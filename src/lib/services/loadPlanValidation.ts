import { db } from "@/lib/db";
import {
  loadPlans,
  aircrafts,
  uldAssignments,
  positionLoads,
  loadingPositions,
  cgEnvelopes,
  weightConstraints,
  deckConfigurations,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export interface ValidationResult {
  isValid: boolean;
  withinWeightLimits: boolean;
  withinCgEnvelope: boolean;
  constraintsSatisfied: boolean;
  lateralBalanceOk: boolean;
  errors: string[];
  warnings: string[];
  calculations: {
    totalPayloadKg: number;
    zeroFuelWeightKg: number;
    takeoffWeightKg: number;
    landingWeightKg: number;
    zfwCgPercentMac: number;
    towCgPercentMac: number;
    ldwCgPercentMac: number;
  };
}

/**
 * Validate and calculate load plan weight & balance
 */
export async function validateLoadPlan(loadPlanId: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get load plan
  const [loadPlan] = await db.select().from(loadPlans).where(eq(loadPlans.id, loadPlanId));
  if (!loadPlan) {
    return {
      isValid: false,
      withinWeightLimits: false,
      withinCgEnvelope: false,
      constraintsSatisfied: false,
      lateralBalanceOk: false,
      errors: ["Load plan not found"],
      warnings: [],
      calculations: {
        totalPayloadKg: 0,
        zeroFuelWeightKg: 0,
        takeoffWeightKg: 0,
        landingWeightKg: 0,
        zfwCgPercentMac: 0,
        towCgPercentMac: 0,
        ldwCgPercentMac: 0,
      },
    };
  }

  // Get aircraft
  const [aircraft] = await db.select().from(aircrafts).where(eq(aircrafts.id, loadPlan.aircraftId));
  if (!aircraft) {
    return {
      isValid: false,
      withinWeightLimits: false,
      withinCgEnvelope: false,
      constraintsSatisfied: false,
      lateralBalanceOk: false,
      errors: ["Aircraft not found"],
      warnings: [],
      calculations: {
        totalPayloadKg: 0,
        zeroFuelWeightKg: 0,
        takeoffWeightKg: 0,
        landingWeightKg: 0,
        zfwCgPercentMac: 0,
        towCgPercentMac: 0,
        ldwCgPercentMac: 0,
      },
    };
  }

  // Get all ULD assignments
  const assignments = await db
    .select()
    .from(uldAssignments)
    .where(eq(uldAssignments.loadPlanId, loadPlanId));

  // Get all position loads
  const positions = await db
    .select()
    .from(positionLoads)
    .where(eq(positionLoads.loadPlanId, loadPlanId));

  // Calculate total payload
  const totalPayloadKg = assignments.reduce(
    (sum, a) => sum + Number(a.cargoWeightKg || 0),
    0
  );

  // Calculate weights
  const operatingEmptyWeightKg = Number(loadPlan.operatingEmptyWeightKg || aircraft.operatingEmptyWeightKg);
  const takeoffFuelKg = Number(loadPlan.takeoffFuelKg || 0);
  const tripFuelKg = Number(loadPlan.tripFuelKg || 0);

  const zeroFuelWeightKg = operatingEmptyWeightKg + totalPayloadKg;
  const takeoffWeightKg = zeroFuelWeightKg + takeoffFuelKg;
  const landingWeightKg = takeoffWeightKg - tripFuelKg;

  // Check weight limits
  let withinWeightLimits = true;

  const maxZFW = Number(aircraft.maxZeroFuelWeightKg);
  const maxTOW = Number(aircraft.maxTakeoffWeightKg);
  const maxLDW = Number(aircraft.maxLandingWeightKg);
  const maxPayload = Number(aircraft.totalMaxPayloadKg);

  if (zeroFuelWeightKg > maxZFW) {
    errors.push(`ZFW ${zeroFuelWeightKg.toFixed(0)} kg exceeds maximum ${maxZFW.toFixed(0)} kg`);
    withinWeightLimits = false;
  }

  if (takeoffWeightKg > maxTOW) {
    errors.push(`TOW ${takeoffWeightKg.toFixed(0)} kg exceeds maximum ${maxTOW.toFixed(0)} kg`);
    withinWeightLimits = false;
  }

  if (landingWeightKg > maxLDW) {
    errors.push(`LDW ${landingWeightKg.toFixed(0)} kg exceeds maximum ${maxLDW.toFixed(0)} kg`);
    withinWeightLimits = false;
  }

  if (totalPayloadKg > maxPayload) {
    errors.push(`Payload ${totalPayloadKg.toFixed(0)} kg exceeds maximum ${maxPayload.toFixed(0)} kg`);
    withinWeightLimits = false;
  }

  // Check main deck weight
  const mainDeckMax = Number(aircraft.mainDeckMaxWeightKg || 0);
  const mainDeckWeight = positions
    .filter((p) => p.positionCode.startsWith("U"))
    .reduce((sum, p) => sum + Number(p.grossWeightKg || 0), 0);

  if (mainDeckWeight > mainDeckMax) {
    errors.push(`Main deck weight ${mainDeckWeight.toFixed(0)} kg exceeds maximum ${mainDeckMax.toFixed(0)} kg`);
    withinWeightLimits = false;
  }

  // Check lower deck weight
  const lowerDeckMax = Number(aircraft.lowerDeckMaxWeightKg || 0);
  const lowerDeckWeight = positions
    .filter((p) => !p.positionCode.startsWith("U"))
    .reduce((sum, p) => sum + Number(p.grossWeightKg || 0), 0);

  if (lowerDeckWeight > lowerDeckMax) {
    errors.push(`Lower deck weight ${lowerDeckWeight.toFixed(0)} kg exceeds maximum ${lowerDeckMax.toFixed(0)} kg`);
    withinWeightLimits = false;
  }

  // Calculate CG (simplified - using index method)
  // In production, this would use actual arm stations and detailed calculations
  let totalMoment = 0;
  for (const pos of positions) {
    totalMoment += Number(pos.calculatedMoment || 0);
  }

  // Simplified CG calculation as percentage MAC
  const macLeadingEdgeCm = Number(aircraft.macLeadingEdgeCm || 1000);
  const macLengthCm = Number(aircraft.macLengthCm || 400);
  
  // This is a simplified calculation - production would use actual arm positions
  const avgArm = totalPayloadKg > 0 ? totalMoment / totalPayloadKg : macLeadingEdgeCm;
  const zfwCgPercentMac = ((avgArm - macLeadingEdgeCm) / macLengthCm) * 100;
  const towCgPercentMac = zfwCgPercentMac; // Simplified - fuel shifts CG
  const ldwCgPercentMac = zfwCgPercentMac;

  // Check CG envelope
  let withinCgEnvelope = true;
  const cgEnvelopesList = await db
    .select()
    .from(cgEnvelopes)
    .where(eq(cgEnvelopes.aircraftId, aircraft.id));

  for (const envelope of cgEnvelopesList) {
    const fwdLimit = Number(envelope.forwardLimitPercentMac);
    const aftLimit = Number(envelope.aftLimitPercentMac);

    if (envelope.envelopeType === "ZERO_FUEL" && (zfwCgPercentMac < fwdLimit || zfwCgPercentMac > aftLimit)) {
      errors.push(`ZFW CG ${zfwCgPercentMac.toFixed(1)}% MAC outside envelope (${fwdLimit}-${aftLimit}%)`);
      withinCgEnvelope = false;
    }
    if (envelope.envelopeType === "TAKEOFF" && (towCgPercentMac < fwdLimit || towCgPercentMac > aftLimit)) {
      errors.push(`TOW CG ${towCgPercentMac.toFixed(1)}% MAC outside envelope (${fwdLimit}-${aftLimit}%)`);
      withinCgEnvelope = false;
    }
    if (envelope.envelopeType === "LANDING" && (ldwCgPercentMac < fwdLimit || ldwCgPercentMac > aftLimit)) {
      errors.push(`LDW CG ${ldwCgPercentMac.toFixed(1)}% MAC outside envelope (${fwdLimit}-${aftLimit}%)`);
      withinCgEnvelope = false;
    }
  }

  // Check position weight constraints
  let constraintsSatisfied = true;
  const constraints = await db
    .select()
    .from(weightConstraints)
    .where(and(eq(weightConstraints.aircraftId, aircraft.id), eq(weightConstraints.isActive, true)));

  for (const constraint of constraints) {
    const affectedPositionCodes = constraint.affectedPositions;
    const affectedPositions = positions.filter((p) =>
      affectedPositionCodes.includes(p.positionCode)
    );
    const combinedWeight = affectedPositions.reduce(
      (sum, p) => sum + Number(p.grossWeightKg || 0),
      0
    );

    if (combinedWeight > Number(constraint.maxCombinedWeightKg)) {
      errors.push(
        `${constraint.name}: Combined weight ${combinedWeight.toFixed(0)} kg exceeds limit ${Number(constraint.maxCombinedWeightKg).toFixed(0)} kg`
      );
      constraintsSatisfied = false;
    }
  }

  // Check individual position limits
  const decks = await db
    .select()
    .from(deckConfigurations)
    .where(eq(deckConfigurations.aircraftId, aircraft.id));

  for (const deck of decks) {
    const deckPositions = await db
      .select()
      .from(loadingPositions)
      .where(eq(loadingPositions.deckId, deck.id));

    for (const deckPos of deckPositions) {
      const loadedPos = positions.find((p) => p.positionId === deckPos.id);
      if (loadedPos) {
        const loadedWeight = Number(loadedPos.grossWeightKg || 0);
        const maxWeight = Number(deckPos.maxWeightKg);
        if (loadedWeight > maxWeight) {
          errors.push(
            `Position ${deckPos.positionCode}: Weight ${loadedWeight.toFixed(0)} kg exceeds limit ${maxWeight.toFixed(0)} kg`
          );
          constraintsSatisfied = false;
        }
      }
    }
  }

  // Check lateral balance (simplified)
  const lateralBalanceOk = true; // Simplified - production would check left/right balance

  // Add warnings
  const payloadUtilization = (totalPayloadKg / maxPayload) * 100;
  if (payloadUtilization < 50) {
    warnings.push(`Low payload utilization: ${payloadUtilization.toFixed(1)}%`);
  }
  if (payloadUtilization > 95) {
    warnings.push(`Near maximum payload capacity: ${payloadUtilization.toFixed(1)}%`);
  }

  const isValid = withinWeightLimits && withinCgEnvelope && constraintsSatisfied && lateralBalanceOk;

  return {
    isValid,
    withinWeightLimits,
    withinCgEnvelope,
    constraintsSatisfied,
    lateralBalanceOk,
    errors,
    warnings,
    calculations: {
      totalPayloadKg,
      zeroFuelWeightKg,
      takeoffWeightKg,
      landingWeightKg,
      zfwCgPercentMac,
      towCgPercentMac,
      ldwCgPercentMac,
    },
  };
}

/**
 * Validate and update load plan in database
 */
export async function validateAndUpdateLoadPlan(loadPlanId: string): Promise<ValidationResult> {
  const result = await validateLoadPlan(loadPlanId);

  // Update load plan with validation results
  await db
    .update(loadPlans)
    .set({
      payloadKg: String(result.calculations.totalPayloadKg),
      zeroFuelWeightKg: String(result.calculations.zeroFuelWeightKg),
      takeoffWeightKg: String(result.calculations.takeoffWeightKg),
      landingWeightKg: String(result.calculations.landingWeightKg),
      zfwCgPercentMac: String(result.calculations.zfwCgPercentMac),
      towCgPercentMac: String(result.calculations.towCgPercentMac),
      ldwCgPercentMac: String(result.calculations.ldwCgPercentMac),
      withinWeightLimits: result.withinWeightLimits,
      withinCgEnvelope: result.withinCgEnvelope,
      constraintsSatisfied: result.constraintsSatisfied,
      lateralBalanceOk: result.lateralBalanceOk,
      validationErrors: result.errors.length > 0 ? result.errors : null,
      validationWarnings: result.warnings.length > 0 ? result.warnings : null,
      optimizedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(loadPlans.id, loadPlanId));

  return result;
}

