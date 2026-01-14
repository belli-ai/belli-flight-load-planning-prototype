/**
 * Algorithm Types
 * 
 * Core types for the optimization algorithm layer.
 * These types define the contract between data layer and algorithm implementations.
 */

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Aircraft configuration for optimization
 */
export type AircraftConfigForPacking = {
  id: string;
  name: string;
  typeCode: string;
  /** Operating empty weight in kg */
  operatingEmptyWeightKg: number;
  /** Maximum zero fuel weight in kg */
  maxZeroFuelWeightKg: number;
  /** Maximum takeoff weight in kg */
  maxTakeoffWeightKg: number;
  /** Maximum landing weight in kg */
  maxLandingWeightKg: number;
  /** Total maximum payload in kg */
  totalMaxPayloadKg: number;
  /** MAC leading edge position in cm from datum */
  macLeadingEdgeCm: number | null;
  /** Mean Aerodynamic Chord length in cm */
  macLengthCm: number | null;
  /** Deck configurations with positions */
  decks: DeckConfigForPacking[];
  /** CG envelopes for validation */
  cgEnvelopes: CgEnvelopeForPacking[];
};

/**
 * Deck configuration for optimization
 */
export type DeckConfigForPacking = {
  id: string;
  deckCode: "MAIN" | "LOWER_FWD" | "LOWER_AFT" | "BULK";
  deckName: string;
  /** Maximum structural weight for the deck in kg */
  maxStructuralWeightKg: number | null;
  /** Sequence number for ordering */
  sequence: number;
  /** Loading positions on this deck */
  positions: LoadingPositionForPacking[];
};

/**
 * Loading position for optimization
 */
export type LoadingPositionForPacking = {
  id: string;
  positionCode: string;
  sequenceNumber: number;
  /** Maximum weight allowed in this position in kg */
  maxWeightKg: number;
  /** Arm station (distance from datum) in cm for moment calculation */
  armStationCm: number;
  /** Compatible ULD type codes (null means all types accepted) */
  compatibleUldTypes: string[] | null;
  /** Whether position accepts bulk/loose cargo */
  acceptsBulkCargo: boolean;
  /** Maximum height allowed at this position in cm */
  maxHeightCm: number | null;
  /** Contour code for fuselage shape restrictions */
  contourCode: string | null;
  /** Column index for position grid layout */
  colIndex: number | null;
  /** Row index for position grid layout */
  rowIndex: number | null;
};

/**
 * CG envelope for validation
 */
export type CgEnvelopeForPacking = {
  id: string;
  envelopeType: "TAKEOFF" | "ZERO_FUEL" | "LANDING";
  /** Forward CG limit in % MAC */
  forwardLimitPercentMac: number;
  /** Aft CG limit in % MAC */
  aftLimitPercentMac: number;
  /** Polygon points defining the envelope */
  points: CgEnvelopePointForPacking[];
};

/**
 * Point on CG envelope polygon
 */
export type CgEnvelopePointForPacking = {
  sequence: number;
  weightKg: number;
  cgPercentMac: number;
};

/**
 * Cargo item prepared for packing algorithm
 */
export type CargoItemForPacking = {
  id: string;
  awbId: string;
  awbNumber: string;
  pieceNumber: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeM3: number;
  isStackable: boolean;
  maxStackWeightKg: number | null;
  isTiltable: boolean;
  isDangerousGoods: boolean;
  dgClassCode: string | null;
  tempZoneCode: string | null;
  isLiveAnimal: boolean;
  isFoodstuff: boolean;
  specialHandlingCodes: string[];
  priority: "HIGH" | "STANDARD" | "LOW";
};

/**
 * ULD type specification for packing
 */
export type UldTypeForPacking = {
  id: string;
  code: string;
  name: string;
  category: "CONTAINER" | "PALLET";
  maxGrossWeightKg: number;
  tareWeightKg: number;
  maxVolumeM3: number;
  internalLengthCm: number;
  internalWidthCm: number;
  internalHeightCm: number;
  isRefrigerated: boolean;
};

/**
 * Physical ULD from inventory
 * Represents an actual ULD instance that can be assigned to a load plan
 */
export type UldInventoryItem = {
  id: string;
  /** Unique ULD number in IATA format (e.g., "AKE12345BA") */
  uldNumber: string;
  uldTypeId: string;
  /** Full ULD type details */
  uldType: UldTypeForPacking;
  /** Current location (airport) where the ULD is stored */
  locationId: string;
  /** Owner airline code (e.g., "RY", "TH") */
  ownerCode: string | null;
  /** Current status of the ULD */
  status: string;
};

/**
 * Packing constraint from rules
 */
export type PackingConstraint = {
  id: string;
  type: "position" | "compatibility" | "weight" | "stacking" | "grouping" | "segregation";
  condition: string;
  constraint: string;
  priority: number;
  parameters?: Record<string, unknown>;
};

/**
 * Rotation level for cargo items
 * - NONE: No rotation allowed, use original orientation only
 * - Z_ONLY: Flat rotation only (swap length/width), keeps item upright
 * - FULL_3D: Full 3D rotation including tilting (all 6 orientations)
 */
export type RotationLevel = "NONE" | "Z_ONLY" | "FULL_3D";

/**
 * Optimization configuration options
 */
export type OptimizerOptions = {
  objective: "MINIMIZE_ULDS" | "MAXIMIZE_UTILIZATION" | "MINIMIZE_CG_DEVIATION" | "BALANCED";
  maxUldsToUse?: number;
  prioritizeHighPriorityCargo?: boolean;
  /** @deprecated Use rotationLevel instead */
  allowRotation?: boolean;
  /** Rotation level for cargo items (defaults to Z_ONLY for backwards compatibility) */
  rotationLevel?: RotationLevel;
  targetCgPercentMac?: number;
  timeoutMs?: number;
  /** Specific ULD IDs that MUST be used (all will be included even if empty) */
  selectedUldIds?: string[];
};

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * 3D position within ULD
 */
export type Position3D = {
  x: number;
  y: number;
  z: number;
};

/**
 * Dimensions in centimeters
 */
export type Dimensions3D = {
  length: number;
  width: number;
  height: number;
};

/**
 * Packed item result from algorithm
 */
export type PackedItemOutput = {
  cargoItemId: string;
  position: Position3D;
  dimensions: Dimensions3D;
  rotated: boolean;
  rotationAxis: "X" | "Y" | "Z" | null;
  sequence: number;
};

/**
 * ULD assignment result from algorithm
 */
export type UldAssignmentOutput = {
  /** Physical ULD ID from inventory (null if virtual ULD) */
  uldId: string | null;
  /** ULD number in IATA format (null if virtual ULD) */
  uldNumber: string | null;
  uldTypeId: string;
  uldTypeCode: string;
  sequence: number;
  positionCode: string | null;
  cargoItems: PackedItemOutput[];
  totalWeightKg: number;
  tareWeightKg: number;
  cargoWeightKg: number;
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
  /** Position assignment details (populated when aircraft config is provided) */
  positionAssignment?: PositionAssignmentOutput;
};

/**
 * Position assignment details for a ULD
 */
export type PositionAssignmentOutput = {
  positionId: string;
  positionCode: string;
  deckCode: string;
  armStationCm: number;
  /** Calculated moment (weight × arm) */
  momentKgCm: number;
};

/**
 * Statistics from optimization run
 */
export type OptimizationStats = {
  uldsUsed: number;
  totalCargoItems: number;
  totalCargoWeight: number;
  totalCargoVolume: number;
  avgVolumeUtilization: number;
  avgWeightUtilization: number;
  unassignedCount: number;
  unassignedWeight: number;
  unassignedVolume: number;
};

/**
 * CG calculation result
 */
export type CgResultOutput = {
  /** Zero fuel weight in kg */
  zeroFuelWeightKg: number;
  /** Zero fuel weight CG in % MAC */
  zfwCgPercentMac: number;
  /** Whether ZFW CG is within envelope */
  zfwWithinEnvelope: boolean;
  /** Total payload weight in kg */
  payloadWeightKg: number;
  /** Total moment from payload in kg·cm */
  totalMomentKgCm: number;
  /** Forward limit at this weight in % MAC */
  forwardLimitPercentMac: number;
  /** Aft limit at this weight in % MAC */
  aftLimitPercentMac: number;
  /** Deviation from target CG (if specified) */
  cgDeviationFromTarget?: number;
};

/**
 * Full optimization result
 */
export type OptimizationOutput = {
  status: "OPTIMAL" | "FEASIBLE" | "INFEASIBLE" | "TIMEOUT" | "ERROR";
  assignments: UldAssignmentOutput[];
  unassignedCargoIds: string[];
  stats: OptimizationStats;
  computationTimeMs: number;
  warnings: string[];
  algorithmUsed: string;
  /** CG calculation result (populated when aircraft config is provided) */
  cgResult?: CgResultOutput;
};

// ============================================================================
// OPTIMIZER INTERFACE
// ============================================================================

/**
 * Input bundle for optimizer
 */
export type OptimizerInput = {
  cargoItems: CargoItemForPacking[];
  uldTypes: UldTypeForPacking[];
  constraints: PackingConstraint[];
  options: OptimizerOptions;
  /** Aircraft configuration for position assignment and CG calculations (optional) */
  aircraftConfig?: AircraftConfigForPacking;
  /** Available ULDs from inventory at origin location (optional) */
  uldInventory?: UldInventoryItem[];
};

/**
 * Abstract interface for ULD optimization algorithms.
 * 
 * Implement this interface to create new optimization strategies.
 * The optimizer takes cargo items and ULD types as input and produces
 * an assignment of cargo to ULDs with 3D positioning.
 */
export type IUldOptimizer = {
  /** Unique identifier for this algorithm */
  readonly name: string;
  
  /** Human-readable description */
  readonly description: string;
  
  /**
   * Run the optimization algorithm
   * @param input - Cargo items, ULD types, constraints, and options
   * @returns Optimization result with ULD assignments
   */
  optimize(input: OptimizerInput): Promise<OptimizationOutput>;
};

/**
 * Factory function type for creating optimizers
 */
export type OptimizerFactory = () => IUldOptimizer;

