/**
 * CG Calculator
 * 
 * Utilities for center of gravity calculations including:
 * - Moment calculations (weight × arm)
 * - % MAC (Mean Aerodynamic Chord) conversions
 * - CG envelope validation
 */

import type {
  AircraftConfigForPacking,
  CgEnvelopeForPacking,
  CgEnvelopePointForPacking,
  UldAssignmentOutput,
  LoadingPositionForPacking,
  CgResultOutput,
} from "./types";

// ============================================================================
// BASIC CALCULATIONS
// ============================================================================

/**
 * Calculate moment (weight × arm)
 */
export function calculateMoment(weightKg: number, armStationCm: number): number {
  return weightKg * armStationCm;
}

/**
 * Calculate CG position in % MAC
 * 
 * Formula: %MAC = ((CG position - MAC leading edge) / MAC length) × 100
 */
export function calculateCgPercentMac(
  cgPositionCm: number,
  macLeadingEdgeCm: number,
  macLengthCm: number
): number {
  if (macLengthCm <= 0) return 0;
  return ((cgPositionCm - macLeadingEdgeCm) / macLengthCm) * 100;
}

/**
 * Calculate CG position from total moment and weight
 * 
 * CG position = Total Moment / Total Weight
 */
export function calculateCgFromMoment(
  totalMomentKgCm: number,
  totalWeightKg: number
): number {
  if (totalWeightKg <= 0) return 0;
  return totalMomentKgCm / totalWeightKg;
}

// ============================================================================
// ENVELOPE VALIDATION
// ============================================================================

/**
 * Check if a point (weight, CG%) is within a CG envelope polygon
 * Uses the ray casting algorithm for point-in-polygon detection
 */
export function isPointInEnvelopePolygon(
  weightKg: number,
  cgPercentMac: number,
  points: CgEnvelopePointForPacking[]
): boolean {
  if (points.length < 3) return false;

  // Sort points by sequence
  const sortedPoints = [...points].sort((a, b) => a.sequence - b.sequence);
  
  // Ray casting algorithm
  let inside = false;
  const n = sortedPoints.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = sortedPoints[i].cgPercentMac;
    const yi = sortedPoints[i].weightKg;
    const xj = sortedPoints[j].cgPercentMac;
    const yj = sortedPoints[j].weightKg;
    
    // Check if ray from point crosses this edge
    if (
      yi > weightKg !== yj > weightKg &&
      cgPercentMac < ((xj - xi) * (weightKg - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Check if CG is within the simple forward/aft limits
 * This is a simplified check when polygon points are not available
 */
export function isWithinSimpleLimits(
  cgPercentMac: number,
  forwardLimitPercentMac: number,
  aftLimitPercentMac: number
): boolean {
  return cgPercentMac >= forwardLimitPercentMac && cgPercentMac <= aftLimitPercentMac;
}

/**
 * Validate CG against envelope
 * Uses polygon points if available, otherwise simple limits
 */
export function isWithinCgEnvelope(
  weightKg: number,
  cgPercentMac: number,
  envelope: CgEnvelopeForPacking
): boolean {
  // If we have polygon points, use them for precise validation
  if (envelope.points && envelope.points.length >= 3) {
    return isPointInEnvelopePolygon(weightKg, cgPercentMac, envelope.points);
  }
  
  // Otherwise use simple forward/aft limits
  return isWithinSimpleLimits(
    cgPercentMac,
    envelope.forwardLimitPercentMac,
    envelope.aftLimitPercentMac
  );
}

/**
 * Get the CG limits at a specific weight from envelope
 * Returns interpolated forward and aft limits
 */
export function getCgLimitsAtWeight(
  weightKg: number,
  envelope: CgEnvelopeForPacking
): { forwardLimit: number; aftLimit: number } {
  // If no polygon points, return simple limits
  if (!envelope.points || envelope.points.length < 3) {
    return {
      forwardLimit: envelope.forwardLimitPercentMac,
      aftLimit: envelope.aftLimitPercentMac,
    };
  }

  const sortedPoints = [...envelope.points].sort((a, b) => a.sequence - b.sequence);
  
  // Find min and max CG at this weight by checking envelope boundaries
  // This is a simplified approach - for production, implement proper polygon edge intersection
  let forwardLimit = envelope.forwardLimitPercentMac;
  let aftLimit = envelope.aftLimitPercentMac;
  
  // Find the closest points above and below this weight
  const pointsBelow = sortedPoints.filter(p => p.weightKg <= weightKg);
  const pointsAbove = sortedPoints.filter(p => p.weightKg > weightKg);
  
  if (pointsBelow.length > 0 && pointsAbove.length > 0) {
    // Interpolate between nearest points
    const maxBelow = pointsBelow.reduce((max, p) => p.weightKg > max.weightKg ? p : max);
    const minAbove = pointsAbove.reduce((min, p) => p.weightKg < min.weightKg ? p : min);
    
    const ratio = (weightKg - maxBelow.weightKg) / (minAbove.weightKg - maxBelow.weightKg);
    const interpolatedCg = maxBelow.cgPercentMac + ratio * (minAbove.cgPercentMac - maxBelow.cgPercentMac);
    
    // Adjust limits based on interpolation direction
    if (maxBelow.cgPercentMac < minAbove.cgPercentMac) {
      forwardLimit = Math.min(maxBelow.cgPercentMac, interpolatedCg);
      aftLimit = Math.max(minAbove.cgPercentMac, interpolatedCg);
    } else {
      forwardLimit = Math.min(minAbove.cgPercentMac, interpolatedCg);
      aftLimit = Math.max(maxBelow.cgPercentMac, interpolatedCg);
    }
  }
  
  return { forwardLimit, aftLimit };
}

// ============================================================================
// TOTAL CG CALCULATION
// ============================================================================

/**
 * Position load for CG calculation
 */
export type PositionLoad = {
  positionCode: string;
  weightKg: number;
  armStationCm: number;
};

/**
 * Calculate total CG from all position loads
 */
export function calculateTotalCg(
  positionLoads: PositionLoad[],
  aircraftConfig: AircraftConfigForPacking
): CgResultOutput | null {
  if (!aircraftConfig.macLeadingEdgeCm || !aircraftConfig.macLengthCm) {
    return null;
  }

  // Calculate total payload weight and moment
  const payloadWeightKg = positionLoads.reduce((sum, load) => sum + load.weightKg, 0);
  const totalMomentKgCm = positionLoads.reduce(
    (sum, load) => sum + calculateMoment(load.weightKg, load.armStationCm),
    0
  );

  // Calculate zero fuel weight
  const zeroFuelWeightKg = aircraftConfig.operatingEmptyWeightKg + payloadWeightKg;

  // Calculate CG position
  // Note: For accurate calculation, we'd need the OEW CG position/moment
  // For now, we calculate payload CG only
  const payloadCgPositionCm = calculateCgFromMoment(totalMomentKgCm, payloadWeightKg);
  
  // Convert to % MAC
  const zfwCgPercentMac = calculateCgPercentMac(
    payloadCgPositionCm,
    aircraftConfig.macLeadingEdgeCm,
    aircraftConfig.macLengthCm
  );

  // Find the ZERO_FUEL envelope for validation
  const zfwEnvelope = aircraftConfig.cgEnvelopes.find(
    (env) => env.envelopeType === "ZERO_FUEL"
  );

  // Validate against envelope
  const zfwWithinEnvelope = zfwEnvelope
    ? isWithinCgEnvelope(zeroFuelWeightKg, zfwCgPercentMac, zfwEnvelope)
    : true;

  // Get limits at this weight
  const limits = zfwEnvelope
    ? getCgLimitsAtWeight(zeroFuelWeightKg, zfwEnvelope)
    : { forwardLimit: 15, aftLimit: 40 }; // Default limits if no envelope

  return {
    zeroFuelWeightKg,
    zfwCgPercentMac,
    zfwWithinEnvelope,
    payloadWeightKg,
    totalMomentKgCm,
    forwardLimitPercentMac: limits.forwardLimit,
    aftLimitPercentMac: limits.aftLimit,
  };
}

/**
 * Calculate CG result from ULD assignments
 */
export function calculateCgFromAssignments(
  assignments: UldAssignmentOutput[],
  aircraftConfig: AircraftConfigForPacking
): CgResultOutput | null {
  // Convert assignments to position loads
  const positionLoads: PositionLoad[] = [];

  for (const assignment of assignments) {
    if (assignment.positionAssignment) {
      positionLoads.push({
        positionCode: assignment.positionAssignment.positionCode,
        weightKg: assignment.totalWeightKg,
        armStationCm: assignment.positionAssignment.armStationCm,
      });
    }
  }

  if (positionLoads.length === 0) {
    return null;
  }

  return calculateTotalCg(positionLoads, aircraftConfig);
}

// ============================================================================
// POSITION SELECTION FOR CG TARGET
// ============================================================================

/**
 * Calculate the impact of placing a ULD at a position on CG
 * Returns the estimated CG change
 */
export function calculateCgImpact(
  uldWeightKg: number,
  positionArmStationCm: number,
  currentTotalWeightKg: number,
  currentTotalMomentKgCm: number,
  macLeadingEdgeCm: number,
  macLengthCm: number
): { newCgPercentMac: number; cgChange: number } {
  const currentCgPercentMac = currentTotalWeightKg > 0
    ? calculateCgPercentMac(
        calculateCgFromMoment(currentTotalMomentKgCm, currentTotalWeightKg),
        macLeadingEdgeCm,
        macLengthCm
      )
    : 0;

  const newMoment = currentTotalMomentKgCm + calculateMoment(uldWeightKg, positionArmStationCm);
  const newWeight = currentTotalWeightKg + uldWeightKg;
  
  const newCgPosition = calculateCgFromMoment(newMoment, newWeight);
  const newCgPercentMac = calculateCgPercentMac(newCgPosition, macLeadingEdgeCm, macLengthCm);

  return {
    newCgPercentMac,
    cgChange: newCgPercentMac - currentCgPercentMac,
  };
}

/**
 * Find the best position for a ULD to achieve a target CG
 */
export function findBestPositionForCgTarget(
  uldWeightKg: number,
  availablePositions: LoadingPositionForPacking[],
  currentTotalWeightKg: number,
  currentTotalMomentKgCm: number,
  targetCgPercentMac: number,
  macLeadingEdgeCm: number,
  macLengthCm: number
): LoadingPositionForPacking | null {
  if (availablePositions.length === 0) return null;

  let bestPosition: LoadingPositionForPacking | null = null;
  let bestDeviation = Infinity;

  for (const position of availablePositions) {
    const { newCgPercentMac } = calculateCgImpact(
      uldWeightKg,
      position.armStationCm,
      currentTotalWeightKg,
      currentTotalMomentKgCm,
      macLeadingEdgeCm,
      macLengthCm
    );

    const deviation = Math.abs(newCgPercentMac - targetCgPercentMac);
    
    if (deviation < bestDeviation) {
      bestDeviation = deviation;
      bestPosition = position;
    }
  }

  return bestPosition;
}

