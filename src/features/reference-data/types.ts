/**
 * Reference Data Feature - Type Definitions
 *
 * Static lookup data for airports, commodity codes, dangerous goods classes,
 * segregation rules, and temperature zones.
 */

// ============================================================================
// LOCATIONS
// ============================================================================

/**
 * Airport and location master data
 */
export type Location = {
  id: string;
  airportCode: string;
  city: string;
  country: string;
  countryCode: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NewLocation = Omit<Location, "id" | "createdAt" | "updatedAt">;

export type LocationWithFlights = Location & {
  originFlights?: Flight[];
  destinationFlights?: Flight[];
};

// ============================================================================
// COMMODITY CODES
// ============================================================================

/**
 * IATA commodity classification codes
 */
export type CommodityCode = {
  id: string;
  code: string;
  description: string;
  isDangerousGoods: boolean;
  dangerousGoodsCodes: string[] | null;
  specialHandlingCodes: string[] | null;
  requiresTempControl: boolean;
  isLiveAnimal: boolean;
  isFoodstuff: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type NewCommodityCode = Omit<CommodityCode, "id" | "createdAt" | "updatedAt">;

// ============================================================================
// DANGEROUS GOODS CLASSES
// ============================================================================

/**
 * IATA Dangerous Goods Regulations class definitions
 * Based on IATA DGR classifications (Classes 1-9)
 */
export type DangerousGoodsClass = {
  id: string;
  classCode: string;
  division: string | null;
  name: string;
  description: string | null;
  isExemptFromSegregation: boolean;
  createdAt: Date;
};

export type NewDangerousGoodsClass = Omit<DangerousGoodsClass, "id" | "createdAt">;

/**
 * Standard DG class codes for reference
 */
export const DG_CLASS_CODES = {
  EXPLOSIVES_MASS: "1.1",
  EXPLOSIVES_PROJECTION: "1.2",
  EXPLOSIVES_FIRE: "1.3",
  EXPLOSIVES_MINOR: "1.4",
  EXPLOSIVES_INSENSITIVE: "1.5",
  EXPLOSIVES_EXTREMELY_INSENSITIVE: "1.6",
  GASES_FLAMMABLE: "2.1",
  GASES_NON_FLAMMABLE: "2.2",
  GASES_TOXIC: "2.3",
  FLAMMABLE_LIQUIDS: "3",
  FLAMMABLE_SOLIDS: "4.1",
  SPONTANEOUSLY_COMBUSTIBLE: "4.2",
  DANGEROUS_WHEN_WET: "4.3",
  OXIDIZERS: "5.1",
  ORGANIC_PEROXIDES: "5.2",
  TOXIC_SUBSTANCES: "6.1",
  INFECTIOUS_SUBSTANCES: "6.2",
  RADIOACTIVE: "7",
  CORROSIVES: "8",
  MISCELLANEOUS: "9",
} as const;

export type DgClassCode = (typeof DG_CLASS_CODES)[keyof typeof DG_CLASS_CODES];

// ============================================================================
// DG SEGREGATION RULES
// ============================================================================

/**
 * IATA Table 9.3.A - Segregation of packages matrix
 * Defines which DG classes cannot be stored together in the same ULD
 */
export type DgSegregationRule = {
  id: string;
  classAId: string;
  classBId: string;
  isSegregated: boolean;
  segregationType: SegregationType | null;
  notes: string | null;
  createdAt: Date;
};

export type NewDgSegregationRule = Omit<DgSegregationRule, "id" | "createdAt">;

export type SegregationType = "PROHIBITED" | "SEPARATED" | "ALLOWED";

export type DgSegregationRuleWithClasses = DgSegregationRule & {
  classA: DangerousGoodsClass;
  classB: DangerousGoodsClass;
};

// ============================================================================
// TEMPERATURE ZONES
// ============================================================================

/**
 * Temperature zone definitions for cargo compatibility
 */
export type TemperatureZone = {
  id: string;
  code: TempZoneCode;
  name: string;
  minTempCelsius: number | null;
  maxTempCelsius: number | null;
  description: string | null;
  createdAt: Date;
};

export type NewTemperatureZone = Omit<TemperatureZone, "id" | "createdAt">;

/**
 * Standard temperature zone codes
 */
export const TEMP_ZONE_CODES = {
  DEEP_FROZEN: "DEEP_FROZEN",
  FROZEN: "FROZEN",
  CHILLED: "CHILLED",
  COOL: "COOL",
  AMBIENT: "AMBIENT",
  CONTROLLED_ROOM: "CONTROLLED_ROOM",
} as const;

export type TempZoneCode = (typeof TEMP_ZONE_CODES)[keyof typeof TEMP_ZONE_CODES];

/**
 * Temperature zone ranges for reference
 */
export const TEMP_ZONE_RANGES: Record<TempZoneCode, { min: number | null; max: number | null }> = {
  DEEP_FROZEN: { min: null, max: -18 },
  FROZEN: { min: -18, max: -12 },
  CHILLED: { min: 2, max: 8 },
  COOL: { min: 8, max: 15 },
  AMBIENT: { min: 15, max: 25 },
  CONTROLLED_ROOM: { min: 15, max: 25 },
};

// ============================================================================
// COMPATIBILITY HELPERS
// ============================================================================

/**
 * Cargo compatibility classification for ULD build-up
 */
export type CargoCompatibilityClass =
  | "GENERAL"
  | "DG_CLASS_1"
  | "DG_CLASS_2"
  | "DG_CLASS_3"
  | "DG_CLASS_4"
  | "DG_CLASS_5"
  | "DG_CLASS_6"
  | "DG_CLASS_7"
  | "DG_CLASS_8"
  | "DG_CLASS_9"
  | "TEMP_FROZEN"
  | "TEMP_CHILLED"
  | "TEMP_AMBIENT"
  | "LIVE_ANIMAL"
  | "FOODSTUFF";

/**
 * Incompatible cargo pairs based on IATA regulations
 */
export type IncompatiblePair = {
  classA: CargoCompatibilityClass;
  classB: CargoCompatibilityClass;
  reason: string;
};

// Forward declaration for cross-feature reference
type Flight = {
  id: string;
  flightNumber: string;
};

