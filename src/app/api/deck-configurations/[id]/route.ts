import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deckConfigurations, loadingPositions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Get single deck configuration with positions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deck] = await db
      .select()
      .from(deckConfigurations)
      .where(eq(deckConfigurations.id, id));

    if (!deck) {
      return NextResponse.json(
        { success: false, error: "Deck configuration not found" },
        { status: 404 }
      );
    }

    const positions = await db
      .select()
      .from(loadingPositions)
      .where(eq(loadingPositions.deckId, id))
      .orderBy(loadingPositions.sequenceNumber);

    return NextResponse.json({
      success: true,
      data: { deck, positions },
    });
  } catch (error) {
    console.error("Error fetching deck configuration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deck configuration" },
      { status: 500 }
    );
  }
}

// PUT - Update deck configuration and positions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { deck, positions } = body;

    const result = await db.transaction(async (tx) => {
      // Update deck configuration
      const updateData: Partial<typeof deckConfigurations.$inferInsert> = {};
      
      if (deck.deckCode !== undefined) updateData.deckCode = deck.deckCode;
      if (deck.deckName !== undefined) updateData.deckName = deck.deckName;
      if (deck.maxStructuralWeightKg !== undefined) updateData.maxStructuralWeightKg = deck.maxStructuralWeightKg;
      if (deck.sequence !== undefined) updateData.sequence = deck.sequence;

      const [updatedDeck] = await tx
        .update(deckConfigurations)
        .set(updateData)
        .where(eq(deckConfigurations.id, id))
        .returning();

      if (!updatedDeck) {
        throw new Error("Deck configuration not found");
      }

      // Update positions if provided
      let updatedPositions: typeof loadingPositions.$inferSelect[] = [];
      if (positions && Array.isArray(positions)) {
        // Delete existing positions
        await tx.delete(loadingPositions).where(eq(loadingPositions.deckId, id));

        // Insert new positions
        if (positions.length > 0) {
          updatedPositions = await tx
            .insert(loadingPositions)
            .values(
              positions.map((pos: {
                positionCode: string;
                sequenceNumber: number;
                maxWeightKg: string;
                armStationCm: string;
                compatibleUldTypes?: string[];
                acceptsBulkCargo?: boolean;
                floorAreaM2?: string;
                maxHeightCm?: string;
                contourCode?: string;
                xOffset?: string;
                yOffset?: string;
                colIndex?: number;
                rowIndex?: number;
              }) => ({
                deckId: id,
                positionCode: pos.positionCode,
                sequenceNumber: pos.sequenceNumber,
                maxWeightKg: pos.maxWeightKg,
                armStationCm: pos.armStationCm,
                compatibleUldTypes: pos.compatibleUldTypes,
                acceptsBulkCargo: pos.acceptsBulkCargo ?? false,
                floorAreaM2: pos.floorAreaM2,
                maxHeightCm: pos.maxHeightCm,
                contourCode: pos.contourCode,
                xOffset: pos.xOffset,
                yOffset: pos.yOffset,
                colIndex: pos.colIndex,
                rowIndex: pos.rowIndex,
              }))
            )
            .returning();
        }
      }

      return { deck: updatedDeck, positions: updatedPositions };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating deck configuration:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update deck configuration";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete deck configuration (cascades to positions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deletedDeck] = await db
      .delete(deckConfigurations)
      .where(eq(deckConfigurations.id, id))
      .returning();

    if (!deletedDeck) {
      return NextResponse.json(
        { success: false, error: "Deck configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Deck configuration deleted successfully", deck: deletedDeck },
    });
  } catch (error) {
    console.error("Error deleting deck configuration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete deck configuration" },
      { status: 500 }
    );
  }
}

