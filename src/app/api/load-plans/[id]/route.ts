import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  loadPlans,
  flights,
  aircrafts,
  uldAssignments,
  positionLoads,
  packedItems,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateFlightCapacity } from "@/lib/services/flightCapacity";

// GET - Get single load plan with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [loadPlan] = await db
      .select({
        id: loadPlans.id,
        flightId: loadPlans.flightId,
        aircraftId: loadPlans.aircraftId,
        planNumber: loadPlans.planNumber,
        status: loadPlans.status,
        operatingEmptyWeightKg: loadPlans.operatingEmptyWeightKg,
        dryOperatingWeightKg: loadPlans.dryOperatingWeightKg,
        payloadKg: loadPlans.payloadKg,
        zeroFuelWeightKg: loadPlans.zeroFuelWeightKg,
        takeoffFuelKg: loadPlans.takeoffFuelKg,
        tripFuelKg: loadPlans.tripFuelKg,
        takeoffWeightKg: loadPlans.takeoffWeightKg,
        landingWeightKg: loadPlans.landingWeightKg,
        zfwCgPercentMac: loadPlans.zfwCgPercentMac,
        zfwCgIndex: loadPlans.zfwCgIndex,
        towCgPercentMac: loadPlans.towCgPercentMac,
        towCgIndex: loadPlans.towCgIndex,
        ldwCgPercentMac: loadPlans.ldwCgPercentMac,
        ldwCgIndex: loadPlans.ldwCgIndex,
        stabilizerTrimUnits: loadPlans.stabilizerTrimUnits,
        withinWeightLimits: loadPlans.withinWeightLimits,
        withinCgEnvelope: loadPlans.withinCgEnvelope,
        constraintsSatisfied: loadPlans.constraintsSatisfied,
        lateralBalanceOk: loadPlans.lateralBalanceOk,
        validationErrors: loadPlans.validationErrors,
        validationWarnings: loadPlans.validationWarnings,
        optimizationTimeMs: loadPlans.optimizationTimeMs,
        optimizedAt: loadPlans.optimizedAt,
        releasedAt: loadPlans.releasedAt,
        releasedBy: loadPlans.releasedBy,
        createdAt: loadPlans.createdAt,
        updatedAt: loadPlans.updatedAt,
        flightNumber: flights.flightNumber,
        scheduledDeparture: flights.scheduledDeparture,
        aircraftName: aircrafts.name,
        aircraftType: aircrafts.typeCode,
      })
      .from(loadPlans)
      .leftJoin(flights, eq(flights.id, loadPlans.flightId))
      .leftJoin(aircrafts, eq(aircrafts.id, loadPlans.aircraftId))
      .where(eq(loadPlans.id, id));

    if (!loadPlan) {
      return NextResponse.json(
        { success: false, error: "Load plan not found" },
        { status: 404 }
      );
    }

    // Get ULD assignments
    const assignments = await db
      .select()
      .from(uldAssignments)
      .where(eq(uldAssignments.loadPlanId, id))
      .orderBy(uldAssignments.sequence);

    // Get position loads
    const positions = await db
      .select()
      .from(positionLoads)
      .where(eq(positionLoads.loadPlanId, id));

    // Get packed items for each assignment
    const assignmentsWithItems = await Promise.all(
      assignments.map(async (assignment) => {
        const items = await db
          .select()
          .from(packedItems)
          .where(eq(packedItems.uldAssignmentId, assignment.id))
          .orderBy(packedItems.sequence);
        return { ...assignment, packedItems: items };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        loadPlan,
        uldAssignments: assignmentsWithItems,
        positionLoads: positions,
      },
    });
  } catch (error) {
    console.error("Error fetching load plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch load plan" },
      { status: 500 }
    );
  }
}

// PUT - Update load plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Partial<typeof loadPlans.$inferInsert> = {
      updatedAt: new Date(),
    };

    // Map all updatable fields
    const fields = [
      'status', 'operatingEmptyWeightKg', 'dryOperatingWeightKg', 'payloadKg',
      'zeroFuelWeightKg', 'takeoffFuelKg', 'tripFuelKg', 'takeoffWeightKg',
      'landingWeightKg', 'zfwCgPercentMac', 'zfwCgIndex', 'towCgPercentMac',
      'towCgIndex', 'ldwCgPercentMac', 'ldwCgIndex', 'stabilizerTrimUnits',
      'withinWeightLimits', 'withinCgEnvelope', 'constraintsSatisfied',
      'lateralBalanceOk', 'validationErrors', 'validationWarnings',
      'optimizationTimeMs', 'releasedBy'
    ];

    fields.forEach((field) => {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field];
      }
    });

    if (body.optimizedAt !== undefined) {
      updateData.optimizedAt = body.optimizedAt ? new Date(body.optimizedAt) : null;
    }
    if (body.releasedAt !== undefined) {
      updateData.releasedAt = body.releasedAt ? new Date(body.releasedAt) : null;
    }

    const [updatedPlan] = await db
      .update(loadPlans)
      .set(updateData)
      .where(eq(loadPlans.id, id))
      .returning();

    if (!updatedPlan) {
      return NextResponse.json(
        { success: false, error: "Load plan not found" },
        { status: 404 }
      );
    }

    // Update flight capacity
    await updateFlightCapacity(updatedPlan.flightId);

    return NextResponse.json({ success: true, data: updatedPlan });
  } catch (error) {
    console.error("Error updating load plan:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update load plan";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete load plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check plan status
    const [plan] = await db.select().from(loadPlans).where(eq(loadPlans.id, id));

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Load plan not found" },
        { status: 404 }
      );
    }

    if (plan.status === "RELEASED") {
      return NextResponse.json(
        { success: false, error: "Cannot delete a released load plan" },
        { status: 400 }
      );
    }

    const [deletedPlan] = await db
      .delete(loadPlans)
      .where(eq(loadPlans.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: { message: "Load plan deleted successfully", loadPlan: deletedPlan },
    });
  } catch (error) {
    console.error("Error deleting load plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete load plan" },
      { status: 500 }
    );
  }
}

