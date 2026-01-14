/**
 * Position Assigner
 * 
 * Handles assignment of packed ULDs to aircraft loading positions.
 * Supports both sequential assignment and CG-optimized assignment.
 */

import type {
  AircraftConfigForPacking,
  DeckConfigForPacking,
  LoadingPositionForPacking,
  UldAssignmentOutput,
  PositionAssignmentOutput,
  UldTypeForPacking,
} from "./types";
import {
  calculateMoment,
  calculateCgImpact,
  findBestPositionForCgTarget,
} from "./cg-calculator";

// ============================================================================
// COMPATIBILITY CHECKING
// ============================================================================

/**
 * Check if a ULD type is compatible with a position
 */
export function isUldCompatibleWithPosition(
  uldTypeCode: string,
  position: LoadingPositionForPacking
): boolean {
  // If no compatibility restrictions, accept all ULD types
  if (!position.compatibleUldTypes || position.compatibleUldTypes.length === 0) {
    return true;
  }
  return position.compatibleUldTypes.includes(uldTypeCode);
}

/**
 * Get all positions compatible with a ULD type
 */
export function getCompatiblePositions(
  uldTypeCode: string,
  positions: LoadingPositionForPacking[]
): LoadingPositionForPacking[] {
  return positions.filter((pos) => isUldCompatibleWithPosition(uldTypeCode, pos));
}

/**
 * Check if a ULD can be placed in a position (weight check)
 */
export function validatePositionWeight(
  uldWeightKg: number,
  position: LoadingPositionForPacking
): boolean {
  return uldWeightKg <= position.maxWeightKg;
}

// ============================================================================
// DECK WEIGHT TRACKING
// ============================================================================

/**
 * Track current weight per deck
 */
export type DeckWeightTracker = {
  [deckCode: string]: number;
};

/**
 * Initialize deck weight tracker
 */
export function initDeckWeightTracker(
  decks: DeckConfigForPacking[]
): DeckWeightTracker {
  const tracker: DeckWeightTracker = {};
  for (const deck of decks) {
    tracker[deck.deckCode] = 0;
  }
  return tracker;
}

/**
 * Check if adding weight to a deck would exceed its limit
 */
export function validateDeckWeight(
  deck: DeckConfigForPacking,
  currentDeckWeight: number,
  additionalWeight: number
): boolean {
  if (!deck.maxStructuralWeightKg) {
    // No limit defined, allow
    return true;
  }
  return currentDeckWeight + additionalWeight <= deck.maxStructuralWeightKg;
}

/**
 * Get deck configuration for a position
 */
export function getDeckForPosition(
  position: LoadingPositionForPacking,
  decks: DeckConfigForPacking[]
): DeckConfigForPacking | null {
  for (const deck of decks) {
    if (deck.positions.some((p) => p.id === position.id)) {
      return deck;
    }
  }
  return null;
}

// ============================================================================
// POSITION ASSIGNMENT STRATEGIES
// ============================================================================

/**
 * Track assigned positions
 */
export type AssignedPositionTracker = Set<string>;

/**
 * Result of position assignment
 */
export type PositionAssignmentResult = {
  success: boolean;
  assignments: UldAssignmentOutput[];
  unassignedUlds: UldAssignmentOutput[];
  warnings: string[];
  deckWeights: DeckWeightTracker;
};

/**
 * Assign positions sequentially (forward to aft)
 * Simple first-fit approach based on position sequence
 */
export function assignPositionsSequential(
  ulds: UldAssignmentOutput[],
  aircraftConfig: AircraftConfigForPacking
): PositionAssignmentResult {
  const warnings: string[] = [];
  const assignments: UldAssignmentOutput[] = [];
  const unassignedUlds: UldAssignmentOutput[] = [];
  const assignedPositions: AssignedPositionTracker = new Set();
  const deckWeights = initDeckWeightTracker(aircraftConfig.decks);

  // Get all positions sorted by sequence
  const allPositions = aircraftConfig.decks
    .flatMap((deck) =>
      deck.positions.map((pos) => ({ ...pos, deckCode: deck.deckCode }))
    )
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  for (const uld of ulds) {
    let assigned = false;

    for (const position of allPositions) {
      // Skip already assigned positions
      if (assignedPositions.has(position.id)) continue;

      // Check ULD compatibility
      if (!isUldCompatibleWithPosition(uld.uldTypeCode, position)) continue;

      // Check position weight limit
      if (!validatePositionWeight(uld.totalWeightKg, position)) {
        continue;
      }

      // Check deck weight limit
      const deck = aircraftConfig.decks.find((d) => d.deckCode === position.deckCode);
      if (deck && !validateDeckWeight(deck, deckWeights[deck.deckCode], uld.totalWeightKg)) {
        continue;
      }

      // Assign to this position
      const positionAssignment: PositionAssignmentOutput = {
        positionId: position.id,
        positionCode: position.positionCode,
        deckCode: position.deckCode,
        armStationCm: position.armStationCm,
        momentKgCm: calculateMoment(uld.totalWeightKg, position.armStationCm),
      };

      assignments.push({
        ...uld,
        positionCode: position.positionCode,
        positionAssignment,
      });

      assignedPositions.add(position.id);
      if (deck) {
        deckWeights[deck.deckCode] += uld.totalWeightKg;
      }

      assigned = true;
      break;
    }

    if (!assigned) {
      warnings.push(
        `No compatible position found for ULD ${uld.uldTypeCode} (sequence ${uld.sequence})`
      );
      unassignedUlds.push(uld);
    }
  }

  return {
    success: unassignedUlds.length === 0,
    assignments,
    unassignedUlds,
    warnings,
    deckWeights,
  };
}

/**
 * Assign positions optimizing for a target CG
 * Uses greedy approach selecting positions that move CG towards target
 */
export function assignPositionsForCgTarget(
  ulds: UldAssignmentOutput[],
  aircraftConfig: AircraftConfigForPacking,
  targetCgPercentMac: number
): PositionAssignmentResult {
  const warnings: string[] = [];
  const assignments: UldAssignmentOutput[] = [];
  const unassignedUlds: UldAssignmentOutput[] = [];
  const assignedPositions: AssignedPositionTracker = new Set();
  const deckWeights = initDeckWeightTracker(aircraftConfig.decks);

  if (!aircraftConfig.macLeadingEdgeCm || !aircraftConfig.macLengthCm) {
    warnings.push("MAC reference data not available, falling back to sequential assignment");
    return assignPositionsSequential(ulds, aircraftConfig);
  }

  // Track current CG state
  let currentTotalWeight = 0;
  let currentTotalMoment = 0;

  // Sort ULDs by weight (heaviest first for better CG control)
  const sortedUlds = [...ulds].sort((a, b) => b.totalWeightKg - a.totalWeightKg);

  // Get all positions with deck info
  const allPositions = aircraftConfig.decks.flatMap((deck) =>
    deck.positions.map((pos) => ({
      ...pos,
      deckCode: deck.deckCode,
      deckConfig: deck,
    }))
  );

  for (const uld of sortedUlds) {
    // Get compatible and available positions
    const availablePositions = allPositions.filter((pos) => {
      if (assignedPositions.has(pos.id)) return false;
      if (!isUldCompatibleWithPosition(uld.uldTypeCode, pos)) return false;
      if (!validatePositionWeight(uld.totalWeightKg, pos)) return false;
      if (!validateDeckWeight(pos.deckConfig, deckWeights[pos.deckCode], uld.totalWeightKg)) {
        return false;
      }
      return true;
    });

    if (availablePositions.length === 0) {
      warnings.push(
        `No compatible position found for ULD ${uld.uldTypeCode} (sequence ${uld.sequence})`
      );
      unassignedUlds.push(uld);
      continue;
    }

    // Find position that moves CG closest to target
    const bestPosition = findBestPositionForCgTarget(
      uld.totalWeightKg,
      availablePositions,
      currentTotalWeight,
      currentTotalMoment,
      targetCgPercentMac,
      aircraftConfig.macLeadingEdgeCm,
      aircraftConfig.macLengthCm
    );

    if (!bestPosition) {
      // Fall back to first available position
      const fallbackPosition = availablePositions[0];
      const positionAssignment: PositionAssignmentOutput = {
        positionId: fallbackPosition.id,
        positionCode: fallbackPosition.positionCode,
        deckCode: fallbackPosition.deckCode,
        armStationCm: fallbackPosition.armStationCm,
        momentKgCm: calculateMoment(uld.totalWeightKg, fallbackPosition.armStationCm),
      };

      assignments.push({
        ...uld,
        positionCode: fallbackPosition.positionCode,
        positionAssignment,
      });

      assignedPositions.add(fallbackPosition.id);
      deckWeights[fallbackPosition.deckCode] += uld.totalWeightKg;
      currentTotalMoment += positionAssignment.momentKgCm;
      currentTotalWeight += uld.totalWeightKg;
    } else {
      const positionAssignment: PositionAssignmentOutput = {
        positionId: bestPosition.id,
        positionCode: bestPosition.positionCode,
        deckCode: allPositions.find((p) => p.id === bestPosition.id)?.deckCode ?? "",
        armStationCm: bestPosition.armStationCm,
        momentKgCm: calculateMoment(uld.totalWeightKg, bestPosition.armStationCm),
      };

      assignments.push({
        ...uld,
        positionCode: bestPosition.positionCode,
        positionAssignment,
      });

      assignedPositions.add(bestPosition.id);
      const deck = allPositions.find((p) => p.id === bestPosition.id)?.deckConfig;
      if (deck) {
        deckWeights[deck.deckCode] += uld.totalWeightKg;
      }
      currentTotalMoment += positionAssignment.momentKgCm;
      currentTotalWeight += uld.totalWeightKg;
    }
  }

  // Re-sort assignments by original sequence for consistency
  assignments.sort((a, b) => a.sequence - b.sequence);

  return {
    success: unassignedUlds.length === 0,
    assignments,
    unassignedUlds,
    warnings,
    deckWeights,
  };
}

/**
 * Assign positions based on optimizer options
 */
export function assignPositions(
  ulds: UldAssignmentOutput[],
  aircraftConfig: AircraftConfigForPacking,
  objective: "MINIMIZE_ULDS" | "MAXIMIZE_UTILIZATION" | "MINIMIZE_CG_DEVIATION" | "BALANCED",
  targetCgPercentMac?: number
): PositionAssignmentResult {
  // Default target CG if not specified (typical aircraft target around 25-30% MAC)
  const defaultTargetCg = 28;
  
  switch (objective) {
    case "MINIMIZE_CG_DEVIATION":
    case "BALANCED":
      return assignPositionsForCgTarget(
        ulds,
        aircraftConfig,
        targetCgPercentMac ?? defaultTargetCg
      );
    
    case "MINIMIZE_ULDS":
    case "MAXIMIZE_UTILIZATION":
    default:
      return assignPositionsSequential(ulds, aircraftConfig);
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate total payload against aircraft limits
 */
export function validatePayloadLimits(
  totalPayloadKg: number,
  aircraftConfig: AircraftConfigForPacking
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (totalPayloadKg > aircraftConfig.totalMaxPayloadKg) {
    warnings.push(
      `Total payload ${totalPayloadKg.toFixed(1)}kg exceeds aircraft limit ${aircraftConfig.totalMaxPayloadKg}kg`
    );
    return { valid: false, warnings };
  }

  return { valid: true, warnings };
}

/**
 * Get all available positions from aircraft config
 */
export function getAllPositions(
  aircraftConfig: AircraftConfigForPacking
): LoadingPositionForPacking[] {
  return aircraftConfig.decks.flatMap((deck) => deck.positions);
}

/**
 * Get positions for a specific deck
 */
export function getPositionsForDeck(
  aircraftConfig: AircraftConfigForPacking,
  deckCode: string
): LoadingPositionForPacking[] {
  const deck = aircraftConfig.decks.find((d) => d.deckCode === deckCode);
  return deck?.positions ?? [];
}

