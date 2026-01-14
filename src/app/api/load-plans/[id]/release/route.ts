import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST - Release a load plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { releasedBy } = body;

    // Get current plan
    const [plan] = await db.select().from(loadPlans).where(eq(loadPlans.id, id));

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Load plan not found" },
        { status: 404 }
      );
    }

    // Validate plan can be released
    if (plan.status === "RELEASED") {
      return NextResponse.json(
        { success: false, error: "Load plan is already released" },
        { status: 400 }
      );
    }

    // Check validation status
    const validationIssues: string[] = [];
    if (!plan.withinWeightLimits) {
      validationIssues.push("Weight limits exceeded");
    }
    if (!plan.withinCgEnvelope) {
      validationIssues.push("CG is outside acceptable envelope");
    }
    if (!plan.constraintsSatisfied) {
      validationIssues.push("Some constraints are not satisfied");
    }

    if (validationIssues.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot release load plan with validation errors",
          validationIssues 
        },
        { status: 400 }
      );
    }

    // Release the plan
    const [releasedPlan] = await db
      .update(loadPlans)
      .set({
        status: "RELEASED",
        releasedAt: new Date(),
        releasedBy: releasedBy || "SYSTEM",
        updatedAt: new Date(),
      })
      .where(eq(loadPlans.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: releasedPlan,
      message: "Load plan released successfully",
    });
  } catch (error) {
    console.error("Error releasing load plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to release load plan" },
      { status: 500 }
    );
  }
}

