/**
 * Mock Data for ULD Build-Up Feature
 *
 * Realistic sample data matching the schema structure
 * for development and demo purposes.
 */

import type { FlightWithDetails, FlightSummary } from "@/features/aircraft";
import type {
  CargoItemForPacking,
  CargoItemDisplay,
  AirWaybillSummary,
} from "@/features/cargo";
import type {
  UldAssignmentForVisualization,
  PackedItemForVisualization,
  PackingRule,
  OptimizationResult,
  BuildUpInstruction,
} from "../types";

// ============================================================================
// MOCK FLIGHTS
// ============================================================================

export const MOCK_FLIGHTS: FlightSummary[] = [
  {
    id: "flight-001",
    flightNumber: "GA-801",
    scheduledDeparture: new Date("2024-12-07T08:30:00"),
    status: "SCHEDULED",
    originCode: "CGK",
    destinationCode: "SIN",
    aircraftType: "A321-200PCF",
  },
  {
    id: "flight-002",
    flightNumber: "GA-802",
    scheduledDeparture: new Date("2024-12-07T14:00:00"),
    status: "SCHEDULED",
    originCode: "CGK",
    destinationCode: "HKG",
    aircraftType: "A321-200PCF",
  },
  {
    id: "flight-003",
    flightNumber: "GA-803",
    scheduledDeparture: new Date("2024-12-07T19:45:00"),
    status: "SCHEDULED",
    originCode: "CGK",
    destinationCode: "NRT",
    aircraftType: "A321-200PCF",
  },
  {
    id: "flight-004",
    flightNumber: "GA-804",
    scheduledDeparture: new Date("2024-12-08T06:00:00"),
    status: "SCHEDULED",
    originCode: "SIN",
    destinationCode: "CGK",
    aircraftType: "A321-200PCF",
  },
];

// ============================================================================
// MOCK AWBs
// ============================================================================

export const MOCK_AWBS: AirWaybillSummary[] = [
  {
    id: "awb-001",
    awbNumber: "126-12345678",
    totalPieces: 8,
    totalWeightKg: 1250,
    totalVolumeM3: 4.2,
    status: "RECEIVED",
    originCode: "CGK",
    destinationCode: "SIN",
    hasDangerousGoods: false,
  },
  {
    id: "awb-002",
    awbNumber: "126-23456789",
    totalPieces: 4,
    totalWeightKg: 680,
    totalVolumeM3: 2.8,
    status: "RECEIVED",
    originCode: "CGK",
    destinationCode: "SIN",
    hasDangerousGoods: true,
  },
  {
    id: "awb-003",
    awbNumber: "126-34567890",
    totalPieces: 12,
    totalWeightKg: 1850,
    totalVolumeM3: 6.5,
    status: "RECEIVED",
    originCode: "CGK",
    destinationCode: "SIN",
    hasDangerousGoods: false,
  },
  {
    id: "awb-004",
    awbNumber: "126-45678901",
    totalPieces: 6,
    totalWeightKg: 420,
    totalVolumeM3: 1.8,
    status: "RECEIVED",
    originCode: "CGK",
    destinationCode: "SIN",
    hasDangerousGoods: false,
  },
  {
    id: "awb-005",
    awbNumber: "126-56789012",
    totalPieces: 3,
    totalWeightKg: 890,
    totalVolumeM3: 3.2,
    status: "RECEIVED",
    originCode: "CGK",
    destinationCode: "SIN",
    hasDangerousGoods: false,
  },
];

// ============================================================================
// MOCK CARGO ITEMS
// ============================================================================

export const MOCK_CARGO_ITEMS: CargoItemDisplay[] = [
  // AWB 001 - Electronics
  {
    id: "cargo-001",
    awbId: "awb-001",
    awbNumber: "126-12345678",
    pieceNumber: 1,
    weightKg: 180,
    lengthCm: 120,
    widthCm: 80,
    heightCm: 60,
    isDangerousGoods: false,
    priority: "HIGH",
    loadStatus: "PENDING",
    description: "Electronic Components",
    specialHandling: ["HEA"],
  },
  {
    id: "cargo-002",
    awbId: "awb-001",
    awbNumber: "126-12345678",
    pieceNumber: 2,
    weightKg: 165,
    lengthCm: 100,
    widthCm: 80,
    heightCm: 55,
    isDangerousGoods: false,
    priority: "HIGH",
    loadStatus: "PENDING",
    description: "Electronic Components",
    specialHandling: [],
  },
  {
    id: "cargo-003",
    awbId: "awb-001",
    awbNumber: "126-12345678",
    pieceNumber: 3,
    weightKg: 145,
    lengthCm: 90,
    widthCm: 70,
    heightCm: 50,
    isDangerousGoods: false,
    priority: "HIGH",
    loadStatus: "PENDING",
    description: "Electronic Components",
    specialHandling: [],
  },
  // AWB 002 - DG Batteries
  {
    id: "cargo-004",
    awbId: "awb-002",
    awbNumber: "126-23456789",
    pieceNumber: 1,
    weightKg: 220,
    lengthCm: 80,
    widthCm: 60,
    heightCm: 50,
    isDangerousGoods: true,
    priority: "MEDIUM",
    loadStatus: "PENDING",
    description: "Lithium Batteries",
    specialHandling: ["DGR", "CAO"],
  },
  {
    id: "cargo-005",
    awbId: "awb-002",
    awbNumber: "126-23456789",
    pieceNumber: 2,
    weightKg: 195,
    lengthCm: 80,
    widthCm: 60,
    heightCm: 45,
    isDangerousGoods: true,
    priority: "MEDIUM",
    loadStatus: "PENDING",
    description: "Lithium Batteries",
    specialHandling: ["DGR", "CAO"],
  },
  // AWB 003 - General Cargo
  {
    id: "cargo-006",
    awbId: "awb-003",
    awbNumber: "126-34567890",
    pieceNumber: 1,
    weightKg: 210,
    lengthCm: 110,
    widthCm: 85,
    heightCm: 70,
    isDangerousGoods: false,
    priority: "STANDARD",
    loadStatus: "PENDING",
    description: "Textile Goods",
    specialHandling: [],
  },
  {
    id: "cargo-007",
    awbId: "awb-003",
    awbNumber: "126-34567890",
    pieceNumber: 2,
    weightKg: 185,
    lengthCm: 100,
    widthCm: 80,
    heightCm: 65,
    isDangerousGoods: false,
    priority: "STANDARD",
    loadStatus: "PENDING",
    description: "Textile Goods",
    specialHandling: [],
  },
  {
    id: "cargo-008",
    awbId: "awb-003",
    awbNumber: "126-34567890",
    pieceNumber: 3,
    weightKg: 175,
    lengthCm: 95,
    widthCm: 75,
    heightCm: 60,
    isDangerousGoods: false,
    priority: "STANDARD",
    loadStatus: "PENDING",
    description: "Textile Goods",
    specialHandling: [],
  },
  // AWB 004 - Perishables
  {
    id: "cargo-009",
    awbId: "awb-004",
    awbNumber: "126-45678901",
    pieceNumber: 1,
    weightKg: 85,
    lengthCm: 60,
    widthCm: 50,
    heightCm: 40,
    isDangerousGoods: false,
    priority: "HIGH",
    loadStatus: "PENDING",
    description: "Frozen Seafood",
    specialHandling: ["PER", "COL"],
  },
  {
    id: "cargo-010",
    awbId: "awb-004",
    awbNumber: "126-45678901",
    pieceNumber: 2,
    weightKg: 78,
    lengthCm: 60,
    widthCm: 50,
    heightCm: 40,
    isDangerousGoods: false,
    priority: "HIGH",
    loadStatus: "PENDING",
    description: "Frozen Seafood",
    specialHandling: ["PER", "COL"],
  },
  // AWB 005 - Machinery Parts
  {
    id: "cargo-011",
    awbId: "awb-005",
    awbNumber: "126-56789012",
    pieceNumber: 1,
    weightKg: 320,
    lengthCm: 140,
    widthCm: 100,
    heightCm: 80,
    isDangerousGoods: false,
    priority: "LOW",
    loadStatus: "PENDING",
    description: "Heavy Machinery Parts",
    specialHandling: ["HEA"],
  },
  {
    id: "cargo-012",
    awbId: "awb-005",
    awbNumber: "126-56789012",
    pieceNumber: 2,
    weightKg: 285,
    lengthCm: 130,
    widthCm: 90,
    heightCm: 75,
    isDangerousGoods: false,
    priority: "LOW",
    loadStatus: "PENDING",
    description: "Heavy Machinery Parts",
    specialHandling: ["HEA"],
  },
];

// Cargo items formatted for packing algorithm
export const MOCK_CARGO_FOR_PACKING: CargoItemForPacking[] = MOCK_CARGO_ITEMS.map(
  (item) => ({
    id: item.id,
    awbId: item.awbId,
    pieceNumber: item.pieceNumber,
    weightKg: item.weightKg,
    lengthCm: item.lengthCm,
    widthCm: item.widthCm,
    heightCm: item.heightCm,
    volumeM3: (item.lengthCm * item.widthCm * item.heightCm) / 1000000,
    isStackable: !item.specialHandling.includes("HEA"),
    maxStackWeightKg: item.specialHandling.includes("HEA") ? 0 : 100,
    isTiltable: true,
    isDangerousGoods: item.isDangerousGoods,
    dgClassCode: item.isDangerousGoods ? "9" : null,
    tempZoneCode: item.specialHandling.includes("COL") ? "COL" : null,
    isLiveAnimal: false,
    isFoodstuff: item.specialHandling.includes("PER"),
    priority: item.priority,
  })
);

// ============================================================================
// MOCK ULD TYPES
// ============================================================================

export const MOCK_ULD_TYPES = [
  {
    id: "uld-type-ake",
    code: "AKE",
    name: "LD-3 Container",
    category: "CONTAINER" as const,
    maxGrossWeightKg: 1588,
    tareWeightKg: 70,
    maxVolumeM3: 4.3,
    internalLengthCm: 156,
    internalWidthCm: 153,
    internalHeightCm: 163,
    isRefrigerated: false,
  },
  {
    id: "uld-type-akc",
    code: "AKC",
    name: "LD-1 Container",
    category: "CONTAINER" as const,
    maxGrossWeightKg: 1134,
    tareWeightKg: 55,
    maxVolumeM3: 3.4,
    internalLengthCm: 156,
    internalWidthCm: 153,
    internalHeightCm: 114,
    isRefrigerated: false,
  },
  {
    id: "uld-type-pmc",
    code: "PMC",
    name: "P6P Pallet 96x125",
    category: "PALLET" as const,
    maxGrossWeightKg: 4500,
    tareWeightKg: 120,
    maxVolumeM3: 10.5,
    internalLengthCm: 318,
    internalWidthCm: 244,
    internalHeightCm: 163,
    isRefrigerated: false,
  },
  {
    id: "uld-type-rkn",
    code: "RKN",
    name: "Refrigerated LD-3",
    category: "CONTAINER" as const,
    maxGrossWeightKg: 1588,
    tareWeightKg: 180,
    maxVolumeM3: 3.8,
    internalLengthCm: 140,
    internalWidthCm: 145,
    internalHeightCm: 155,
    isRefrigerated: true,
  },
];

// ============================================================================
// MOCK PACKING RULES
// ============================================================================

export const MOCK_PACKING_RULES: PackingRule[] = [
  {
    id: "rule-001",
    ruleText: "Heavy items (>150kg) must be placed at the bottom of the ULD",
    ruleType: "CONSTRAINT",
    priority: 95,
    category: "WEIGHT_DISTRIBUTION",
    isActive: true,
    examples: [
      "A 200kg machinery part should be loaded first at floor level",
      "Stack lighter items on top of heavy base items",
    ],
    structuredRule: {
      type: "position",
      condition: "weight > 150",
      constraint: "z = 0",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-002",
    ruleText: "Dangerous goods must not be placed in the same ULD as foodstuffs",
    ruleType: "PROHIBITION",
    priority: 100,
    category: "DANGEROUS_GOODS",
    isActive: true,
    examples: [
      "Lithium batteries cannot share ULD with frozen seafood",
      "Chemical products must be separated from perishable food items",
    ],
    structuredRule: {
      type: "compatibility",
      condition: "isDangerousGoods",
      constraint: "not with isFoodstuff",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-003",
    ruleText: "Temperature-controlled items must be grouped in refrigerated ULDs",
    ruleType: "CONSTRAINT",
    priority: 98,
    category: "TEMPERATURE",
    isActive: true,
    examples: [
      "Frozen seafood requires RKN container",
      "Pharmaceutical products with cold chain requirements need refrigerated ULD",
    ],
    structuredRule: {
      type: "grouping",
      condition: "tempZoneCode != null",
      constraint: "use refrigerated ULD",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-004",
    ruleText: "High priority cargo should be loaded last for easy access at destination",
    ruleType: "PREFERENCE",
    priority: 70,
    category: "PRIORITY",
    isActive: true,
    examples: [
      "AOG parts should be near the ULD door",
      "Express shipments placed for quick unloading",
    ],
    structuredRule: {
      type: "position",
      condition: "priority == HIGH",
      constraint: "load last, near door",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-005",
    ruleText: "Non-stackable items must have no cargo placed on top",
    ruleType: "CONSTRAINT",
    priority: 90,
    category: "STACKING",
    isActive: true,
    examples: [
      "Fragile electronics with 'no stack' label",
      "Items exceeding stack weight limit",
    ],
    structuredRule: {
      type: "stacking",
      condition: "isStackable == false",
      constraint: "nothing on top",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ============================================================================
// MOCK OPTIMIZATION RESULT
// ============================================================================

export const MOCK_OPTIMIZATION_RESULT: OptimizationResult = {
  status: "OPTIMAL",
  objectiveValue: 3,
  computationTimeMs: 1247,
  assignments: [
    {
      uldId: null,
      uldNumber: null,
      uldTypeId: "uld-type-ake",
      uldTypeCode: "AKE",
      positionCode: "11L",
      cargoItems: [
        {
          cargoItemId: "cargo-001",
          position: { x: 0, y: 0, z: 0 },
          dimensions: { length: 120, width: 80, height: 60 },
          rotated: false,
          rotationAxis: null,
        },
        {
          cargoItemId: "cargo-002",
          position: { x: 0, y: 0, z: 60 },
          dimensions: { length: 100, width: 80, height: 55 },
          rotated: false,
          rotationAxis: null,
        },
        {
          cargoItemId: "cargo-003",
          position: { x: 0, y: 80, z: 0 },
          dimensions: { length: 90, width: 70, height: 50 },
          rotated: false,
          rotationAxis: null,
        },
      ],
      totalWeightKg: 560,
      volumeUsedM3: 1.52,
      volumeUtilization: 0.78,
      weightUtilization: 0.37,
      uldDimensions: { lengthCm: 147, widthCm: 145, heightCm: 155 },
      maxGrossWeightKg: 1588,
    },
    {
      uldId: null,
      uldNumber: null,
      uldTypeId: "uld-type-ake",
      uldTypeCode: "AKE",
      positionCode: "12L",
      cargoItems: [
        {
          cargoItemId: "cargo-004",
          position: { x: 0, y: 0, z: 0 },
          dimensions: { length: 80, width: 60, height: 50 },
          rotated: false,
          rotationAxis: null,
        },
        {
          cargoItemId: "cargo-005",
          position: { x: 80, y: 0, z: 0 },
          dimensions: { length: 80, width: 60, height: 45 },
          rotated: false,
          rotationAxis: null,
        },
      ],
      totalWeightKg: 485,
      volumeUsedM3: 0.46,
      volumeUtilization: 0.52,
      weightUtilization: 0.32,
      uldDimensions: { lengthCm: 147, widthCm: 145, heightCm: 155 },
      maxGrossWeightKg: 1588,
    },
    {
      uldId: null,
      uldNumber: null,
      uldTypeId: "uld-type-pmc",
      uldTypeCode: "PMC",
      positionCode: "21P",
      cargoItems: [
        {
          cargoItemId: "cargo-011",
          position: { x: 0, y: 0, z: 0 },
          dimensions: { length: 140, width: 100, height: 80 },
          rotated: false,
          rotationAxis: null,
        },
        {
          cargoItemId: "cargo-012",
          position: { x: 140, y: 0, z: 0 },
          dimensions: { length: 130, width: 90, height: 75 },
          rotated: false,
          rotationAxis: null,
        },
        {
          cargoItemId: "cargo-006",
          position: { x: 0, y: 100, z: 0 },
          dimensions: { length: 110, width: 85, height: 70 },
          rotated: false,
          rotationAxis: null,
        },
        {
          cargoItemId: "cargo-007",
          position: { x: 110, y: 100, z: 0 },
          dimensions: { length: 100, width: 80, height: 65 },
          rotated: false,
          rotationAxis: null,
        },
        {
          cargoItemId: "cargo-008",
          position: { x: 0, y: 0, z: 80 },
          dimensions: { length: 95, width: 75, height: 60 },
          rotated: false,
          rotationAxis: null,
        },
      ],
      totalWeightKg: 1175,
      volumeUsedM3: 3.94,
      volumeUtilization: 0.85,
      weightUtilization: 0.27,
      uldDimensions: { lengthCm: 317.5, widthCm: 243.8, heightCm: 160 },
      maxGrossWeightKg: 4626,
    },
  ],
  unassignedCargoIds: [],
  stats: {
    uldsUsed: 3,
    totalCargoItems: 12,
    avgVolumeUtilization: 0.72,
    avgWeightUtilization: 0.32,
    totalCargoWeight: 2220,
    totalCargoVolume: 5.92,
    unassignedCount: 0,
    unassignedWeight: 0,
    unassignedVolume: 0,
  },
  warnings: [],
};

// ============================================================================
// MOCK BUILD-UP INSTRUCTIONS
// ============================================================================

export const MOCK_BUILD_UP_INSTRUCTIONS: BuildUpInstruction[] = [
  {
    uldNumber: "AKE-12345GA",
    uldTypeCode: "AKE",
    positionCode: "11L",
    steps: [
      {
        sequence: 1,
        action: "Place at floor level, left rear corner",
        cargoDescription: "Electronic Components Box 1",
        awbNumber: "126-12345678",
        weightKg: 180,
        placement: "Base layer, position (0,0,0)",
        warnings: ["Heavy item - use mechanical handling"],
      },
      {
        sequence: 2,
        action: "Place adjacent to first item",
        cargoDescription: "Electronic Components Box 3",
        awbNumber: "126-12345678",
        weightKg: 145,
        placement: "Base layer, position (0,80,0)",
      },
      {
        sequence: 3,
        action: "Stack on top of Box 1",
        cargoDescription: "Electronic Components Box 2",
        awbNumber: "126-12345678",
        weightKg: 165,
        placement: "Second layer, position (0,0,60)",
        warnings: ["Ensure stable stacking"],
      },
    ],
    notes: [
      "All items from same AWB - keep together",
      "Total weight: 490kg, well within ULD limit",
      "Volume utilization: 78%",
    ],
    totalWeightKg: 490,
    estimatedBuildTimeMinutes: 12,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getFlightById(id: string) {
  return MOCK_FLIGHTS.find((f) => f.id === id);
}

export function getCargoForFlight(flightId: string) {
  // In real app, filter by flight assignment
  return MOCK_CARGO_ITEMS;
}

export function getAwbsForFlight(flightId: string) {
  return MOCK_AWBS;
}

// Color palette for cargo visualization
export const CARGO_COLORS = [
  "#3d63da", // ANA Navy Blue
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f59e0b", // amber-500
  "#6366f1", // indigo-500
];

export function getColorForAwb(awbNumber: string): string {
  // Use a simple hash to consistently map AWB numbers to colors
  // This works for both mock and real database AWB numbers
  let hash = 0;
  for (let i = 0; i < awbNumber.length; i++) {
    const char = awbNumber.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % CARGO_COLORS.length;
  return CARGO_COLORS[index];
}

