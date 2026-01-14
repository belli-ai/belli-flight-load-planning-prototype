import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  uldAssignments,
  uldTypes,
  loadPlans,
  flights,
  cargoItems,
  packedItems,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export interface BuildUpSession {
  id: string;
  flightId: string;
  loadPlanId: string;
  status: string;
  uldAssignments: {
    id: string;
    uldNumber: string | null;
    uldTypeId: string;
    positionCode: string | null;
    isBulk: boolean;
    cargoItems: string[];
    totalWeightKg: number;
    volumeUsedM3: number;
  }[];
}

// GET - Get build-up status for a flight
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flightId = searchParams.get("flightId");

    if (!flightId) {
      return NextResponse.json(
        { success: false, error: "flightId is required" },
        { status: 400 }
      );
    }

    // Get or create load plan for this flight
    let [loadPlan] = await db
      .select()
      .from(loadPlans)
      .where(eq(loadPlans.flightId, flightId));

    if (!loadPlan) {
      // Get flight details
      const [flight] = await db.select().from(flights).where(eq(flights.id, flightId));
      if (!flight) {
        return NextResponse.json(
          { success: false, error: "Flight not found" },
          { status: 404 }
        );
      }

      // Create new load plan
      const planNumber = `LP-${flight.flightNumber}-${Date.now()}`;
      [loadPlan] = await db
        .insert(loadPlans)
        .values({
          flightId,
          aircraftId: flight.aircraftId,
          planNumber,
          status: "DRAFT",
        })
        .returning();
    }

    // Get ULD assignments
    const assignments = await db
      .select({
        id: uldAssignments.id,
        uldId: uldAssignments.uldId,
        uldNumber: uldAssignments.uldNumber,
        uldTypeId: uldAssignments.uldTypeId,
        positionCode: uldAssignments.positionCode,
        totalWeightKg: uldAssignments.totalWeightKg,
        cargoWeightKg: uldAssignments.cargoWeightKg,
        tareWeightKg: uldAssignments.tareWeightKg,
        volumeUsedM3: uldAssignments.volumeUsedM3,
        isVirtual: uldAssignments.isVirtual,
        status: uldAssignments.status,
        notes: uldAssignments.notes,
        uldTypeCode: uldTypes.code,
        uldTypeName: uldTypes.name,
      })
      .from(uldAssignments)
      .leftJoin(uldTypes, eq(uldTypes.id, uldAssignments.uldTypeId))
      .where(eq(uldAssignments.loadPlanId, loadPlan.id));

    // Get packed items for each assignment
    const assignmentsWithCargo = await Promise.all(
      assignments.map(async (assignment) => {
        const items = await db
          .select({
            id: packedItems.id,
            cargoItemId: packedItems.cargoItemId,
          })
          .from(packedItems)
          .where(eq(packedItems.uldAssignmentId, assignment.id));

        return {
          ...assignment,
          cargoItemIds: items.map((i) => i.cargoItemId),
          isBulk: assignment.isVirtual,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        loadPlanId: loadPlan.id,
        flightId,
        status: loadPlan.status,
        assignments: assignmentsWithCargo,
      },
    });
  } catch (error) {
    console.error("Error getting build-up status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get build-up status" },
      { status: 500 }
    );
  }
}

// POST - Create or update build-up assignments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightId, assignments } = body;

    if (!flightId) {
      return NextResponse.json(
        { success: false, error: "flightId is required" },
        { status: 400 }
      );
    }

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { success: false, error: "assignments array is required" },
        { status: 400 }
      );
    }

    // Get or create load plan
    const [flight] = await db.select().from(flights).where(eq(flights.id, flightId));
    if (!flight) {
      return NextResponse.json(
        { success: false, error: "Flight not found" },
        { status: 404 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // Get or create load plan
      let [loadPlan] = await tx
        .select()
        .from(loadPlans)
        .where(eq(loadPlans.flightId, flightId));

      if (!loadPlan) {
        const planNumber = `LP-${flight.flightNumber}-${Date.now()}`;
        [loadPlan] = await tx
          .insert(loadPlans)
          .values({
            flightId,
            aircraftId: flight.aircraftId,
            planNumber,
            status: "DRAFT",
          })
          .returning();
      }

      const createdAssignments: (typeof uldAssignments.$inferSelect)[] = [];

      for (const assignment of assignments) {
        const {
          uldId,
          uldTypeId,
          uldNumber,
          cargoItemIds,
          isBulk,
          positionCode,
          notes,
        } = assignment;

        // Get ULD type for tare weight
        const [uldType] = await tx
          .select()
          .from(uldTypes)
          .where(eq(uldTypes.id, uldTypeId));

        if (!uldType) {
          throw new Error(`ULD type not found: ${uldTypeId}`);
        }

        // Calculate cargo weight and volume
        let cargoWeightKg = 0;
        let volumeUsedM3 = 0;

        if (cargoItemIds && cargoItemIds.length > 0) {
          const cargo = await tx
            .select()
            .from(cargoItems)
            .where(inArray(cargoItems.id, cargoItemIds));

          cargoWeightKg = cargo.reduce((sum, c) => sum + Number(c.weightKg || 0), 0);
          volumeUsedM3 = cargo.reduce((sum, c) => sum + Number(c.volumeM3 || 0), 0);
        }

        const tareWeightKg = isBulk ? 0 : Number(uldType.tareWeightKg || 0);
        const totalWeightKg = cargoWeightKg + tareWeightKg;

        // Get next sequence number
        const existingAssignments = await tx
          .select()
          .from(uldAssignments)
          .where(eq(uldAssignments.loadPlanId, loadPlan.id));
        const sequence = existingAssignments.length + 1;

        // Create ULD assignment
        const [newAssignment] = await tx
          .insert(uldAssignments)
          .values({
            loadPlanId: loadPlan.id,
            uldId: isBulk ? null : uldId,
            uldTypeId,
            uldNumber: isBulk ? `BULK-${sequence}` : uldNumber,
            positionCode,
            sequence,
            totalWeightKg: String(totalWeightKg),
            tareWeightKg: String(tareWeightKg),
            cargoWeightKg: String(cargoWeightKg),
            volumeUsedM3: String(volumeUsedM3),
            isVirtual: isBulk ?? false,
            status: "PLANNED",
            notes,
          })
          .returning();

        // Create packed items for each cargo item
        if (cargoItemIds && cargoItemIds.length > 0) {
          let itemSequence = 0;
          for (const cargoItemId of cargoItemIds) {
            itemSequence++;
            await tx.insert(packedItems).values({
              uldAssignmentId: newAssignment.id,
              cargoItemId,
              sequence: itemSequence,
              xPositionCm: "0",
              yPositionCm: "0",
              zPositionCm: "0",
              rotated: false,
              packedLengthCm: "0",
              packedWidthCm: "0",
              packedHeightCm: "0",
            });

            // Update cargo item status
            await tx
              .update(cargoItems)
              .set({
                assignedUldId: newAssignment.id,
                loadStatus: isBulk ? "BULK_ASSIGNED" : "ASSIGNED",
                updatedAt: new Date(),
              })
              .where(eq(cargoItems.id, cargoItemId));
          }
        }

        createdAssignments.push(newAssignment);
      }

      return {
        loadPlanId: loadPlan.id,
        assignments: createdAssignments,
      };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating build-up:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create build-up";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

