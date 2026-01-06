"use server";

import { isStaticDataMode } from "@/lib/config";
import { db } from "@/lib/db";
import {
  cargoItems,
  airWaybills,
  uldTypes,
  ulds,
  packingRules,
  flights,
  aircrafts,
  deckConfigurationPresets,
  deckConfigurations,
  loadingPositions,
  cgEnvelopes,
  cgEnvelopePoints,
  positionLoads,
  loadPlans,
  uldAssignments,
  packedItems,
} from "@/lib/db/schema";
import { eq, and, inArray, desc, asc } from "drizzle-orm";
import type { PackingRule } from "../types";
import type {
  CargoItemForPacking,
  UldTypeForPacking,
  UldInventoryItem,
  AircraftConfigForPacking,
  DeckConfigForPacking,
  LoadingPositionForPacking,
  CgEnvelopeForPacking,
} from "../lib/algorithm/types";

// Import static data
import {
  staticFlights,
  staticAircrafts,
  staticLocations,
  staticUldTypes,
  staticUlds,
  staticCargoItems,
  staticAirWaybills,
  staticPackingRules,
  staticDeckConfigurations,
  staticLoadingPositions,
  staticCgEnvelopes,
  staticCgEnvelopePoints,
  staticDeckConfigurationPresets,
  getStaticCargoItemsForFlight,
  AIRCRAFT_IDS,
} from "@/lib/data/static-data";

// Import memory store
import { memoryStore } from "@/lib/data/memory-store";

// ============================================================================
// CARGO QUERIES
// ============================================================================

/**
 * Get cargo items for a flight (via AWBs linked to the flight)
 */
export async function getCargoItemsForFlight(flightId: string): Promise<CargoItemForPacking[]> {
  if (isStaticDataMode()) {
    const items = getStaticCargoItemsForFlight(flightId);
    return items.map((item) => ({
      id: item.id,
      awbId: item.awbId,
      awbNumber: item.awbNumber,
      pieceNumber: item.pieceNumber,
      weightKg: item.weightKg,
      lengthCm: item.lengthCm,
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      volumeM3: item.volumeM3,
      isStackable: item.isStackable,
      maxStackWeightKg: item.maxStackWeightKg,
      isTiltable: item.isTiltable,
      isDangerousGoods: item.isDangerousGoods,
      dgClassCode: item.dgClassCode,
      tempZoneCode: item.tempZoneCode,
      isLiveAnimal: item.isLiveAnimal,
      isFoodstuff: item.isFoodstuff,
      specialHandlingCodes: item.specialHandlingCodes ?? [],
      priority: item.priority,
    }));
  }

  // First, get all AWB IDs that belong to this flight
  const awbsForFlight = await db.query.airWaybills.findMany({
    where: eq(airWaybills.flightId, flightId),
    columns: { id: true },
  });

  if (awbsForFlight.length === 0) {
    return [];
  }

  const awbIds = awbsForFlight.map((awb) => awb.id);

  // Get cargo items belonging to these AWBs
  const items = await db.query.cargoItems.findMany({
    where: and(
      inArray(cargoItems.awbId, awbIds),
      eq(cargoItems.loadStatus, "PENDING")
    ),
    with: {
      awb: true,
      tempZone: true,
      dgClass: true,
    },
  });

  return items.map((item) => ({
    id: item.id,
    awbId: item.awbId,
    awbNumber: item.awb?.awbNumber ?? "Unknown",
    pieceNumber: item.pieceNumber,
    weightKg: Number(item.weightKg),
    lengthCm: Number(item.lengthCm),
    widthCm: Number(item.widthCm),
    heightCm: Number(item.heightCm),
    volumeM3: item.volumeM3 ? Number(item.volumeM3) :
      (Number(item.lengthCm) * Number(item.widthCm) * Number(item.heightCm)) / 1_000_000,
    isStackable: item.isStackable,
    maxStackWeightKg: item.maxStackWeightKg ? Number(item.maxStackWeightKg) : null,
    isTiltable: item.isTiltable,
    isDangerousGoods: item.isDangerousGoods,
    dgClassCode: item.dgClass?.classCode ?? null,
    tempZoneCode: item.tempZone?.code ?? null,
    isLiveAnimal: item.isLiveAnimal,
    isFoodstuff: item.isFoodstuff,
    specialHandlingCodes: item.specialHandlingCodes ?? [],
    priority: item.priority as "HIGH" | "STANDARD" | "LOW",
  }));
}

/**
 * Get cargo items by IDs
 */
export async function getCargoItemsByIds(ids: string[]): Promise<CargoItemForPacking[]> {
  if (ids.length === 0) return [];

  if (isStaticDataMode()) {
    return staticCargoItems
      .filter((item) => ids.includes(item.id))
      .map((item) => ({
        id: item.id,
        awbId: item.awbId,
        awbNumber: item.awbNumber,
        pieceNumber: item.pieceNumber,
        weightKg: item.weightKg,
        lengthCm: item.lengthCm,
        widthCm: item.widthCm,
        heightCm: item.heightCm,
        volumeM3: item.volumeM3,
        isStackable: item.isStackable,
        maxStackWeightKg: item.maxStackWeightKg,
        isTiltable: item.isTiltable,
        isDangerousGoods: item.isDangerousGoods,
        dgClassCode: item.dgClassCode,
        tempZoneCode: item.tempZoneCode,
        isLiveAnimal: item.isLiveAnimal,
        isFoodstuff: item.isFoodstuff,
        specialHandlingCodes: item.specialHandlingCodes ?? [],
        priority: item.priority,
      }));
  }

  const items = await db.query.cargoItems.findMany({
    where: inArray(cargoItems.id, ids),
    with: {
      awb: true,
      tempZone: true,
      dgClass: true,
    },
  });

  return items.map((item) => ({
    id: item.id,
    awbId: item.awbId,
    awbNumber: item.awb?.awbNumber ?? "Unknown",
    pieceNumber: item.pieceNumber,
    weightKg: Number(item.weightKg),
    lengthCm: Number(item.lengthCm),
    widthCm: Number(item.widthCm),
    heightCm: Number(item.heightCm),
    volumeM3: item.volumeM3 ? Number(item.volumeM3) :
      (Number(item.lengthCm) * Number(item.widthCm) * Number(item.heightCm)) / 1_000_000,
    isStackable: item.isStackable,
    maxStackWeightKg: item.maxStackWeightKg ? Number(item.maxStackWeightKg) : null,
    isTiltable: item.isTiltable,
    isDangerousGoods: item.isDangerousGoods,
    dgClassCode: item.dgClass?.classCode ?? null,
    tempZoneCode: item.tempZone?.code ?? null,
    isLiveAnimal: item.isLiveAnimal,
    isFoodstuff: item.isFoodstuff,
    specialHandlingCodes: item.specialHandlingCodes ?? [],
    priority: item.priority as "HIGH" | "STANDARD" | "LOW",
  }));
}

// ============================================================================
// ULD TYPE QUERIES
// ============================================================================

/**
 * Get all available ULD types
 */
export async function getUldTypes(): Promise<UldTypeForPacking[]> {
  if (isStaticDataMode()) {
    return staticUldTypes.map((uld) => ({
      id: uld.id,
      code: uld.code,
      name: uld.name,
      category: uld.category as "CONTAINER" | "PALLET",
      maxGrossWeightKg: uld.maxGrossWeightKg,
      tareWeightKg: uld.tareWeightKg,
      maxVolumeM3: uld.maxVolumeM3,
      internalLengthCm: uld.internalLengthCm ?? uld.lengthCm,
      internalWidthCm: uld.internalWidthCm ?? uld.widthCm,
      internalHeightCm: uld.internalHeightCm ?? uld.heightCm,
      isRefrigerated: uld.isRefrigerated,
    }));
  }

  const types = await db.query.uldTypes.findMany();

  return types.map((uld) => ({
    id: uld.id,
    code: uld.code,
    name: uld.name,
    category: uld.category as "CONTAINER" | "PALLET",
    maxGrossWeightKg: Number(uld.maxGrossWeightKg),
    tareWeightKg: Number(uld.tareWeightKg),
    maxVolumeM3: Number(uld.maxVolumeM3),
    internalLengthCm: uld.internalLengthCm ? Number(uld.internalLengthCm) : Number(uld.lengthCm),
    internalWidthCm: uld.internalWidthCm ? Number(uld.internalWidthCm) : Number(uld.widthCm),
    internalHeightCm: uld.internalHeightCm ? Number(uld.internalHeightCm) : Number(uld.heightCm),
    isRefrigerated: uld.isRefrigerated,
  }));
}

/**
 * Get ULD types by IDs
 */
export async function getUldTypesByIds(ids: string[]): Promise<UldTypeForPacking[]> {
  if (ids.length === 0) return [];

  if (isStaticDataMode()) {
    return staticUldTypes
      .filter((uld) => ids.includes(uld.id))
      .map((uld) => ({
        id: uld.id,
        code: uld.code,
        name: uld.name,
        category: uld.category as "CONTAINER" | "PALLET",
        maxGrossWeightKg: uld.maxGrossWeightKg,
        tareWeightKg: uld.tareWeightKg,
        maxVolumeM3: uld.maxVolumeM3,
        internalLengthCm: uld.internalLengthCm ?? uld.lengthCm,
        internalWidthCm: uld.internalWidthCm ?? uld.widthCm,
        internalHeightCm: uld.internalHeightCm ?? uld.heightCm,
        isRefrigerated: uld.isRefrigerated,
      }));
  }

  const types = await db.query.uldTypes.findMany({
    where: inArray(uldTypes.id, ids),
  });

  return types.map((uld) => ({
    id: uld.id,
    code: uld.code,
    name: uld.name,
    category: uld.category as "CONTAINER" | "PALLET",
    maxGrossWeightKg: Number(uld.maxGrossWeightKg),
    tareWeightKg: Number(uld.tareWeightKg),
    maxVolumeM3: Number(uld.maxVolumeM3),
    internalLengthCm: uld.internalLengthCm ? Number(uld.internalLengthCm) : Number(uld.lengthCm),
    internalWidthCm: uld.internalWidthCm ? Number(uld.internalWidthCm) : Number(uld.widthCm),
    internalHeightCm: uld.internalHeightCm ? Number(uld.internalHeightCm) : Number(uld.heightCm),
    isRefrigerated: uld.isRefrigerated,
  }));
}

// ============================================================================
// PACKING RULES QUERIES
// ============================================================================

/**
 * Get all active packing rules
 */
export async function getActivePackingRules(): Promise<PackingRule[]> {
  if (isStaticDataMode()) {
    return staticPackingRules
      .filter((rule) => rule.isActive)
      .sort((a, b) => b.priority - a.priority)
      .map((rule) => ({
        id: rule.id,
        ruleText: rule.ruleText,
        ruleType: rule.ruleType as "CONSTRAINT" | "PREFERENCE" | "PROHIBITION",
        priority: rule.priority,
        category: rule.category,
        isActive: rule.isActive,
        examples: rule.examples,
        // The static structuredRule has a different shape than the StructuredRule type,
        // so we set it to null. The LLM parser interprets ruleText anyway.
        structuredRule: null,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      }));
  }

  const rules = await db.query.packingRules.findMany({
    where: eq(packingRules.isActive, true),
    orderBy: [desc(packingRules.priority)],
  });

  return rules.map((rule) => ({
    id: rule.id,
    ruleText: rule.ruleText,
    ruleType: rule.ruleType as "CONSTRAINT" | "PREFERENCE" | "PROHIBITION",
    priority: rule.priority,
    category: rule.category,
    isActive: rule.isActive,
    examples: rule.examples,
    structuredRule: rule.structuredRule as PackingRule["structuredRule"],
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }));
}

// ============================================================================
// FLIGHT QUERIES
// ============================================================================

/**
 * Get flights with aircraft and location details
 */
export async function getFlightsWithDetails() {
  if (isStaticDataMode()) {
    return staticFlights.map((f) => {
      const aircraft = staticAircrafts.find((a) => a.id === f.aircraftId);
      const origin = staticLocations.find((l) => l.id === f.originId);
      const destination = staticLocations.find((l) => l.id === f.destinationId);
      return {
        id: f.id,
        flightNumber: f.flightNumber,
        aircraftType: aircraft?.typeCode ?? "Unknown",
        aircraftName: aircraft?.name ?? "Unknown",
        origin: origin?.airportCode ?? "Unknown",
        destination: destination?.airportCode ?? "Unknown",
        scheduledDeparture: f.scheduledDeparture,
        scheduledArrival: f.scheduledArrival,
        status: f.status,
      };
    });
  }

  const flightList = await db.query.flights.findMany({
    with: {
      aircraft: true,
      origin: true,
      destination: true,
    },
    orderBy: [desc(flights.scheduledDeparture)],
    limit: 50,
  });

  return flightList.map((f) => ({
    id: f.id,
    flightNumber: f.flightNumber,
    aircraftType: f.aircraft?.typeCode ?? "Unknown",
    aircraftName: f.aircraft?.name ?? "Unknown",
    origin: f.origin?.airportCode ?? "Unknown",
    destination: f.destination?.airportCode ?? "Unknown",
    scheduledDeparture: f.scheduledDeparture,
    scheduledArrival: f.scheduledArrival,
    status: f.status,
  }));
}

/**
 * Get a single flight by ID
 */
export async function getFlightById(id: string) {
  if (isStaticDataMode()) {
    const flight = staticFlights.find((f) => f.id === id);
    if (!flight) return null;

    const aircraft = staticAircrafts.find((a) => a.id === flight.aircraftId);
    const origin = staticLocations.find((l) => l.id === flight.originId);
    const destination = staticLocations.find((l) => l.id === flight.destinationId);

    return {
      id: flight.id,
      flightNumber: flight.flightNumber,
      aircraftType: aircraft?.typeCode ?? "Unknown",
      aircraftName: aircraft?.name ?? "Unknown",
      aircraftId: flight.aircraftId,
      originId: flight.originId,
      origin: origin?.airportCode ?? "Unknown",
      destinationId: flight.destinationId,
      destination: destination?.airportCode ?? "Unknown",
      scheduledDeparture: flight.scheduledDeparture,
      scheduledArrival: flight.scheduledArrival,
      status: flight.status,
    };
  }

  const flight = await db.query.flights.findFirst({
    where: eq(flights.id, id),
    with: {
      aircraft: true,
      origin: true,
      destination: true,
    },
  });

  if (!flight) return null;

  return {
    id: flight.id,
    flightNumber: flight.flightNumber,
    aircraftType: flight.aircraft?.typeCode ?? "Unknown",
    aircraftName: flight.aircraft?.name ?? "Unknown",
    aircraftId: flight.aircraftId,
    originId: flight.originId,
    origin: flight.origin?.airportCode ?? "Unknown",
    destinationId: flight.destinationId,
    destination: flight.destination?.airportCode ?? "Unknown",
    scheduledDeparture: flight.scheduledDeparture,
    scheduledArrival: flight.scheduledArrival,
    status: flight.status,
  };
}

// ============================================================================
// LOAD PLAN MUTATIONS
// ============================================================================

/**
 * Create or get load plan for a flight
 */
export async function getOrCreateLoadPlan(flightId: string) {
  if (isStaticDataMode()) {
    // Check for existing plan in memory store
    const existing = memoryStore.getLoadPlanByFlightId(flightId);
    if (existing) return existing;

    // Get flight to get aircraft ID
    const flight = staticFlights.find((f) => f.id === flightId);
    if (!flight) {
      throw new Error("Flight not found");
    }

    // Create new load plan in memory store
    return memoryStore.createLoadPlan({
      flightId,
      version: 1,
      status: "DRAFT",
      totalCargoWeightKg: 0,
      totalCargoVolumeM3: 0,
      uldCount: 0,
      bulkCargoWeightKg: 0,
      totalIndexChange: null,
      estimatedCgPercentMac: null,
      isWithinEnvelope: null,
      optimizationScore: null,
      notes: null,
      releasedAt: null,
      releasedBy: null,
    });
  }

  // Check for existing draft plan
  const existing = await db.query.loadPlans.findFirst({
    where: and(
      eq(loadPlans.flightId, flightId),
      eq(loadPlans.status, "DRAFT")
    ),
  });

  if (existing) return existing;

  // Get flight to get aircraft ID
  const flight = await db.query.flights.findFirst({
    where: eq(flights.id, flightId),
  });

  if (!flight) {
    throw new Error("Flight not found");
  }

  // Create new load plan
  const [newPlan] = await db.insert(loadPlans).values({
    flightId,
    aircraftId: flight.aircraftId,
    status: "DRAFT",
  }).returning();

  return newPlan;
}

/**
 * Save optimization results to database
 */
export async function saveOptimizationResults(
  loadPlanId: string,
  results: {
    assignments: Array<{
      uldTypeId: string;
      sequence: number;
      positionCode: string | null;
      totalWeightKg: number;
      tareWeightKg: number;
      cargoWeightKg: number;
      volumeUsedM3: number;
      volumeUtilization: number;
      weightUtilization: number;
      cargoItems: Array<{
        cargoItemId: string;
        sequence: number;
        xPositionCm: number;
        yPositionCm: number;
        zPositionCm: number;
        rotated: boolean;
        rotationAxis: string | null;
        packedLengthCm: number;
        packedWidthCm: number;
        packedHeightCm: number;
      }>;
    }>;
    computationTimeMs: number;
  }
) {
  if (isStaticDataMode()) {
    // Delete existing assignments (memory store handles this internally)
    const existingAssignments = memoryStore.getUldAssignmentsForLoadPlan(loadPlanId);
    for (const assignment of existingAssignments) {
      memoryStore.deleteUldAssignment(assignment.id);
    }

    // Create new assignments and packed items
    for (const assignment of results.assignments) {
      // Find ULD type to get the code
      const uldType = staticUldTypes.find((u) => u.id === assignment.uldTypeId);
      
      const newAssignment = memoryStore.createUldAssignment({
        loadPlanId,
        uldId: "", // Virtual ULD
        uldNumber: `V-${uldType?.code ?? "ULD"}-${assignment.sequence}`,
        uldTypeId: assignment.uldTypeId,
        uldTypeCode: uldType?.code ?? "ULD",
        assignedPositionId: null,
        positionCode: assignment.positionCode,
        deckCode: null,
        sequence: assignment.sequence,
        totalWeightKg: assignment.totalWeightKg,
        totalVolumeM3: assignment.volumeUsedM3,
        itemCount: assignment.cargoItems.length,
        status: "ASSIGNED",
      });

      // Create packed items
      for (const item of assignment.cargoItems) {
        memoryStore.createPackedItem({
          uldAssignmentId: newAssignment.id,
          cargoItemId: item.cargoItemId,
          sequence: item.sequence,
          xPositionCm: item.xPositionCm,
          yPositionCm: item.yPositionCm,
          zPositionCm: item.zPositionCm,
          isRotated: item.rotated,
        });
      }
    }

    // Update load plan status
    memoryStore.updateLoadPlan(loadPlanId, {
      status: "OPTIMIZED",
    });

    return;
  }

  // Delete existing position loads for this load plan first (foreign key constraint)
  await db.delete(positionLoads).where(eq(positionLoads.loadPlanId, loadPlanId));
  
  // Delete existing assignments for this load plan
  await db.delete(uldAssignments).where(eq(uldAssignments.loadPlanId, loadPlanId));

  // Insert new assignments
  for (const assignment of results.assignments) {
    const [newAssignment] = await db.insert(uldAssignments).values({
      loadPlanId,
      uldTypeId: assignment.uldTypeId,
      sequence: assignment.sequence,
      positionCode: assignment.positionCode,
      totalWeightKg: String(assignment.totalWeightKg),
      tareWeightKg: String(assignment.tareWeightKg),
      cargoWeightKg: String(assignment.cargoWeightKg),
      volumeUsedM3: String(assignment.volumeUsedM3),
      volumeUtilization: String(assignment.volumeUtilization),
      weightUtilization: String(assignment.weightUtilization),
      isVirtual: true,
      status: "PLANNED",
    }).returning();

    // Insert packed items
    for (const item of assignment.cargoItems) {
      await db.insert(packedItems).values({
        uldAssignmentId: newAssignment.id,
        cargoItemId: item.cargoItemId,
        sequence: item.sequence,
        xPositionCm: String(item.xPositionCm),
        yPositionCm: String(item.yPositionCm),
        zPositionCm: String(item.zPositionCm),
        rotated: item.rotated,
        rotationAxis: item.rotationAxis,
        packedLengthCm: String(item.packedLengthCm),
        packedWidthCm: String(item.packedWidthCm),
        packedHeightCm: String(item.packedHeightCm),
      });
    }
  }

  // Update load plan status
  await db.update(loadPlans)
    .set({
      status: "OPTIMIZED",
      optimizationTimeMs: results.computationTimeMs,
      optimizedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(loadPlans.id, loadPlanId));
}

// ============================================================================
// AIRCRAFT CONFIGURATION QUERIES
// ============================================================================

/**
 * Get aircraft configuration for a flight including decks, positions, and CG envelopes
 */
export async function getAircraftConfigForFlight(
  flightId: string
): Promise<AircraftConfigForPacking | null> {
  if (isStaticDataMode()) {
    const flight = staticFlights.find((f) => f.id === flightId);
    if (!flight) return null;
    return getAircraftConfigById(flight.aircraftId);
  }

  // Get flight with aircraft
  const flight = await db.query.flights.findFirst({
    where: eq(flights.id, flightId),
    with: {
      aircraft: true,
    },
  });

  if (!flight || !flight.aircraft) {
    return null;
  }

  return getAircraftConfigById(flight.aircraft.id);
}

/**
 * Get aircraft configuration by aircraft ID
 */
export async function getAircraftConfigById(
  aircraftId: string
): Promise<AircraftConfigForPacking | null> {
  if (isStaticDataMode()) {
    const aircraft = staticAircrafts.find((a) => a.id === aircraftId);
    if (!aircraft) return null;

    // Get the default preset for this aircraft
    const preset = staticDeckConfigurationPresets.find(
      (p) => p.aircraftId === aircraftId && p.isDefault
    ) ?? staticDeckConfigurationPresets.find((p) => p.aircraftId === aircraftId);

    if (!preset) {
      return {
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
        decks: [],
        cgEnvelopes: [],
      };
    }

    // Get deck configurations
    const decks = staticDeckConfigurations
      .filter((d) => d.presetId === preset.id)
      .sort((a, b) => a.sequence - b.sequence);

    // Get positions grouped by deck
    const deckConfigs: DeckConfigForPacking[] = decks.map((deck) => {
      const positions = staticLoadingPositions
        .filter((p) => p.deckId === deck.id)
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
        .map((pos) => ({
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
        }));

      return {
        id: deck.id,
        deckCode: deck.deckCode as DeckConfigForPacking["deckCode"],
        deckName: deck.deckName,
        maxStructuralWeightKg: deck.maxStructuralWeightKg,
        sequence: deck.sequence,
        positions,
      };
    });

    // Get CG envelopes
    const envelopes = staticCgEnvelopes.filter((e) => e.aircraftId === aircraftId);
    const cgEnvelopeConfigs: CgEnvelopeForPacking[] = envelopes.map((env) => {
      const points = staticCgEnvelopePoints
        .filter((p) => p.envelopeId === env.id)
        .sort((a, b) => a.sequence - b.sequence)
        .map((point) => ({
          sequence: point.sequence,
          weightKg: point.weightKg,
          cgPercentMac: point.cgPercentMac,
        }));

      return {
        id: env.id,
        envelopeType: env.envelopeType as CgEnvelopeForPacking["envelopeType"],
        forwardLimitPercentMac: env.forwardLimitPercentMac,
        aftLimitPercentMac: env.aftLimitPercentMac,
        points,
      };
    });

    return {
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
      decks: deckConfigs,
      cgEnvelopes: cgEnvelopeConfigs,
    };
  }

  // Get aircraft
  const aircraft = await db.query.aircrafts.findFirst({
    where: eq(aircrafts.id, aircraftId),
  });

  if (!aircraft) {
    return null;
  }

  // Get the default preset for this aircraft
  const defaultPreset = await db.query.deckConfigurationPresets.findFirst({
    where: and(
      eq(deckConfigurationPresets.aircraftId, aircraftId),
      eq(deckConfigurationPresets.isDefault, true)
    ),
  });

  // If no default preset, try to get any preset
  const preset = defaultPreset ?? await db.query.deckConfigurationPresets.findFirst({
    where: eq(deckConfigurationPresets.aircraftId, aircraftId),
  });

  if (!preset) {
    // No preset found, return aircraft config without deck configurations
    return {
      id: aircraft.id,
      name: aircraft.name,
      typeCode: aircraft.typeCode,
      operatingEmptyWeightKg: Number(aircraft.operatingEmptyWeightKg),
      maxZeroFuelWeightKg: Number(aircraft.maxZeroFuelWeightKg),
      maxTakeoffWeightKg: Number(aircraft.maxTakeoffWeightKg),
      maxLandingWeightKg: Number(aircraft.maxLandingWeightKg),
      totalMaxPayloadKg: Number(aircraft.totalMaxPayloadKg),
      macLeadingEdgeCm: Number(aircraft.macLeadingEdgeCm),
      macLengthCm: Number(aircraft.macLengthCm),
      decks: [],
      cgEnvelopes: [],
    };
  }

  // Get deck configurations with positions using presetId
  const decks = await db.query.deckConfigurations.findMany({
    where: eq(deckConfigurations.presetId, preset.id),
    orderBy: [asc(deckConfigurations.sequence)],
  });

  // Get all loading positions for these decks
  const deckIds = decks.map((d) => d.id);
  const positions =
    deckIds.length > 0
      ? await db.query.loadingPositions.findMany({
          where: inArray(loadingPositions.deckId, deckIds),
          orderBy: [asc(loadingPositions.sequenceNumber)],
        })
      : [];

  // Group positions by deck
  const positionsByDeck = new Map<string, LoadingPositionForPacking[]>();
  for (const pos of positions) {
    const deckPositions = positionsByDeck.get(pos.deckId) ?? [];
    deckPositions.push({
      id: pos.id,
      positionCode: pos.positionCode,
      sequenceNumber: pos.sequenceNumber,
      maxWeightKg: Number(pos.maxWeightKg),
      armStationCm: Number(pos.armStationCm),
      compatibleUldTypes: pos.compatibleUldTypes,
      acceptsBulkCargo: pos.acceptsBulkCargo,
      maxHeightCm: pos.maxHeightCm ? Number(pos.maxHeightCm) : null,
      contourCode: pos.contourCode,
      colIndex: pos.colIndex,
      rowIndex: pos.rowIndex,
    });
    positionsByDeck.set(pos.deckId, deckPositions);
  }

  // Build deck configurations
  const deckConfigs: DeckConfigForPacking[] = decks.map((deck) => ({
    id: deck.id,
    deckCode: deck.deckCode as DeckConfigForPacking["deckCode"],
    deckName: deck.deckName,
    maxStructuralWeightKg: deck.maxStructuralWeightKg
      ? Number(deck.maxStructuralWeightKg)
      : null,
    sequence: deck.sequence,
    positions: positionsByDeck.get(deck.id) ?? [],
  }));

  // Get CG envelopes with points
  const envelopes = await db.query.cgEnvelopes.findMany({
    where: eq(cgEnvelopes.aircraftId, aircraftId),
  });

  const envelopeIds = envelopes.map((e) => e.id);
  const allPoints =
    envelopeIds.length > 0
      ? await db.query.cgEnvelopePoints.findMany({
          where: inArray(cgEnvelopePoints.envelopeId, envelopeIds),
          orderBy: [asc(cgEnvelopePoints.sequence)],
        })
      : [];

  // Group points by envelope
  const pointsByEnvelope = new Map<
    string,
    CgEnvelopeForPacking["points"]
  >();
  for (const point of allPoints) {
    const envPoints = pointsByEnvelope.get(point.envelopeId) ?? [];
    envPoints.push({
      sequence: point.sequence,
      weightKg: Number(point.weightKg),
      cgPercentMac: Number(point.cgPercentMac),
    });
    pointsByEnvelope.set(point.envelopeId, envPoints);
  }

  // Build CG envelopes
  const cgEnvelopeConfigs: CgEnvelopeForPacking[] = envelopes.map((env) => ({
    id: env.id,
    envelopeType: env.envelopeType as CgEnvelopeForPacking["envelopeType"],
    forwardLimitPercentMac: Number(env.forwardLimitPercentMac),
    aftLimitPercentMac: Number(env.aftLimitPercentMac),
    points: pointsByEnvelope.get(env.id) ?? [],
  }));

  return {
    id: aircraft.id,
    name: aircraft.name,
    typeCode: aircraft.typeCode,
    operatingEmptyWeightKg: Number(aircraft.operatingEmptyWeightKg),
    maxZeroFuelWeightKg: Number(aircraft.maxZeroFuelWeightKg),
    maxTakeoffWeightKg: Number(aircraft.maxTakeoffWeightKg),
    maxLandingWeightKg: Number(aircraft.maxLandingWeightKg),
    totalMaxPayloadKg: Number(aircraft.totalMaxPayloadKg),
    macLeadingEdgeCm: aircraft.macLeadingEdgeCm
      ? Number(aircraft.macLeadingEdgeCm)
      : null,
    macLengthCm: aircraft.macLengthCm ? Number(aircraft.macLengthCm) : null,
    decks: deckConfigs,
    cgEnvelopes: cgEnvelopeConfigs,
  };
}

/**
 * Save position loads to database after optimization
 */
export async function savePositionLoads(
  loadPlanId: string,
  positionLoadsData: Array<{
    positionId: string;
    uldAssignmentId: string | null;
    positionCode: string;
    grossWeightKg: number;
    calculatedMoment: number | null;
    calculatedIndex: number | null;
  }>
) {
  if (isStaticDataMode()) {
    // Delete existing position loads
    memoryStore.deletePositionLoadsForLoadPlan(loadPlanId);

    // Create new position loads
    for (const load of positionLoadsData) {
      // Find position to get arm station and deck code
      const position = staticLoadingPositions.find((p) => p.id === load.positionId);
      const deck = position
        ? staticDeckConfigurations.find((d) => d.id === position.deckId)
        : null;

      memoryStore.createPositionLoad({
        loadPlanId,
        positionId: load.positionId,
        positionCode: load.positionCode,
        deckCode: deck?.deckCode ?? "",
        uldAssignmentId: load.uldAssignmentId,
        grossWeightKg: load.grossWeightKg,
        indexContribution: load.calculatedIndex ?? 0,
        armStationCm: position?.armStationCm ?? 0,
        sequence: position?.sequenceNumber ?? 0,
      });
    }

    return;
  }

  // Delete existing position loads for this load plan
  await db.delete(positionLoads).where(eq(positionLoads.loadPlanId, loadPlanId));

  // Insert new position loads
  for (const load of positionLoadsData) {
    await db.insert(positionLoads).values({
      loadPlanId,
      positionId: load.positionId,
      uldAssignmentId: load.uldAssignmentId,
      positionCode: load.positionCode,
      grossWeightKg: String(load.grossWeightKg),
      calculatedMoment: load.calculatedMoment
        ? String(load.calculatedMoment)
        : null,
      calculatedIndex: load.calculatedIndex
        ? String(load.calculatedIndex)
        : null,
      status: "PLANNED",
    });
  }
}

/**
 * Update load plan with CG calculation results
 */
export async function updateLoadPlanCgResults(
  loadPlanId: string,
  cgResults: {
    payloadKg: number;
    zeroFuelWeightKg: number;
    zfwCgPercentMac: number;
    withinCgEnvelope: boolean;
  }
) {
  if (isStaticDataMode()) {
    memoryStore.updateLoadPlan(loadPlanId, {
      totalCargoWeightKg: cgResults.payloadKg,
      estimatedCgPercentMac: cgResults.zfwCgPercentMac,
      isWithinEnvelope: cgResults.withinCgEnvelope,
    });
    return;
  }

  await db.update(loadPlans)
    .set({
      payloadKg: String(cgResults.payloadKg),
      zeroFuelWeightKg: String(cgResults.zeroFuelWeightKg),
      zfwCgPercentMac: String(cgResults.zfwCgPercentMac),
      withinCgEnvelope: cgResults.withinCgEnvelope,
      updatedAt: new Date(),
    })
    .where(eq(loadPlans.id, loadPlanId));
}

// ============================================================================
// ULD INVENTORY QUERIES
// ============================================================================

/**
 * Get available ULDs at a specific location
 * Returns ULDs with status "AVAILABLE" at the given location, including type details
 */
export async function getAvailableUldsAtLocation(
  locationId: string
): Promise<UldInventoryItem[]> {
  if (isStaticDataMode()) {
    return staticUlds
      .filter((uld) => uld.locationId === locationId && uld.status === "AVAILABLE")
      .map((uld) => {
        const uldType = staticUldTypes.find((t) => t.id === uld.uldTypeId);
        return {
          id: uld.id,
          uldNumber: uld.uldNumber,
          uldTypeId: uld.uldTypeId,
          uldType: uldType
            ? {
                id: uldType.id,
                code: uldType.code,
                name: uldType.name,
                category: uldType.category as "CONTAINER" | "PALLET",
                maxGrossWeightKg: uldType.maxGrossWeightKg,
                tareWeightKg: uldType.tareWeightKg,
                maxVolumeM3: uldType.maxVolumeM3,
                internalLengthCm: uldType.internalLengthCm ?? uldType.lengthCm,
                internalWidthCm: uldType.internalWidthCm ?? uldType.widthCm,
                internalHeightCm: uldType.internalHeightCm ?? uldType.heightCm,
                isRefrigerated: uldType.isRefrigerated,
              }
            : {
                id: uld.uldTypeId,
                code: "UNK",
                name: "Unknown",
                category: "CONTAINER" as const,
                maxGrossWeightKg: 0,
                tareWeightKg: 0,
                maxVolumeM3: 0,
                internalLengthCm: 0,
                internalWidthCm: 0,
                internalHeightCm: 0,
                isRefrigerated: false,
              },
          locationId: uld.locationId,
          ownerCode: uld.ownerCode,
          status: uld.status,
        };
      })
      .sort((a, b) => a.uldNumber.localeCompare(b.uldNumber));
  }

  const uldsAtLocation = await db.query.ulds.findMany({
    where: and(
      eq(ulds.locationId, locationId),
      eq(ulds.status, "AVAILABLE")
    ),
    with: {
      uldType: true,
    },
    orderBy: [asc(ulds.uldNumber)],
  });

  return uldsAtLocation.map((uld) => ({
    id: uld.id,
    uldNumber: uld.uldNumber,
    uldTypeId: uld.uldTypeId,
    uldType: {
      id: uld.uldType.id,
      code: uld.uldType.code,
      name: uld.uldType.name,
      category: uld.uldType.category as "CONTAINER" | "PALLET",
      maxGrossWeightKg: Number(uld.uldType.maxGrossWeightKg),
      tareWeightKg: Number(uld.uldType.tareWeightKg),
      maxVolumeM3: Number(uld.uldType.maxVolumeM3),
      internalLengthCm: uld.uldType.internalLengthCm
        ? Number(uld.uldType.internalLengthCm)
        : Number(uld.uldType.lengthCm),
      internalWidthCm: uld.uldType.internalWidthCm
        ? Number(uld.uldType.internalWidthCm)
        : Number(uld.uldType.widthCm),
      internalHeightCm: uld.uldType.internalHeightCm
        ? Number(uld.uldType.internalHeightCm)
        : Number(uld.uldType.heightCm),
      isRefrigerated: uld.uldType.isRefrigerated,
    },
    locationId: uld.locationId ?? "",
    ownerCode: uld.ownerCode,
    status: uld.status,
  }));
}

/**
 * Update ULD status
 */
export async function updateUldStatus(
  uldId: string,
  status: "AVAILABLE" | "ASSIGNED" | "IN_USE" | "MAINTENANCE"
): Promise<void> {
  if (isStaticDataMode()) {
    // In static mode, we don't actually persist ULD status changes
    // This is intentional since static data is immutable
    return;
  }

  await db.update(ulds)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(ulds.id, uldId));
}

/**
 * Update multiple ULD statuses
 */
export async function updateUldsStatus(
  uldIds: string[],
  status: "AVAILABLE" | "ASSIGNED" | "IN_USE" | "MAINTENANCE"
): Promise<void> {
  if (uldIds.length === 0) return;

  if (isStaticDataMode()) {
    // In static mode, we don't actually persist ULD status changes
    return;
  }

  await db.update(ulds)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(inArray(ulds.id, uldIds));
}

/**
 * Release ULDs from a load plan (set status back to AVAILABLE)
 * Finds all ULD assignments for the load plan and releases those ULDs
 */
export async function releaseUldsFromLoadPlan(loadPlanId: string): Promise<void> {
  if (isStaticDataMode()) {
    // In static mode, we don't actually persist ULD status changes
    return;
  }

  // Get all ULD assignments for this load plan
  const assignments = await db.query.uldAssignments.findMany({
    where: eq(uldAssignments.loadPlanId, loadPlanId),
  });

  // Get the ULD IDs that were used (not virtual)
  const uldIds = assignments
    .filter((a) => a.uldId !== null)
    .map((a) => a.uldId as string);

  if (uldIds.length > 0) {
    await updateUldsStatus(uldIds, "AVAILABLE");
  }
}

/**
 * Get flight with origin location for ULD availability check
 */
export async function getFlightWithOrigin(flightId: string) {
  if (isStaticDataMode()) {
    const flight = staticFlights.find((f) => f.id === flightId);
    if (!flight) return null;

    const origin = staticLocations.find((l) => l.id === flight.originId);
    const destination = staticLocations.find((l) => l.id === flight.destinationId);
    const aircraft = staticAircrafts.find((a) => a.id === flight.aircraftId);

    return {
      ...flight,
      origin,
      destination,
      aircraft,
    };
  }

  return db.query.flights.findFirst({
    where: eq(flights.id, flightId),
    with: {
      origin: true,
      destination: true,
      aircraft: true,
    },
  });
}

/**
 * Get load plan by ID
 */
export async function getLoadPlanById(loadPlanId: string) {
  if (isStaticDataMode()) {
    return memoryStore.getLoadPlanById(loadPlanId);
  }

  return db.query.loadPlans.findFirst({
    where: eq(loadPlans.id, loadPlanId),
  });
}

/**
 * Get load plans for a flight
 */
export async function getLoadPlansForFlight(flightId: string) {
  if (isStaticDataMode()) {
    return memoryStore.getLoadPlansForFlight(flightId);
  }

  return db.query.loadPlans.findMany({
    where: eq(loadPlans.flightId, flightId),
    orderBy: [desc(loadPlans.createdAt)],
  });
}

/**
 * Get ULD assignments for a load plan
 */
export async function getUldAssignmentsForLoadPlan(loadPlanId: string) {
  if (isStaticDataMode()) {
    return memoryStore.getUldAssignmentsForLoadPlan(loadPlanId);
  }

  return db.query.uldAssignments.findMany({
    where: eq(uldAssignments.loadPlanId, loadPlanId),
    orderBy: [asc(uldAssignments.sequence)],
  });
}

/**
 * Get position loads for a load plan
 */
export async function getPositionLoadsForLoadPlan(loadPlanId: string) {
  if (isStaticDataMode()) {
    return memoryStore.getPositionLoadsForLoadPlan(loadPlanId);
  }

  return db.query.positionLoads.findMany({
    where: eq(positionLoads.loadPlanId, loadPlanId),
    orderBy: [asc(positionLoads.positionCode)],
  });
}

/**
 * Get packed items for a ULD assignment
 */
export async function getPackedItemsForAssignment(uldAssignmentId: string) {
  if (isStaticDataMode()) {
    return memoryStore.getPackedItemsForAssignment(uldAssignmentId);
  }

  return db.query.packedItems.findMany({
    where: eq(packedItems.uldAssignmentId, uldAssignmentId),
    orderBy: [asc(packedItems.sequence)],
  });
}
