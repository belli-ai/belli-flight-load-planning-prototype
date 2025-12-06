/**
 * Planning Feature - Type Definitions
 *
 * Load plans, ULD assignments, 3D packing coordinates, position loads,
 * and packing rules for optimization.
 */

// ============================================================================
// LOAD PLANS
// ============================================================================

/**
 * Load planning session and results
 * Central record tracking optimization state and weight/balance results
 */
export type LoadPlan = {
  id: string;
  flightId: string;
  aircraftId: string;
  planNumber: string | null;
  status: LoadPlanStatus;
  // Weight calculations
  operatingEmptyWeightKg: number | null;
  dryOperatingWeightKg: number | null;
  payloadKg: number | null;
  zeroFuelWeightKg: number | null;
  takeoffFuelKg: number | null;
  tripFuelKg: number | null;
  takeoffWeightKg: number | null;
  landingWeightKg: number | null;
  // CG results
  zfwCgPercentMac: number | null;
  zfwCgIndex: number | null;
  towCgPercentMac: number | null;
  towCgIndex: number | null;
  ldwCgPercentMac: number | null;
  ldwCgIndex: number | null;
  // Trim
  stabilizerTrimUnits: number | null;
  // Validation
  withinWeightLimits: boolean | null;
  withinCgEnvelope: boolean | null;
  constraintsSatisfied: boolean | null;
  lateralBalanceOk: boolean | null;
  validationErrors: string[] | null;
  validationWarnings: string[] | null;
  // Optimization metadata
  optimizationTimeMs: number | null;
  optimizedAt: Date | null;
  releasedAt: Date | null;
  releasedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewLoadPlan = Omit<LoadPlan, "id" | "createdAt" | "updatedAt">;

export const LOAD_PLAN_STATUSES = {
  DRAFT: "DRAFT",
  OPTIMIZING: "OPTIMIZING",
  OPTIMIZED: "OPTIMIZED",
  FINAL: "FINAL",
  RELEASED: "RELEASED",
} as const;

export type LoadPlanStatus = (typeof LOAD_PLAN_STATUSES)[keyof typeof LOAD_PLAN_STATUSES];

export type LoadPlanWithDetails = LoadPlan & {
  flight: Flight;
  aircraft: Aircraft;
  uldAssignments: UldAssignment[];
  positionLoads: PositionLoad[];
};

export type LoadPlanSummary = Pick<
  LoadPlan,
  | "id"
  | "planNumber"
  | "status"
  | "payloadKg"
  | "zfwCgPercentMac"
  | "withinCgEnvelope"
  | "createdAt"
> & {
  flightNumber: string;
  originCode: string;
  destinationCode: string;
  uldsUsed: number;
  cargoCount: number;
};

// ============================================================================
// ULD ASSIGNMENTS
// ============================================================================

/**
 * Cargo-to-ULD assignment records
 * Tracks which cargo items are packed into which ULD
 */
export type UldAssignment = {
  id: string;
  loadPlanId: string;
  uldId: string | null;
  uldTypeId: string;
  uldNumber: string | null;
  positionCode: string | null;
  sequence: number;
  totalWeightKg: number;
  tareWeightKg: number;
  cargoWeightKg: number;
  volumeUsedM3: number;
  volumeUtilization: number | null;
  weightUtilization: number | null;
  isVirtual: boolean;
  status: UldAssignmentStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewUldAssignment = Omit<UldAssignment, "id" | "createdAt" | "updatedAt">;

export const ULD_ASSIGNMENT_STATUSES = {
  PLANNED: "PLANNED",
  BUILDING: "BUILDING",
  COMPLETE: "COMPLETE",
  LOADED: "LOADED",
} as const;

export type UldAssignmentStatus =
  (typeof ULD_ASSIGNMENT_STATUSES)[keyof typeof ULD_ASSIGNMENT_STATUSES];

export type UldAssignmentWithDetails = UldAssignment & {
  uldType: UldType;
  uld: Uld | null;
  packedItems: PackedItem[];
};

/**
 * ULD assignment for visualization
 */
export type UldAssignmentForVisualization = {
  id: string;
  uldTypeCode: string;
  uldNumber: string | null;
  positionCode: string | null;
  totalWeightKg: number;
  volumeUsedM3: number;
  volumeUtilization: number;
  weightUtilization: number;
  packedItems: PackedItemForVisualization[];
};

// ============================================================================
// PACKED ITEMS
// ============================================================================

/**
 * 3D packing coordinates within ULD
 * Stores the exact position of each cargo item after optimization
 */
export type PackedItem = {
  id: string;
  uldAssignmentId: string;
  cargoItemId: string;
  sequence: number;
  xPositionCm: number;
  yPositionCm: number;
  zPositionCm: number;
  rotated: boolean;
  rotationAxis: RotationAxis | null;
  packedLengthCm: number;
  packedWidthCm: number;
  packedHeightCm: number;
  createdAt: Date;
};

export type NewPackedItem = Omit<PackedItem, "id" | "createdAt">;

export const ROTATION_AXES = {
  X: "X",
  Y: "Y",
  Z: "Z",
} as const;

export type RotationAxis = (typeof ROTATION_AXES)[keyof typeof ROTATION_AXES];

export type PackedItemWithCargo = PackedItem & {
  cargoItem: CargoItem;
};

/**
 * Packed item for 3D visualization
 */
export type PackedItemForVisualization = {
  id: string;
  cargoItemId: string;
  awbNumber: string;
  pieceNumber: number;
  position: { x: number; y: number; z: number };
  dimensions: { length: number; width: number; height: number };
  weightKg: number;
  color: string; // Assigned color for visualization
  isDangerousGoods: boolean;
  specialHandlingCodes: string[];
};

// ============================================================================
// POSITION LOADS
// ============================================================================

/**
 * ULD-to-aircraft position assignments
 * Records the load at each aircraft position for weight & balance
 */
export type PositionLoad = {
  id: string;
  loadPlanId: string;
  positionId: string;
  uldAssignmentId: string | null;
  positionCode: string;
  grossWeightKg: number;
  calculatedMoment: number | null;
  calculatedIndex: number | null;
  status: PositionLoadStatus;
  loadedAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewPositionLoad = Omit<PositionLoad, "id" | "createdAt" | "updatedAt">;

export const POSITION_LOAD_STATUSES = {
  PLANNED: "PLANNED",
  LOADED: "LOADED",
  VERIFIED: "VERIFIED",
} as const;

export type PositionLoadStatus =
  (typeof POSITION_LOAD_STATUSES)[keyof typeof POSITION_LOAD_STATUSES];

export type PositionLoadWithDetails = PositionLoad & {
  position: LoadingPosition;
  uldAssignment: UldAssignment | null;
};

// ============================================================================
// PACKING RULES
// ============================================================================

/**
 * Natural language rules for LLM interpretation
 * Rules that guide the optimization algorithm
 */
export type PackingRule = {
  id: string;
  ruleText: string;
  ruleType: PackingRuleType;
  priority: number;
  category: string | null;
  isActive: boolean;
  examples: string[] | null;
  structuredRule: StructuredRule | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewPackingRule = Omit<PackingRule, "id" | "createdAt" | "updatedAt">;

export const PACKING_RULE_TYPES = {
  CONSTRAINT: "CONSTRAINT",
  PREFERENCE: "PREFERENCE",
  PROHIBITION: "PROHIBITION",
} as const;

export type PackingRuleType = (typeof PACKING_RULE_TYPES)[keyof typeof PACKING_RULE_TYPES];

/**
 * Structured rule parsed by LLM
 * Machine-readable format for algorithm
 */
export type StructuredRule = {
  type: "position" | "compatibility" | "weight" | "stacking" | "grouping";
  condition: string;
  constraint: string;
  parameters?: Record<string, unknown>;
};

/**
 * Rule categories for organization
 */
export const RULE_CATEGORIES = {
  DANGEROUS_GOODS: "DANGEROUS_GOODS",
  TEMPERATURE: "TEMPERATURE",
  WEIGHT_DISTRIBUTION: "WEIGHT_DISTRIBUTION",
  STACKING: "STACKING",
  PRIORITY: "PRIORITY",
  COMPATIBILITY: "COMPATIBILITY",
} as const;

export type RuleCategory = (typeof RULE_CATEGORIES)[keyof typeof RULE_CATEGORIES];

// ============================================================================
// OPTIMIZATION
// ============================================================================

/**
 * Optimization request input
 */
export type OptimizationRequest = {
  loadPlanId: string;
  cargoItemIds: string[];
  availableUldTypeIds: string[];
  rules: PackingRule[];
  options: OptimizationOptions;
};

export type OptimizationOptions = {
  objective: OptimizationObjective;
  targetCgPercentMac?: number;
  maxUldsToUse?: number;
  prioritizeHighPriorityCargo?: boolean;
  allowRotation?: boolean;
  useVirtualUlds?: boolean;
};

export const OPTIMIZATION_OBJECTIVES = {
  MINIMIZE_ULDS: "MINIMIZE_ULDS",
  MAXIMIZE_UTILIZATION: "MAXIMIZE_UTILIZATION",
  MINIMIZE_CG_DEVIATION: "MINIMIZE_CG_DEVIATION",
  BALANCED: "BALANCED",
} as const;

export type OptimizationObjective =
  (typeof OPTIMIZATION_OBJECTIVES)[keyof typeof OPTIMIZATION_OBJECTIVES];

/**
 * Optimization result
 */
export type OptimizationResult = {
  status: OptimizationStatus;
  objectiveValue: number;
  computationTimeMs: number;
  assignments: UldAssignmentResult[];
  unassignedCargoIds: string[];
  stats: OptimizationStats;
  warnings: string[];
  /** CG calculation result (when aircraft config is available) */
  cgResult?: CgResult;
};

/**
 * CG calculation result from optimization
 */
export type CgResult = {
  /** Zero fuel weight in kg */
  zeroFuelWeightKg: number;
  /** Zero fuel weight CG in % MAC */
  zfwCgPercentMac: number;
  /** Whether ZFW CG is within envelope */
  zfwWithinEnvelope: boolean;
  /** Total payload weight in kg */
  payloadWeightKg: number;
  /** Total moment from payload */
  totalMomentKgCm: number;
  /** Forward CG limit at this weight */
  forwardLimitPercentMac: number;
  /** Aft CG limit at this weight */
  aftLimitPercentMac: number;
  /** Deviation from target CG (if specified) */
  cgDeviationFromTarget?: number;
};

export const OPTIMIZATION_STATUSES = {
  OPTIMAL: "OPTIMAL",
  FEASIBLE: "FEASIBLE",
  INFEASIBLE: "INFEASIBLE",
  TIMEOUT: "TIMEOUT",
  ERROR: "ERROR",
} as const;

export type OptimizationStatus =
  (typeof OPTIMIZATION_STATUSES)[keyof typeof OPTIMIZATION_STATUSES];

export type UldAssignmentResult = {
  /** Physical ULD ID from inventory (null if virtual ULD) */
  uldId: string | null;
  /** ULD number in IATA format (null if virtual ULD) */
  uldNumber: string | null;
  uldTypeId: string;
  uldTypeCode: string;
  positionCode: string | null;
  cargoItems: PackedItemResult[];
  totalWeightKg: number;
  volumeUsedM3: number;
  volumeUtilization: number;
  weightUtilization: number;
  /** ULD internal dimensions in cm (for 3D visualization) */
  uldDimensions: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  /** Max gross weight capacity in kg */
  maxGrossWeightKg: number;
  /** Position assignment details (when aircraft config is available) */
  positionAssignment?: PositionAssignmentResult;
};

export type PositionAssignmentResult = {
  positionId: string;
  positionCode: string;
  deckCode: string;
  armStationCm: number;
  momentKgCm: number;
};

export type PackedItemResult = {
  cargoItemId: string;
  position: { x: number; y: number; z: number };
  dimensions: { length: number; width: number; height: number };
  rotated: boolean;
  rotationAxis: RotationAxis | null;
};

export type OptimizationStats = {
  uldsUsed: number;
  totalCargoItems: number;
  avgVolumeUtilization: number;
  avgWeightUtilization: number;
  totalCargoWeight: number;
  totalCargoVolume: number;
  unassignedCount: number;
  unassignedWeight: number;
  unassignedVolume: number;
};

// ============================================================================
// BUILD-UP INSTRUCTIONS
// ============================================================================

/**
 * Human-readable build-up instruction generated by LLM
 */
export type BuildUpInstruction = {
  uldNumber: string;
  uldTypeCode: string;
  positionCode: string | null;
  steps: BuildUpStep[];
  notes: string[];
  totalWeightKg: number;
  estimatedBuildTimeMinutes: number;
};

export type BuildUpStep = {
  sequence: number;
  action: string;
  cargoDescription: string;
  awbNumber: string;
  weightKg: number;
  placement: string;
  warnings?: string[];
};

// ============================================================================
// FORWARD DECLARATIONS (from other features)
// ============================================================================

// From aircraft feature
type Flight = {
  id: string;
  flightNumber: string;
  originId: string;
  destinationId: string;
};

type Aircraft = {
  id: string;
  name: string;
  typeCode: string;
};

type UldType = {
  id: string;
  code: string;
  name: string;
  maxGrossWeightKg: number;
  maxVolumeM3: number;
};

type Uld = {
  id: string;
  uldNumber: string;
  uldTypeId: string;
};

type LoadingPosition = {
  id: string;
  positionCode: string;
  maxWeightKg: number;
  armStationCm: number;
};

// From cargo feature
type CargoItem = {
  id: string;
  awbId: string;
  pieceNumber: number;
  weightKg: number;
};

