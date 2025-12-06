import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flights, locations, aircrafts } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// GET - List all flights with filtering options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const originId = searchParams.get("originId");
    const destinationId = searchParams.get("destinationId");
    const aircraftId = searchParams.get("aircraftId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const flightNumber = searchParams.get("flightNumber");

    // Build query with joins for location names
    const flightsList = await db
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
      })
      .from(flights)
      .leftJoin(sql`${locations} AS origin`, sql`origin.id = ${flights.originId}`)
      .leftJoin(sql`${locations} AS destination`, sql`destination.id = ${flights.destinationId}`)
      .leftJoin(aircrafts, eq(aircrafts.id, flights.aircraftId))
      .where(
        and(
          status ? eq(flights.status, status) : undefined,
          originId ? eq(flights.originId, originId) : undefined,
          destinationId ? eq(flights.destinationId, destinationId) : undefined,
          aircraftId ? eq(flights.aircraftId, aircraftId) : undefined,
          dateFrom ? gte(flights.scheduledDeparture, new Date(dateFrom)) : undefined,
          dateTo ? lte(flights.scheduledDeparture, new Date(dateTo)) : undefined,
          flightNumber ? eq(flights.flightNumber, flightNumber) : undefined
        )
      )
      .orderBy(flights.scheduledDeparture);

    return NextResponse.json({ success: true, data: flightsList });
  } catch (error) {
    console.error("Error fetching flights:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch flights" },
      { status: 500 }
    );
  }
}

// POST - Create a new flight
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.flightNumber || !body.aircraftId || !body.originId || 
        !body.destinationId || !body.scheduledDeparture || !body.scheduledArrival) {
      return NextResponse.json(
        { success: false, error: "Missing required flight fields" },
        { status: 400 }
      );
    }

    // Validate aircraft exists
    const [aircraft] = await db
      .select()
      .from(aircrafts)
      .where(eq(aircrafts.id, body.aircraftId));

    if (!aircraft) {
      return NextResponse.json(
        { success: false, error: "Aircraft not found" },
        { status: 400 }
      );
    }

    // Validate locations exist
    const [origin] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, body.originId));

    const [destination] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, body.destinationId));

    if (!origin || !destination) {
      return NextResponse.json(
        { success: false, error: "Origin or destination location not found" },
        { status: 400 }
      );
    }

    const [newFlight] = await db
      .insert(flights)
      .values({
        flightNumber: body.flightNumber,
        aircraftId: body.aircraftId,
        originId: body.originId,
        destinationId: body.destinationId,
        scheduledDeparture: new Date(body.scheduledDeparture),
        scheduledArrival: new Date(body.scheduledArrival),
        actualDeparture: body.actualDeparture ? new Date(body.actualDeparture) : null,
        actualArrival: body.actualArrival ? new Date(body.actualArrival) : null,
        status: body.status || "SCHEDULED",
      })
      .returning();

    return NextResponse.json({ success: true, data: newFlight }, { status: 201 });
  } catch (error) {
    console.error("Error creating flight:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create flight";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

