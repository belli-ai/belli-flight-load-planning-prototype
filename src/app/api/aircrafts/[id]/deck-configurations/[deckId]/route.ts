import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deckConfigurations, loadingPositions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Get single deck configuration with positions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deckId: string }> }
) {
  try {
    const { id: aircraftId, deckId } = await params;

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

    const positions = await db
      .select()
      .from(loadingPositions)
      .where(eq(loadingPositions.deckId, deckId))
      .orderBy(loadingPositions.sequenceNumber);

    return NextResponse.json({
      success: true,
      data: { ...deck, aircraftId, positions },
    });
  } catch (error) {
    console.error("Error fetching deck configuration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deck configuration" },
      { status: 500 }
    );
  }
}

// PUT - Update deck configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deckId: string }> }
) {
  try {
    const { deckId } = await params;
    const body = await request.json();

    const [updatedDeck] = await db
      .update(deckConfigurations)
      .set({
        deckCode: body.deckCode,
        deckName: body.deckName,
        maxStructuralWeightKg: body.maxStructuralWeightKg,
        sequence: body.sequence,
      })
      .where(eq(deckConfigurations.id, deckId))
      .returning();

    if (!updatedDeck) {
      return NextResponse.json(
        { success: false, error: "Deck configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedDeck });
  } catch (error) {
    console.error("Error updating deck configuration:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update deck configuration";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete deck configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deckId: string }> }
) {
  try {
    const { deckId } = await params;

    const [deletedDeck] = await db
      .delete(deckConfigurations)
      .where(eq(deckConfigurations.id, deckId))
      .returning();

    if (!deletedDeck) {
      return NextResponse.json(
        { success: false, error: "Deck configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Deck configuration deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting deck configuration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete deck configuration" },
      { status: 500 }
    );
  }
}
