import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flights, locations, aircrafts, loadPlans, uldAssignments } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// GET - Get single flight with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [flight] = await db
      .select({
        id: flights.id,
        flightNumber: flights.flightNumber,
        aircraftId: flights.aircraftId,
        originId: flights.originId,
        destinationId: flights.destinationId,
        scheduledDeparture: flights.scheduledDeparture,
        scheduledArrival: flights.scheduledArrival,
        actualDeparture: flights.actualDeparture,
        actualArrival: flights.actualArrival,
        status: flights.status,
        createdAt: flights.createdAt,
        updatedAt: flights.updatedAt,
        originCode: sql<string>`origin.airport_code`,
        originCity: sql<string>`origin.city`,
        destinationCode: sql<string>`destination.airport_code`,
        destinationCity: sql<string>`destination.city`,
        aircraftName: aircrafts.name,
        aircraftType: aircrafts.typeCode,
        aircraftRegistration: aircrafts.registration,
      })
      .from(flights)
      .leftJoin(sql`${locations} AS origin`, sql`origin.id = ${flights.originId}`)
      .leftJoin(sql`${locations} AS destination`, sql`destination.id = ${flights.destinationId}`)
      .leftJoin(aircrafts, eq(aircrafts.id, flights.aircraftId))
      .where(eq(flights.id, id));

    if (!flight) {
      return NextResponse.json(
        { success: false, error: "Flight not found" },
        { status: 404 }
      );
    }

    // Get associated load plan if exists
    const [loadPlan] = await db
      .select()
      .from(loadPlans)
      .where(eq(loadPlans.flightId, id));

    // Get ULD assignments if load plan exists
    let assignments: typeof uldAssignments.$inferSelect[] = [];
    if (loadPlan) {
      assignments = await db
        .select()
        .from(uldAssignments)
        .where(eq(uldAssignments.loadPlanId, loadPlan.id));
    }

    return NextResponse.json({
      success: true,
      data: { flight, loadPlan, uldAssignments: assignments },
    });
  } catch (error) {
    console.error("Error fetching flight:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch flight" },
      { status: 500 }
    );
  }
}

// PUT - Update flight
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Partial<typeof flights.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.flightNumber !== undefined) updateData.flightNumber = body.flightNumber;
    if (body.aircraftId !== undefined) updateData.aircraftId = body.aircraftId;
    if (body.originId !== undefined) updateData.originId = body.originId;
    if (body.destinationId !== undefined) updateData.destinationId = body.destinationId;
    if (body.scheduledDeparture !== undefined) updateData.scheduledDeparture = new Date(body.scheduledDeparture);
    if (body.scheduledArrival !== undefined) updateData.scheduledArrival = new Date(body.scheduledArrival);
    if (body.actualDeparture !== undefined) updateData.actualDeparture = body.actualDeparture ? new Date(body.actualDeparture) : null;
    if (body.actualArrival !== undefined) updateData.actualArrival = body.actualArrival ? new Date(body.actualArrival) : null;
    if (body.status !== undefined) updateData.status = body.status;

    const [updatedFlight] = await db
      .update(flights)
      .set(updateData)
      .where(eq(flights.id, id))
      .returning();

    if (!updatedFlight) {
      return NextResponse.json(
        { success: false, error: "Flight not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedFlight });
  } catch (error) {
    console.error("Error updating flight:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update flight";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete flight
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if there's an active load plan
    const [loadPlan] = await db
      .select()
      .from(loadPlans)
      .where(eq(loadPlans.flightId, id));

    if (loadPlan && loadPlan.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Cannot delete flight with active load plan. Set load plan to DRAFT first." },
        { status: 400 }
      );
    }

    const [deletedFlight] = await db
      .delete(flights)
      .where(eq(flights.id, id))
      .returning();

    if (!deletedFlight) {
      return NextResponse.json(
        { success: false, error: "Flight not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Flight deleted successfully", flight: deletedFlight },
    });
  } catch (error) {
    console.error("Error deleting flight:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete flight" },
      { status: 500 }
    );
  }
}

