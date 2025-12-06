import { db } from "@/lib/db";
import {
  flights,
  loadPlans,
  uldAssignments,
  cargoItems,
  aircrafts,
  deckConfigurationPresets,
  deckConfigurations,
  loadingPositions,
} from "@/lib/db/schema";
import { eq, and, sum, sql } from "drizzle-orm";

export interface FlightCapacity {
  flightId: string;
  flightNumber: string;
  aircraftId: string;
  
  // Capacity limits
  mainDeckMaxWeightKg: number;
  mainDeckMaxVolumeM3: number;
  lowerDeckMaxWeightKg: number;
  lowerDeckMaxVolumeM3: number;
  totalMaxPayloadKg: number;
  
  // Current usage (ULD loaded)
  uldLoadedWeightKg: number;
  uldLoadedVolumeM3: number;
  
  // Bulk cargo (not in ULD)
  bulkCargoWeightKg: number;
  bulkCargoVolumeM3: number;
  
  // Available capacity
  availableWeightKg: number;
  availableVolumeM3: number;
  
  // Utilization percentages
  weightUtilizationPercent: number;
  volumeUtilizationPercent: number;
  
  // Breakdown by deck
  mainDeckUsedWeightKg: number;
  mainDeckUsedVolumeM3: number;
  lowerDeckUsedWeightKg: number;
  lowerDeckUsedVolumeM3: number;
  
  // Position availability
  totalPositions: number;
  occupiedPositions: number;
  availablePositions: number;
}

export interface CapacityUpdateResult {
  success: boolean;
  capacity: FlightCapacity | null;
  loadPlanId?: string;
  message: string;
}

/**
 * Calculate and update flight capacity based on current AWB/ULD assignments
 */
export async function updateFlightCapacity(
  flightId: string
): Promise<CapacityUpdateResult> {
  try {
    // Get flight and aircraft info
    const [flight] = await db
      .select()
      .from(flights)
      .where(eq(flights.id, flightId));

    if (!flight) {
      return {
        success: false,
        capacity: null,
        message: "Flight not found",
      };
    }

    const [aircraft] = await db
      .select()
      .from(aircrafts)
      .where(eq(aircrafts.id, flight.aircraftId));

    if (!aircraft) {
      return {
        success: false,
        capacity: null,
        message: "Aircraft not found",
      };
    }

    // Get or create load plan for this flight
    let [loadPlan] = await db
      .select()
      .from(loadPlans)
      .where(eq(loadPlans.flightId, flightId));

    if (!loadPlan) {
      // Create a new load plan
      const planNumber = `LP-${flight.flightNumber}-${Date.now()}`;
      [loadPlan] = await db
        .insert(loadPlans)
        .values({
          flightId,
          aircraftId: flight.aircraftId,
          planNumber,
          status: "DRAFT",
          operatingEmptyWeightKg: aircraft.operatingEmptyWeightKg,
        })
        .returning();
    }

    // Get ULD assignments for this load plan
    const assignments = await db
      .select({
        totalWeight: sum(uldAssignments.cargoWeightKg),
        totalVolume: sum(uldAssignments.volumeUsedM3),
        count: sql<number>`count(*)::int`,
      })
      .from(uldAssignments)
      .where(eq(uldAssignments.loadPlanId, loadPlan.id));

    const uldLoadedWeightKg = Number(assignments[0]?.totalWeight || 0);
    const uldLoadedVolumeM3 = Number(assignments[0]?.totalVolume || 0);
    const occupiedPositions = Number(assignments[0]?.count || 0);

    // Get bulk cargo (cargo not assigned to ULDs for this flight's destination)
    const bulkCargo = await db
      .select({
        totalWeight: sum(cargoItems.weightKg),
        totalVolume: sum(cargoItems.volumeM3),
      })
      .from(cargoItems)
      .where(
        and(
          eq(cargoItems.destinationId, flight.destinationId),
          eq(cargoItems.loadStatus, "PENDING"),
          sql`${cargoItems.assignedUldId} IS NULL`
        )
      );

    const bulkCargoWeightKg = Number(bulkCargo[0]?.totalWeight || 0);
    const bulkCargoVolumeM3 = Number(bulkCargo[0]?.totalVolume || 0);

    // Get total positions via default preset
    const [defaultPreset] = await db
      .select()
      .from(deckConfigurationPresets)
      .where(and(
        eq(deckConfigurationPresets.aircraftId, aircraft.id),
        eq(deckConfigurationPresets.isDefault, true)
      ))
      .limit(1);
    
    const decks = defaultPreset 
      ? await db
          .select()
          .from(deckConfigurations)
          .where(eq(deckConfigurations.presetId, defaultPreset.id))
      : [];

    let totalPositions = 0;
    for (const deck of decks) {
      const positions = await db
        .select()
        .from(loadingPositions)
        .where(eq(loadingPositions.deckId, deck.id));
      totalPositions += positions.length;
    }

    // Calculate capacities
    const mainDeckMaxWeightKg = Number(aircraft.mainDeckMaxWeightKg || 0);
    const mainDeckMaxVolumeM3 = Number(aircraft.mainDeckMaxVolumeM3 || 0);
    const lowerDeckMaxWeightKg = Number(aircraft.lowerDeckMaxWeightKg || 0);
    const lowerDeckMaxVolumeM3 = Number(aircraft.lowerDeckMaxVolumeM3 || 0);
    const totalMaxPayloadKg = Number(aircraft.totalMaxPayloadKg || 0);
    const totalMaxVolumeM3 = Number(aircraft.totalMaxVolumeM3 || 0);

    const totalUsedWeightKg = uldLoadedWeightKg + bulkCargoWeightKg;
    const totalUsedVolumeM3 = uldLoadedVolumeM3 + bulkCargoVolumeM3;

    const availableWeightKg = Math.max(0, totalMaxPayloadKg - totalUsedWeightKg);
    const availableVolumeM3 = Math.max(0, totalMaxVolumeM3 - totalUsedVolumeM3);

    const weightUtilizationPercent = totalMaxPayloadKg > 0
      ? (totalUsedWeightKg / totalMaxPayloadKg) * 100
      : 0;
    const volumeUtilizationPercent = totalMaxVolumeM3 > 0
      ? (totalUsedVolumeM3 / totalMaxVolumeM3) * 100
      : 0;

    // Update load plan with calculated values
    await db
      .update(loadPlans)
      .set({
        payloadKg: String(totalUsedWeightKg),
        updatedAt: new Date(),
      })
      .where(eq(loadPlans.id, loadPlan.id));

    const capacity: FlightCapacity = {
      flightId,
      flightNumber: flight.flightNumber,
      aircraftId: flight.aircraftId,
      mainDeckMaxWeightKg,
      mainDeckMaxVolumeM3,
      lowerDeckMaxWeightKg,
      lowerDeckMaxVolumeM3,
      totalMaxPayloadKg,
      uldLoadedWeightKg,
      uldLoadedVolumeM3,
      bulkCargoWeightKg,
      bulkCargoVolumeM3,
      availableWeightKg,
      availableVolumeM3,
      weightUtilizationPercent: Math.round(weightUtilizationPercent * 100) / 100,
      volumeUtilizationPercent: Math.round(volumeUtilizationPercent * 100) / 100,
      mainDeckUsedWeightKg: 0, // Would need position-level tracking
      mainDeckUsedVolumeM3: 0,
      lowerDeckUsedWeightKg: 0,
      lowerDeckUsedVolumeM3: 0,
      totalPositions,
      occupiedPositions,
      availablePositions: totalPositions - occupiedPositions,
    };

    return {
      success: true,
      capacity,
      loadPlanId: loadPlan.id,
      message: "Flight capacity updated successfully",
    };
  } catch (error) {
    console.error("Error updating flight capacity:", error);
    return {
      success: false,
      capacity: null,
      message: error instanceof Error ? error.message : "Failed to update flight capacity",
    };
  }
}

/**
 * Assign cargo to a ULD and update flight capacity
 */
export async function assignCargoToUld(
  flightId: string,
  uldAssignmentId: string,
  cargoItemIds: string[]
): Promise<CapacityUpdateResult> {
  try {
    // Get the ULD assignment
    const [assignment] = await db
      .select()
      .from(uldAssignments)
      .where(eq(uldAssignments.id, uldAssignmentId));

    if (!assignment) {
      return {
        success: false,
        capacity: null,
        message: "ULD assignment not found",
      };
    }

    // Update cargo items to reference this ULD assignment
    await db
      .update(cargoItems)
      .set({
        assignedUldId: uldAssignmentId,
        loadStatus: "ASSIGNED",
        updatedAt: new Date(),
      })
      .where(sql`${cargoItems.id} = ANY(${cargoItemIds})`);

    // Calculate new ULD weights
    const cargoInUld = await db
      .select({
        totalWeight: sum(cargoItems.weightKg),
        totalVolume: sum(cargoItems.volumeM3),
      })
      .from(cargoItems)
      .where(eq(cargoItems.assignedUldId, uldAssignmentId));

    const cargoWeightKg = Number(cargoInUld[0]?.totalWeight || 0);
    const volumeUsedM3 = Number(cargoInUld[0]?.totalVolume || 0);
    const tareWeightKg = Number(assignment.tareWeightKg || 0);

    // Update ULD assignment
    await db
      .update(uldAssignments)
      .set({
        cargoWeightKg: String(cargoWeightKg),
        totalWeightKg: String(cargoWeightKg + tareWeightKg),
        volumeUsedM3: String(volumeUsedM3),
        updatedAt: new Date(),
      })
      .where(eq(uldAssignments.id, uldAssignmentId));

    // Update flight capacity
    return updateFlightCapacity(flightId);
  } catch (error) {
    console.error("Error assigning cargo to ULD:", error);
    return {
      success: false,
      capacity: null,
      message: error instanceof Error ? error.message : "Failed to assign cargo",
    };
  }
}

/**
 * Add bulk cargo (not in ULD) to flight and update capacity
 */
export async function addBulkCargoToFlight(
  flightId: string,
  cargoItemIds: string[]
): Promise<CapacityUpdateResult> {
  try {
    // Get flight to get destination
    const [flight] = await db
      .select()
      .from(flights)
      .where(eq(flights.id, flightId));

    if (!flight) {
      return {
        success: false,
        capacity: null,
        message: "Flight not found",
      };
    }

    // Update cargo items to mark them for this flight (bulk)
    await db
      .update(cargoItems)
      .set({
        destinationId: flight.destinationId,
        loadStatus: "BULK_ASSIGNED",
        updatedAt: new Date(),
      })
      .where(sql`${cargoItems.id} = ANY(${cargoItemIds})`);

    // Update flight capacity
    return updateFlightCapacity(flightId);
  } catch (error) {
    console.error("Error adding bulk cargo:", error);
    return {
      success: false,
      capacity: null,
      message: error instanceof Error ? error.message : "Failed to add bulk cargo",
    };
  }
}

/**
 * Get current flight capacity without updating
 */
export async function getFlightCapacity(
  flightId: string
): Promise<CapacityUpdateResult> {
  return updateFlightCapacity(flightId);
}

