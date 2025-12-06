import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aircrafts, deckConfigurationPresets, deckConfigurations, loadingPositions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Get single aircraft with presets, deck configurations and positions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const presetId = searchParams.get("presetId");

    const [aircraft] = await db
      .select()
      .from(aircrafts)
      .where(eq(aircrafts.id, id));

    if (!aircraft) {
      return NextResponse.json(
        { success: false, error: "Aircraft not found" },
        { status: 404 }
      );
    }

    // Get all presets for this aircraft
    const presets = await db
      .select()
      .from(deckConfigurationPresets)
      .where(eq(deckConfigurationPresets.aircraftId, id));

    // Find the active preset
    let activePreset = presets.find(p => p.id === presetId)
      || presets.find(p => p.isDefault)
      || presets[0];

    let decksWithPositions: Array<{
      id: string;
      presetId: string;
      deckCode: string;
      deckName: string;
      maxStructuralWeightKg: string | null;
      sequence: number;
      positions: Array<unknown>;
      positionCount: number;
    }> = [];

    if (activePreset) {
      // Get deck configurations for the active preset
      const decks = await db
        .select()
        .from(deckConfigurations)
        .where(eq(deckConfigurations.presetId, activePreset.id))
        .orderBy(deckConfigurations.sequence);

      // Get positions for each deck
      decksWithPositions = await Promise.all(
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
    }

    return NextResponse.json({
      success: true,
      data: {
        ...aircraft,
        presets: presets.map(p => ({
          ...p,
          isActive: p.id === activePreset?.id,
        })),
        activePreset: activePreset || null,
        decks: decksWithPositions,
        deckCount: decksWithPositions.length,
        totalPositions: decksWithPositions.reduce(
          (sum, d) => sum + d.positionCount,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching aircraft:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch aircraft" },
      { status: 500 }
    );
  }
}
