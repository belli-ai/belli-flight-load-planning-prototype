import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aircrafts, deckConfigurationPresets, deckConfigurations, loadingPositions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - List all aircrafts with their presets, deck configurations and loading positions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDecks = searchParams.get("includeDecks") !== "false";
    const presetId = searchParams.get("presetId");

    // Get all aircrafts
    const aircraftList = await db.select().from(aircrafts);

    if (!includeDecks) {
      return NextResponse.json({ success: true, data: aircraftList });
    }

    // Get presets, deck configurations and positions for each aircraft
    const aircraftsWithPresets = await Promise.all(
      aircraftList.map(async (aircraft) => {
        // Get all presets for this aircraft
        const presets = await db
          .select()
          .from(deckConfigurationPresets)
          .where(eq(deckConfigurationPresets.aircraftId, aircraft.id));

        // Find the active preset (use provided presetId or default)
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
          totalMaxWeight: number;
        }> = [];

        if (activePreset) {
          // Get deck configurations for the active preset
          const decks = await db
            .select()
            .from(deckConfigurations)
            .where(eq(deckConfigurations.presetId, activePreset.id))
            .orderBy(deckConfigurations.sequence);

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
                totalMaxWeight: positions.reduce(
                  (sum, p) => sum + Number(p.maxWeightKg || 0),
                  0
                ),
              };
            })
          );
        }

        return {
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
        };
      })
    );

    return NextResponse.json({ success: true, data: aircraftsWithPresets });
  } catch (error) {
    console.error("Error fetching aircrafts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch aircrafts" },
      { status: 500 }
    );
  }
}
