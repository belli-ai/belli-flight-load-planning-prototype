"use server";

import type {
  OptimizationResult,
  OptimizationOptions,
  PackingRule,
  BuildUpInstruction,
} from "../types";
import type { CargoItemDisplay } from "@/features/cargo";
import {
  MOCK_OPTIMIZATION_RESULT,
  MOCK_BUILD_UP_INSTRUCTIONS,
  MOCK_CARGO_ITEMS,
  MOCK_PACKING_RULES,
} from "../data/mock-data";
import {
  generateBuildUpInstructions,
  explainOptimization,
  parsePackingRule,
} from "../lib/llm/anthropic-client";

// ============================================================================
// OPTIMIZATION ACTION
// ============================================================================

type OptimizeInput = {
  flightId: string;
  cargoItemIds: string[];
  uldTypeIds: string[];
  rules: PackingRule[];
  options: OptimizationOptions;
};

/**
 * Run optimization algorithm on cargo items
 *
 * Currently uses mock data, will be replaced with actual bin-packing algorithm
 */
export async function runOptimization(
  input: OptimizeInput
): Promise<{ success: boolean; result?: OptimizationResult; error?: string }> {
  try {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Return mock result for now
    // TODO: Implement actual 3D bin-packing algorithm
    return {
      success: true,
      result: MOCK_OPTIMIZATION_RESULT,
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
 *
 * Uses Claude LLM to generate human-readable packing instructions
 */
export async function generateInstructions(
  input: GenerateInstructionsInput
): Promise<{ success: boolean; instructions?: BuildUpInstruction; error?: string }> {
  try {
    if (!input.useLLM) {
      // Return mock instructions
      const mockInstruction = MOCK_BUILD_UP_INSTRUCTIONS.find(
        (i) => i.uldTypeCode === input.uldTypeCode
      );
      return {
        success: true,
        instructions: mockInstruction || MOCK_BUILD_UP_INSTRUCTIONS[0],
      };
    }

    // Get cargo items for this ULD
    const cargoItems = MOCK_CARGO_ITEMS.filter((c) =>
      input.cargoItemIds.includes(c.id)
    );

    // Get optimization result to get positions
    const assignment = MOCK_OPTIMIZATION_RESULT.assignments.find(
      (a) => a.uldTypeCode === input.uldTypeCode
    );

    if (!assignment) {
      return {
        success: false,
        error: "ULD assignment not found",
      };
    }

    // Build context for LLM
    const context = {
      uldTypeCode: input.uldTypeCode,
      uldNumber: input.uldNumber,
      positionCode: input.positionCode,
      cargoItems: assignment.cargoItems.map((packed) => {
        const item = cargoItems.find((c) => c.id === packed.cargoItemId);
        return {
          item: item || MOCK_CARGO_ITEMS[0],
          position: packed,
        };
      }),
      totalWeightKg: assignment.totalWeightKg,
    };

    const instructions = await generateBuildUpInstructions(context);

    return {
      success: true,
      instructions,
    };
  } catch (error) {
    console.error("Instruction generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate instructions",
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
    const explanation = await explainOptimization(
      MOCK_OPTIMIZATION_RESULT.assignments,
      MOCK_PACKING_RULES
    );

    return {
      success: true,
      explanation,
    };
  } catch (error) {
    console.error("Explanation generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate explanation",
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
// CARGO DATA ACTIONS (Mock)
// ============================================================================

export async function getCargoItems(
  flightId: string
): Promise<{ success: boolean; items: CargoItemDisplay[] }> {
  // Return mock data
  return {
    success: true,
    items: MOCK_CARGO_ITEMS,
  };
}

export async function getPackingRules(): Promise<{
  success: boolean;
  rules: PackingRule[];
}> {
  return {
    success: true,
    rules: MOCK_PACKING_RULES,
  };
}

