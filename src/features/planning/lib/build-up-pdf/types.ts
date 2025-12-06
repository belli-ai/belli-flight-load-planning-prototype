/**
 * Build-Up PDF - Type Definitions
 *
 * Input data types for generating ULD Build-Up Instructions PDF
 * Based on BUILD_UP_PLAN_PDF_SPEC.md
 */

// ============================================================================
// BUILD-UP PDF INPUT
// ============================================================================

/**
 * Complete input data for generating a Build-Up Instructions PDF
 */
export type BuildUpPdfInput = {
  // Flight context
  flightNumber: string;
  flightDate: Date;
  origin: string;
  destination: string;
  aircraftRegistration?: string;
  aircraftType?: string;

  // ULD context
  uldAssignment: {
    uldTypeCode: string;
    uldNumber: string;
    positionCode: string | null;
    tareWeightKg: number;
    maxGrossWeightKg: number;
    dimensions: {
      lengthCm: number;
      widthCm: number;
      heightCm: number;
    };
  };

  // Packed items with coordinates
  packedItems: PackedItemData[];

  // Summary statistics
  totalWeightKg: number;
  volumeUtilization: number;
  weightUtilization: number;

  // Build-up instructions (optional, from LLM)
  instructions?: BuildUpInstructionData;
};

// ============================================================================
// PACKED ITEM DATA
// ============================================================================

/**
 * Packed item data for PDF rendering
 */
export type PackedItemData = {
  cargoItemId: string;
  awbNumber: string;
  pieceId: string;
  sequenceNumber: number;

  // Physical properties
  weightKg: number;
  originalDimensions: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  packedDimensions: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };

  // Position in ULD (origin at bottom-front-left corner)
  position: {
    xCm: number; // Along length (front to back)
    yCm: number; // Along width (left to right)
    zCm: number; // Along height (bottom to top)
  };

  // Rotation applied
  rotationApplied: RotationType;

  // Special handling
  specialHandlingCodes: string[];
  isDangerousGoods: boolean;
  isPerishable: boolean;
  isFragile: boolean;
  isValuable: boolean;
  isTemperatureControlled: boolean;
  orientationRestricted: boolean;
  priority: number;

  // Display color (based on cargo type)
  color: string;
};

export type RotationType =
  | "NONE"
  | "Z_90"
  | "Z_180"
  | "Z_270"
  | "XY_SWAP"
  | "X_90"
  | "Y_90";

// ============================================================================
// BUILD-UP INSTRUCTIONS
// ============================================================================

/**
 * Build-up instructions for PDF rendering
 */
export type BuildUpInstructionData = {
  steps: BuildUpStepData[];
  notes: string[];
  estimatedBuildTimeMinutes: number;
};

export type BuildUpStepData = {
  sequence: number;
  action: string;
  cargoDescription: string;
  awbNumber: string;
  weightKg: number;
  placement: string;
  warnings?: string[];
};

// ============================================================================
// COLOR CODING
// ============================================================================

/**
 * Color coding scheme for cargo types (from spec)
 */
export const CARGO_COLORS = {
  GENERAL: "#93C5FD", // Light Blue
  PRIORITY: "#FDBA74", // Orange
  DANGEROUS_GOODS: "#FCA5A5", // Red
  PERISHABLE: "#86EFAC", // Green
  VALUABLE: "#D8B4FE", // Purple
  TEMPERATURE_CONTROLLED: "#67E8F9", // Cyan
} as const;

/**
 * Get color for a cargo item based on its properties
 */
export function getCargoColor(item: {
  isDangerousGoods?: boolean;
  isPerishable?: boolean;
  isValuable?: boolean;
  isTemperatureControlled?: boolean;
  priority?: number;
}): string {
  if (item.isDangerousGoods) return CARGO_COLORS.DANGEROUS_GOODS;
  if (item.isTemperatureControlled) return CARGO_COLORS.TEMPERATURE_CONTROLLED;
  if (item.isPerishable) return CARGO_COLORS.PERISHABLE;
  if (item.isValuable) return CARGO_COLORS.VALUABLE;
  if (item.priority && item.priority >= 80) return CARGO_COLORS.PRIORITY;
  return CARGO_COLORS.GENERAL;
}

// ============================================================================
// NOTE CATEGORIES
// ============================================================================

/**
 * Note category icons and triggers
 */
export const NOTE_CATEGORIES = {
  LOADING_SEQUENCE: { icon: "⚠", trigger: "always" },
  HEAVY_CARGO: { icon: "⚡", trigger: "weight > 100kg" },
  FRAGILE: { icon: "⚠", trigger: "SHC contains FRA" },
  PERISHABLE: { icon: "❄", trigger: "SHC contains PER" },
  DANGEROUS_GOODS: { icon: "☢", trigger: "isDangerousGoods" },
  TEMPERATURE: { icon: "🌡", trigger: "temperatureControlled" },
  ORIENTATION: { icon: "↑", trigger: "orientationRestricted" },
} as const;
