/**
 * Planning Feature - Public Exports
 *
 * Load plans, ULD assignments, optimization, and packing visualization.
 */

// Types
export * from "./types";

// Components
export { CargoList } from "./components/cargo-list";
export { UldVisualization } from "./components/uld-visualization";
export { UldViewer3D } from "./components/uld-viewer-3d";
export { OptimizationPanel, type OptimizationObjective } from "./components/optimization-panel";
export { ResultsSummary } from "./components/results-summary";
export { UldSelector } from "./components/uld-selector";

// Actions
export {
  runOptimization,
  generateInstructions,
  explainOptimizationResult,
  parseRule,
  getCargoItems,
  getPackingRules,
  getFlights,
  getAvailableUldsForFlight,
  confirmBuildUpPlan,
  getLoadPlanById,
  type OptimizerUsed,
  type AvailableUldDisplay,
} from "./actions/optimize.actions";

// Algorithm (for custom optimizer implementations)
export type {
  IUldOptimizer,
  OptimizerFactory,
  OptimizerInput,
  OptimizationOutput,
  CargoItemForPacking,
  UldTypeForPacking,
  PackingConstraint,
} from "./lib/algorithm";

export {
  registerOptimizer,
  getOptimizer,
  setDefaultOptimizer,
  getAvailableOptimizers,
} from "./lib/algorithm";

// Utilities
export { getColorForAwb, CARGO_COLORS } from "./lib/utils/colors";
