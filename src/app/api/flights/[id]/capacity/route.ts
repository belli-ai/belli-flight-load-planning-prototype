import { NextRequest, NextResponse } from "next/server";
import {
  updateFlightCapacity,
  assignCargoToUld,
  addBulkCargoToFlight,
} from "@/lib/services/flightCapacity";

// GET - Get current flight capacity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await updateFlightCapacity(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error getting flight capacity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get flight capacity" },
      { status: 500 }
    );
  }
}

// POST - Assign cargo to ULD or add bulk cargo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flightId } = await params;
    const body = await request.json();
    const { action, uldAssignmentId, cargoItemIds } = body;

    if (!cargoItemIds || !Array.isArray(cargoItemIds) || cargoItemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "cargoItemIds array is required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "ASSIGN_TO_ULD":
        if (!uldAssignmentId) {
          return NextResponse.json(
            { success: false, error: "uldAssignmentId is required for ASSIGN_TO_ULD action" },
            { status: 400 }
          );
        }
        result = await assignCargoToUld(flightId, uldAssignmentId, cargoItemIds);
        break;

      case "ADD_BULK":
        result = await addBulkCargoToFlight(flightId, cargoItemIds);
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use ASSIGN_TO_ULD or ADD_BULK" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating flight capacity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update flight capacity" },
      { status: 500 }
    );
  }
}

