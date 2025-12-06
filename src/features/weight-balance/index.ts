/**
 * Weight & Balance Feature
 *
 * CG envelopes, loading zones, fuel configurations, and weight constraints
 * for aircraft weight and balance calculations.
 */

// Type exports
export * from "./types";

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
  WeightBreakdown,
  CgResult,
  WeightBalanceResult,
} from "./types";

