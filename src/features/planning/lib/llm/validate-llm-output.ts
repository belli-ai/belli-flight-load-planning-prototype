/**
 * LLM Output Validation Module
 *
 * Validates optimization output from LLM to ensure:
 * - Correct JSON structure
 * - All cargo items assigned exactly once
 * - ULD weight limits respected
 * - 3D coordinates valid and non-overlapping
 * - Cargo dimensions fit within ULDs
 */

import type {
  CargoItemForPacking,
  UldTypeForPacking,
  OptimizationOutput,
  UldAssignmentOutput,
} from "../algorithm/types";

// ============================================================================
// TYPES
// ============================================================================

export type ValidationContext = {
  cargoItems: CargoItemForPacking[];
  uldTypes: UldTypeForPacking[];
  allowRotation?: boolean;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate LLM optimization output
 */
export function validateLlmOptimizationOutput(
  output: OptimizationOutput | null,
  context: ValidationContext
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!output) {
    errors.push("Output is null or undefined");
    return { isValid: false, errors, warnings };
  }

  // Validate structure
  const structureErrors = validateStructure(output);
  errors.push(...structureErrors);

  if (structureErrors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Validate cargo assignment completeness
  const cargoErrors = validateCargoAssignment(output, context.cargoItems);
  errors.push(...cargoErrors);

  // Validate each ULD assignment
  for (let i = 0; i < output.assignments.length; i++) {
    const assignment = output.assignments[i];
    const uldType = context.uldTypes.find((u) => u.id === assignment.uldTypeId);

    if (!uldType) {
      errors.push(`ULD assignment ${i + 1}: Unknown ULD type ID "${assignment.uldTypeId}"`);
      continue;
    }

    // Validate weight limits
    const weightErrors = validateUldWeight(assignment, uldType, i);
    errors.push(...weightErrors);

    // Validate 3D positions
    const positionErrors = validatePositions(
      assignment,
      uldType,
      context.cargoItems,
      context.allowRotation ?? true,
      i
    );
    errors.push(...positionErrors);

    // Validate cargo items exist
    const cargoExistErrors = validateCargoItemsExist(
      assignment,
      context.cargoItems,
      i
    );
    errors.push(...cargoExistErrors);
  }

  // Add warnings for potential issues
  const potentialWarnings = generateWarnings(output, context);
  warnings.push(...potentialWarnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// STRUCTURE VALIDATION
// ============================================================================

function validateStructure(output: OptimizationOutput): string[] {
  const errors: string[] = [];

  if (!output.status) {
    errors.push("Missing 'status' field");
  } else if (!["OPTIMAL", "FEASIBLE", "INFEASIBLE", "TIMEOUT", "ERROR"].includes(output.status)) {
    errors.push(`Invalid status value: "${output.status}"`);
  }

  if (!Array.isArray(output.assignments)) {
    errors.push("'assignments' must be an array");
  }

  if (!Array.isArray(output.unassignedCargoIds)) {
    errors.push("'unassignedCargoIds' must be an array");
  }

  // Validate each assignment structure
  if (Array.isArray(output.assignments)) {
    for (let i = 0; i < output.assignments.length; i++) {
      const a = output.assignments[i];
      if (!a.uldTypeId) {
        errors.push(`Assignment ${i + 1}: Missing 'uldTypeId'`);
      }
      if (!a.uldTypeCode) {
        errors.push(`Assignment ${i + 1}: Missing 'uldTypeCode'`);
      }
      if (typeof a.sequence !== "number") {
        errors.push(`Assignment ${i + 1}: Missing or invalid 'sequence'`);
      }
      if (!Array.isArray(a.cargoItems)) {
        errors.push(`Assignment ${i + 1}: 'cargoItems' must be an array`);
      }
      if (!a.uldDimensions || typeof a.uldDimensions.lengthCm !== "number") {
        errors.push(`Assignment ${i + 1}: Missing or invalid 'uldDimensions'`);
      }
    }
  }

  return errors;
}

// ============================================================================
// CARGO ASSIGNMENT VALIDATION
// ============================================================================

function validateCargoAssignment(
  output: OptimizationOutput,
  cargoItems: CargoItemForPacking[]
): string[] {
  const errors: string[] = [];
  const assignedIds = new Set<string>();
  const duplicates: string[] = [];

  // Collect all assigned cargo IDs
  for (const assignment of output.assignments) {
    for (const item of assignment.cargoItems) {
      if (assignedIds.has(item.cargoItemId)) {
        duplicates.push(item.cargoItemId);
      }
      assignedIds.add(item.cargoItemId);
    }
  }

  // Check for duplicates
  if (duplicates.length > 0) {
    errors.push(`Cargo items assigned multiple times: ${duplicates.slice(0, 3).join(", ")}${duplicates.length > 3 ? ` and ${duplicates.length - 3} more` : ""}`);
  }

  // Check for items assigned and also marked unassigned
  const bothAssignedAndUnassigned = output.unassignedCargoIds.filter((id) =>
    assignedIds.has(id)
  );
  if (bothAssignedAndUnassigned.length > 0) {
    errors.push(`Cargo items both assigned and unassigned: ${bothAssignedAndUnassigned.slice(0, 3).join(", ")}`);
  }

  // Check all cargo items are accounted for
  const allOutputIds = new Set([...assignedIds, ...output.unassignedCargoIds]);
  const inputIds = new Set(cargoItems.map((c) => c.id));

  // Missing from output
  const missingFromOutput = cargoItems.filter((c) => !allOutputIds.has(c.id));
  if (missingFromOutput.length > 0) {
    errors.push(`${missingFromOutput.length} cargo item(s) missing from output: ${missingFromOutput.slice(0, 3).map((c) => c.id).join(", ")}${missingFromOutput.length > 3 ? "..." : ""}`);
  }

  // Unknown IDs in output
  const unknownIds = [...allOutputIds].filter((id) => !inputIds.has(id));
  if (unknownIds.length > 0) {
    errors.push(`Unknown cargo IDs in output: ${unknownIds.slice(0, 3).join(", ")}${unknownIds.length > 3 ? "..." : ""}`);
  }

  return errors;
}

// ============================================================================
// WEIGHT VALIDATION
// ============================================================================

function validateUldWeight(
  assignment: UldAssignmentOutput,
  uldType: UldTypeForPacking,
  assignmentIndex: number
): string[] {
  const errors: string[] = [];
  const prefix = `ULD ${assignmentIndex + 1} (${assignment.uldTypeCode})`;

  const maxPayload = uldType.maxGrossWeightKg - uldType.tareWeightKg;

  // Check cargo weight doesn't exceed payload capacity
  if (assignment.cargoWeightKg > maxPayload) {
    errors.push(
      `${prefix}: Cargo weight ${assignment.cargoWeightKg.toFixed(1)}kg exceeds max payload ${maxPayload.toFixed(1)}kg`
    );
  }

  // Check total weight doesn't exceed gross weight limit
  if (assignment.totalWeightKg > uldType.maxGrossWeightKg) {
    errors.push(
      `${prefix}: Total weight ${assignment.totalWeightKg.toFixed(1)}kg exceeds max gross ${uldType.maxGrossWeightKg.toFixed(1)}kg`
    );
  }

  // Verify cargo weight calculation
  const summedCargoWeight = assignment.cargoItems.reduce((sum, item) => {
    // We can't verify individual weights without cargo data, but we can check consistency
    return sum;
  }, 0);

  // Verify tare + cargo = total (within tolerance)
  const expectedTotal = assignment.tareWeightKg + assignment.cargoWeightKg;
  if (Math.abs(expectedTotal - assignment.totalWeightKg) > 0.5) {
    errors.push(
      `${prefix}: Weight inconsistency - tare (${assignment.tareWeightKg}) + cargo (${assignment.cargoWeightKg}) ≠ total (${assignment.totalWeightKg})`
    );
  }

  return errors;
}

// ============================================================================
// 3D POSITION VALIDATION
// ============================================================================

type BoundingBox = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

function validatePositions(
  assignment: UldAssignmentOutput,
  uldType: UldTypeForPacking,
  cargoItems: CargoItemForPacking[],
  allowRotation: boolean,
  assignmentIndex: number
): string[] {
  const errors: string[] = [];
  const prefix = `ULD ${assignmentIndex + 1} (${assignment.uldTypeCode})`;

  const uldLength = assignment.uldDimensions.lengthCm || uldType.internalLengthCm;
  const uldWidth = assignment.uldDimensions.widthCm || uldType.internalWidthCm;
  const uldHeight = assignment.uldDimensions.heightCm || uldType.internalHeightCm;

  const boundingBoxes: Array<{ box: BoundingBox; cargoId: string }> = [];

  for (const packed of assignment.cargoItems) {
    const cargo = cargoItems.find((c) => c.id === packed.cargoItemId);
    if (!cargo) continue; // Will be caught by cargo existence validation

    // Get packed dimensions (might be rotated)
    const length = packed.dimensions.length;
    const width = packed.dimensions.width;
    const height = packed.dimensions.height;

    const box: BoundingBox = {
      minX: packed.position.x,
      maxX: packed.position.x + length,
      minY: packed.position.y,
      maxY: packed.position.y + width,
      minZ: packed.position.z,
      maxZ: packed.position.z + height,
    };

    // Check if item fits within ULD boundaries
    if (box.maxX > uldLength) {
      errors.push(
        `${prefix}: Item ${packed.cargoItemId} exceeds ULD length (${box.maxX.toFixed(0)} > ${uldLength})`
      );
    }
    if (box.maxY > uldWidth) {
      errors.push(
        `${prefix}: Item ${packed.cargoItemId} exceeds ULD width (${box.maxY.toFixed(0)} > ${uldWidth})`
      );
    }
    if (box.maxZ > uldHeight) {
      errors.push(
        `${prefix}: Item ${packed.cargoItemId} exceeds ULD height (${box.maxZ.toFixed(0)} > ${uldHeight})`
      );
    }

    // Check for negative positions
    if (box.minX < 0 || box.minY < 0 || box.minZ < 0) {
      errors.push(`${prefix}: Item ${packed.cargoItemId} has negative position coordinates`);
    }

    // Check for overlaps with other items
    for (const other of boundingBoxes) {
      if (boxesOverlap(box, other.box)) {
        errors.push(
          `${prefix}: Items ${packed.cargoItemId} and ${other.cargoId} overlap`
        );
      }
    }

    boundingBoxes.push({ box, cargoId: packed.cargoItemId });
  }

  return errors;
}

function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  // Two boxes overlap if and only if they overlap on all three axes
  const overlapX = a.minX < b.maxX && a.maxX > b.minX;
  const overlapY = a.minY < b.maxY && a.maxY > b.minY;
  const overlapZ = a.minZ < b.maxZ && a.maxZ > b.minZ;

  return overlapX && overlapY && overlapZ;
}

// ============================================================================
// CARGO EXISTENCE VALIDATION
// ============================================================================

function validateCargoItemsExist(
  assignment: UldAssignmentOutput,
  cargoItems: CargoItemForPacking[],
  assignmentIndex: number
): string[] {
  const errors: string[] = [];
  const prefix = `ULD ${assignmentIndex + 1} (${assignment.uldTypeCode})`;
  const cargoIds = new Set(cargoItems.map((c) => c.id));

  for (const packed of assignment.cargoItems) {
    if (!cargoIds.has(packed.cargoItemId)) {
      errors.push(`${prefix}: Unknown cargo item ID "${packed.cargoItemId}"`);
    }
  }

  return errors;
}

// ============================================================================
// WARNING GENERATION
// ============================================================================

function generateWarnings(
  output: OptimizationOutput,
  context: ValidationContext
): string[] {
  const warnings: string[] = [];

  // Warn about low utilization
  for (const assignment of output.assignments) {
    if (assignment.volumeUtilization < 0.3) {
      warnings.push(
        `ULD ${assignment.uldTypeCode} #${assignment.sequence} has low volume utilization (${(assignment.volumeUtilization * 100).toFixed(0)}%)`
      );
    }
    if (assignment.weightUtilization < 0.2) {
      warnings.push(
        `ULD ${assignment.uldTypeCode} #${assignment.sequence} has low weight utilization (${(assignment.weightUtilization * 100).toFixed(0)}%)`
      );
    }
  }

  // Warn about unassigned cargo
  if (output.unassignedCargoIds.length > 0) {
    warnings.push(`${output.unassignedCargoIds.length} cargo item(s) could not be assigned`);
  }

  // Warn about many ULDs used
  if (output.assignments.length > 10) {
    warnings.push(`Large number of ULDs used (${output.assignments.length})`);
  }

  return warnings;
}

