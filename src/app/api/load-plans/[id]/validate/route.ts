import { NextRequest, NextResponse } from "next/server";
import { validateAndUpdateLoadPlan } from "@/lib/services/loadPlanValidation";

// POST - Validate and recalculate load plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const startTime = Date.now();

    const result = await validateAndUpdateLoadPlan(id);

    const optimizationTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        optimizationTimeMs,
      },
    });
  } catch (error) {
    console.error("Error validating load plan:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to validate load plan";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

