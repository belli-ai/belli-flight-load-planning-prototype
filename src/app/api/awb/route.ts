import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { airWaybills, parcelGroups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - List all AWBs or filter by status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const originId = searchParams.get("originId");
    const destinationId = searchParams.get("destinationId");

    let query = db.select().from(airWaybills);

    if (status) {
      query = query.where(eq(airWaybills.status, status)) as typeof query;
    }
    if (originId) {
      query = query.where(eq(airWaybills.originId, originId)) as typeof query;
    }
    if (destinationId) {
      query = query.where(eq(airWaybills.destinationId, destinationId)) as typeof query;
    }

    const awbs = await query;

    return NextResponse.json({ success: true, data: awbs });
  } catch (error) {
    console.error("Error fetching AWBs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch AWBs" },
      { status: 500 }
    );
  }
}

// POST - Create a new AWB with optional parcel groups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { awb, parcels } = body;

    // Validate required fields
    if (!awb?.awbNumber || !awb?.originId || !awb?.destinationId || 
        awb?.totalPieces === undefined || !awb?.totalWeightKg || !awb?.totalVolumeM3) {
      return NextResponse.json(
        { success: false, error: "Missing required AWB fields" },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create AWB
      const [newAwb] = await tx
        .insert(airWaybills)
        .values({
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
          status: awb.status || "BOOKED",
        })
        .returning();

      // Create parcel groups if provided
      let createdParcels: typeof parcelGroups.$inferSelect[] = [];
      if (parcels && Array.isArray(parcels) && parcels.length > 0) {
        createdParcels = await tx
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
              awbId: newAwb.id,
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

      return { awb: newAwb, parcels: createdParcels };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating AWB:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create AWB";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

