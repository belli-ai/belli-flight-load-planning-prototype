/**
 * In-Memory State Store
 *
 * Handles runtime state for load plans, ULD assignments, and packed items
 * when running in static data mode. This enables Build-Up to create plans
 * that Load Balancing can read.
 */

// Simple UUID v4 generator without external dependency
function generateUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// TYPES
// ============================================================================

export type LoadPlanStatus =
  | "DRAFT"
  | "OPTIMIZING"
  | "OPTIMIZED"
  | "VALIDATED"
  | "RELEASED"
  | "FINALIZED";

export type LoadPlan = {
  id: string;
  flightId: string;
  version: number;
  status: LoadPlanStatus;
  totalCargoWeightKg: number;
  totalCargoVolumeM3: number;
  uldCount: number;
  bulkCargoWeightKg: number;
  totalIndexChange: number | null;
  estimatedCgPercentMac: number | null;
  isWithinEnvelope: boolean | null;
  optimizationScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  releasedAt: Date | null;
  releasedBy: string | null;
};

export type UldAssignment = {
  id: string;
  loadPlanId: string;
  uldId: string;
  uldNumber: string;
  uldTypeId: string;
  uldTypeCode: string;
  assignedPositionId: string | null;
  positionCode: string | null;
  deckCode: string | null;
  sequence: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  itemCount: number;
  status: "ASSIGNED" | "LOADING" | "LOADED" | "REMOVED";
  createdAt: Date;
  updatedAt: Date;
};

export type PackedItem = {
  id: string;
  uldAssignmentId: string;
  cargoItemId: string;
  sequence: number;
  xPositionCm: number;
  yPositionCm: number;
  zPositionCm: number;
  isRotated: boolean;
  createdAt: Date;
};

export type PositionLoad = {
  id: string;
  loadPlanId: string;
  positionId: string;
  positionCode: string;
  deckCode: string;
  uldAssignmentId: string | null;
  grossWeightKg: number;
  indexContribution: number;
  armStationCm: number;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// IN-MEMORY STORE
// ============================================================================

class MemoryStore {
  private loadPlans: Map<string, LoadPlan> = new Map();
  private uldAssignments: Map<string, UldAssignment> = new Map();
  private packedItems: Map<string, PackedItem> = new Map();
  private positionLoads: Map<string, PositionLoad> = new Map();

  // Load Plans
  createLoadPlan(data: Omit<LoadPlan, "id" | "createdAt" | "updatedAt">): LoadPlan {
    const id = generateUuid();
    const now = new Date();
    const loadPlan: LoadPlan = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.loadPlans.set(id, loadPlan);
    return loadPlan;
  }

  getLoadPlanById(id: string): LoadPlan | null {
    return this.loadPlans.get(id) ?? null;
  }

  getLoadPlanByFlightId(flightId: string): LoadPlan | null {
    for (const plan of this.loadPlans.values()) {
      if (plan.flightId === flightId) {
        return plan;
      }
    }
    return null;
  }

  getLoadPlansForFlight(flightId: string): LoadPlan[] {
    return Array.from(this.loadPlans.values()).filter(
      (plan) => plan.flightId === flightId
    );
  }

  updateLoadPlan(id: string, data: Partial<LoadPlan>): LoadPlan | null {
    const existing = this.loadPlans.get(id);
    if (!existing) return null;

    const updated: LoadPlan = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    this.loadPlans.set(id, updated);
    return updated;
  }

  deleteLoadPlan(id: string): boolean {
    // Also delete related assignments and packed items
    const assignments = this.getUldAssignmentsForLoadPlan(id);
    for (const assignment of assignments) {
      this.deletePackedItemsForAssignment(assignment.id);
      this.uldAssignments.delete(assignment.id);
    }
    this.deletePositionLoadsForLoadPlan(id);
    return this.loadPlans.delete(id);
  }

  // ULD Assignments
  createUldAssignment(
    data: Omit<UldAssignment, "id" | "createdAt" | "updatedAt">
  ): UldAssignment {
    const id = generateUuid();
    const now = new Date();
    const assignment: UldAssignment = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.uldAssignments.set(id, assignment);
    return assignment;
  }

  getUldAssignmentById(id: string): UldAssignment | null {
    return this.uldAssignments.get(id) ?? null;
  }

  getUldAssignmentsForLoadPlan(loadPlanId: string): UldAssignment[] {
    return Array.from(this.uldAssignments.values()).filter(
      (a) => a.loadPlanId === loadPlanId
    );
  }

  updateUldAssignment(
    id: string,
    data: Partial<UldAssignment>
  ): UldAssignment | null {
    const existing = this.uldAssignments.get(id);
    if (!existing) return null;

    const updated: UldAssignment = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    this.uldAssignments.set(id, updated);
    return updated;
  }

  deleteUldAssignment(id: string): boolean {
    this.deletePackedItemsForAssignment(id);
    return this.uldAssignments.delete(id);
  }

  // Packed Items
  createPackedItem(data: Omit<PackedItem, "id" | "createdAt">): PackedItem {
    const id = generateUuid();
    const packedItem: PackedItem = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.packedItems.set(id, packedItem);
    return packedItem;
  }

  getPackedItemsForAssignment(uldAssignmentId: string): PackedItem[] {
    return Array.from(this.packedItems.values()).filter(
      (item) => item.uldAssignmentId === uldAssignmentId
    );
  }

  deletePackedItemsForAssignment(uldAssignmentId: string): void {
    for (const [id, item] of this.packedItems) {
      if (item.uldAssignmentId === uldAssignmentId) {
        this.packedItems.delete(id);
      }
    }
  }

  // Position Loads
  createPositionLoad(
    data: Omit<PositionLoad, "id" | "createdAt" | "updatedAt">
  ): PositionLoad {
    const id = generateUuid();
    const now = new Date();
    const positionLoad: PositionLoad = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.positionLoads.set(id, positionLoad);
    return positionLoad;
  }

  getPositionLoadsForLoadPlan(loadPlanId: string): PositionLoad[] {
    return Array.from(this.positionLoads.values()).filter(
      (p) => p.loadPlanId === loadPlanId
    );
  }

  updatePositionLoad(
    id: string,
    data: Partial<PositionLoad>
  ): PositionLoad | null {
    const existing = this.positionLoads.get(id);
    if (!existing) return null;

    const updated: PositionLoad = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    this.positionLoads.set(id, updated);
    return updated;
  }

  deletePositionLoadsForLoadPlan(loadPlanId: string): void {
    for (const [id, load] of this.positionLoads) {
      if (load.loadPlanId === loadPlanId) {
        this.positionLoads.delete(id);
      }
    }
  }

  // Batch operations for optimization results
  saveOptimizationResults(
    loadPlanId: string,
    assignments: Array<Omit<UldAssignment, "id" | "createdAt" | "updatedAt">>,
    items: Array<{
      uldAssignmentIndex: number;
      cargoItemId: string;
      sequence: number;
      xPositionCm: number;
      yPositionCm: number;
      zPositionCm: number;
      isRotated: boolean;
    }>
  ): { assignments: UldAssignment[]; packedItems: PackedItem[] } {
    const createdAssignments: UldAssignment[] = [];

    // Create assignments
    for (const assignmentData of assignments) {
      const assignment = this.createUldAssignment({
        ...assignmentData,
        loadPlanId,
      });
      createdAssignments.push(assignment);
    }

    // Create packed items
    const createdPackedItems: PackedItem[] = [];
    for (const itemData of items) {
      const assignment = createdAssignments[itemData.uldAssignmentIndex];
      if (assignment) {
        const packedItem = this.createPackedItem({
          uldAssignmentId: assignment.id,
          cargoItemId: itemData.cargoItemId,
          sequence: itemData.sequence,
          xPositionCm: itemData.xPositionCm,
          yPositionCm: itemData.yPositionCm,
          zPositionCm: itemData.zPositionCm,
          isRotated: itemData.isRotated,
        });
        createdPackedItems.push(packedItem);
      }
    }

    return { assignments: createdAssignments, packedItems: createdPackedItems };
  }

  // Clear all data (useful for testing/reset)
  clear(): void {
    this.loadPlans.clear();
    this.uldAssignments.clear();
    this.packedItems.clear();
    this.positionLoads.clear();
  }

  // Debug: Get all data
  getAll() {
    return {
      loadPlans: Array.from(this.loadPlans.values()),
      uldAssignments: Array.from(this.uldAssignments.values()),
      packedItems: Array.from(this.packedItems.values()),
      positionLoads: Array.from(this.positionLoads.values()),
    };
  }
}

// Export singleton instance
export const memoryStore = new MemoryStore();

