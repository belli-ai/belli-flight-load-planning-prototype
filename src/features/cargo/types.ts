/**
 * Cargo Feature - Type Definitions
 *
 * Air waybills, parcel groups, and individual cargo items
 * for shipment tracking and optimization.
 */

// ============================================================================
// AIR WAYBILLS
// ============================================================================

/**
 * Air Waybill header information
 * Master record for a shipment containing multiple parcel groups
 */
export type AirWaybill = {
  id: string;
  awbNumber: string;
  originId: string;
  destinationId: string;
  shipperName: string | null;
  shipperAddress: string | null;
  consigneeName: string | null;
  consigneeAddress: string | null;
  totalPieces: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  chargeableWeightKg: number | null;
  natureOfGoods: string | null;
  specialHandlingCodes: string[] | null;
  bookingReference: string | null;
  status: AwbStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type NewAirWaybill = Omit<AirWaybill, "id" | "createdAt" | "updatedAt">;

export const AWB_STATUSES = {
  BOOKED: "BOOKED",
  RECEIVED: "RECEIVED",
  LOADED: "LOADED",
  DELIVERED: "DELIVERED",
} as const;

export type AwbStatus = (typeof AWB_STATUSES)[keyof typeof AWB_STATUSES];

export type AirWaybillWithLocations = AirWaybill & {
  origin: Location;
  destination: Location;
};

export type AirWaybillWithGroups = AirWaybill & {
  parcelGroups: ParcelGroup[];
};

export type AirWaybillSummary = Pick<
  AirWaybill,
  "id" | "awbNumber" | "totalPieces" | "totalWeightKg" | "totalVolumeM3" | "status"
> & {
  originCode: string;
  destinationCode: string;
  hasDangerousGoods: boolean;
};

// ============================================================================
// PARCEL GROUPS
// ============================================================================

/**
 * Cargo piece groups within an AWB
 * Represents identical pieces with same dimensions and properties
 */
export type ParcelGroup = {
  id: string;
  awbId: string;
  commodityCodeId: string | null;
  groupNumber: number;
  pieces: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeM3: number | null;
  isStackable: boolean;
  maxStackWeightKg: number | null;
  isTiltable: boolean;
  tempZoneId: string | null;
  specialHandlingCodes: string[] | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewParcelGroup = Omit<ParcelGroup, "id" | "createdAt" | "updatedAt">;

export type ParcelGroupWithCommodity = ParcelGroup & {
  commodityCode: CommodityCode | null;
  tempZone: TemperatureZone | null;
};

/**
 * Parcel group dimensions for packing calculations
 */
export type ParcelDimensions = Pick<
  ParcelGroup,
  "lengthCm" | "widthCm" | "heightCm" | "volumeM3"
>;

// ============================================================================
// CARGO ITEMS
// ============================================================================

/**
 * Individual cargo items for optimization
 * Represents a single piece that can be packed into a ULD
 */
export type CargoItem = {
  id: string;
  parcelGroupId: string | null;
  awbId: string;
  pieceNumber: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeM3: number | null;
  isStackable: boolean;
  maxStackWeightKg: number | null;
  isTiltable: boolean;
  isDangerousGoods: boolean;
  dgClassId: string | null;
  tempZoneId: string | null;
  isLiveAnimal: boolean;
  isFoodstuff: boolean;
  specialHandlingCodes: string[] | null;
  priority: CargoPriority;
  destinationId: string | null;
  loadStatus: CargoLoadStatus;
  assignedUldId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewCargoItem = Omit<CargoItem, "id" | "createdAt" | "updatedAt">;

export const CARGO_PRIORITIES = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  STANDARD: "STANDARD",
} as const;

export type CargoPriority = (typeof CARGO_PRIORITIES)[keyof typeof CARGO_PRIORITIES];

export const CARGO_LOAD_STATUSES = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  LOADED: "LOADED",
  OFFLOADED: "OFFLOADED",
} as const;

export type CargoLoadStatus = (typeof CARGO_LOAD_STATUSES)[keyof typeof CARGO_LOAD_STATUSES];

/**
 * Cargo item with all related data for display
 */
export type CargoItemWithDetails = CargoItem & {
  awb: AirWaybill;
  parcelGroup: ParcelGroup | null;
  dgClass: DangerousGoodsClass | null;
  tempZone: TemperatureZone | null;
  destination: Location | null;
};

/**
 * Cargo item for packing algorithm
 * Lightweight type with only fields needed for optimization
 */
export type CargoItemForPacking = {
  id: string;
  awbId: string;
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
  priority: CargoPriority;
};

/**
 * Cargo item display for lists and tables
 */
export type CargoItemDisplay = Pick<
  CargoItem,
  | "id"
  | "pieceNumber"
  | "weightKg"
  | "lengthCm"
  | "widthCm"
  | "heightCm"
  | "isDangerousGoods"
  | "priority"
  | "loadStatus"
> & {
  awbNumber: string;
  description: string | null;
  specialHandling: string[];
  /** DG class code if dangerous goods */
  dgClassCode?: string | null;
  /** Whether the cargo item can be stacked */
  isStackable?: boolean;
};

// ============================================================================
// SPECIAL HANDLING CODES
// ============================================================================

/**
 * Common IATA Special Handling Codes (SHC)
 */
export const SPECIAL_HANDLING_CODES = {
  // Dangerous Goods
  DGR: "DGR", // Dangerous goods
  RRE: "RRE", // Dangerous goods - excepted quantity
  RRW: "RRW", // Dangerous goods - radioactive White-I
  RRY: "RRY", // Dangerous goods - radioactive Yellow-II/III
  ICE: "ICE", // Dry ice
  CAO: "CAO", // Cargo aircraft only

  // Temperature Control
  COL: "COL", // Cool (+2 to +8°C)
  FRO: "FRO", // Frozen (<-18°C)
  EAT: "EAT", // Foodstuffs
  PEP: "PEP", // Pharmaceuticals - temperature controlled

  // Live Animals
  AVI: "AVI", // Live animals
  LIC: "LIC", // Live insects

  // Perishables
  PER: "PER", // Perishable cargo
  PEA: "PEA", // Perishable - pharmaceuticals
  PES: "PES", // Perishable - meat/seafood

  // Valuable
  VAL: "VAL", // Valuable cargo
  VUN: "VUN", // Vulnerable cargo

  // Heavy/Oversize
  HEA: "HEA", // Heavy cargo (>150kg per piece)
  OHG: "OHG", // Overhanging cargo
  BIG: "BIG", // Big/oversized cargo

  // Other
  HUM: "HUM", // Human remains
  DIP: "DIP", // Diplomatic cargo
  GOV: "GOV", // Government cargo
  AOG: "AOG", // Aircraft on ground (urgent)
} as const;

export type SpecialHandlingCode =
  (typeof SPECIAL_HANDLING_CODES)[keyof typeof SPECIAL_HANDLING_CODES];

// ============================================================================
// CARGO INPUT/FORMS
// ============================================================================

/**
 * Input type for creating cargo from AWB data
 */
export type CargoInput = {
  awbNumber: string;
  originCode: string;
  destinationCode: string;
  shipperName?: string;
  consigneeName?: string;
  natureOfGoods?: string;
  groups: ParcelGroupInput[];
};

export type ParcelGroupInput = {
  pieces: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  commodityCode?: string;
  isStackable?: boolean;
  tempZoneCode?: string;
  specialHandlingCodes?: string[];
  description?: string;
};

/**
 * Bulk cargo input for quick entry
 */
export type BulkCargoInput = {
  awbNumber: string;
  pieces: number;
  totalWeightKg: number;
  dimensions: ParcelDimensions;
  isDangerousGoods: boolean;
  dgClassCode?: string;
  tempZoneCode?: string;
  priority: CargoPriority;
};

// ============================================================================
// CARGO STATISTICS
// ============================================================================

/**
 * Cargo statistics for a load plan
 */
export type CargoStats = {
  totalPieces: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  assignedPieces: number;
  unassignedPieces: number;
  dangerousGoodsCount: number;
  tempControlledCount: number;
  highPriorityCount: number;
};

// ============================================================================
// FORWARD DECLARATIONS (from other features)
// ============================================================================

// From reference-data feature
type Location = {
  id: string;
  airportCode: string;
  city: string;
};

type CommodityCode = {
  id: string;
  code: string;
  description: string;
  isDangerousGoods: boolean;
};

type DangerousGoodsClass = {
  id: string;
  classCode: string;
  name: string;
};

type TemperatureZone = {
  id: string;
  code: string;
  name: string;
};

