import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { airWaybills, parcelGroups, cargoItems, locations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET - List all AWBs or filter by status, flightId, etc.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const originId = searchParams.get("originId");
    const destinationId = searchParams.get("destinationId");
    const flightId = searchParams.get("flightId");
    const includeParcels = searchParams.get("includeParcels") === "true";
    const includeCargoItems = searchParams.get("includeCargoItems") === "true";

    // Build conditions array
    const conditions = [];
    if (status) {
      conditions.push(eq(airWaybills.status, status));
    }
    if (originId) {
      conditions.push(eq(airWaybills.originId, originId));
    }
    if (destinationId) {
      conditions.push(eq(airWaybills.destinationId, destinationId));
    }
    if (flightId) {
      conditions.push(eq(airWaybills.flightId, flightId));
    }

    // Query with relations if needed
    if (includeParcels || includeCargoItems) {
      const awbs = await db.query.airWaybills.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          ...(includeParcels ? { parcelGroups: true } : {}),
          ...(includeCargoItems ? { cargoItems: true } : {}),
          origin: true,
          destination: true,
        },
      });

      // Transform data for response
      const transformedAwbs = awbs.map((awb) => ({
        ...awb,
        originCode: awb.origin?.airportCode,
        destinationCode: awb.destination?.airportCode,
        totalWeightKg: Number(awb.totalWeightKg),
        totalVolumeM3: awb.totalVolumeM3 ? Number(awb.totalVolumeM3) : null,
        chargeableWeightKg: Number(awb.chargeableWeightKg),
        parcelGroups: includeParcels && awb.parcelGroups
          ? awb.parcelGroups.map((p) => ({
              ...p,
              weightKg: Number(p.weightKg),
              lengthCm: Number(p.lengthCm),
              widthCm: Number(p.widthCm),
              heightCm: Number(p.heightCm),
              volumeM3: p.volumeM3 ? Number(p.volumeM3) : null,
              maxStackWeightKg: p.maxStackWeightKg ? Number(p.maxStackWeightKg) : null,
            }))
          : undefined,
        cargoItems: includeCargoItems && awb.cargoItems
          ? awb.cargoItems.map((c) => ({
              ...c,
              weightKg: Number(c.weightKg),
              lengthCm: Number(c.lengthCm),
              widthCm: Number(c.widthCm),
              heightCm: Number(c.heightCm),
              volumeM3: c.volumeM3 ? Number(c.volumeM3) : null,
              maxStackWeightKg: c.maxStackWeightKg ? Number(c.maxStackWeightKg) : null,
            }))
          : undefined,
      }));

      return NextResponse.json({ success: true, data: transformedAwbs });
    }

    // Simple query without relations
    let query = db.select().from(airWaybills);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
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

