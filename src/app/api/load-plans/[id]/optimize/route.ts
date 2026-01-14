import { NextRequest, NextResponse } from "next/server";
import { optimizeLoadPlanWithLlm } from "@/lib/services/llmLoadPlanning";

// POST - Optimize load plan using LLM
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: loadPlanId } = await params;
    const body = await request.json();

    const {
      selectedRuleIds,
      fuelLoadKg,
      targetCgPercentMac,
      preferences,
    } = body;

    console.log(`Starting LLM load plan optimization for plan: ${loadPlanId}`);

    const result = await optimizeLoadPlanWithLlm({
      loadPlanId,
      selectedRuleIds,
      fuelLoadKg: fuelLoadKg || 8000,
      targetCgPercentMac,
      preferences,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Load plan optimization failed",
          details: result.validation.errors,
          warnings: result.validation.warnings,
          llmReasoning: result.llmReasoning,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Load plan optimized successfully using AI",
    });
  } catch (error) {
    console.error("Error optimizing load plan:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to optimize load plan";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

