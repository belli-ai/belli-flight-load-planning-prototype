"use server";

import { db } from "@/lib/db";
import {
  loadPlans,
  uldAssignments,
  positionLoads,
  loadingPositions,
  deckConfigurations,
  aircrafts,
  cgEnvelopes,
  cgEnvelopePoints,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  assignPositionsForCgTarget,
  assignPositionsSequential,
} from "@/features/planning/lib/algorithm/position-assigner";
import {
  calculateCgFromAssignments,
  isWithinCgEnvelope,
} from "@/features/planning/lib/algorithm/cg-calculator";
import type {
  AircraftConfigForPacking,
  DeckConfigForPacking,
  LoadingPositionForPacking,
  UldAssignmentOutput,
  CgEnvelopeForPacking,
} from "@/features/planning/lib/algorithm/types";

// ============================================================================
// TYPES
// ============================================================================

export type BalanceOptimizationInput = {
  loadPlanId: string;
  targetCgPercentMac?: number;
  strategy: "SEQUENTIAL" | "CG_OPTIMIZED";
};

export type BalanceOptimizationResult = {
  success: boolean;
  assignments: UldAssignmentOutput[];
  cgResult: {
    zeroFuelWeightKg: number;
    zfwCgPercentMac: number;
    zfwWithinEnvelope: boolean;
    payloadWeightKg: number;
    totalMomentKgCm: number;
    forwardLimitPercentMac: number;
    aftLimitPercentMac: number;
  } | null;
  deckWeights: Record<string, number>;
  warnings: string[];
  error?: string;
};

export type LoadPlanWithAssignments = {
  id: string;
  flightId: string;
  aircraftId: string;
  status: string;
  assignments: Array<{
    id: string;
    uldTypeId: string;
    uldTypeCode: string;
    uldNumber: string | null;
    positionCode: string | null;
    totalWeightKg: number;
    volumeUtilization: number;
    cargoCount: number;
  }>;
  aircraft: {
    id: string;
    name: string;
    typeCode: string;
    operatingEmptyWeightKg: number;
    maxZeroFuelWeightKg: number;
    maxTakeoffWeightKg: number;
    maxLandingWeightKg: number;
    totalMaxPayloadKg: number;
    macLeadingEdgeCm: number | null;
    macLengthCm: number | null;
  };
  weights: {
    payloadKg: number;
    zeroFuelWeightKg: number;
    takeoffWeightKg: number;
    landingWeightKg: number;
  };
};

// ============================================================================
// GET LOAD PLAN WITH ASSIGNMENTS
// ============================================================================

export async function getLoadPlanWithAssignments(
  loadPlanId: string
): Promise<{ success: boolean; data?: LoadPlanWithAssignments; error?: string }> {
  try {
    // Get load plan
    const loadPlan = await db.query.loadPlans.findFirst({
      where: eq(loadPlans.id, loadPlanId),
    });

    if (!loadPlan) {
      return { success: false, error: "Load plan not found" };
    }

    // Get aircraft
    const aircraft = await db.query.aircrafts.findFirst({
      where: eq(aircrafts.id, loadPlan.aircraftId),
    });

    if (!aircraft) {
      return { success: false, error: "Aircraft not found" };
    }

    // Get ULD assignments
    const assignments = await db.query.uldAssignments.findMany({
      where: eq(uldAssignments.loadPlanId, loadPlanId),
      with: {
        uldType: true,
        packedItems: true,
      },
    });

    // Transform to response format
    const transformedAssignments = assignments.map((a) => ({
      id: a.id,
      uldTypeId: a.uldTypeId,
      uldTypeCode: a.uldType?.code ?? "UNK",
      uldNumber: a.uldNumber,
      positionCode: a.positionCode,
      totalWeightKg: a.totalWeightKg,
      volumeUtilization: a.volumeUtilization ?? 0,
      cargoCount: a.packedItems?.length ?? 0,
    }));

    // Calculate weights
    const payloadKg = transformedAssignments.reduce(
      (sum, a) => sum + a.totalWeightKg,
      0
    );
    const zeroFuelWeightKg = aircraft.operatingEmptyWeightKg + payloadKg;

    return {
      success: true,
      data: {
        id: loadPlan.id,
        flightId: loadPlan.flightId,
        aircraftId: loadPlan.aircraftId,
        status: loadPlan.status,
        assignments: transformedAssignments,
        aircraft: {
          id: aircraft.id,
          name: aircraft.name,
          typeCode: aircraft.typeCode,
          operatingEmptyWeightKg: aircraft.operatingEmptyWeightKg,
          maxZeroFuelWeightKg: aircraft.maxZeroFuelWeightKg,
          maxTakeoffWeightKg: aircraft.maxTakeoffWeightKg,
          maxLandingWeightKg: aircraft.maxLandingWeightKg,
          totalMaxPayloadKg: aircraft.totalMaxPayloadKg,
          macLeadingEdgeCm: aircraft.macLeadingEdgeCm,
          macLengthCm: aircraft.macLengthCm,
        },
        weights: {
          payloadKg,
          zeroFuelWeightKg,
          takeoffWeightKg: loadPlan.takeoffWeightKg ?? zeroFuelWeightKg,
          landingWeightKg: loadPlan.landingWeightKg ?? zeroFuelWeightKg,
        },
      },
    };
  } catch (error) {
    console.error("Failed to get load plan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// GET AIRCRAFT CONFIGURATION FOR BALANCING
// ============================================================================

async function getAircraftConfigForBalancing(
  aircraftId: string
): Promise<AircraftConfigForPacking | null> {
  try {
    // Get aircraft
    const aircraft = await db.query.aircrafts.findFirst({
      where: eq(aircrafts.id, aircraftId),
    });

    if (!aircraft) return null;

    // Get deck configurations with positions
    const decks = await db.query.deckConfigurations.findMany({
      where: eq(deckConfigurations.aircraftId, aircraftId),
      with: {
        loadingPositions: true,
      },
    });

    // Get CG envelopes with points
    const envelopes = await db.query.cgEnvelopes.findMany({
      where: eq(cgEnvelopes.aircraftId, aircraftId),
      with: {
        cgEnvelopePoints: true,
      },
    });

    // Transform to algorithm types
    const deckConfigs: DeckConfigForPacking[] = decks.map((deck, idx) => ({
      id: deck.id,
      deckCode: deck.deckCode as DeckConfigForPacking["deckCode"],
      deckName: deck.deckName,
      maxStructuralWeightKg: deck.maxStructuralWeightKg,
      sequence: deck.sequence ?? idx,
      positions: deck.loadingPositions.map((pos) => ({
        id: pos.id,
        positionCode: pos.positionCode,
        sequenceNumber: pos.sequenceNumber,
        maxWeightKg: pos.maxWeightKg,
        armStationCm: pos.armStationCm,
        compatibleUldTypes: pos.compatibleUldTypes,
        acceptsBulkCargo: pos.acceptsBulkCargo ?? false,
        maxHeightCm: pos.maxHeightCm ?? null,
        contourCode: pos.contourCode ?? null,
        colIndex: pos.colIndex ?? null,
        rowIndex: pos.rowIndex ?? null,
      })),
    }));

    const cgEnvelopesForPacking: CgEnvelopeForPacking[] = envelopes.map((env) => ({
      id: env.id,
      envelopeType: env.envelopeType as CgEnvelopeForPacking["envelopeType"],
      forwardLimitPercentMac: env.forwardLimitPercentMac,
      aftLimitPercentMac: env.aftLimitPercentMac,
      points: env.cgEnvelopePoints.map((p) => ({
        sequence: p.sequence,
        weightKg: p.weightKg,
        cgPercentMac: p.cgPercentMac,
      })),
    }));

    return {
      id: aircraft.id,
      name: aircraft.name,
      typeCode: aircraft.typeCode,
      operatingEmptyWeightKg: aircraft.operatingEmptyWeightKg,
      totalMaxPayloadKg: aircraft.totalMaxPayloadKg,
      maxZeroFuelWeightKg: aircraft.maxZeroFuelWeightKg,
      macLeadingEdgeCm: aircraft.macLeadingEdgeCm,
      macLengthCm: aircraft.macLengthCm,
      decks: deckConfigs,
      cgEnvelopes: cgEnvelopesForPacking,
    };
  } catch (error) {
    console.error("Failed to get aircraft config:", error);
    return null;
  }
}

// ============================================================================
// OPTIMIZE BALANCE
// ============================================================================

export async function optimizeBalance(
  input: BalanceOptimizationInput
): Promise<BalanceOptimizationResult> {
  try {
    // Get load plan with assignments
    const loadPlanResult = await getLoadPlanWithAssignments(input.loadPlanId);
    
    if (!loadPlanResult.success || !loadPlanResult.data) {
      return {
        success: false,
        assignments: [],
        cgResult: null,
        deckWeights: {},
        warnings: [],
        error: loadPlanResult.error,
      };
    }

    const loadPlan = loadPlanResult.data;

    // Get aircraft configuration
    const aircraftConfig = await getAircraftConfigForBalancing(loadPlan.aircraftId);

    if (!aircraftConfig) {
      return {
        success: false,
        assignments: [],
        cgResult: null,
        deckWeights: {},
        warnings: [],
        error: "Aircraft configuration not found",
      };
    }

    // Transform assignments to algorithm format
    const uldAssignmentsForOptimization: UldAssignmentOutput[] = loadPlan.assignments.map(
      (a, idx) => ({
        uldId: null,
        uldNumber: a.uldNumber,
        uldTypeId: a.uldTypeId,
        uldTypeCode: a.uldTypeCode,
        positionCode: a.positionCode,
        sequence: idx + 1,
        totalWeightKg: a.totalWeightKg,
        tareWeightKg: 0,
        cargoWeightKg: a.totalWeightKg,
        volumeUsedM3: 0,
        volumeUtilization: a.volumeUtilization,
        weightUtilization: 0,
        cargoItems: [],
        uldDimensions: { lengthCm: 150, widthCm: 150, heightCm: 150 },
        maxGrossWeightKg: 1500,
      })
    );

    // Run position assignment based on strategy
    const targetCg = input.targetCgPercentMac ?? 28; // Default target CG
    
    const assignmentResult =
      input.strategy === "CG_OPTIMIZED"
        ? assignPositionsForCgTarget(
            uldAssignmentsForOptimization,
            aircraftConfig,
            targetCg
          )
        : assignPositionsSequential(uldAssignmentsForOptimization, aircraftConfig);

    // Calculate CG result
    const cgResult = calculateCgFromAssignments(
      assignmentResult.assignments,
      aircraftConfig
    );

    // Update position loads in database
    if (assignmentResult.assignments.length > 0) {
      // Delete existing position loads
      await db
        .delete(positionLoads)
        .where(eq(positionLoads.loadPlanId, input.loadPlanId));

      // Insert new position loads
      for (const assignment of assignmentResult.assignments) {
        if (assignment.positionAssignment) {
          await db.insert(positionLoads).values({
            loadPlanId: input.loadPlanId,
            positionId: assignment.positionAssignment.positionId,
            uldAssignmentId: null, // Would need to map back to actual ULD assignment IDs
            positionCode: assignment.positionAssignment.positionCode,
            grossWeightKg: assignment.totalWeightKg,
            calculatedMoment: assignment.positionAssignment.momentKgCm,
            calculatedIndex: null,
            status: "PLANNED",
          });
        }
      }

      // Update load plan CG results
      if (cgResult) {
        await db
          .update(loadPlans)
          .set({
            zfwCgPercentMac: cgResult.zfwCgPercentMac,
            withinCgEnvelope: cgResult.zfwWithinEnvelope,
            payloadKg: cgResult.payloadWeightKg,
            zeroFuelWeightKg: cgResult.zeroFuelWeightKg,
            updatedAt: new Date(),
          })
          .where(eq(loadPlans.id, input.loadPlanId));
      }
    }

    return {
      success: assignmentResult.success,
      assignments: assignmentResult.assignments,
      cgResult: cgResult
        ? {
            zeroFuelWeightKg: cgResult.zeroFuelWeightKg,
            zfwCgPercentMac: cgResult.zfwCgPercentMac,
            zfwWithinEnvelope: cgResult.zfwWithinEnvelope,
            payloadWeightKg: cgResult.payloadWeightKg,
            totalMomentKgCm: cgResult.totalMomentKgCm,
            forwardLimitPercentMac: cgResult.forwardLimitPercentMac,
            aftLimitPercentMac: cgResult.aftLimitPercentMac,
          }
        : null,
      deckWeights: assignmentResult.deckWeights,
      warnings: assignmentResult.warnings,
    };
  } catch (error) {
    console.error("Balance optimization failed:", error);
    return {
      success: false,
      assignments: [],
      cgResult: null,
      deckWeights: {},
      warnings: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// GET LOAD PLANS FOR FLIGHT
// ============================================================================

export async function getLoadPlansForFlight(
  flightId: string
): Promise<{ success: boolean; plans: Array<{ id: string; status: string; createdAt: Date }>; error?: string }> {
  try {
    const plans = await db.query.loadPlans.findMany({
      where: eq(loadPlans.flightId, flightId),
      orderBy: (loadPlans, { desc }) => [desc(loadPlans.createdAt)],
    });

    return {
      success: true,
      plans: plans.map((p) => ({
        id: p.id,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };
  } catch (error) {
    console.error("Failed to get load plans:", error);
    return {
      success: false,
      plans: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

