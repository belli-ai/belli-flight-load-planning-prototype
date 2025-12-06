/**
 * 3D First Fit Decreasing (FFD) Bin Packing Optimizer
 *
 * This optimizer uses a modified 3D First Fit Decreasing algorithm:
 * 1. Sort cargo items by volume (descending)
 * 2. For each item, try to fit into existing ULDs
 * 3. If no fit, open a new ULD
 * 4. Uses guillotine splits for 3D space management
 * 5. Respects weight limits and stacking constraints
 */

import type {
  IUldOptimizer,
  OptimizerInput,
  OptimizationOutput,
  CargoItemForPacking,
  UldTypeForPacking,
  PackedItemOutput,
  UldAssignmentOutput,
  PackingConstraint,
  Position3D,
  Dimensions3D,
  AircraftConfigForPacking,
  CgResultOutput,
  UldInventoryItem,
} from "./types";
import {
  assignPositions,
  validatePayloadLimits,
  getCompatiblePositions,
  getAllPositions,
} from "./position-assigner";
import { calculateCgFromAssignments } from "./cg-calculator";

// ============================================================================
// INTERNAL TYPES
// ============================================================================

type FreeSpace = {
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
};

type OpenUld = {
  uldType: UldTypeForPacking;
  sequence: number;
  freeSpaces: FreeSpace[];
  packedItems: PackedItemOutput[];
  currentWeightKg: number;
  currentVolumeM3: number;
  /** Physical ULD ID from inventory (null if virtual) */
  uldId: string | null;
  /** ULD number in IATA format (null if virtual) */
  uldNumber: string | null;
};

type ItemOrientation = {
  length: number;
  width: number;
  height: number;
  rotated: boolean;
  rotationAxis: "X" | "Y" | "Z" | null;
};

// ============================================================================
// OPTIMIZER IMPLEMENTATION
// ============================================================================

export class Ffd3dOptimizer implements IUldOptimizer {
  readonly name = "ffd-3d";
  readonly description =
    "3D First Fit Decreasing bin packing algorithm with guillotine splits";

  async optimize(input: OptimizerInput): Promise<OptimizationOutput> {
    const startTime = performance.now();
    const warnings: string[] = [];

    try {
      // Validate inputs
      if (input.cargoItems.length === 0) {
        return this.createEmptyResult(startTime, "No cargo items to pack");
      }

      if (input.uldTypes.length === 0) {
        return this.createErrorResult(startTime, "No ULD types available");
      }

      // Filter ULD types based on aircraft position compatibility if config provided
      const filteredUldTypes = input.aircraftConfig
        ? this.filterUldTypesByAircraftCompatibility(
            input.uldTypes,
            input.aircraftConfig
          )
        : input.uldTypes;

      if (filteredUldTypes.length === 0) {
        return this.createErrorResult(
          startTime,
          "No ULD types compatible with aircraft positions"
        );
      }

      // Sort cargo based on objective strategy
      const sortedCargo = this.sortCargoItems(
        input.cargoItems,
        input.options.prioritizeHighPriorityCargo,
        input.options.objective
      );

      // Select best ULD types for this cargo set based on objective
      const selectedUldTypes = this.selectUldTypes(
        filteredUldTypes,
        sortedCargo,
        input.constraints,
        input.options.objective
      );

      // Validate payload limits if aircraft config provided
      if (input.aircraftConfig) {
        const totalCargoWeight = sortedCargo.reduce(
          (sum, c) => sum + c.weightKg,
          0
        );
        const payloadValidation = validatePayloadLimits(
          totalCargoWeight,
          input.aircraftConfig
        );
        if (!payloadValidation.valid) {
          warnings.push(...payloadValidation.warnings);
        }
      }

      // Run packing algorithm
      const { openUlds, unassignedItems } = this.packItems(
        sortedCargo,
        selectedUldTypes,
        input.constraints,
        input.options,
        warnings,
        input.uldInventory
      );

      // Build initial assignments (without position info)
      let assignments = this.buildAssignments(openUlds);

      // If aircraft config is provided, assign positions and calculate CG
      let cgResult: CgResultOutput | undefined;

      if (input.aircraftConfig && assignments.length > 0) {
        const positionResult = assignPositions(
          assignments,
          input.aircraftConfig,
          input.options.objective,
          input.options.targetCgPercentMac
        );

        // Update assignments with position info
        assignments = positionResult.assignments;

        // Add unassigned ULDs back as warnings
        if (positionResult.unassignedUlds.length > 0) {
          warnings.push(
            ...positionResult.warnings,
            `${positionResult.unassignedUlds.length} ULD(s) could not be assigned to aircraft positions`
          );
        }

        // Calculate CG result
        cgResult =
          calculateCgFromAssignments(assignments, input.aircraftConfig) ??
          undefined;

        // Add CG warnings
        if (cgResult && !cgResult.zfwWithinEnvelope) {
          warnings.push(
            `ZFW CG (${cgResult.zfwCgPercentMac.toFixed(
              1
            )}% MAC) outside envelope limits ` +
              `(${cgResult.forwardLimitPercentMac.toFixed(
                1
              )}% - ${cgResult.aftLimitPercentMac.toFixed(1)}%)`
          );
        }

        // Add target CG deviation if applicable
        if (cgResult && input.options.targetCgPercentMac !== undefined) {
          cgResult.cgDeviationFromTarget = Math.abs(
            cgResult.zfwCgPercentMac - input.options.targetCgPercentMac
          );
        }
      }

      const stats = this.calculateStats(
        assignments,
        sortedCargo,
        unassignedItems
      );
      const computationTimeMs = performance.now() - startTime;

      // Determine status
      let status: OptimizationOutput["status"] = "OPTIMAL";
      if (unassignedItems.length > 0) {
        status = "FEASIBLE";
      }
      if (cgResult && !cgResult.zfwWithinEnvelope) {
        status = "FEASIBLE"; // CG violation makes it not optimal
      }

      return {
        status,
        assignments,
        unassignedCargoIds: unassignedItems.map((i) => i.id),
        stats,
        computationTimeMs: Math.round(computationTimeMs),
        warnings,
        algorithmUsed: this.name,
        cgResult,
      };
    } catch (error) {
      return this.createErrorResult(
        startTime,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  // --------------------------------------------------------------------------
  // AIRCRAFT COMPATIBILITY FILTERING
  // --------------------------------------------------------------------------

  /**
   * Filter ULD types to only those compatible with aircraft positions
   */
  private filterUldTypesByAircraftCompatibility(
    uldTypes: UldTypeForPacking[],
    aircraftConfig: AircraftConfigForPacking
  ): UldTypeForPacking[] {
    const allPositions = getAllPositions(aircraftConfig);

    if (allPositions.length === 0) {
      // No positions defined, allow all ULD types
      return uldTypes;
    }

    return uldTypes.filter((uldType) => {
      // Check if at least one position accepts this ULD type
      const compatiblePositions = getCompatiblePositions(
        uldType.code,
        allPositions
      );
      return compatiblePositions.length > 0;
    });
  }

  // --------------------------------------------------------------------------
  // SORTING (objective-aware)
  // --------------------------------------------------------------------------

  private sortCargoItems(
    items: CargoItemForPacking[],
    prioritizeHighPriority?: boolean,
    objective?: OptimizerInput["options"]["objective"]
  ): CargoItemForPacking[] {
    return [...items].sort((a, b) => {
      // First by priority if enabled
      if (prioritizeHighPriority) {
        const priorityOrder = { HIGH: 0, STANDARD: 1, LOW: 2 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
      }

      // Strategy depends on objective
      switch (objective) {
        case "MAXIMIZE_UTILIZATION":
          // Sort by density (weight/volume) descending - pack dense items first
          // This helps fill ULDs more completely by weight
          const densityA = a.weightKg / a.volumeM3;
          const densityB = b.weightKg / b.volumeM3;
          if (Math.abs(densityA - densityB) > 0.1) {
            return densityB - densityA;
          }
          // Fallback to volume
          return b.volumeM3 - a.volumeM3;

        case "BALANCED":
          // Sort by a combined score that considers both weight and volume
          // Normalized score = 0.5 * (weight/maxWeight) + 0.5 * (volume/maxVolume)
          const maxWeight = Math.max(...items.map((i) => i.weightKg));
          const maxVolume = Math.max(...items.map((i) => i.volumeM3));
          const scoreA =
            0.5 * (a.weightKg / maxWeight) + 0.5 * (a.volumeM3 / maxVolume);
          const scoreB =
            0.5 * (b.weightKg / maxWeight) + 0.5 * (b.volumeM3 / maxVolume);
          return scoreB - scoreA;

        case "MINIMIZE_ULDS":
        default:
          // Classic FFD: sort by volume (descending) - larger items first
          return b.volumeM3 - a.volumeM3;
      }
    });
  }

  // --------------------------------------------------------------------------
  // ULD TYPE SELECTION (objective-aware)
  // --------------------------------------------------------------------------

  private selectUldTypes(
    uldTypes: UldTypeForPacking[],
    cargo: CargoItemForPacking[],
    constraints: PackingConstraint[],
    objective?: OptimizerInput["options"]["objective"]
  ): UldTypeForPacking[] {
    // Check if any cargo needs refrigeration
    const needsRefrigeration = cargo.some((c) => c.tempZoneCode !== null);

    // Filter ULD types based on constraints
    let selectedTypes = [...uldTypes];

    // Sort ULDs based on objective
    switch (objective) {
      case "MAXIMIZE_UTILIZATION":
        // For max utilization, prefer smaller ULDs that can be filled completely
        selectedTypes.sort((a, b) => a.maxVolumeM3 - b.maxVolumeM3);
        break;
      case "BALANCED":
        // For balanced, sort by volume-to-weight capacity ratio
        selectedTypes.sort((a, b) => {
          const ratioA = a.maxVolumeM3 / (a.maxGrossWeightKg - a.tareWeightKg);
          const ratioB = b.maxVolumeM3 / (b.maxGrossWeightKg - b.tareWeightKg);
          return ratioA - ratioB;
        });
        break;
      case "MINIMIZE_ULDS":
      default:
        // For min ULDs, prefer larger ULDs (pack more per ULD)
        selectedTypes.sort((a, b) => b.maxVolumeM3 - a.maxVolumeM3);
        break;
    }

    // If refrigerated cargo exists, prioritize refrigerated ULDs
    if (needsRefrigeration) {
      const refrigeratedTypes = selectedTypes.filter((u) => u.isRefrigerated);
      const normalTypes = selectedTypes.filter((u) => !u.isRefrigerated);
      selectedTypes = [...refrigeratedTypes, ...normalTypes];
    }

    return selectedTypes;
  }

  // --------------------------------------------------------------------------
  // MAIN PACKING ALGORITHM
  // --------------------------------------------------------------------------

  private packItems(
    items: CargoItemForPacking[],
    uldTypes: UldTypeForPacking[],
    constraints: PackingConstraint[],
    options: OptimizerInput["options"],
    warnings: string[],
    uldInventory?: UldInventoryItem[]
  ): { openUlds: OpenUld[]; unassignedItems: CargoItemForPacking[] } {
    const openUlds: OpenUld[] = [];
    const unassignedItems: CargoItemForPacking[] = [];
    let uldSequence = 0;

    // Track available physical ULDs from inventory (grouped by type)
    const availableInventory = new Map<string, UldInventoryItem[]>();
    if (uldInventory) {
      for (const uld of uldInventory) {
        const existing = availableInventory.get(uld.uldTypeId) || [];
        existing.push(uld);
        availableInventory.set(uld.uldTypeId, existing);
      }
    }

    for (const item of items) {
      let placed = false;

      // Determine valid ULD types for this item
      const validUldTypes = this.getValidUldTypesForItem(
        item,
        uldTypes,
        constraints
      );

      if (validUldTypes.length === 0) {
        warnings.push(
          `No valid ULD type for item ${item.awbNumber}-${item.pieceNumber}`
        );
        unassignedItems.push(item);
        continue;
      }

      // Try to fit in existing open ULDs
      // For MAXIMIZE_UTILIZATION, prioritize ULDs that are already partially filled
      const uldsToTry = this.sortUldsForPlacement(
        openUlds,
        validUldTypes,
        item,
        options.objective
      );

      for (const openUld of uldsToTry) {
        const placement = this.tryPlaceItem(
          item,
          openUld,
          constraints,
          options.allowRotation
        );
        if (placement) {
          this.placeItem(item, openUld, placement);
          placed = true;
          break;
        }
      }

      // If not placed, open a new ULD
      if (!placed) {
        // Check max ULDs limit
        if (options.maxUldsToUse && openUlds.length >= options.maxUldsToUse) {
          warnings.push(
            `Max ULDs limit reached. Item ${item.awbNumber}-${item.pieceNumber} unassigned`
          );
          unassignedItems.push(item);
          continue;
        }

        // Find best ULD type for this item based on objective
        const bestUldType = this.findBestUldTypeForItem(
          item,
          validUldTypes,
          options.objective
        );
        if (!bestUldType) {
          warnings.push(
            `Item ${item.awbNumber}-${item.pieceNumber} too large for any ULD`
          );
          unassignedItems.push(item);
          continue;
        }

        // Try to get a physical ULD from inventory first
        const inventoryItem = this.consumeInventoryUld(
          bestUldType.id,
          availableInventory
        );

        // Create new ULD (with inventory info if available)
        const newUld = this.createNewUld(
          bestUldType,
          ++uldSequence,
          inventoryItem
        );
        const placement = this.tryPlaceItem(
          item,
          newUld,
          constraints,
          options.allowRotation
        );

        if (placement) {
          this.placeItem(item, newUld, placement);
          openUlds.push(newUld);
          placed = true;
        } else {
          warnings.push(
            `Failed to place item ${item.awbNumber}-${item.pieceNumber} in new ULD`
          );
          unassignedItems.push(item);
          // Return the inventory ULD back to available pool if we couldn't use it
          if (inventoryItem) {
            const pool = availableInventory.get(bestUldType.id) || [];
            pool.push(inventoryItem);
            availableInventory.set(bestUldType.id, pool);
          }
        }
      }
    }

    return { openUlds, unassignedItems };
  }

  /**
   * Consume a physical ULD from inventory for the given ULD type
   * Returns the inventory item if available, null otherwise (virtual ULD will be used)
   */
  private consumeInventoryUld(
    uldTypeId: string,
    availableInventory: Map<string, UldInventoryItem[]>
  ): UldInventoryItem | null {
    const pool = availableInventory.get(uldTypeId);
    if (!pool || pool.length === 0) {
      return null;
    }
    return pool.shift() ?? null;
  }

  // --------------------------------------------------------------------------
  // ULD PLACEMENT ORDERING (objective-aware)
  // --------------------------------------------------------------------------

  private sortUldsForPlacement(
    openUlds: OpenUld[],
    validUldTypes: UldTypeForPacking[],
    item: CargoItemForPacking,
    objective?: OptimizerInput["options"]["objective"]
  ): OpenUld[] {
    // Filter to only ULDs of valid types
    const validUlds = openUlds.filter((uld) =>
      validUldTypes.some((t) => t.id === uld.uldType.id)
    );

    switch (objective) {
      case "MAXIMIZE_UTILIZATION":
        // Prioritize ULDs that are already partially filled (best-fit approach)
        // Try to fill existing ULDs as much as possible before opening new ones
        return [...validUlds].sort((a, b) => {
          // Calculate how much space would remain after placing this item
          const remainingA =
            a.uldType.maxVolumeM3 - a.currentVolumeM3 - item.volumeM3;
          const remainingB =
            b.uldType.maxVolumeM3 - b.currentVolumeM3 - item.volumeM3;
          // Prefer ULD where item leaves less remaining space (tighter fit)
          // But only if it still fits (remaining >= 0)
          if (remainingA < 0 && remainingB >= 0) return 1;
          if (remainingB < 0 && remainingA >= 0) return -1;
          if (remainingA < 0 && remainingB < 0) {
            // Both won't fit well, prefer the one with more current utilization
            return (
              b.currentVolumeM3 / b.uldType.maxVolumeM3 -
              a.currentVolumeM3 / a.uldType.maxVolumeM3
            );
          }
          return remainingA - remainingB;
        });

      case "BALANCED":
        // Balance weight and volume utilization across ULDs
        return [...validUlds].sort((a, b) => {
          const netCapacityA =
            a.uldType.maxGrossWeightKg - a.uldType.tareWeightKg;
          const netCapacityB =
            b.uldType.maxGrossWeightKg - b.uldType.tareWeightKg;

          // Current utilizations
          const weightUtilA =
            (a.currentWeightKg - a.uldType.tareWeightKg) / netCapacityA;
          const volumeUtilA = a.currentVolumeM3 / a.uldType.maxVolumeM3;
          const weightUtilB =
            (b.currentWeightKg - b.uldType.tareWeightKg) / netCapacityB;
          const volumeUtilB = b.currentVolumeM3 / b.uldType.maxVolumeM3;

          // Prefer ULDs where weight and volume are more balanced
          const imbalanceA = Math.abs(weightUtilA - volumeUtilA);
          const imbalanceB = Math.abs(weightUtilB - volumeUtilB);
          return imbalanceA - imbalanceB;
        });

      case "MINIMIZE_ULDS":
      default:
        // First-fit: try ULDs in order they were created (original behavior)
        return validUlds;
    }
  }

  // --------------------------------------------------------------------------
  // CONSTRAINT HANDLING
  // --------------------------------------------------------------------------

  private getValidUldTypesForItem(
    item: CargoItemForPacking,
    uldTypes: UldTypeForPacking[],
    constraints: PackingConstraint[]
  ): UldTypeForPacking[] {
    return uldTypes.filter((uld) => {
      // Temperature-controlled cargo needs refrigerated ULD
      if (item.tempZoneCode !== null && !uld.isRefrigerated) {
        return false;
      }

      // Check if item physically fits
      const netCapacity = uld.maxGrossWeightKg - uld.tareWeightKg;
      if (item.weightKg > netCapacity) {
        return false;
      }

      // Check dimensions (at least one orientation must fit)
      const orientations = this.getItemOrientations(item, true);
      const fits = orientations.some(
        (o) =>
          o.length <= uld.internalLengthCm &&
          o.width <= uld.internalWidthCm &&
          o.height <= uld.internalHeightCm
      );
      if (!fits) {
        return false;
      }

      return true;
    });
  }

  private findBestUldTypeForItem(
    item: CargoItemForPacking,
    validTypes: UldTypeForPacking[],
    objective?: OptimizerInput["options"]["objective"]
  ): UldTypeForPacking | null {
    if (validTypes.length === 0) return null;

    switch (objective) {
      case "MAXIMIZE_UTILIZATION":
        // For max utilization, pick the smallest ULD where item fills high % of space
        const sorted = [...validTypes].sort((a, b) => {
          const utilizationA = item.volumeM3 / a.maxVolumeM3;
          const utilizationB = item.volumeM3 / b.maxVolumeM3;
          // Prefer higher utilization (but still need space for more items)
          // Target ~30-50% utilization per item to leave room
          const targetUtil = 0.4;
          const diffA = Math.abs(utilizationA - targetUtil);
          const diffB = Math.abs(utilizationB - targetUtil);
          return diffA - diffB;
        });
        return sorted[0] ?? null;

      case "BALANCED":
        // For balanced, consider both weight and volume capacity headroom
        const balancedSorted = [...validTypes].sort((a, b) => {
          const netCapacityA = a.maxGrossWeightKg - a.tareWeightKg;
          const netCapacityB = b.maxGrossWeightKg - b.tareWeightKg;
          const weightUtilA = item.weightKg / netCapacityA;
          const volumeUtilA = item.volumeM3 / a.maxVolumeM3;
          const weightUtilB = item.weightKg / netCapacityB;
          const volumeUtilB = item.volumeM3 / b.maxVolumeM3;
          // Pick ULD where weight and volume utilizations are closest
          const balanceA = Math.abs(weightUtilA - volumeUtilA);
          const balanceB = Math.abs(weightUtilB - volumeUtilB);
          return balanceA - balanceB;
        });
        return balancedSorted[0] ?? null;

      case "MINIMIZE_ULDS":
      default:
        // For min ULDs, prefer smallest ULD that fits (original behavior)
        const minSorted = [...validTypes].sort(
          (a, b) => a.maxVolumeM3 - b.maxVolumeM3
        );
        return minSorted[0] ?? null;
    }
  }

  // --------------------------------------------------------------------------
  // 3D PACKING LOGIC
  // --------------------------------------------------------------------------

  private createNewUld(
    uldType: UldTypeForPacking,
    sequence: number,
    inventoryItem?: UldInventoryItem | null
  ): OpenUld {
    return {
      uldType,
      sequence,
      freeSpaces: [
        {
          x: 0,
          y: 0,
          z: 0,
          length: uldType.internalLengthCm,
          width: uldType.internalWidthCm,
          height: uldType.internalHeightCm,
        },
      ],
      packedItems: [],
      currentWeightKg: uldType.tareWeightKg,
      currentVolumeM3: 0,
      uldId: inventoryItem?.id ?? null,
      uldNumber: inventoryItem?.uldNumber ?? null,
    };
  }

  private getItemOrientations(
    item: CargoItemForPacking,
    allowRotation: boolean = true
  ): ItemOrientation[] {
    const orientations: ItemOrientation[] = [
      {
        length: item.lengthCm,
        width: item.widthCm,
        height: item.heightCm,
        rotated: false,
        rotationAxis: null,
      },
    ];

    if (allowRotation && item.isTiltable) {
      // Rotate around Z axis (swap length and width)
      orientations.push({
        length: item.widthCm,
        width: item.lengthCm,
        height: item.heightCm,
        rotated: true,
        rotationAxis: "Z",
      });

      // Rotate around Y axis (swap length and height)
      orientations.push({
        length: item.heightCm,
        width: item.widthCm,
        height: item.lengthCm,
        rotated: true,
        rotationAxis: "Y",
      });

      // Rotate around X axis (swap width and height)
      orientations.push({
        length: item.lengthCm,
        width: item.heightCm,
        height: item.widthCm,
        rotated: true,
        rotationAxis: "X",
      });
    } else if (allowRotation) {
      // Only allow Z rotation (keep upright)
      orientations.push({
        length: item.widthCm,
        width: item.lengthCm,
        height: item.heightCm,
        rotated: true,
        rotationAxis: "Z",
      });
    }

    return orientations;
  }

  private tryPlaceItem(
    item: CargoItemForPacking,
    uld: OpenUld,
    constraints: PackingConstraint[],
    allowRotation: boolean = true
  ): {
    space: FreeSpace;
    orientation: ItemOrientation;
    position: Position3D;
  } | null {
    // Check weight limit
    const netCapacity = uld.uldType.maxGrossWeightKg - uld.uldType.tareWeightKg;
    const usedWeight = uld.currentWeightKg - uld.uldType.tareWeightKg;
    if (usedWeight + item.weightKg > netCapacity) {
      return null;
    }

    // Check stacking constraints
    if (!this.checkStackingConstraints(item, uld, constraints)) {
      return null;
    }

    const orientations = this.getItemOrientations(item, allowRotation);

    // Sort free spaces by position (bottom-left-back first - BLF heuristic)
    const sortedSpaces = [...uld.freeSpaces].sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z; // Bottom first
      if (a.y !== b.y) return a.y - b.y; // Front first
      return a.x - b.x; // Left first
    });

    for (const space of sortedSpaces) {
      for (const orientation of orientations) {
        if (
          orientation.length <= space.length &&
          orientation.width <= space.width &&
          orientation.height <= space.height
        ) {
          return {
            space,
            orientation,
            position: { x: space.x, y: space.y, z: space.z },
          };
        }
      }
    }

    return null;
  }

  private checkStackingConstraints(
    item: CargoItemForPacking,
    uld: OpenUld,
    constraints: PackingConstraint[]
  ): boolean {
    // Check if non-stackable items are being stacked on
    if (!item.isStackable) {
      // Non-stackable items can still be placed, just nothing on top
      // This is handled by space management
    }

    // Check max stack weight for items below
    // Simplified: just allow placement for now
    // TODO: Implement full stacking weight check

    return true;
  }

  private placeItem(
    item: CargoItemForPacking,
    uld: OpenUld,
    placement: {
      space: FreeSpace;
      orientation: ItemOrientation;
      position: Position3D;
    }
  ): void {
    const { space, orientation, position } = placement;

    // Add packed item
    uld.packedItems.push({
      cargoItemId: item.id,
      position,
      dimensions: {
        length: orientation.length,
        width: orientation.width,
        height: orientation.height,
      },
      rotated: orientation.rotated,
      rotationAxis: orientation.rotationAxis,
      sequence: uld.packedItems.length + 1,
    });

    // Update ULD stats
    uld.currentWeightKg += item.weightKg;
    uld.currentVolumeM3 += item.volumeM3;

    // Update free spaces using guillotine split
    this.updateFreeSpaces(uld, space, orientation, position);
  }

  private updateFreeSpaces(
    uld: OpenUld,
    usedSpace: FreeSpace,
    itemDimensions: Dimensions3D,
    itemPosition: Position3D
  ): void {
    // Remove the used space
    uld.freeSpaces = uld.freeSpaces.filter((s) => s !== usedSpace);

    // Guillotine split: create up to 3 new spaces
    const newSpaces: FreeSpace[] = [];

    // Space to the right (X direction)
    const rightSpace = usedSpace.length - itemDimensions.length;
    if (rightSpace > 0) {
      newSpaces.push({
        x: itemPosition.x + itemDimensions.length,
        y: usedSpace.y,
        z: usedSpace.z,
        length: rightSpace,
        width: usedSpace.width,
        height: usedSpace.height,
      });
    }

    // Space in front (Y direction)
    const frontSpace = usedSpace.width - itemDimensions.width;
    if (frontSpace > 0) {
      newSpaces.push({
        x: usedSpace.x,
        y: itemPosition.y + itemDimensions.width,
        z: usedSpace.z,
        length: itemDimensions.length, // Only the width of the placed item
        width: frontSpace,
        height: usedSpace.height,
      });
    }

    // Space on top (Z direction)
    const topSpace = usedSpace.height - itemDimensions.height;
    if (topSpace > 0) {
      newSpaces.push({
        x: usedSpace.x,
        y: usedSpace.y,
        z: itemPosition.z + itemDimensions.height,
        length: itemDimensions.length,
        width: itemDimensions.width,
        height: topSpace,
      });
    }

    // Filter out tiny spaces (less than 10cm in any dimension)
    const minDimension = 10;
    const validSpaces = newSpaces.filter(
      (s) =>
        s.length >= minDimension &&
        s.width >= minDimension &&
        s.height >= minDimension
    );

    uld.freeSpaces.push(...validSpaces);
  }

  // --------------------------------------------------------------------------
  // OUTPUT BUILDING
  // --------------------------------------------------------------------------

  private buildAssignments(openUlds: OpenUld[]): UldAssignmentOutput[] {
    return openUlds.map((uld) => ({
      uldId: uld.uldId,
      uldNumber: uld.uldNumber,
      uldTypeId: uld.uldType.id,
      uldTypeCode: uld.uldType.code,
      sequence: uld.sequence,
      positionCode: null, // Aircraft position assigned later
      cargoItems: uld.packedItems,
      totalWeightKg: uld.currentWeightKg,
      tareWeightKg: uld.uldType.tareWeightKg,
      cargoWeightKg: uld.currentWeightKg - uld.uldType.tareWeightKg,
      volumeUsedM3: uld.currentVolumeM3,
      volumeUtilization: uld.currentVolumeM3 / uld.uldType.maxVolumeM3,
      weightUtilization:
        (uld.currentWeightKg - uld.uldType.tareWeightKg) /
        (uld.uldType.maxGrossWeightKg - uld.uldType.tareWeightKg),
      uldDimensions: {
        lengthCm: uld.uldType.internalLengthCm,
        widthCm: uld.uldType.internalWidthCm,
        heightCm: uld.uldType.internalHeightCm,
      },
      maxGrossWeightKg: uld.uldType.maxGrossWeightKg,
    }));
  }

  private calculateStats(
    assignments: UldAssignmentOutput[],
    allCargo: CargoItemForPacking[],
    unassigned: CargoItemForPacking[]
  ): OptimizationOutput["stats"] {
    const totalCargoWeight = allCargo.reduce((sum, c) => sum + c.weightKg, 0);
    const totalCargoVolume = allCargo.reduce((sum, c) => sum + c.volumeM3, 0);
    const unassignedWeight = unassigned.reduce((sum, c) => sum + c.weightKg, 0);
    const unassignedVolume = unassigned.reduce((sum, c) => sum + c.volumeM3, 0);

    const avgVolumeUtil =
      assignments.length > 0
        ? assignments.reduce((sum, a) => sum + a.volumeUtilization, 0) /
          assignments.length
        : 0;

    const avgWeightUtil =
      assignments.length > 0
        ? assignments.reduce((sum, a) => sum + a.weightUtilization, 0) /
          assignments.length
        : 0;

    return {
      uldsUsed: assignments.length,
      totalCargoItems: allCargo.length,
      totalCargoWeight,
      totalCargoVolume,
      avgVolumeUtilization: avgVolumeUtil,
      avgWeightUtilization: avgWeightUtil,
      unassignedCount: unassigned.length,
      unassignedWeight,
      unassignedVolume,
    };
  }

  // --------------------------------------------------------------------------
  // HELPER RESULTS
  // --------------------------------------------------------------------------

  private createEmptyResult(
    startTime: number,
    message: string
  ): OptimizationOutput {
    return {
      status: "OPTIMAL",
      assignments: [],
      unassignedCargoIds: [],
      stats: {
        uldsUsed: 0,
        totalCargoItems: 0,
        totalCargoWeight: 0,
        totalCargoVolume: 0,
        avgVolumeUtilization: 0,
        avgWeightUtilization: 0,
        unassignedCount: 0,
        unassignedWeight: 0,
        unassignedVolume: 0,
      },
      computationTimeMs: Math.round(performance.now() - startTime),
      warnings: [message],
      algorithmUsed: this.name,
    };
  }

  private createErrorResult(
    startTime: number,
    error: string
  ): OptimizationOutput {
    return {
      status: "ERROR",
      assignments: [],
      unassignedCargoIds: [],
      stats: {
        uldsUsed: 0,
        totalCargoItems: 0,
        totalCargoWeight: 0,
        totalCargoVolume: 0,
        avgVolumeUtilization: 0,
        avgWeightUtilization: 0,
        unassignedCount: 0,
        unassignedWeight: 0,
        unassignedVolume: 0,
      },
      computationTimeMs: Math.round(performance.now() - startTime),
      warnings: [error],
      algorithmUsed: this.name,
    };
  }
}

// Factory function for registry
export function createFfd3dOptimizer(): IUldOptimizer {
  return new Ffd3dOptimizer();
}
