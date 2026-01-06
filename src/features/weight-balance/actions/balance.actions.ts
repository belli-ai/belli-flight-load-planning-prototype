"use server";

import { isStaticDataMode } from "@/lib/config";
import { db } from "@/lib/db";
import {
  loadPlans,
  uldAssignments,
  positionLoads,
  deckConfigurationPresets,
  aircrafts,
  cgEnvelopes,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  assignPositionsForCgTarget,
  assignPositionsSequential,
} from "@/features/planning/lib/algorithm/position-assigner";
import {
  calculateCgFromAssignments,
} from "@/features/planning/lib/algorithm/cg-calculator";
import type {
  AircraftConfigForPacking,
  DeckConfigForPacking,
  UldAssignmentOutput,
  CgEnvelopeForPacking,
} from "@/features/planning/lib/algorithm/types";

// Import static data and memory store
import {
  staticAircrafts,
  staticDeckConfigurationPresets,
  staticDeckConfigurations,
  staticLoadingPositions,
  staticCgEnvelopes,
  staticCgEnvelopePoints,
  staticUldTypes,
} from "@/lib/data/static-data";
import { memoryStore } from "@/lib/data/memory-store";

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

export type DeckConfigPosition = {
  positionCode: string;
  xOffset: number;
  yOffset: number;
  colIndex: number;
  rowIndex: number;
  contourCode: string;
  maxWeightKg: number;
  armStationCm: number;
};

export type DeckConfigForVisualization = {
  id: string;
  deckCode: string;
  deckName: string;
  sequence: number;
  positions: DeckConfigPosition[];
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
  deckConfig: {
    decks: DeckConfigForVisualization[];
  };
};

// ============================================================================
// STATIC DATA HELPERS
// ============================================================================

function getStaticDeckConfigForVisualization(aircraftId: string): DeckConfigForVisualization[] {
  const preset = staticDeckConfigurationPresets.find(
    (p) => p.aircraftId === aircraftId && p.isDefault
  ) ?? staticDeckConfigurationPresets.find((p) => p.aircraftId === aircraftId);

  if (!preset) return [];

  const decks = staticDeckConfigurations
    .filter((d) => d.presetId === preset.id)
    .sort((a, b) => a.sequence - b.sequence);

  return decks.map((deck) => {
    const positions = staticLoadingPositions
      .filter((p) => p.deckId === deck.id)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    return {
      id: deck.id,
      deckCode: deck.deckCode,
      deckName: deck.deckName,
      sequence: deck.sequence,
      positions: positions.map((pos) => ({
        positionCode: pos.positionCode,
        xOffset: pos.xOffset,
        yOffset: pos.yOffset,
        colIndex: pos.colIndex,
        rowIndex: pos.rowIndex,
        contourCode: pos.contourCode,
        maxWeightKg: pos.maxWeightKg,
        armStationCm: pos.armStationCm,
      })),
    };
  });
}

function getStaticAircraftConfigForBalancing(
  aircraftId: string
): AircraftConfigForPacking | null {
  const aircraft = staticAircrafts.find((a) => a.id === aircraftId);
  if (!aircraft) return null;

  const preset = staticDeckConfigurationPresets.find(
    (p) => p.aircraftId === aircraftId && p.isDefault
  ) ?? staticDeckConfigurationPresets.find((p) => p.aircraftId === aircraftId);

  const decks = preset
    ? staticDeckConfigurations
        .filter((d) => d.presetId === preset.id)
        .sort((a, b) => a.sequence - b.sequence)
    : [];

  const deckConfigs: DeckConfigForPacking[] = decks.map((deck) => {
    const positions = staticLoadingPositions
      .filter((p) => p.deckId === deck.id)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    return {
      id: deck.id,
      deckCode: deck.deckCode as DeckConfigForPacking["deckCode"],
      deckName: deck.deckName,
      maxStructuralWeightKg: deck.maxStructuralWeightKg,
      sequence: deck.sequence,
      positions: positions.map((pos) => ({
        id: pos.id,
        positionCode: pos.positionCode,
        sequenceNumber: pos.sequenceNumber,
        maxWeightKg: pos.maxWeightKg,
        armStationCm: pos.armStationCm,
        compatibleUldTypes: pos.compatibleUldTypes,
        acceptsBulkCargo: pos.acceptsBulkCargo,
        maxHeightCm: pos.maxHeightCm,
        contourCode: pos.contourCode,
        colIndex: pos.colIndex,
        rowIndex: pos.rowIndex,
      })),
    };
  });

  const envelopes = staticCgEnvelopes.filter((e) => e.aircraftId === aircraftId);
  const cgEnvelopesForPacking: CgEnvelopeForPacking[] = envelopes.map((env) => {
    const points = staticCgEnvelopePoints
      .filter((p) => p.envelopeId === env.id)
      .sort((a, b) => a.sequence - b.sequence);

    return {
      id: env.id,
      envelopeType: env.envelopeType as CgEnvelopeForPacking["envelopeType"],
      forwardLimitPercentMac: env.forwardLimitPercentMac,
      aftLimitPercentMac: env.aftLimitPercentMac,
      points: points.map((p) => ({
        sequence: p.sequence,
        weightKg: p.weightKg,
        cgPercentMac: p.cgPercentMac,
      })),
    };
  });

  return {
    id: aircraft.id,
    name: aircraft.name,
    typeCode: aircraft.typeCode,
    operatingEmptyWeightKg: aircraft.operatingEmptyWeightKg,
    totalMaxPayloadKg: aircraft.totalMaxPayloadKg,
    maxZeroFuelWeightKg: aircraft.maxZeroFuelWeightKg,
    maxTakeoffWeightKg: aircraft.maxTakeoffWeightKg,
    maxLandingWeightKg: aircraft.maxLandingWeightKg,
    macLeadingEdgeCm: aircraft.macLeadingEdgeCm,
    macLengthCm: aircraft.macLengthCm,
    decks: deckConfigs,
    cgEnvelopes: cgEnvelopesForPacking,
  };
}

// ============================================================================
// GET LOAD PLAN WITH ASSIGNMENTS
// ============================================================================

export async function getLoadPlanWithAssignments(
  loadPlanId: string
): Promise<{
  success: boolean;
  data?: LoadPlanWithAssignments;
  error?: string;
}> {
  try {
    if (isStaticDataMode()) {
      // Get load plan from memory store
      const loadPlan = memoryStore.getLoadPlanById(loadPlanId);
      if (!loadPlan) {
        return { success: false, error: "Load plan not found" };
      }

      // Get aircraft - in static mode, we use the default aircraft
      const aircraft = staticAircrafts[0];
      if (!aircraft) {
        return { success: false, error: "Aircraft not found" };
      }

      // Get ULD assignments from memory store
      const assignments = memoryStore.getUldAssignmentsForLoadPlan(loadPlanId);

      // Get deck configurations for visualization
      const deckConfigForVisualization = getStaticDeckConfigForVisualization(
        aircraft.id
      );

      // Transform assignments
      const transformedAssignments = assignments.map((a) => {
        const uldType = staticUldTypes.find((t) => t.id === a.uldTypeId);
        return {
          id: a.id,
          uldTypeId: a.uldTypeId,
          uldTypeCode: uldType?.code ?? a.uldTypeCode ?? "UNK",
          uldNumber: a.uldNumber,
          positionCode: a.positionCode,
          totalWeightKg: a.totalWeightKg,
          volumeUtilization: (a.totalVolumeM3 / (uldType?.maxVolumeM3 ?? 1)) * 100,
          cargoCount: a.itemCount,
        };
      });

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
          aircraftId: aircraft.id,
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
            takeoffWeightKg: zeroFuelWeightKg,
            landingWeightKg: zeroFuelWeightKg,
          },
          deckConfig: {
            decks: deckConfigForVisualization,
          },
        },
      };
    }

    // Database mode
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

    // Get deck configurations with positions through presets
    const presets = await db.query.deckConfigurationPresets.findMany({
      where: and(
        eq(deckConfigurationPresets.aircraftId, loadPlan.aircraftId),
        eq(deckConfigurationPresets.isDefault, true)
      ),
      with: {
        deckConfigurations: {
          with: {
            loadingPositions: true,
          },
        },
      },
    });

    // If no default preset, get the first available preset
    let decks: (typeof presets)[0]["deckConfigurations"] = [];
    if (presets.length > 0) {
      decks = presets[0].deckConfigurations;
    } else {
      // Fallback to first preset if no default
      const fallbackPresets = await db.query.deckConfigurationPresets.findMany({
        where: eq(deckConfigurationPresets.aircraftId, loadPlan.aircraftId),
        with: {
          deckConfigurations: {
            with: {
              loadingPositions: true,
            },
          },
        },
        limit: 1,
      });
      if (fallbackPresets.length > 0) {
        decks = fallbackPresets[0].deckConfigurations;
      }
    }

    // Helper to parse decimal strings to numbers
    const toNum = (val: string | number | null | undefined): number => {
      if (val === null || val === undefined) return 0;
      return typeof val === "number" ? val : parseFloat(val);
    };

    // Transform deck configurations for visualization
    const deckConfigForVisualization: DeckConfigForVisualization[] = decks.map(
      (deck, idx) => ({
        id: deck.id,
        deckCode: deck.deckCode,
        deckName: deck.deckName,
        sequence: deck.sequence ?? idx,
        positions: deck.loadingPositions.map((pos) => ({
          positionCode: pos.positionCode,
          xOffset: toNum(pos.xOffset),
          yOffset: toNum(pos.yOffset),
          colIndex: pos.colIndex ?? 0,
          rowIndex: pos.rowIndex ?? 0,
          contourCode: pos.contourCode ?? "FULL_WIDTH",
          maxWeightKg: toNum(pos.maxWeightKg),
          armStationCm: toNum(pos.armStationCm),
        })),
      })
    );

    // Transform to response format
    const transformedAssignments = assignments.map((a) => ({
      id: a.id,
      uldTypeId: a.uldTypeId,
      uldTypeCode: a.uldType?.code ?? "UNK",
      uldNumber: a.uldNumber,
      positionCode: a.positionCode,
      totalWeightKg: parseFloat(String(a.totalWeightKg)),
      volumeUtilization: parseFloat(String(a.volumeUtilization ?? 0)),
      cargoCount: a.packedItems?.length ?? 0,
    }));

    // Calculate weights
    const payloadKg = transformedAssignments.reduce(
      (sum, a) => sum + a.totalWeightKg,
      0
    );
    const zeroFuelWeightKg =
      parseFloat(String(aircraft.operatingEmptyWeightKg)) + payloadKg;

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
          operatingEmptyWeightKg: parseFloat(
            String(aircraft.operatingEmptyWeightKg)
          ),
          maxZeroFuelWeightKg: parseFloat(String(aircraft.maxZeroFuelWeightKg)),
          maxTakeoffWeightKg: parseFloat(String(aircraft.maxTakeoffWeightKg)),
          maxLandingWeightKg: parseFloat(String(aircraft.maxLandingWeightKg)),
          totalMaxPayloadKg: parseFloat(String(aircraft.totalMaxPayloadKg)),
          macLeadingEdgeCm: parseFloat(String(aircraft.macLeadingEdgeCm)),
          macLengthCm: parseFloat(String(aircraft.macLengthCm)),
        },
        weights: {
          payloadKg,
          zeroFuelWeightKg,
          takeoffWeightKg: parseFloat(
            String(loadPlan.takeoffWeightKg ?? zeroFuelWeightKg)
          ),
          landingWeightKg: parseFloat(
            String(loadPlan.landingWeightKg ?? zeroFuelWeightKg)
          ),
        },
        deckConfig: {
          decks: deckConfigForVisualization,
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
  if (isStaticDataMode()) {
    return getStaticAircraftConfigForBalancing(aircraftId);
  }

  try {
    // Get aircraft
    const aircraft = await db.query.aircrafts.findFirst({
      where: eq(aircrafts.id, aircraftId),
    });

    if (!aircraft) return null;

    // Get deck configurations with positions through presets
    const presets = await db.query.deckConfigurationPresets.findMany({
      where: eq(deckConfigurationPresets.aircraftId, aircraftId),
      with: {
        deckConfigurations: {
          with: {
            loadingPositions: true,
          },
        },
      },
    });

    // Flatten deck configurations from all presets (use first preset as default)
    const decks = presets.length > 0 ? presets[0].deckConfigurations : [];

    // Get CG envelopes with points
    const envelopes = await db.query.cgEnvelopes.findMany({
      where: eq(cgEnvelopes.aircraftId, aircraftId),
      with: {
        points: true,
      },
    });

    // Helper to parse decimal strings to numbers
    const toNum = (val: string | number | null | undefined): number | null => {
      if (val === null || val === undefined) return null;
      return typeof val === "number" ? val : parseFloat(val);
    };

    // Transform to algorithm types
    const deckConfigs: DeckConfigForPacking[] = decks.map((deck, idx) => ({
      id: deck.id,
      deckCode: deck.deckCode as DeckConfigForPacking["deckCode"],
      deckName: deck.deckName,
      maxStructuralWeightKg: toNum(deck.maxStructuralWeightKg),
      sequence: deck.sequence ?? idx,
      positions: deck.loadingPositions.map((pos) => ({
        id: pos.id,
        positionCode: pos.positionCode,
        sequenceNumber: pos.sequenceNumber,
        maxWeightKg: toNum(pos.maxWeightKg) ?? 0,
        armStationCm: toNum(pos.armStationCm) ?? 0,
        compatibleUldTypes: pos.compatibleUldTypes,
        acceptsBulkCargo: pos.acceptsBulkCargo ?? false,
        maxHeightCm: toNum(pos.maxHeightCm),
        contourCode: pos.contourCode ?? null,
        colIndex: pos.colIndex ?? null,
        rowIndex: pos.rowIndex ?? null,
      })),
    }));

    const cgEnvelopesForPacking: CgEnvelopeForPacking[] = envelopes.map(
      (env) => ({
        id: env.id,
        envelopeType: env.envelopeType as CgEnvelopeForPacking["envelopeType"],
        forwardLimitPercentMac: toNum(env.forwardLimitPercentMac) ?? 0,
        aftLimitPercentMac: toNum(env.aftLimitPercentMac) ?? 0,
        points: env.points.map((p) => ({
          sequence: p.sequence,
          weightKg: toNum(p.weightKg) ?? 0,
          cgPercentMac: toNum(p.cgPercentMac) ?? 0,
        })),
      })
    );

    return {
      id: aircraft.id,
      name: aircraft.name,
      typeCode: aircraft.typeCode,
      operatingEmptyWeightKg: toNum(aircraft.operatingEmptyWeightKg) ?? 0,
      totalMaxPayloadKg: toNum(aircraft.totalMaxPayloadKg) ?? 0,
      maxZeroFuelWeightKg: toNum(aircraft.maxZeroFuelWeightKg) ?? 0,
      maxTakeoffWeightKg: toNum(aircraft.maxTakeoffWeightKg) ?? 0,
      maxLandingWeightKg: toNum(aircraft.maxLandingWeightKg) ?? 0,
      macLeadingEdgeCm: toNum(aircraft.macLeadingEdgeCm) ?? 0,
      macLengthCm: toNum(aircraft.macLengthCm) ?? 0,
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
    const aircraftConfig = await getAircraftConfigForBalancing(
      loadPlan.aircraftId
    );

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
    const uldAssignmentsForOptimization: UldAssignmentOutput[] =
      loadPlan.assignments.map((a, idx) => ({
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
      }));

    // Run position assignment based on strategy
    const targetCg = input.targetCgPercentMac ?? 28; // Default target CG

    const assignmentResult =
      input.strategy === "CG_OPTIMIZED"
        ? assignPositionsForCgTarget(
            uldAssignmentsForOptimization,
            aircraftConfig,
            targetCg
          )
        : assignPositionsSequential(
            uldAssignmentsForOptimization,
            aircraftConfig
          );

    // Calculate CG result
    const cgResult = calculateCgFromAssignments(
      assignmentResult.assignments,
      aircraftConfig
    );

    // Update position loads
    if (assignmentResult.assignments.length > 0) {
      if (isStaticDataMode()) {
        // Delete existing position loads in memory store
        memoryStore.deletePositionLoadsForLoadPlan(input.loadPlanId);

        // Insert new position loads
        for (const assignment of assignmentResult.assignments) {
          if (assignment.positionAssignment) {
            const position = staticLoadingPositions.find(
              (p) => p.id === assignment.positionAssignment?.positionId
            );
            const deck = position
              ? staticDeckConfigurations.find((d) => d.id === position.deckId)
              : null;

            memoryStore.createPositionLoad({
              loadPlanId: input.loadPlanId,
              positionId: assignment.positionAssignment.positionId,
              positionCode: assignment.positionAssignment.positionCode,
              deckCode: deck?.deckCode ?? "",
              uldAssignmentId: null,
              grossWeightKg: assignment.totalWeightKg,
              indexContribution: 0,
              armStationCm: assignment.positionAssignment.armStationCm,
              sequence: position?.sequenceNumber ?? 0,
            });
          }
        }

        // Update load plan CG results
        if (cgResult) {
          memoryStore.updateLoadPlan(input.loadPlanId, {
            estimatedCgPercentMac: cgResult.zfwCgPercentMac,
            isWithinEnvelope: cgResult.zfwWithinEnvelope,
            totalCargoWeightKg: cgResult.payloadWeightKg,
          });
        }
      } else {
        // Database mode
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
              uldAssignmentId: null,
              positionCode: assignment.positionAssignment.positionCode,
              grossWeightKg: String(assignment.totalWeightKg),
              calculatedMoment: String(assignment.positionAssignment.momentKgCm),
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
              zfwCgPercentMac: String(cgResult.zfwCgPercentMac),
              withinCgEnvelope: cgResult.zfwWithinEnvelope,
              payloadKg: String(cgResult.payloadWeightKg),
              zeroFuelWeightKg: String(cgResult.zeroFuelWeightKg),
              updatedAt: new Date(),
            })
            .where(eq(loadPlans.id, input.loadPlanId));
        }
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
): Promise<{
  success: boolean;
  plans: Array<{ id: string; status: string; createdAt: Date }>;
  error?: string;
}> {
  try {
    if (isStaticDataMode()) {
      const plans = memoryStore.getLoadPlansForFlight(flightId);
      return {
        success: true,
        plans: plans.map((p) => ({
          id: p.id,
          status: p.status,
          createdAt: p.createdAt,
        })),
      };
    }

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
