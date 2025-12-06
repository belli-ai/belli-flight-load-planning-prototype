/**
 * Algorithm Module
 * 
 * Exports optimization algorithms and registry for ULD packing.
 */

// Types
export type {
  // Aircraft configuration types
  AircraftConfigForPacking,
  DeckConfigForPacking,
  LoadingPositionForPacking,
  CgEnvelopeForPacking,
  CgEnvelopePointForPacking,
  // Cargo and ULD types
  CargoItemForPacking,
  UldTypeForPacking,
  PackingConstraint,
  OptimizerOptions,
  Position3D,
  Dimensions3D,
  PackedItemOutput,
  UldAssignmentOutput,
  PositionAssignmentOutput,
  OptimizationStats,
  CgResultOutput,
  OptimizationOutput,
  OptimizerInput,
  IUldOptimizer,
  OptimizerFactory,
} from "./types";

// Registry
export {
  registerOptimizer,
  getOptimizer,
  setDefaultOptimizer,
  getAvailableOptimizers,
  getDefaultOptimizerName,
} from "./optimizer-registry";

// Optimizers
export { Ffd3dOptimizer, createFfd3dOptimizer } from "./ffd-3d-optimizer";

// CG Calculator
export {
  calculateMoment,
  calculateCgPercentMac,
  calculateCgFromMoment,
  isWithinCgEnvelope,
  calculateTotalCg,
  calculateCgFromAssignments,
  findBestPositionForCgTarget,
} from "./cg-calculator";

// Position Assigner
export {
  isUldCompatibleWithPosition,
  getCompatiblePositions,
  validatePositionWeight,
  validateDeckWeight,
  assignPositions,
  assignPositionsSequential,
  assignPositionsForCgTarget,
  validatePayloadLimits,
  getAllPositions,
} from "./position-assigner";

// Auto-register default optimizer
import { registerOptimizer } from "./optimizer-registry";
import { createFfd3dOptimizer } from "./ffd-3d-optimizer";

registerOptimizer("ffd-3d", createFfd3dOptimizer);

