import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deckConfigurations, loadingPositions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - List all deck configurations or filter by aircraft
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aircraftId = searchParams.get("aircraftId");

    let query = db.select().from(deckConfigurations);

    if (aircraftId) {
      query = query.where(eq(deckConfigurations.aircraftId, aircraftId)) as typeof query;
    }

    const decks = await query.orderBy(deckConfigurations.sequence);

    // Get positions for each deck
    const decksWithPositions = await Promise.all(
      decks.map(async (deck) => {
        const positions = await db
          .select()
          .from(loadingPositions)
          .where(eq(loadingPositions.deckId, deck.id))
          .orderBy(loadingPositions.sequenceNumber);
        return { ...deck, positions };
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

// POST - Create a new deck configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deck, positions } = body;

    // Validate required fields
    if (!deck?.aircraftId || !deck?.deckCode || !deck?.deckName || deck?.sequence === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required deck fields (aircraftId, deckCode, deckName, sequence)" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // Create deck configuration
      const [newDeck] = await tx
        .insert(deckConfigurations)
        .values({
          aircraftId: deck.aircraftId,
          deckCode: deck.deckCode,
          deckName: deck.deckName,
          maxStructuralWeightKg: deck.maxStructuralWeightKg,
          sequence: deck.sequence,
        })
        .returning();

      // Create loading positions if provided
      let createdPositions: typeof loadingPositions.$inferSelect[] = [];
      if (positions && Array.isArray(positions) && positions.length > 0) {
        createdPositions = await tx
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
              deckId: newDeck.id,
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

      return { deck: newDeck, positions: createdPositions };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating deck configuration:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create deck configuration";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

