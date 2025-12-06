"use server";

import type {
  OptimizationResult,
  OptimizationOptions,
  PackingRule,
  BuildUpInstruction,
} from "../types";
import type { CargoItemDisplay } from "@/features/cargo";
import {
  getCargoItemsByIds,
  getUldTypes,
  getActivePackingRules,
  getOrCreateLoadPlan,
  saveOptimizationResults,
  getFlightsWithDetails,
  getCargoItemsForFlight,
  getAircraftConfigForFlight,
  savePositionLoads,
  updateLoadPlanCgResults,
  getFlightById,
  getAvailableUldsAtLocation,
  updateUldsStatus,
} from "../data/queries";
import {
  getOptimizer,
  type PackingConstraint,
  type OptimizationOutput,
} from "../lib/algorithm";
import {
  generateBuildUpInstructions,
  explainOptimization,
  parsePackingRule,
  runLlmOptimization,
  type LlmOptimizerInput,
} from "../lib/llm/anthropic-client";
import { validateLlmOptimizationOutput } from "../lib/llm/validate-llm-output";

// ============================================================================
// OPTIMIZATION ACTION
// ============================================================================

type OptimizeInput = {
  flightId: string;
  cargoItemIds: string[];
  uldTypeIds?: string[];
  rules?: PackingRule[];
  options: OptimizationOptions;
  algorithmName?: string; // Allow specifying which algorithm to use
  useLlm?: boolean; // Use LLM-based optimization instead of algorithm
};

/** Which optimizer was used for the result */
export type OptimizerUsed = "FFD3D" | "LLM" | "LLM_FALLBACK";

const MAX_LLM_RETRIES = 3;

/**
 * Run optimization algorithm on cargo items
 */
export async function runOptimization(input: OptimizeInput): Promise<{
  success: boolean;
  result?: OptimizationResult;
  error?: string;
  optimizerUsed?: OptimizerUsed;
}> {
  try {
    // Get or create load plan
    const loadPlan = await getOrCreateLoadPlan(input.flightId);

    // Fetch flight details to get origin location
    const flight = await getFlightById(input.flightId);
    if (!flight) {
      return {
        success: false,
        error: "Flight not found",
      };
    }

    // Fetch cargo items from database
    const cargoItems = await getCargoItemsByIds(input.cargoItemIds);

    if (cargoItems.length === 0) {
      return {
        success: false,
        error: "No cargo items found for the provided IDs",
      };
    }

    // Fetch ULD types
    const uldTypes = await getUldTypes();

    if (uldTypes.length === 0) {
      return {
        success: false,
        error: "No ULD types available in database",
      };
    }

    // Fetch available ULDs from inventory at origin location
    const uldInventory = await getAvailableUldsAtLocation(flight.originId);

    // Fetch packing rules
    const rules = input.rules ?? (await getActivePackingRules());

    // Convert rules to constraints
    const constraints: PackingConstraint[] = rules
      .filter((r) => r.structuredRule)
      .map((r) => ({
        id: r.id,
        type: r.structuredRule!.type,
        condition: r.structuredRule!.condition,
        constraint: r.structuredRule!.constraint,
        priority: r.priority,
        parameters: r.structuredRule!.parameters,
      }));

    // Fetch aircraft configuration for position assignment and CG calculations
    const aircraftConfig = await getAircraftConfigForFlight(input.flightId);

    let optimizationResult: OptimizationOutput;
    let optimizerUsed: OptimizerUsed = "FFD3D";

    // Choose optimization approach
    if (input.useLlm) {
      // Try LLM optimization with retry logic
      const llmResult = await runLlmOptimizationWithRetry(
        {
          cargoItems,
          uldTypes,
          constraints,
          options: {
            objective: input.options.objective ?? "MINIMIZE_ULDS",
            maxUldsToUse: input.options.maxUldsToUse,
            prioritizeHighPriorityCargo:
              input.options.prioritizeHighPriorityCargo,
            allowRotation: input.options.allowRotation ?? true,
            targetCgPercentMac: input.options.targetCgPercentMac,
          },
          aircraftConfig: aircraftConfig ?? undefined,
          uldInventory,
        },
        cargoItems,
        uldTypes
      );

      if (llmResult.success && llmResult.output) {
        optimizationResult = llmResult.output;
        optimizerUsed = "LLM";
      } else {
        // Fallback to algorithm
        console.warn(
          "LLM optimization failed, falling back to FFD-3D algorithm:",
          llmResult.error
        );
        const optimizer = getOptimizer(input.algorithmName);
        optimizationResult = await optimizer.optimize({
          cargoItems,
          uldTypes,
          constraints,
          options: {
            objective: input.options.objective ?? "MINIMIZE_ULDS",
            maxUldsToUse: input.options.maxUldsToUse,
            prioritizeHighPriorityCargo:
              input.options.prioritizeHighPriorityCargo,
            allowRotation: input.options.allowRotation ?? true,
            targetCgPercentMac: input.options.targetCgPercentMac,
          },
          aircraftConfig: aircraftConfig ?? undefined,
          uldInventory,
        });
        optimizerUsed = "LLM_FALLBACK";

        // Add warning about fallback
        optimizationResult.warnings.push(
          `LLM optimization failed after ${MAX_LLM_RETRIES} attempts. Used FFD-3D algorithm as fallback.`
        );
      }
    } else {
      // Use traditional algorithm
      const optimizer = getOptimizer(input.algorithmName);
      optimizationResult = await optimizer.optimize({
        cargoItems,
        uldTypes,
        constraints,
        options: {
          objective: input.options.objective ?? "MINIMIZE_ULDS",
          maxUldsToUse: input.options.maxUldsToUse,
          prioritizeHighPriorityCargo:
            input.options.prioritizeHighPriorityCargo,
          allowRotation: input.options.allowRotation ?? true,
          targetCgPercentMac: input.options.targetCgPercentMac,
        },
        aircraftConfig: aircraftConfig ?? undefined,
        uldInventory,
      });
    }

    // Save results to database
    await saveOptimizationResults(loadPlan.id, {
      assignments: optimizationResult.assignments.map((a) => ({
        uldTypeId: a.uldTypeId,
        uldId: a.uldId,
        uldNumber: a.uldNumber,
        sequence: a.sequence,
        positionCode: a.positionCode,
        totalWeightKg: a.totalWeightKg,
        tareWeightKg: a.tareWeightKg,
        cargoWeightKg: a.cargoWeightKg,
        volumeUsedM3: a.volumeUsedM3,
        volumeUtilization: a.volumeUtilization,
        weightUtilization: a.weightUtilization,
        cargoItems: a.cargoItems.map((item) => ({
          cargoItemId: item.cargoItemId,
          sequence: item.sequence,
          xPositionCm: item.position.x,
          yPositionCm: item.position.y,
          zPositionCm: item.position.z,
          rotated: item.rotated,
          rotationAxis: item.rotationAxis,
          packedLengthCm: item.dimensions.length,
          packedWidthCm: item.dimensions.width,
          packedHeightCm: item.dimensions.height,
        })),
      })),
      computationTimeMs: optimizationResult.computationTimeMs,
    });

    // Update status of assigned physical ULDs to ASSIGNED
    const usedUldIds = optimizationResult.assignments
      .filter((a) => a.uldId !== null)
      .map((a) => a.uldId as string);

    if (usedUldIds.length > 0) {
      await updateUldsStatus(usedUldIds, "ASSIGNED");
    }

    // Save position loads if aircraft config was used
    if (aircraftConfig && optimizationResult.assignments.length > 0) {
      const positionLoadsData = optimizationResult.assignments
        .filter((a) => a.positionAssignment)
        .map((a) => ({
          positionId: a.positionAssignment!.positionId,
          uldAssignmentId: null, // Will be linked after ULD assignment is saved
          positionCode: a.positionAssignment!.positionCode,
          grossWeightKg: a.totalWeightKg,
          calculatedMoment: a.positionAssignment!.momentKgCm,
          calculatedIndex: null,
        }));

      if (positionLoadsData.length > 0) {
        await savePositionLoads(loadPlan.id, positionLoadsData);
      }

      // Update load plan with CG results
      if (optimizationResult.cgResult) {
        await updateLoadPlanCgResults(loadPlan.id, {
          payloadKg: optimizationResult.cgResult.payloadWeightKg,
          zeroFuelWeightKg: optimizationResult.cgResult.zeroFuelWeightKg,
          zfwCgPercentMac: optimizationResult.cgResult.zfwCgPercentMac,
          withinCgEnvelope: optimizationResult.cgResult.zfwWithinEnvelope,
        });
      }
    }

    // Convert to API response format
    const result = convertToOptimizationResult(optimizationResult, uldTypes);

    return {
      success: true,
      result,
      optimizerUsed,
    };
  } catch (error) {
    console.error("Optimization failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Optimization failed",
    };
  }
}

// ============================================================================
// LLM OPTIMIZATION WITH RETRY
// ============================================================================

import type {
  CargoItemForPacking,
  UldTypeForPacking,
} from "../lib/algorithm/types";

type LlmRetryResult = {
  success: boolean;
  output?: OptimizationOutput;
  error?: string;
  attempts: number;
};

/**
 * Run LLM optimization with retry logic and validation
 */
async function runLlmOptimizationWithRetry(
  input: LlmOptimizerInput,
  cargoItems: CargoItemForPacking[],
  uldTypes: UldTypeForPacking[]
): Promise<LlmRetryResult> {
  let lastError: string | undefined;
  let previousErrors: string[] = [];

  for (let attempt = 1; attempt <= MAX_LLM_RETRIES; attempt++) {
    console.log(`LLM optimization attempt ${attempt}/${MAX_LLM_RETRIES}`);

    // Run LLM optimization with previous errors for context
    const llmResult = await runLlmOptimization({
      ...input,
      previousErrors: previousErrors.length > 0 ? previousErrors : undefined,
    });

    if (llmResult.error) {
      lastError = llmResult.error;
      previousErrors = [`API Error: ${llmResult.error}`];
      continue;
    }

    if (!llmResult.output) {
      lastError = "LLM returned no output";
      previousErrors = ["LLM returned no output"];
      continue;
    }

    // Validate the output
    const validation = validateLlmOptimizationOutput(llmResult.output, {
      cargoItems,
      uldTypes,
      allowRotation: input.options.allowRotation,
    });

    if (validation.isValid) {
      // Add validation warnings to output
      if (validation.warnings.length > 0) {
        llmResult.output.warnings.push(...validation.warnings);
      }
      return {
        success: true,
        output: llmResult.output,
        attempts: attempt,
      };
    }

    // Validation failed - collect errors for retry
    lastError = validation.errors.join("; ");
    previousErrors = validation.errors;
    console.warn(
      `LLM output validation failed (attempt ${attempt}):`,
      validation.errors
    );
  }

  return {
    success: false,
    error: lastError ?? "LLM optimization failed after max retries",
    attempts: MAX_LLM_RETRIES,
  };
}

/**
 * Convert internal optimization output to API result format
 */
function convertToOptimizationResult(
  output: OptimizationOutput,
  uldTypes: { id: string; code: string }[]
): OptimizationResult {
  return {
    status: output.status,
    objectiveValue: output.stats.uldsUsed,
    computationTimeMs: output.computationTimeMs,
    assignments: output.assignments.map((a) => ({
      uldId: a.uldId,
      uldNumber: a.uldNumber,
      uldTypeId: a.uldTypeId,
      uldTypeCode: a.uldTypeCode,
      positionCode: a.positionCode,
      cargoItems: a.cargoItems.map((item) => ({
        cargoItemId: item.cargoItemId,
        position: item.position,
        dimensions: item.dimensions,
        rotated: item.rotated,
        rotationAxis: item.rotationAxis,
      })),
      totalWeightKg: a.totalWeightKg,
      volumeUsedM3: a.volumeUsedM3,
      volumeUtilization: a.volumeUtilization,
      weightUtilization: a.weightUtilization,
      uldDimensions: {
        lengthCm: a.uldDimensions.lengthCm,
        widthCm: a.uldDimensions.widthCm,
        heightCm: a.uldDimensions.heightCm,
      },
      maxGrossWeightKg: a.maxGrossWeightKg,
      positionAssignment: a.positionAssignment
        ? {
            positionId: a.positionAssignment.positionId,
            positionCode: a.positionAssignment.positionCode,
            deckCode: a.positionAssignment.deckCode,
            armStationCm: a.positionAssignment.armStationCm,
            momentKgCm: a.positionAssignment.momentKgCm,
          }
        : undefined,
    })),
    unassignedCargoIds: output.unassignedCargoIds,
    stats: output.stats,
    warnings: output.warnings,
    cgResult: output.cgResult
      ? {
          zeroFuelWeightKg: output.cgResult.zeroFuelWeightKg,
          zfwCgPercentMac: output.cgResult.zfwCgPercentMac,
          zfwWithinEnvelope: output.cgResult.zfwWithinEnvelope,
          payloadWeightKg: output.cgResult.payloadWeightKg,
          totalMomentKgCm: output.cgResult.totalMomentKgCm,
          forwardLimitPercentMac: output.cgResult.forwardLimitPercentMac,
          aftLimitPercentMac: output.cgResult.aftLimitPercentMac,
          cgDeviationFromTarget: output.cgResult.cgDeviationFromTarget,
        }
      : undefined,
  };
}

// ============================================================================
// BUILD-UP INSTRUCTIONS ACTION
// ============================================================================

type GenerateInstructionsInput = {
  uldAssignmentId: string;
  uldTypeCode: string;
  uldNumber: string;
  positionCode: string | null;
  cargoItemIds: string[];
  useLLM?: boolean;
};

/**
 * Generate build-up instructions for a ULD
 */
export async function generateInstructions(
  input: GenerateInstructionsInput
): Promise<{
  success: boolean;
  instructions?: BuildUpInstruction;
  error?: string;
}> {
  try {
    // Get cargo items
    const cargoItems = await getCargoItemsByIds(input.cargoItemIds);

    // Build context for LLM
    const context = {
      uldTypeCode: input.uldTypeCode,
      uldNumber: input.uldNumber,
      positionCode: input.positionCode,
      cargoItems: cargoItems.map((item, index) => ({
        item: {
          id: item.id,
          awbNumber: item.awbNumber,
          pieceNumber: item.pieceNumber,
          weightKg: item.weightKg,
          lengthCm: item.lengthCm,
          widthCm: item.widthCm,
          heightCm: item.heightCm,
          isDangerousGoods: item.isDangerousGoods,
          priority: item.priority,
          loadStatus: "PENDING" as const,
          description: item.specialHandlingCodes.join(", ") || "General cargo",
          specialHandling: item.specialHandlingCodes,
        },
        position: {
          cargoItemId: item.id,
          position: { x: 0, y: 0, z: index * 50 }, // Placeholder positions
          dimensions: {
            length: item.lengthCm,
            width: item.widthCm,
            height: item.heightCm,
          },
          rotated: false,
          rotationAxis: null,
        },
      })),
      totalWeightKg: cargoItems.reduce((sum, c) => sum + c.weightKg, 0),
    };

    if (input.useLLM) {
      const instructions = await generateBuildUpInstructions(context);
      return { success: true, instructions };
    }

    // Generate simple instructions without LLM
    const instructions: BuildUpInstruction = {
      uldNumber: input.uldNumber,
      uldTypeCode: input.uldTypeCode,
      positionCode: input.positionCode,
      steps: cargoItems.map((item, index) => ({
        sequence: index + 1,
        action: "LOAD",
        cargoDescription: `${item.awbNumber} piece ${item.pieceNumber}`,
        awbNumber: item.awbNumber,
        weightKg: item.weightKg,
        placement: `Position at floor level`,
        warnings: item.isDangerousGoods
          ? ["Handle as dangerous goods"]
          : undefined,
      })),
      notes: ["Standard build-up procedure"],
      totalWeightKg: context.totalWeightKg,
      estimatedBuildTimeMinutes: Math.ceil(cargoItems.length * 5),
    };

    return { success: true, instructions };
  } catch (error) {
    console.error("Instruction generation failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate instructions",
    };
  }
}

// ============================================================================
// EXPLANATION ACTION
// ============================================================================

type ExplainInput = {
  optimizationResultId?: string;
};

/**
 * Generate natural language explanation of optimization results
 */
export async function explainOptimizationResult(
  input: ExplainInput
): Promise<{ success: boolean; explanation?: string; error?: string }> {
  try {
    const rules = await getActivePackingRules();

    // For now, return a generic explanation
    // TODO: Pass actual optimization results when available
    const explanation = `Optimization completed successfully. Applied ${rules.length} active rules.`;

    return {
      success: true,
      explanation,
    };
  } catch (error) {
    console.error("Explanation generation failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate explanation",
    };
  }
}

// ============================================================================
// RULE PARSING ACTION
// ============================================================================

type ParseRuleInput = {
  ruleText: string;
};

/**
 * Parse a natural language rule into structured format
 */
export async function parseRule(
  input: ParseRuleInput
): Promise<{ success: boolean; structuredRule?: object; error?: string }> {
  try {
    const structuredRule = await parsePackingRule(input.ruleText);

    return {
      success: true,
      structuredRule,
    };
  } catch (error) {
    console.error("Rule parsing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse rule",
    };
  }
}

// ============================================================================
// DATA ACCESS ACTIONS
// ============================================================================

/**
 * Get cargo items for a flight
 */
export async function getCargoItems(
  flightId: string
): Promise<{ success: boolean; items: CargoItemDisplay[] }> {
  try {
    const items = await getCargoItemsForFlight(flightId);

    // Convert to display format
    const displayItems: CargoItemDisplay[] = items.map((item) => ({
      id: item.id,
      awbNumber: item.awbNumber,
      pieceNumber: item.pieceNumber,
      weightKg: item.weightKg,
      lengthCm: item.lengthCm,
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      isDangerousGoods: item.isDangerousGoods,
      dgClassCode: item.dgClassCode,
      isStackable: item.isStackable,
      priority: item.priority,
      loadStatus: "PENDING" as const,
      description: item.specialHandlingCodes.join(", ") || "General cargo",
      specialHandling: item.specialHandlingCodes,
    }));

    return {
      success: true,
      items: displayItems,
    };
  } catch (error) {
    console.error("Failed to get cargo items:", error);
    return {
      success: true,
      items: [],
    };
  }
}

/**
 * Get available packing rules
 */
export async function getPackingRules(): Promise<{
  success: boolean;
  rules: PackingRule[];
}> {
  try {
    const rules = await getActivePackingRules();
    return {
      success: true,
      rules,
    };
  } catch (error) {
    console.error("Failed to get packing rules:", error);
    return {
      success: true,
      rules: [],
    };
  }
}

/**
 * Get available flights
 */
export async function getFlights(): Promise<{
  success: boolean;
  flights: Array<{
    id: string;
    flightNumber: string;
    aircraftType: string;
    origin: string;
    destination: string;
    scheduledDeparture: Date;
    status: string;
  }>;
}> {
  try {
    const flights = await getFlightsWithDetails();
    return {
      success: true,
      flights,
    };
  } catch (error) {
    console.error("Failed to get flights:", error);
    return {
      success: true,
      flights: [],
    };
  }
}
