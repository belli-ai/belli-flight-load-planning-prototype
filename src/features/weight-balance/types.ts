/**
 * Weight & Balance Feature - Type Definitions
 *
 * CG envelopes, loading zones, fuel configurations, and weight constraints
 * for aircraft weight and balance calculations.
 */

// ============================================================================
// CG ENVELOPES
// ============================================================================

/**
 * Center of Gravity envelope definitions
 * Defines acceptable CG ranges at various aircraft weights
 */
export type CgEnvelope = {
  id: string;
  aircraftId: string;
  envelopeType: CgEnvelopeType;
  forwardLimitPercentMac: number;
  aftLimitPercentMac: number;
  description: string | null;
  createdAt: Date;
};

export type NewCgEnvelope = Omit<CgEnvelope, "id" | "createdAt">;

export const CG_ENVELOPE_TYPES = {
  TAKEOFF: "TAKEOFF",
  ZERO_FUEL: "ZERO_FUEL",
  LANDING: "LANDING",
} as const;

export type CgEnvelopeType = (typeof CG_ENVELOPE_TYPES)[keyof typeof CG_ENVELOPE_TYPES];

export type CgEnvelopeWithPoints = CgEnvelope & {
  points: CgEnvelopePoint[];
};

// ============================================================================
// CG ENVELOPE POINTS
// ============================================================================

/**
 * CG envelope polygon points
 * Defines the boundary of valid CG positions at given weights
 */
export type CgEnvelopePoint = {
  id: string;
  envelopeId: string;
  sequence: number;
  weightKg: number;
  cgPercentMac: number;
  cgIndex: number | null;
  createdAt: Date;
};

export type NewCgEnvelopePoint = Omit<CgEnvelopePoint, "id" | "createdAt">;

/**
 * Point for CG envelope visualization
 */
export type EnvelopePoint = {
  weight: number;
  cgPercent: number;
};

// ============================================================================
// LOADING ZONES
// ============================================================================

/**
 * Loading zone definitions with LMC index impacts
 * Groups positions for index calculations
 */
export type LoadingZone = {
  id: string;
  aircraftId: string;
  zoneCode: string;
  positionCodes: string[];
  lmcIndexImpact: number;
  description: string | null;
  createdAt: Date;
};

export type NewLoadingZone = Omit<LoadingZone, "id" | "createdAt">;

export type LoadingZoneWithEntries = LoadingZone & {
  indexEntries: LoadingZoneIndexEntry[];
};

// ============================================================================
// LOADING ZONE INDEX ENTRIES
// ============================================================================

/**
 * Weight-to-index lookup table per zone
 * Used for index-based weight & balance calculations
 */
export type LoadingZoneIndexEntry = {
  id: string;
  zoneId: string;
  weightMinKg: number;
  weightMaxKg: number;
  indexUnits: number;
  createdAt: Date;
};

export type NewLoadingZoneIndexEntry = Omit<LoadingZoneIndexEntry, "id" | "createdAt">;

// ============================================================================
// FUEL CONFIGURATIONS
// ============================================================================

/**
 * Aircraft fuel system configuration
 */
export type FuelConfiguration = {
  id: string;
  aircraftId: string;
  maxFuelCapacityKg: number;
  description: string | null;
  createdAt: Date;
};

export type NewFuelConfiguration = Omit<FuelConfiguration, "id" | "createdAt">;

export type FuelConfigurationWithTanks = FuelConfiguration & {
  tanks: FuelTank[];
  standardIndexTable: FuelIndexEntry[];
};

// ============================================================================
// FUEL TANKS
// ============================================================================

/**
 * Individual fuel tank specifications
 */
export type FuelTank = {
  id: string;
  fuelConfigId: string;
  tankCode: string;
  location: FuelTankLocation;
  maxCapacityKg: number;
  armStationCm: number;
  sequence: number;
  createdAt: Date;
};

export type NewFuelTank = Omit<FuelTank, "id" | "createdAt">;

export const FUEL_TANK_LOCATIONS = {
  WING_LEFT: "WING_LEFT",
  WING_RIGHT: "WING_RIGHT",
  CENTER: "CENTER",
  TRIM: "TRIM",
} as const;

export type FuelTankLocation = (typeof FUEL_TANK_LOCATIONS)[keyof typeof FUEL_TANK_LOCATIONS];

export type FuelTankWithEntries = FuelTank & {
  indexEntries: FuelIndexEntry[];
};

// ============================================================================
// FUEL INDEX ENTRIES
// ============================================================================

/**
 * Fuel weight-to-index lookup table
 */
export type FuelIndexEntry = {
  id: string;
  fuelTankId: string | null;
  fuelConfigId: string;
  weightKg: number;
  indexValue: number;
  densityKgL: number;
  createdAt: Date;
};

export type NewFuelIndexEntry = Omit<FuelIndexEntry, "id" | "createdAt">;

// ============================================================================
// WEIGHT CONSTRAINTS
// ============================================================================

/**
 * Combined position weight constraints
 * Defines maximum combined weight for groups of positions
 */
export type WeightConstraint = {
  id: string;
  aircraftId: string;
  name: string;
  description: string | null;
  affectedPositions: string[];
  maxCombinedWeightKg: number;
  conditionType: ConstraintConditionType;
  conditionExpression: string | null;
  isActive: boolean;
  createdAt: Date;
};

export type NewWeightConstraint = Omit<WeightConstraint, "id" | "createdAt">;

export const CONSTRAINT_CONDITION_TYPES = {
  ALWAYS: "ALWAYS",
  CONDITIONAL: "CONDITIONAL",
} as const;

export type ConstraintConditionType =
  (typeof CONSTRAINT_CONDITION_TYPES)[keyof typeof CONSTRAINT_CONDITION_TYPES];

// ============================================================================
// WEIGHT & BALANCE CALCULATIONS
// ============================================================================

/**
 * Weight breakdown for a load plan
 */
export type WeightBreakdown = {
  operatingEmptyWeightKg: number;
  crewWeightKg: number;
  dryOperatingWeightKg: number;
  payloadKg: number;
  zeroFuelWeightKg: number;
  takeoffFuelKg: number;
  takeoffWeightKg: number;
  tripFuelKg: number;
  landingWeightKg: number;
};

/**
 * CG calculation result
 */
export type CgResult = {
  weightKg: number;
  cgPercentMac: number;
  cgIndex: number;
  isWithinEnvelope: boolean;
  forwardLimit: number;
  aftLimit: number;
};

/**
 * Complete weight and balance result
 */
export type WeightBalanceResult = {
  weights: WeightBreakdown;
  zfwCg: CgResult;
  towCg: CgResult;
  ldwCg: CgResult;
  stabilizerTrimUnits: number;
  withinAllLimits: boolean;
  violations: WeightBalanceViolation[];
  warnings: string[];
};

export type WeightBalanceViolation = {
  type: "WEIGHT_EXCEEDED" | "CG_OUT_OF_ENVELOPE" | "CONSTRAINT_VIOLATED";
  message: string;
  limit: number;
  actual: number;
  positions?: string[];
};

/**
 * Position moment calculation
 */
export type PositionMoment = {
  positionCode: string;
  weightKg: number;
  armStationCm: number;
  moment: number;
  index: number;
};

/**
 * Fuel index calculation input
 */
export type FuelIndexInput = {
  leftWingKg: number;
  rightWingKg: number;
  centerKg: number;
  trimKg?: number;
  totalKg: number;
};

/**
 * Index calculation summary
 */
export type IndexSummary = {
  basicIndex: number;
  cargoIndex: number;
  fuelIndex: number;
  totalIndex: number;
  lmcAdjustment: number;
  finalIndex: number;
};

// ============================================================================
// ENVELOPE VALIDATION
// ============================================================================

/**
 * Envelope check result
 */
export type EnvelopeCheckResult = {
  envelopeType: CgEnvelopeType;
  weightKg: number;
  cgPercentMac: number;
  isWithin: boolean;
  nearestBoundary: "FORWARD" | "AFT" | null;
  marginPercent: number;
};

/**
 * Point position relative to envelope
 */
export type EnvelopePosition = {
  point: { weight: number; cg: number };
  isInside: boolean;
  distanceToForward: number;
  distanceToAft: number;
};

// ============================================================================
// FORMULAS (from LOAD_PLANNING_SPEC.md)
// ============================================================================

/**
 * Weight & Balance Formulas:
 *
 * Moment = Weight × Arm
 * CG = Total Moment / Total Weight
 * Index = f(Weight, Position) // lookup from zone index table
 * Total Index = Σ(Position Index) + Fuel Index + LMC Adjustments
 * CG (% MAC) = Forward Limit + (Index × (Aft Limit - Forward Limit) / 100)
 */
export type WbFormulas = {
  moment: "Weight × Arm";
  cg: "Total Moment / Total Weight";
  index: "Lookup from zone index table";
  totalIndex: "Σ(Position Index) + Fuel Index + LMC Adjustments";
  cgFromIndex: "Forward Limit + (Index × (Aft Limit - Forward Limit) / 100)";
};

