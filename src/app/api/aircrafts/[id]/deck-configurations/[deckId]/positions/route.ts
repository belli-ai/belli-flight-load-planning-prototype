import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadingPositions, deckConfigurations } from "@/lib/db/schema";
import { eq, max } from "drizzle-orm";

// GET - Get all loading positions for a deck
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deckId: string }> }
) {
  try {
    const { deckId } = await params;

    const positions = await db
      .select()
      .from(loadingPositions)
      .where(eq(loadingPositions.deckId, deckId))
      .orderBy(loadingPositions.sequenceNumber);

    return NextResponse.json({ success: true, data: positions });
  } catch (error) {
    console.error("Error fetching loading positions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch loading positions" },
      { status: 500 }
    );
  }
}

// POST - Add a new loading position
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deckId: string }> }
) {
  try {
    const { deckId } = await params;
    const body = await request.json();

    // Verify deck exists
    const [deck] = await db
      .select()
      .from(deckConfigurations)
      .where(eq(deckConfigurations.id, deckId));

    if (!deck) {
      return NextResponse.json(
        { success: false, error: "Deck configuration not found" },
        { status: 404 }
      );
    }

    // Get max sequence number for this deck
    const [maxSeq] = await db
      .select({ maxSequence: max(loadingPositions.sequenceNumber) })
      .from(loadingPositions)
      .where(eq(loadingPositions.deckId, deckId));

    const sequenceNumber = body.sequenceNumber ?? (maxSeq?.maxSequence ?? 0) + 1;

    const [newPosition] = await db
      .insert(loadingPositions)
      .values({
        deckId,
        positionCode: body.positionCode,
        sequenceNumber,
        maxWeightKg: body.maxWeightKg,
        armStationCm: body.armStationCm,
        compatibleUldTypes: body.compatibleUldTypes || [],
        acceptsBulkCargo: body.acceptsBulkCargo ?? false,
        floorAreaM2: body.floorAreaM2,
        maxHeightCm: body.maxHeightCm,
        contourCode: body.contourCode || "FULL_WIDTH",
        xOffset: body.xOffset,
        yOffset: body.yOffset,
        colIndex: body.colIndex,
        rowIndex: body.rowIndex,
      })
      .returning();

    return NextResponse.json({ success: true, data: newPosition }, { status: 201 });
  } catch (error) {
    console.error("Error creating loading position:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create loading position";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
