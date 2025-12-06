import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadPlans, uldAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST - Finalize build-up and prepare for load planning
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ loadPlanId: string }> }
) {
  try {
    const { loadPlanId } = await params;

    // Get load plan
    const [loadPlan] = await db
      .select()
      .from(loadPlans)
      .where(eq(loadPlans.id, loadPlanId));

    if (!loadPlan) {
      return NextResponse.json(
        { success: false, error: "Load plan not found" },
        { status: 404 }
      );
    }

    if (loadPlan.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Load plan is not in DRAFT status" },
        { status: 400 }
      );
    }

    // Get all ULD assignments
    const assignments = await db
      .select()
      .from(uldAssignments)
      .where(eq(uldAssignments.loadPlanId, loadPlanId));

    if (assignments.length === 0) {
      return NextResponse.json(
        { success: false, error: "No ULD assignments found. Add cargo to ULDs first." },
        { status: 400 }
      );
    }

    // Update all ULD assignment statuses
    await db
      .update(uldAssignments)
      .set({ status: "BUILD_UP_COMPLETE" })
      .where(eq(uldAssignments.loadPlanId, loadPlanId));

    // Update load plan status
    const [updatedPlan] = await db
      .update(loadPlans)
      .set({
        status: "BUILD_UP_COMPLETE",
        updatedAt: new Date(),
      })
      .where(eq(loadPlans.id, loadPlanId))
      .returning();

    // Calculate totals
    const totalCargoWeight = assignments.reduce(
      (sum, a) => sum + Number(a.cargoWeightKg || 0),
      0
    );
    const totalTareWeight = assignments.reduce(
      (sum, a) => sum + Number(a.tareWeightKg || 0),
      0
    );
    const totalWeight = totalCargoWeight + totalTareWeight;
    const totalVolume = assignments.reduce(
      (sum, a) => sum + Number(a.volumeUsedM3 || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        loadPlan: updatedPlan,
        summary: {
          totalAssignments: assignments.length,
          uldCount: assignments.filter((a) => !a.isVirtual).length,
          bulkCount: assignments.filter((a) => a.isVirtual).length,
          totalCargoWeightKg: totalCargoWeight,
          totalTareWeightKg: totalTareWeight,
          totalWeightKg: totalWeight,
          totalVolumeM3: totalVolume,
        },
        message: "Build-up finalized. Ready for load planning optimization.",
        nextStep: "POST /api/load-plans/{loadPlanId}/optimize",
      },
    });
  } catch (error) {
    console.error("Error finalizing build-up:", error);
    return NextResponse.json(
      { success: false, error: "Failed to finalize build-up" },
      { status: 500 }
    );
  }
}

