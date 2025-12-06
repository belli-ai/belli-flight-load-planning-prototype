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
export { OptimizationPanel } from "./components/optimization-panel";
export { ResultsSummary } from "./components/results-summary";

// Actions
export {
  runOptimization,
  generateInstructions,
  explainOptimizationResult,
  parseRule,
  getCargoItems,
  getPackingRules,
} from "./actions/optimize.actions";

// Mock data (for development)
export {
  MOCK_FLIGHTS,
  MOCK_CARGO_ITEMS,
  MOCK_CARGO_FOR_PACKING,
  MOCK_AWBS,
  MOCK_ULD_TYPES,
  MOCK_PACKING_RULES,
  MOCK_OPTIMIZATION_RESULT,
  MOCK_BUILD_UP_INSTRUCTIONS,
  getFlightById,
  getCargoForFlight,
  getAwbsForFlight,
  getColorForAwb,
  CARGO_COLORS,
} from "./data/mock-data";
