/**
 * Weight & Balance Feature
 *
 * CG envelopes, loading zones, fuel configurations, and weight constraints
 * for aircraft weight and balance calculations.
 */

// Type exports
export * from "./types";

// Component exports
export { AircraftViewer3D } from "./components/aircraft-viewer-3d";
export { CgEnvelopeChart } from "./components/cg-envelope-chart";
export { UldPositionList } from "./components/uld-position-list";
export { WeightBreakdown } from "./components/weight-breakdown";

// Action exports
export {
  getLoadPlanWithAssignments,
  optimizeBalance,
  getLoadPlansForFlight,
  type BalanceOptimizationInput,
  type BalanceOptimizationResult,
  type LoadPlanWithAssignments,
} from "./actions/balance.actions";

// Lib exports
export {
  generateLoadSheetPdf,
  downloadLoadSheet,
  type LoadSheetData,
} from "./lib/load-sheet-generator";

// Re-export commonly used types with aliases for convenience
export type {
  CgEnvelope,
  NewCgEnvelope,
  CgEnvelopeWithPoints,
  CgEnvelopePoint,
  NewCgEnvelopePoint,
  LoadingZone,
  NewLoadingZone,
  LoadingZoneIndexEntry,
  NewLoadingZoneIndexEntry,
  FuelConfiguration,
  NewFuelConfiguration,
  FuelTank,
  NewFuelTank,
  FuelIndexEntry,
  NewFuelIndexEntry,
  WeightConstraint,
  NewWeightConstraint,
  WeightBreakdown as WeightBreakdownType,
  CgResult,
  WeightBalanceResult,
} from "./types";

