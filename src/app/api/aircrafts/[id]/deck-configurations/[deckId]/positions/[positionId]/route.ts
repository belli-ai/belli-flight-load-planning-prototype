import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadingPositions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Get single loading position
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deckId: string; positionId: string }> }
) {
  try {
    const { deckId, positionId } = await params;

    const [position] = await db
      .select()
      .from(loadingPositions)
      .where(
        and(
          eq(loadingPositions.id, positionId),
          eq(loadingPositions.deckId, deckId)
        )
      );

    if (!position) {
      return NextResponse.json(
        { success: false, error: "Loading position not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: position });
  } catch (error) {
    console.error("Error fetching loading position:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch loading position" },
      { status: 500 }
    );
  }
}

// PUT - Update loading position
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deckId: string; positionId: string }> }
) {
  try {
    const { deckId, positionId } = await params;
    const body = await request.json();

    const updateData: Partial<typeof loadingPositions.$inferInsert> = {};

    if (body.positionCode !== undefined) updateData.positionCode = body.positionCode;
    if (body.sequenceNumber !== undefined) updateData.sequenceNumber = body.sequenceNumber;
    if (body.maxWeightKg !== undefined) updateData.maxWeightKg = body.maxWeightKg;
    if (body.armStationCm !== undefined) updateData.armStationCm = body.armStationCm;
    if (body.compatibleUldTypes !== undefined) updateData.compatibleUldTypes = body.compatibleUldTypes;
    if (body.acceptsBulkCargo !== undefined) updateData.acceptsBulkCargo = body.acceptsBulkCargo;
    if (body.floorAreaM2 !== undefined) updateData.floorAreaM2 = body.floorAreaM2;
    if (body.maxHeightCm !== undefined) updateData.maxHeightCm = body.maxHeightCm;
    if (body.contourCode !== undefined) updateData.contourCode = body.contourCode;
    if (body.xOffset !== undefined) updateData.xOffset = body.xOffset;
    if (body.yOffset !== undefined) updateData.yOffset = body.yOffset;
    if (body.colIndex !== undefined) updateData.colIndex = body.colIndex;
    if (body.rowIndex !== undefined) updateData.rowIndex = body.rowIndex;

    const [updatedPosition] = await db
      .update(loadingPositions)
      .set(updateData)
      .where(
        and(
          eq(loadingPositions.id, positionId),
          eq(loadingPositions.deckId, deckId)
        )
      )
      .returning();

    if (!updatedPosition) {
      return NextResponse.json(
        { success: false, error: "Loading position not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedPosition });
  } catch (error) {
    console.error("Error updating loading position:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update loading position";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete loading position
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deckId: string; positionId: string }> }
) {
  try {
    const { deckId, positionId } = await params;

    const [deletedPosition] = await db
      .delete(loadingPositions)
      .where(
        and(
          eq(loadingPositions.id, positionId),
          eq(loadingPositions.deckId, deckId)
        )
      )
      .returning();

    if (!deletedPosition) {
      return NextResponse.json(
        { success: false, error: "Loading position not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Loading position deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting loading position:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete loading position" },
      { status: 500 }
    );
  }
}

