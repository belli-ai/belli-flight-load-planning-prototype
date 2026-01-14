import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  uldAssignments,
  uldTypes,
  cargoItems,
  packedItems,
  loadPlans,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

// POST - Assign cargo items to a ULD or bulk
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ loadPlanId: string }> }
) {
  try {
    const { loadPlanId } = await params;
    const body = await request.json();
    const {
      uldId,
      uldTypeId,
      uldNumber,
      cargoItemIds,
      isBulk = false,
      notes,
    } = body;

    // Validate required fields
    if (!uldTypeId) {
      return NextResponse.json(
        { success: false, error: "uldTypeId is required" },
        { status: 400 }
      );
    }

    if (!cargoItemIds || !Array.isArray(cargoItemIds) || cargoItemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "cargoItemIds array is required" },
        { status: 400 }
      );
    }

    // Get load plan
    const [loadPlan] = await db
      .select()
      .from(loadPlans)
      .where(eq(loadPlans.id, loadPlanId));

    if (!loadPlan) {
      return NextResponse.json(
        { success: false, error: "Load plan not found" },
        { status: 404 }
      );
    }

    if (loadPlan.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Load plan is not in DRAFT status. Cannot modify." },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // Get ULD type
      const [uldType] = await tx
        .select()
        .from(uldTypes)
        .where(eq(uldTypes.id, uldTypeId));

      if (!uldType) {
        throw new Error("ULD type not found");
      }

      // Get cargo items
      const cargo = await tx
        .select()
        .from(cargoItems)
        .where(inArray(cargoItems.id, cargoItemIds));

      if (cargo.length !== cargoItemIds.length) {
        throw new Error("Some cargo items not found");
      }

      // Check if any cargo is already assigned
      const alreadyAssigned = cargo.filter((c) => c.assignedUldId);
      if (alreadyAssigned.length > 0) {
        throw new Error(
          `Cargo items already assigned: ${alreadyAssigned.map((c) => c.id).join(", ")}`
        );
      }

      // Calculate totals
      const cargoWeightKg = cargo.reduce((sum, c) => sum + Number(c.weightKg || 0), 0);
      const volumeUsedM3 = cargo.reduce((sum, c) => sum + Number(c.volumeM3 || 0), 0);
      const tareWeightKg = isBulk ? 0 : Number(uldType.tareWeightKg || 0);
      const totalWeightKg = cargoWeightKg + tareWeightKg;

      // Check ULD capacity
      if (!isBulk) {
        const maxGrossWeight = Number(uldType.maxGrossWeightKg || 0);
        if (totalWeightKg > maxGrossWeight) {
          throw new Error(
            `Total weight ${totalWeightKg.toFixed(0)} kg exceeds ULD max capacity ${maxGrossWeight.toFixed(0)} kg`
          );
        }

        const maxVolume = Number(uldType.maxVolumeM3 || 0);
        if (maxVolume > 0 && volumeUsedM3 > maxVolume) {
          throw new Error(
            `Total volume ${volumeUsedM3.toFixed(2)} m³ exceeds ULD max capacity ${maxVolume.toFixed(2)} m³`
          );
        }
      }

      // Get next sequence number
      const existingAssignments = await tx
        .select()
        .from(uldAssignments)
        .where(eq(uldAssignments.loadPlanId, loadPlanId));
      const sequence = existingAssignments.length + 1;

      // Create ULD assignment
      const [newAssignment] = await tx
        .insert(uldAssignments)
        .values({
          loadPlanId,
          uldId: isBulk ? null : uldId,
          uldTypeId,
          uldNumber: isBulk ? `BULK-${sequence}` : uldNumber,
          positionCode: null, // Will be set during load planning
          sequence,
          totalWeightKg: String(totalWeightKg),
          tareWeightKg: String(tareWeightKg),
          cargoWeightKg: String(cargoWeightKg),
          volumeUsedM3: String(volumeUsedM3),
          volumeUtilization: uldType.maxVolumeM3
            ? String((volumeUsedM3 / Number(uldType.maxVolumeM3)) * 100)
            : null,
          weightUtilization: uldType.maxGrossWeightKg
            ? String((totalWeightKg / Number(uldType.maxGrossWeightKg)) * 100)
            : null,
          isVirtual: isBulk,
          status: "PLANNED",
          notes,
        })
        .returning();

      // Create packed items
      let itemSequence = 0;
      for (const cargoItem of cargo) {
        itemSequence++;
        await tx.insert(packedItems).values({
          uldAssignmentId: newAssignment.id,
          cargoItemId: cargoItem.id,
          sequence: itemSequence,
          xPositionCm: "0",
          yPositionCm: "0",
          zPositionCm: "0",
          rotated: false,
          packedLengthCm: cargoItem.lengthCm,
          packedWidthCm: cargoItem.widthCm,
          packedHeightCm: cargoItem.heightCm,
        });

        // Update cargo item status
        await tx
          .update(cargoItems)
          .set({
            assignedUldId: newAssignment.id,
            loadStatus: isBulk ? "BULK_ASSIGNED" : "ASSIGNED",
            updatedAt: new Date(),
          })
          .where(eq(cargoItems.id, cargoItem.id));
      }

      return {
        assignment: newAssignment,
        cargoCount: cargo.length,
        totalWeightKg,
        volumeUsedM3,
      };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error assigning cargo:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to assign cargo";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

