/**
 * Aircraft Feature - Type Definitions
 *
 * Master data for aircraft configurations, ULD types, physical ULDs,
 * deck configurations, loading positions, and flight schedules.
 */

// ============================================================================
// AIRCRAFT
// ============================================================================

/**
 * Aircraft configuration master data
 * Contains weight limits, dimensions, and MAC reference for CG calculations
 */
export type Aircraft = {
  id: string;
  name: string;
  typeCode: string;
  subtype: string | null;
  registration: string | null;
  msn: string | null;
  mainDeckMaxWeightKg: number;
  mainDeckMaxVolumeM3: number | null;
  lowerDeckMaxWeightKg: number;
  lowerDeckMaxVolumeM3: number | null;
  totalMaxPayloadKg: number;
  totalMaxVolumeM3: number | null;
  maxZeroFuelWeightKg: number;
  maxTakeoffWeightKg: number;
  maxLandingWeightKg: number;
  maxTaxiWeightKg: number | null;
  operatingEmptyWeightKg: number;
  datumLocation: string;
  macLeadingEdgeCm: number | null;
  macLengthCm: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewAircraft = Omit<Aircraft, "id" | "createdAt" | "updatedAt">;

export type AircraftWithConfiguration = Aircraft & {
  deckConfigurations: DeckConfiguration[];
  cgEnvelopes?: CgEnvelope[];
  fuelConfiguration?: FuelConfiguration;
  weightConstraints?: WeightConstraint[];
  loadingZones?: LoadingZone[];
};

/**
 * Aircraft weight limits for quick reference
 */
export type AircraftWeightLimits = Pick<
  Aircraft,
  | "maxZeroFuelWeightKg"
  | "maxTakeoffWeightKg"
  | "maxLandingWeightKg"
  | "maxTaxiWeightKg"
  | "operatingEmptyWeightKg"
  | "totalMaxPayloadKg"
>;

// ============================================================================
// DECK CONFIGURATIONS
// ============================================================================

/**
 * Deck configuration per aircraft (Main, Lower Forward, Lower Aft, Bulk)
 */
export type DeckConfiguration = {
  id: string;
  aircraftId: string;
  deckCode: DeckCode;
  deckName: string;
  maxStructuralWeightKg: number | null;
  sequence: number;
  createdAt: Date;
};

export type NewDeckConfiguration = Omit<DeckConfiguration, "id" | "createdAt">;

export const DECK_CODES = {
  MAIN: "MAIN",
  LOWER_FWD: "LOWER_FWD",
  LOWER_AFT: "LOWER_AFT",
  BULK: "BULK",
} as const;

export type DeckCode = (typeof DECK_CODES)[keyof typeof DECK_CODES];

export type DeckConfigurationWithPositions = DeckConfiguration & {
  loadingPositions: LoadingPosition[];
};

// ============================================================================
// LOADING POSITIONS
// ============================================================================

/**
 * Individual cargo loading positions within a deck
 */
export type LoadingPosition = {
  id: string;
  deckId: string;
  positionCode: string;
  sequenceNumber: number;
  maxWeightKg: number;
  armStationCm: number;
  compatibleUldTypes: string[] | null;
  acceptsBulkCargo: boolean;
  floorAreaM2: number | null;
  maxHeightCm: number | null;
  contourCode: string | null;
  xOffset: number | null;
  yOffset: number | null;
  colIndex: number | null;
  rowIndex: number | null;
  createdAt: Date;
};

export type NewLoadingPosition = Omit<LoadingPosition, "id" | "createdAt">;

/**
 * Position with calculated load information
 */
export type LoadingPositionWithLoad = LoadingPosition & {
  currentLoad?: {
    uldNumber: string | null;
    grossWeightKg: number;
    utilization: number;
  };
};

// ============================================================================
// ULD TYPES
// ============================================================================

/**
 * Unit Load Device type specifications
 * Defines dimensions, weight limits, and compatibility
 */
export type UldType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: UldCategory;
  contour: UldContour | null;
  maxGrossWeightKg: number;
  tareWeightKg: number;
  maxVolumeM3: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  internalLengthCm: number | null;
  internalWidthCm: number | null;
  internalHeightCm: number | null;
  doorWidthCm: number | null;
  doorHeightCm: number | null;
  colSpan: 1 | 2;
  isRefrigerated: boolean;
  deckCompatibility: DeckCode[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewUldType = Omit<UldType, "id" | "createdAt" | "updatedAt">;

export const ULD_CATEGORIES = {
  CONTAINER: "CONTAINER",
  PALLET: "PALLET",
} as const;

export type UldCategory = (typeof ULD_CATEGORIES)[keyof typeof ULD_CATEGORIES];

export const ULD_CONTOURS = {
  HALF_WIDTH: "HALF_WIDTH",
  FULL_WIDTH: "FULL_WIDTH",
  CONTOURED: "CONTOURED",
} as const;

export type UldContour = (typeof ULD_CONTOURS)[keyof typeof ULD_CONTOURS];

/**
 * Common ULD type codes
 */
export const COMMON_ULD_CODES = {
  AKE: "AKE", // LD-3 Container
  AKC: "AKC", // LD-1 Container
  DPE: "DPE", // LD-2 Container
  PMC: "PMC", // P6P Pallet (96" x 125")
  PAG: "PAG", // 16ft Pallet
  RKN: "RKN", // Refrigerated LD-3
  RAP: "RAP", // Refrigerated LD-9
} as const;

/**
 * ULD type with internal dimensions for packing
 */
export type UldTypeForPacking = Pick<
  UldType,
  | "id"
  | "code"
  | "maxGrossWeightKg"
  | "tareWeightKg"
  | "maxVolumeM3"
  | "internalLengthCm"
  | "internalWidthCm"
  | "internalHeightCm"
  | "isRefrigerated"
>;

// ============================================================================
// PHYSICAL ULDs
// ============================================================================

/**
 * Physical ULD instance tracking
 */
export type Uld = {
  id: string;
  uldNumber: string;
  uldTypeId: string;
  locationId: string | null;
  ownerCode: string | null;
  status: UldStatus;
  lastInspectionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewUld = Omit<Uld, "id" | "createdAt" | "updatedAt">;

export const ULD_STATUSES = {
  AVAILABLE: "AVAILABLE",
  IN_USE: "IN_USE",
  MAINTENANCE: "MAINTENANCE",
  DAMAGED: "DAMAGED",
} as const;

export type UldStatus = (typeof ULD_STATUSES)[keyof typeof ULD_STATUSES];

export type UldWithType = Uld & {
  uldType: UldType;
};

export type UldWithLocation = Uld & {
  location: Location | null;
};

// ============================================================================
// FLIGHTS
// ============================================================================

/**
 * Flight schedule data
 */
export type Flight = {
  id: string;
  flightNumber: string;
  aircraftId: string;
  originId: string;
  destinationId: string;
  scheduledDeparture: Date;
  scheduledArrival: Date;
  actualDeparture: Date | null;
  actualArrival: Date | null;
  status: FlightStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type NewFlight = Omit<Flight, "id" | "createdAt" | "updatedAt">;

export const FLIGHT_STATUSES = {
  SCHEDULED: "SCHEDULED",
  BOARDING: "BOARDING",
  DEPARTED: "DEPARTED",
  ARRIVED: "ARRIVED",
  CANCELLED: "CANCELLED",
} as const;

export type FlightStatus = (typeof FLIGHT_STATUSES)[keyof typeof FLIGHT_STATUSES];

export type FlightWithDetails = Flight & {
  aircraft: Aircraft;
  origin: Location;
  destination: Location;
};

export type FlightSummary = Pick<
  Flight,
  "id" | "flightNumber" | "scheduledDeparture" | "status"
> & {
  originCode: string;
  destinationCode: string;
  aircraftType: string;
};

// ============================================================================
// FORWARD DECLARATIONS (from other features)
// ============================================================================

// From weight-balance feature
type CgEnvelope = {
  id: string;
  aircraftId: string;
  envelopeType: string;
};

type FuelConfiguration = {
  id: string;
  aircraftId: string;
  maxFuelCapacityKg: number;
};

type WeightConstraint = {
  id: string;
  aircraftId: string;
  name: string;
};

type LoadingZone = {
  id: string;
  aircraftId: string;
  zoneCode: string;
};

// From reference-data feature
type Location = {
  id: string;
  airportCode: string;
  city: string;
};

