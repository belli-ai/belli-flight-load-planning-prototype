import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deckConfigurationPresets, deckConfigurations, loadingPositions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Get all presets for an aircraft
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: aircraftId } = await params;
    const { searchParams } = new URL(request.url);
    const includeDecks = searchParams.get("includeDecks") === "true";

    const presets = await db
      .select()
      .from(deckConfigurationPresets)
      .where(eq(deckConfigurationPresets.aircraftId, aircraftId));

    if (!includeDecks) {
      return NextResponse.json({ success: true, data: presets });
    }

    // Include deck configurations for each preset
    const presetsWithDecks = await Promise.all(
      presets.map(async (preset) => {
        const decks = await db
          .select()
          .from(deckConfigurations)
          .where(eq(deckConfigurations.presetId, preset.id))
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

        return {
          ...preset,
          decks: decksWithPositions,
          deckCount: decks.length,
        };
      })
    );

    return NextResponse.json({ success: true, data: presetsWithDecks });
  } catch (error) {
    console.error("Error fetching presets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch presets" },
      { status: 500 }
    );
  }
}

// POST - Create a new preset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: aircraftId } = await params;
    const body = await request.json();

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await db
        .update(deckConfigurationPresets)
        .set({ isDefault: false })
        .where(eq(deckConfigurationPresets.aircraftId, aircraftId));
    }

    const [newPreset] = await db
      .insert(deckConfigurationPresets)
      .values({
        aircraftId,
        presetName: body.presetName,
        presetCode: body.presetCode,
        description: body.description,
        isDefault: body.isDefault ?? false,
      })
      .returning();

    return NextResponse.json({ success: true, data: newPreset }, { status: 201 });
  } catch (error) {
    console.error("Error creating preset:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create preset";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

