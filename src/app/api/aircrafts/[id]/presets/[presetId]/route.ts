import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deckConfigurationPresets, deckConfigurations, loadingPositions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Get a single preset with its deck configurations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presetId: string }> }
) {
  try {
    const { presetId } = await params;

    const [preset] = await db
      .select()
      .from(deckConfigurationPresets)
      .where(eq(deckConfigurationPresets.id, presetId));

    if (!preset) {
      return NextResponse.json(
        { success: false, error: "Preset not found" },
        { status: 404 }
      );
    }

    // Get deck configurations
    const decks = await db
      .select()
      .from(deckConfigurations)
      .where(eq(deckConfigurations.presetId, presetId))
      .orderBy(deckConfigurations.sequence);

    const decksWithPositions = await Promise.all(
      decks.map(async (deck) => {
        const positions = await db
          .select()
          .from(loadingPositions)
          .where(eq(loadingPositions.deckId, deck.id))
          .orderBy(loadingPositions.sequenceNumber);

        return {
          ...deck,
          positions,
          positionCount: positions.length,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { ...preset, decks: decksWithPositions },
    });
  } catch (error) {
    console.error("Error fetching preset:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch preset" },
      { status: 500 }
    );
  }
}

// PUT - Update a preset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presetId: string }> }
) {
  try {
    const { id: aircraftId, presetId } = await params;
    const body = await request.json();

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await db
        .update(deckConfigurationPresets)
        .set({ isDefault: false })
        .where(eq(deckConfigurationPresets.aircraftId, aircraftId));
    }

    const [updatedPreset] = await db
      .update(deckConfigurationPresets)
      .set({
        presetName: body.presetName,
        presetCode: body.presetCode,
        description: body.description,
        isDefault: body.isDefault,
        updatedAt: new Date(),
      })
      .where(eq(deckConfigurationPresets.id, presetId))
      .returning();

    if (!updatedPreset) {
      return NextResponse.json(
        { success: false, error: "Preset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedPreset });
  } catch (error) {
    console.error("Error updating preset:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update preset";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete a preset (cascades to deck configs and positions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presetId: string }> }
) {
  try {
    const { presetId } = await params;

    const [deletedPreset] = await db
      .delete(deckConfigurationPresets)
      .where(eq(deckConfigurationPresets.id, presetId))
      .returning();

    if (!deletedPreset) {
      return NextResponse.json(
        { success: false, error: "Preset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Preset deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting preset:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete preset" },
      { status: 500 }
    );
  }
}

