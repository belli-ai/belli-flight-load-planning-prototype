import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { airWaybills, parcelGroups, cargoItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Get single AWB with parcel groups and cargo items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [awb] = await db
      .select()
      .from(airWaybills)
      .where(eq(airWaybills.id, id));

    if (!awb) {
      return NextResponse.json(
        { success: false, error: "AWB not found" },
        { status: 404 }
      );
    }

    // Get parcel groups
    const parcels = await db
      .select()
      .from(parcelGroups)
      .where(eq(parcelGroups.awbId, id));

    // Get cargo items
    const cargo = await db
      .select()
      .from(cargoItems)
      .where(eq(cargoItems.awbId, id));

    return NextResponse.json({
      success: true,
      data: { awb, parcels, cargo },
    });
  } catch (error) {
    console.error("Error fetching AWB:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch AWB" },
      { status: 500 }
    );
  }
}

// PUT - Update AWB
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { awb, parcels } = body;

    const result = await db.transaction(async (tx) => {
      // Update AWB
      const [updatedAwb] = await tx
        .update(airWaybills)
        .set({
          awbNumber: awb.awbNumber,
          originId: awb.originId,
          destinationId: awb.destinationId,
          shipperName: awb.shipperName,
          shipperAddress: awb.shipperAddress,
          consigneeName: awb.consigneeName,
          consigneeAddress: awb.consigneeAddress,
          totalPieces: awb.totalPieces,
          totalWeightKg: awb.totalWeightKg,
          totalVolumeM3: awb.totalVolumeM3,
          chargeableWeightKg: awb.chargeableWeightKg,
          natureOfGoods: awb.natureOfGoods,
          specialHandlingCodes: awb.specialHandlingCodes,
          bookingReference: awb.bookingReference,
          status: awb.status,
          updatedAt: new Date(),
        })
        .where(eq(airWaybills.id, id))
        .returning();

      if (!updatedAwb) {
        throw new Error("AWB not found");
      }

      // Update parcel groups if provided
      let updatedParcels: typeof parcelGroups.$inferSelect[] = [];
      if (parcels && Array.isArray(parcels)) {
        // Delete existing parcel groups
        await tx.delete(parcelGroups).where(eq(parcelGroups.awbId, id));

        // Insert new parcel groups
        if (parcels.length > 0) {
          updatedParcels = await tx
            .insert(parcelGroups)
            .values(
              parcels.map((parcel: {
                commodityCodeId?: string;
                groupNumber: number;
                pieces: number;
                weightKg: string;
                lengthCm: string;
                widthCm: string;
                heightCm: string;
                volumeM3?: string;
                isStackable?: boolean;
                maxStackWeightKg?: string;
                isTiltable?: boolean;
                tempZoneId?: string;
                specialHandlingCodes?: string[];
                description?: string;
              }, index: number) => ({
                awbId: id,
                commodityCodeId: parcel.commodityCodeId,
                groupNumber: parcel.groupNumber || index + 1,
                pieces: parcel.pieces,
                weightKg: parcel.weightKg,
                lengthCm: parcel.lengthCm,
                widthCm: parcel.widthCm,
                heightCm: parcel.heightCm,
                volumeM3: parcel.volumeM3,
                isStackable: parcel.isStackable ?? true,
                maxStackWeightKg: parcel.maxStackWeightKg,
                isTiltable: parcel.isTiltable ?? false,
                tempZoneId: parcel.tempZoneId,
                specialHandlingCodes: parcel.specialHandlingCodes,
                description: parcel.description,
              }))
            )
            .returning();
        }
      }

      return { awb: updatedAwb, parcels: updatedParcels };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating AWB:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update AWB";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete AWB (cascades to parcel groups and cargo items)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deletedAwb] = await db
      .delete(airWaybills)
      .where(eq(airWaybills.id, id))
      .returning();

    if (!deletedAwb) {
      return NextResponse.json(
        { success: false, error: "AWB not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "AWB deleted successfully", awb: deletedAwb },
    });
  } catch (error) {
    console.error("Error deleting AWB:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete AWB" },
      { status: 500 }
    );
  }
}

