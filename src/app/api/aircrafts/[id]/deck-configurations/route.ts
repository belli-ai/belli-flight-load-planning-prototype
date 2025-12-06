import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deckConfigurations, deckConfigurationPresets, loadingPositions } from "@/lib/db/schema";
import { eq, max, and } from "drizzle-orm";

// Helper to get preset ID from query or find default
async function getPresetId(aircraftId: string, queryPresetId: string | null): Promise<string | null> {
  if (queryPresetId) return queryPresetId;
  
  // Find default preset for this aircraft
  const [defaultPreset] = await db
    .select()
    .from(deckConfigurationPresets)
    .where(and(
      eq(deckConfigurationPresets.aircraftId, aircraftId),
      eq(deckConfigurationPresets.isDefault, true)
    ))
    .limit(1);
  
  if (defaultPreset) return defaultPreset.id;
  
  // Fall back to first preset
  const [firstPreset] = await db
    .select()
    .from(deckConfigurationPresets)
    .where(eq(deckConfigurationPresets.aircraftId, aircraftId))
    .limit(1);
  
  return firstPreset?.id || null;
}

// GET - Get deck configurations for an aircraft (via preset)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: aircraftId } = await params;
    const { searchParams } = new URL(request.url);
    const queryPresetId = searchParams.get("presetId");

    const presetId = await getPresetId(aircraftId, queryPresetId);
    
    if (!presetId) {
      return NextResponse.json({ success: true, data: [] });
    }

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
          aircraftId, // Include for backwards compatibility
          positions,
          positionCount: positions.length,
        };
      })
    );

    return NextResponse.json({ success: true, data: decksWithPositions });
  } catch (error) {
    console.error("Error fetching deck configurations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deck configurations" },
      { status: 500 }
    );
  }
}

// POST - Add a new deck configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: aircraftId } = await params;
    const body = await request.json();

    // Get preset ID from body or find default
    const presetId = body.presetId || await getPresetId(aircraftId, null);
    
    if (!presetId) {
      return NextResponse.json(
        { success: false, error: "No preset found for this aircraft. Create a preset first." },
        { status: 400 }
      );
    }

    // Get max sequence number for this preset
    const [maxSeq] = await db
      .select({ maxSequence: max(deckConfigurations.sequence) })
      .from(deckConfigurations)
      .where(eq(deckConfigurations.presetId, presetId));

    const sequence = body.sequence ?? (maxSeq?.maxSequence ?? 0) + 1;

    const [newDeck] = await db
      .insert(deckConfigurations)
      .values({
        presetId,
        deckCode: body.deckCode,
        deckName: body.deckName,
        maxStructuralWeightKg: body.maxStructuralWeightKg,
        sequence,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: { ...newDeck, aircraftId } // Include for backwards compatibility
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating deck configuration:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create deck configuration";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
