import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  loadPlans,
  flights,
  aircrafts,
  uldAssignments,
  positionLoads,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET - List all load plans or filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flightId = searchParams.get("flightId");
    const status = searchParams.get("status");
    const aircraftId = searchParams.get("aircraftId");

    const plans = await db
      .select({
        id: loadPlans.id,
        flightId: loadPlans.flightId,
        aircraftId: loadPlans.aircraftId,
        planNumber: loadPlans.planNumber,
        status: loadPlans.status,
        payloadKg: loadPlans.payloadKg,
        zeroFuelWeightKg: loadPlans.zeroFuelWeightKg,
        takeoffWeightKg: loadPlans.takeoffWeightKg,
        landingWeightKg: loadPlans.landingWeightKg,
        withinWeightLimits: loadPlans.withinWeightLimits,
        withinCgEnvelope: loadPlans.withinCgEnvelope,
        constraintsSatisfied: loadPlans.constraintsSatisfied,
        optimizedAt: loadPlans.optimizedAt,
        releasedAt: loadPlans.releasedAt,
        createdAt: loadPlans.createdAt,
        updatedAt: loadPlans.updatedAt,
        flightNumber: flights.flightNumber,
        aircraftName: aircrafts.name,
      })
      .from(loadPlans)
      .leftJoin(flights, eq(flights.id, loadPlans.flightId))
      .leftJoin(aircrafts, eq(aircrafts.id, loadPlans.aircraftId))
      .where(
        and(
          flightId ? eq(loadPlans.flightId, flightId) : undefined,
          status ? eq(loadPlans.status, status) : undefined,
          aircraftId ? eq(loadPlans.aircraftId, aircraftId) : undefined
        )
      )
      .orderBy(loadPlans.createdAt);

    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("Error fetching load plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch load plans" },
      { status: 500 }
    );
  }
}

// POST - Create or upsert a load plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightId, plan, uldAssignments: assignmentsData, positionLoads: positionsData } = body;

    if (!flightId) {
      return NextResponse.json(
        { success: false, error: "flightId is required" },
        { status: 400 }
      );
    }

    // Get flight and aircraft
    const [flight] = await db.select().from(flights).where(eq(flights.id, flightId));
    if (!flight) {
      return NextResponse.json(
        { success: false, error: "Flight not found" },
        { status: 404 }
      );
    }

    const [aircraft] = await db.select().from(aircrafts).where(eq(aircrafts.id, flight.aircraftId));
    if (!aircraft) {
      return NextResponse.json(
        { success: false, error: "Aircraft not found" },
        { status: 404 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // Check for existing load plan
      const [existingPlan] = await tx
        .select()
        .from(loadPlans)
        .where(eq(loadPlans.flightId, flightId));

      let loadPlan: typeof loadPlans.$inferSelect;

      if (existingPlan) {
        // Update existing plan
        [loadPlan] = await tx
          .update(loadPlans)
          .set({
            status: plan?.status || existingPlan.status,
            operatingEmptyWeightKg: plan?.operatingEmptyWeightKg || existingPlan.operatingEmptyWeightKg,
            dryOperatingWeightKg: plan?.dryOperatingWeightKg || existingPlan.dryOperatingWeightKg,
            payloadKg: plan?.payloadKg || existingPlan.payloadKg,
            zeroFuelWeightKg: plan?.zeroFuelWeightKg || existingPlan.zeroFuelWeightKg,
            takeoffFuelKg: plan?.takeoffFuelKg || existingPlan.takeoffFuelKg,
            tripFuelKg: plan?.tripFuelKg || existingPlan.tripFuelKg,
            takeoffWeightKg: plan?.takeoffWeightKg || existingPlan.takeoffWeightKg,
            landingWeightKg: plan?.landingWeightKg || existingPlan.landingWeightKg,
            zfwCgPercentMac: plan?.zfwCgPercentMac || existingPlan.zfwCgPercentMac,
            zfwCgIndex: plan?.zfwCgIndex || existingPlan.zfwCgIndex,
            towCgPercentMac: plan?.towCgPercentMac || existingPlan.towCgPercentMac,
            towCgIndex: plan?.towCgIndex || existingPlan.towCgIndex,
            ldwCgPercentMac: plan?.ldwCgPercentMac || existingPlan.ldwCgPercentMac,
            ldwCgIndex: plan?.ldwCgIndex || existingPlan.ldwCgIndex,
            stabilizerTrimUnits: plan?.stabilizerTrimUnits || existingPlan.stabilizerTrimUnits,
            withinWeightLimits: plan?.withinWeightLimits,
            withinCgEnvelope: plan?.withinCgEnvelope,
            constraintsSatisfied: plan?.constraintsSatisfied,
            lateralBalanceOk: plan?.lateralBalanceOk,
            validationErrors: plan?.validationErrors,
            validationWarnings: plan?.validationWarnings,
            optimizationTimeMs: plan?.optimizationTimeMs,
            optimizedAt: plan?.optimizedAt ? new Date(plan.optimizedAt) : existingPlan.optimizedAt,
            releasedAt: plan?.releasedAt ? new Date(plan.releasedAt) : existingPlan.releasedAt,
            releasedBy: plan?.releasedBy || existingPlan.releasedBy,
            updatedAt: new Date(),
          })
          .where(eq(loadPlans.id, existingPlan.id))
          .returning();
      } else {
        // Create new plan
        const planNumber = plan?.planNumber || `LP-${flight.flightNumber}-${Date.now()}`;
        [loadPlan] = await tx
          .insert(loadPlans)
          .values({
            flightId,
            aircraftId: flight.aircraftId,
            planNumber,
            status: plan?.status || "DRAFT",
            operatingEmptyWeightKg: plan?.operatingEmptyWeightKg || aircraft.operatingEmptyWeightKg,
            dryOperatingWeightKg: plan?.dryOperatingWeightKg,
            payloadKg: plan?.payloadKg,
            zeroFuelWeightKg: plan?.zeroFuelWeightKg,
            takeoffFuelKg: plan?.takeoffFuelKg,
            tripFuelKg: plan?.tripFuelKg,
            takeoffWeightKg: plan?.takeoffWeightKg,
            landingWeightKg: plan?.landingWeightKg,
            zfwCgPercentMac: plan?.zfwCgPercentMac,
            zfwCgIndex: plan?.zfwCgIndex,
            towCgPercentMac: plan?.towCgPercentMac,
            towCgIndex: plan?.towCgIndex,
            ldwCgPercentMac: plan?.ldwCgPercentMac,
            ldwCgIndex: plan?.ldwCgIndex,
            stabilizerTrimUnits: plan?.stabilizerTrimUnits,
            withinWeightLimits: plan?.withinWeightLimits,
            withinCgEnvelope: plan?.withinCgEnvelope,
            constraintsSatisfied: plan?.constraintsSatisfied,
            lateralBalanceOk: plan?.lateralBalanceOk,
            validationErrors: plan?.validationErrors,
            validationWarnings: plan?.validationWarnings,
          })
          .returning();
      }

      // Handle ULD assignments if provided
      let createdAssignments: typeof uldAssignments.$inferSelect[] = [];
      if (assignmentsData && Array.isArray(assignmentsData)) {
        // Delete existing assignments
        await tx.delete(uldAssignments).where(eq(uldAssignments.loadPlanId, loadPlan.id));

        if (assignmentsData.length > 0) {
          createdAssignments = await tx
            .insert(uldAssignments)
            .values(
              assignmentsData.map((assignment: {
                uldId?: string;
                uldTypeId: string;
                uldNumber?: string;
                positionCode?: string;
                sequence: number;
                totalWeightKg?: string;
                tareWeightKg: string;
                cargoWeightKg?: string;
                volumeUsedM3?: string;
                volumeUtilization?: string;
                weightUtilization?: string;
                isVirtual?: boolean;
                status?: string;
                notes?: string;
              }) => ({
                loadPlanId: loadPlan.id,
                uldId: assignment.uldId,
                uldTypeId: assignment.uldTypeId,
                uldNumber: assignment.uldNumber,
                positionCode: assignment.positionCode,
                sequence: assignment.sequence,
                totalWeightKg: assignment.totalWeightKg || "0",
                tareWeightKg: assignment.tareWeightKg,
                cargoWeightKg: assignment.cargoWeightKg || "0",
                volumeUsedM3: assignment.volumeUsedM3 || "0",
                volumeUtilization: assignment.volumeUtilization,
                weightUtilization: assignment.weightUtilization,
                isVirtual: assignment.isVirtual ?? false,
                status: assignment.status || "PLANNED",
                notes: assignment.notes,
              }))
            )
            .returning();
        }
      }

      // Handle position loads if provided
      let createdPositions: typeof positionLoads.$inferSelect[] = [];
      if (positionsData && Array.isArray(positionsData)) {
        // Delete existing position loads
        await tx.delete(positionLoads).where(eq(positionLoads.loadPlanId, loadPlan.id));

        if (positionsData.length > 0) {
          createdPositions = await tx
            .insert(positionLoads)
            .values(
              positionsData.map((pos: {
                positionId: string;
                uldAssignmentId?: string;
                positionCode: string;
                grossWeightKg: string;
                calculatedMoment?: string;
                calculatedIndex?: string;
                status?: string;
              }) => ({
                loadPlanId: loadPlan.id,
                positionId: pos.positionId,
                uldAssignmentId: pos.uldAssignmentId,
                positionCode: pos.positionCode,
                grossWeightKg: pos.grossWeightKg,
                calculatedMoment: pos.calculatedMoment,
                calculatedIndex: pos.calculatedIndex,
                status: pos.status || "PLANNED",
              }))
            )
            .returning();
        }
      }

      return {
        loadPlan,
        uldAssignments: createdAssignments,
        positionLoads: createdPositions,
        isNew: !existingPlan,
      };
    });

    return NextResponse.json(
      { success: true, data: result },
      { status: result.isNew ? 201 : 200 }
    );
  } catch (error) {
    console.error("Error creating/updating load plan:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create/update load plan";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

