import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  decimal,
  integer,
  boolean,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// REFERENCE DATA TABLES
// ============================================================================

/**
 * Airport and location master data
 */
export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    airportCode: varchar("airport_code", { length: 4 }).notNull().unique(),
    city: varchar("city", { length: 100 }).notNull(),
    country: varchar("country", { length: 100 }).notNull(),
    countryCode: varchar("country_code", { length: 3 }).notNull(),
    timezone: varchar("timezone", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_locations_country").on(table.countryCode)]
);

/**
 * IATA commodity classification codes
 */
export const commodityCodes = pgTable(
  "commodity_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 10 }).notNull().unique(),
    description: text("description").notNull(),
    isDangerousGoods: boolean("is_dangerous_goods").notNull().default(false),
    dangerousGoodsCodes: text("dangerous_goods_codes").array(),
    specialHandlingCodes: text("special_handling_codes").array(),
    requiresTempControl: boolean("requires_temp_control")
      .notNull()
      .default(false),
    isLiveAnimal: boolean("is_live_animal").notNull().default(false),
    isFoodstuff: boolean("is_foodstuff").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_commodity_dg").on(table.isDangerousGoods)]
);

/**
 * IATA Dangerous Goods Regulations class definitions
 */
export const dangerousGoodsClasses = pgTable("dangerous_goods_classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  classCode: varchar("class_code", { length: 10 }).notNull().unique(),
  division: varchar("division", { length: 10 }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isExemptFromSegregation: boolean("is_exempt_from_segregation")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * IATA Table 9.3.A - Segregation of packages matrix
 */
export const dgSegregationRules = pgTable(
  "dg_segregation_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classAId: uuid("class_a_id")
      .notNull()
      .references(() => dangerousGoodsClasses.id),
    classBId: uuid("class_b_id")
      .notNull()
      .references(() => dangerousGoodsClasses.id),
    isSegregated: boolean("is_segregated").notNull(),
    segregationType: varchar("segregation_type", { length: 20 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("dg_segregation_unique").on(table.classAId, table.classBId),
    index("idx_dg_segregation_class_a").on(table.classAId),
    index("idx_dg_segregation_class_b").on(table.classBId),
  ]
);

/**
 * Temperature zone definitions for cargo compatibility
 */
export const temperatureZones = pgTable("temperature_zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  minTempCelsius: decimal("min_temp_celsius", { precision: 5, scale: 2 }),
  maxTempCelsius: decimal("max_temp_celsius", { precision: 5, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// ULD & AIRCRAFT MASTER DATA
// ============================================================================

/**
 * Unit Load Device type specifications
 */
export const uldTypes = pgTable(
  "uld_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 10 }).notNull().unique(),
    name: varchar("name", { length: 50 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 20 }).notNull(), // CONTAINER, PALLET
    contour: varchar("contour", { length: 20 }), // HALF_WIDTH, FULL_WIDTH, CONTOURED
    maxGrossWeightKg: decimal("max_gross_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    tareWeightKg: decimal("tare_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    maxVolumeM3: decimal("max_volume_m3", {
      precision: 10,
      scale: 4,
    }).notNull(),
    lengthCm: decimal("length_cm", { precision: 10, scale: 2 }).notNull(),
    widthCm: decimal("width_cm", { precision: 10, scale: 2 }).notNull(),
    heightCm: decimal("height_cm", { precision: 10, scale: 2 }).notNull(),
    internalLengthCm: decimal("internal_length_cm", {
      precision: 10,
      scale: 2,
    }),
    internalWidthCm: decimal("internal_width_cm", { precision: 10, scale: 2 }),
    internalHeightCm: decimal("internal_height_cm", {
      precision: 10,
      scale: 2,
    }),
    doorWidthCm: decimal("door_width_cm", { precision: 10, scale: 2 }),
    doorHeightCm: decimal("door_height_cm", { precision: 10, scale: 2 }),
    colSpan: integer("col_span").notNull().default(1),
    isRefrigerated: boolean("is_refrigerated").notNull().default(false),
    deckCompatibility: text("deck_compatibility").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_uld_types_category").on(table.category)]
);

/**
 * Physical ULD instance tracking
 */
export const ulds = pgTable(
  "ulds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    uldNumber: varchar("uld_number", { length: 20 }).notNull().unique(),
    uldTypeId: uuid("uld_type_id")
      .notNull()
      .references(() => uldTypes.id),
    locationId: uuid("location_id").references(() => locations.id),
    ownerCode: varchar("owner_code", { length: 10 }),
    status: varchar("status", { length: 20 }).notNull().default("AVAILABLE"),
    lastInspectionDate: timestamp("last_inspection_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_ulds_type").on(table.uldTypeId),
    index("idx_ulds_location").on(table.locationId),
    index("idx_ulds_status").on(table.status),
  ]
);

/**
 * Aircraft configuration master data
 */
export const aircrafts = pgTable(
  "aircrafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    typeCode: varchar("type_code", { length: 10 }).notNull(),
    subtype: varchar("subtype", { length: 20 }),
    registration: varchar("registration", { length: 20 }).unique(),
    msn: varchar("msn", { length: 20 }),
    mainDeckMaxWeightKg: decimal("main_deck_max_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    mainDeckMaxVolumeM3: decimal("main_deck_max_volume_m3", {
      precision: 10,
      scale: 4,
    }),
    lowerDeckMaxWeightKg: decimal("lower_deck_max_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    lowerDeckMaxVolumeM3: decimal("lower_deck_max_volume_m3", {
      precision: 10,
      scale: 4,
    }),
    totalMaxPayloadKg: decimal("total_max_payload_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    totalMaxVolumeM3: decimal("total_max_volume_m3", {
      precision: 10,
      scale: 4,
    }),
    maxZeroFuelWeightKg: decimal("max_zero_fuel_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    maxTakeoffWeightKg: decimal("max_takeoff_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    maxLandingWeightKg: decimal("max_landing_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    maxTaxiWeightKg: decimal("max_taxi_weight_kg", { precision: 10, scale: 2 }),
    operatingEmptyWeightKg: decimal("operating_empty_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    datumLocation: varchar("datum_location", { length: 20 }).default("NOSE"),
    macLeadingEdgeCm: decimal("mac_leading_edge_cm", {
      precision: 10,
      scale: 2,
    }),
    macLengthCm: decimal("mac_length_cm", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_aircrafts_type").on(table.typeCode)]
);

/**
 * Deck configuration presets per aircraft (an aircraft can have multiple presets)
 */
export const deckConfigurationPresets = pgTable(
  "deck_configuration_presets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    aircraftId: uuid("aircraft_id")
      .notNull()
      .references(() => aircrafts.id, { onDelete: "cascade" }),
    presetName: varchar("preset_name", { length: 50 }).notNull(),
    presetCode: varchar("preset_code", { length: 20 }).notNull(),
    description: text("description"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("preset_unique").on(table.aircraftId, table.presetCode),
    index("idx_preset_aircraft").on(table.aircraftId),
  ]
);

/**
 * Deck configuration per preset
 */
export const deckConfigurations = pgTable(
  "deck_configurations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    presetId: uuid("preset_id")
      .notNull()
      .references(() => deckConfigurationPresets.id, { onDelete: "cascade" }),
    deckCode: varchar("deck_code", { length: 20 }).notNull(),
    deckName: varchar("deck_name", { length: 50 }).notNull(),
    maxStructuralWeightKg: decimal("max_structural_weight_kg", {
      precision: 10,
      scale: 2,
    }),
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("deck_config_unique").on(table.presetId, table.deckCode),
    index("idx_deck_preset").on(table.presetId),
  ]
);

/**
 * Contour code values for loading positions
 * FULL_WIDTH: Position spans full width (2 columns) - for PMC/PAG pallets
 * ONE_COLUMN: Position spans one column - for AKE/DPE containers
 */
export const CONTOUR_CODES = ["FULL_WIDTH", "ONE_COLUMN"] as const;
export type ContourCode = (typeof CONTOUR_CODES)[number];

/**
 * Individual cargo loading positions
 */
export const loadingPositions = pgTable(
  "loading_positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => deckConfigurations.id, { onDelete: "cascade" }),
    positionCode: varchar("position_code", { length: 10 }).notNull(),
    sequenceNumber: integer("sequence_number").notNull(),
    maxWeightKg: decimal("max_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    armStationCm: decimal("arm_station_cm", {
      precision: 10,
      scale: 2,
    }).notNull(),
    compatibleUldTypes: text("compatible_uld_types").array(),
    acceptsBulkCargo: boolean("accepts_bulk_cargo").notNull().default(false),
    floorAreaM2: decimal("floor_area_m2", { precision: 10, scale: 4 }),
    maxHeightCm: decimal("max_height_cm", { precision: 10, scale: 2 }),
    contourCode: varchar("contour_code", { length: 20 }).notNull().default("FULL_WIDTH"), // FULL_WIDTH or ONE_COLUMN
    xOffset: decimal("x_offset", { precision: 10, scale: 2 }),
    yOffset: decimal("y_offset", { precision: 10, scale: 2 }),
    colIndex: integer("col_index"),
    rowIndex: integer("row_index"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("position_unique").on(table.deckId, table.positionCode),
    index("idx_positions_deck").on(table.deckId),
  ]
);

/**
 * Flight schedule data
 */
export const flights = pgTable(
  "flights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    flightNumber: varchar("flight_number", { length: 10 }).notNull(),
    aircraftId: uuid("aircraft_id")
      .notNull()
      .references(() => aircrafts.id),
    originId: uuid("origin_id")
      .notNull()
      .references(() => locations.id),
    destinationId: uuid("destination_id")
      .notNull()
      .references(() => locations.id),
    scheduledDeparture: timestamp("scheduled_departure", {
      withTimezone: true,
    }).notNull(),
    scheduledArrival: timestamp("scheduled_arrival", {
      withTimezone: true,
    }).notNull(),
    actualDeparture: timestamp("actual_departure", { withTimezone: true }),
    actualArrival: timestamp("actual_arrival", { withTimezone: true }),
    status: varchar("status", { length: 20 }).notNull().default("SCHEDULED"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("flight_unique").on(table.flightNumber, table.scheduledDeparture),
    index("idx_flights_aircraft").on(table.aircraftId),
    index("idx_flights_origin").on(table.originId),
    index("idx_flights_destination").on(table.destinationId),
    index("idx_flights_departure").on(table.scheduledDeparture),
    index("idx_flights_status").on(table.status),
  ]
);

// ============================================================================
// WEIGHT & BALANCE CONFIGURATION
// ============================================================================

/**
 * Center of Gravity envelope definitions
 */
export const cgEnvelopes = pgTable(
  "cg_envelopes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    aircraftId: uuid("aircraft_id")
      .notNull()
      .references(() => aircrafts.id, { onDelete: "cascade" }),
    envelopeType: varchar("envelope_type", { length: 20 }).notNull(), // TAKEOFF, ZERO_FUEL, LANDING
    forwardLimitPercentMac: decimal("forward_limit_percent_mac", {
      precision: 5,
      scale: 2,
    }).notNull(),
    aftLimitPercentMac: decimal("aft_limit_percent_mac", {
      precision: 5,
      scale: 2,
    }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("cg_envelope_unique").on(table.aircraftId, table.envelopeType),
    index("idx_cg_envelope_aircraft").on(table.aircraftId),
  ]
);

/**
 * CG envelope polygon points
 */
export const cgEnvelopePoints = pgTable(
  "cg_envelope_points",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    envelopeId: uuid("envelope_id")
      .notNull()
      .references(() => cgEnvelopes.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    weightKg: decimal("weight_kg", { precision: 10, scale: 2 }).notNull(),
    cgPercentMac: decimal("cg_percent_mac", {
      precision: 5,
      scale: 2,
    }).notNull(),
    cgIndex: decimal("cg_index", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_cg_points_envelope").on(table.envelopeId)]
);

/**
 * Loading zone definitions with LMC index impacts
 */
export const loadingZones = pgTable(
  "loading_zones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    aircraftId: uuid("aircraft_id")
      .notNull()
      .references(() => aircrafts.id, { onDelete: "cascade" }),
    zoneCode: varchar("zone_code", { length: 10 }).notNull(),
    positionCodes: text("position_codes").array().notNull(),
    lmcIndexImpact: decimal("lmc_index_impact", {
      precision: 5,
      scale: 2,
    }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("loading_zone_unique").on(table.aircraftId, table.zoneCode),
    index("idx_zones_aircraft").on(table.aircraftId),
  ]
);

/**
 * Weight-to-index lookup table per zone
 */
export const loadingZoneIndexEntries = pgTable(
  "loading_zone_index_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zoneId: uuid("zone_id")
      .notNull()
      .references(() => loadingZones.id, { onDelete: "cascade" }),
    weightMinKg: decimal("weight_min_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    weightMaxKg: decimal("weight_max_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    indexUnits: decimal("index_units", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_zone_index_zone").on(table.zoneId)]
);

/**
 * Aircraft fuel system configuration
 */
export const fuelConfigurations = pgTable("fuel_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  aircraftId: uuid("aircraft_id")
    .notNull()
    .unique()
    .references(() => aircrafts.id, { onDelete: "cascade" }),
  maxFuelCapacityKg: decimal("max_fuel_capacity_kg", {
    precision: 10,
    scale: 2,
  }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Individual fuel tank specifications
 */
export const fuelTanks = pgTable(
  "fuel_tanks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fuelConfigId: uuid("fuel_config_id")
      .notNull()
      .references(() => fuelConfigurations.id, { onDelete: "cascade" }),
    tankCode: varchar("tank_code", { length: 20 }).notNull(),
    location: varchar("location", { length: 20 }).notNull(), // WING_LEFT, WING_RIGHT, CENTER, TRIM
    maxCapacityKg: decimal("max_capacity_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    armStationCm: decimal("arm_station_cm", {
      precision: 10,
      scale: 2,
    }).notNull(),
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("fuel_tank_unique").on(table.fuelConfigId, table.tankCode),
    index("idx_fuel_tanks_config").on(table.fuelConfigId),
  ]
);

/**
 * Fuel weight-to-index lookup table
 */
export const fuelIndexEntries = pgTable(
  "fuel_index_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fuelTankId: uuid("fuel_tank_id").references(() => fuelTanks.id, {
      onDelete: "cascade",
    }),
    fuelConfigId: uuid("fuel_config_id")
      .notNull()
      .references(() => fuelConfigurations.id, { onDelete: "cascade" }),
    weightKg: decimal("weight_kg", { precision: 10, scale: 2 }).notNull(),
    indexValue: decimal("index_value", { precision: 10, scale: 2 }).notNull(),
    densityKgL: decimal("density_kg_l", { precision: 5, scale: 3 }).default(
      "0.8"
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_fuel_index_tank").on(table.fuelTankId),
    index("idx_fuel_index_config").on(table.fuelConfigId),
  ]
);

/**
 * Combined position weight constraints
 */
export const weightConstraints = pgTable(
  "weight_constraints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    aircraftId: uuid("aircraft_id")
      .notNull()
      .references(() => aircrafts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    affectedPositions: text("affected_positions").array().notNull(),
    maxCombinedWeightKg: decimal("max_combined_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    conditionType: varchar("condition_type", { length: 20 })
      .notNull()
      .default("ALWAYS"),
    conditionExpression: text("condition_expression"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_weight_constraints_aircraft").on(table.aircraftId)]
);

// ============================================================================
// CARGO & AWB DATA
// ============================================================================

/**
 * Air Waybill header information
 */
export const airWaybills = pgTable(
  "air_waybills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    awbNumber: varchar("awb_number", { length: 20 }).notNull().unique(),
    flightId: uuid("flight_id").references(() => flights.id),
    originId: uuid("origin_id")
      .notNull()
      .references(() => locations.id),
    destinationId: uuid("destination_id")
      .notNull()
      .references(() => locations.id),
    shipperName: varchar("shipper_name", { length: 200 }),
    shipperAddress: text("shipper_address"),
    consigneeName: varchar("consignee_name", { length: 200 }),
    consigneeAddress: text("consignee_address"),
    totalPieces: integer("total_pieces").notNull(),
    totalWeightKg: decimal("total_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    totalVolumeM3: decimal("total_volume_m3", {
      precision: 10,
      scale: 4,
    }).notNull(),
    chargeableWeightKg: decimal("chargeable_weight_kg", {
      precision: 10,
      scale: 2,
    }),
    natureOfGoods: text("nature_of_goods"),
    specialHandlingCodes: text("special_handling_codes").array(),
    bookingReference: varchar("booking_reference", { length: 50 }),
    status: varchar("status", { length: 20 }).notNull().default("BOOKED"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_awb_origin").on(table.originId),
    index("idx_awb_destination").on(table.destinationId),
    index("idx_awb_status").on(table.status),
    index("idx_awb_flight").on(table.flightId),
  ]
);

/**
 * Cargo piece groups within an AWB
 */
export const parcelGroups = pgTable(
  "parcel_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    awbId: uuid("awb_id")
      .notNull()
      .references(() => airWaybills.id, { onDelete: "cascade" }),
    commodityCodeId: uuid("commodity_code_id").references(
      () => commodityCodes.id
    ),
    groupNumber: integer("group_number").notNull(),
    pieces: integer("pieces").notNull(),
    weightKg: decimal("weight_kg", { precision: 10, scale: 2 }).notNull(),
    lengthCm: decimal("length_cm", { precision: 10, scale: 2 }).notNull(),
    widthCm: decimal("width_cm", { precision: 10, scale: 2 }).notNull(),
    heightCm: decimal("height_cm", { precision: 10, scale: 2 }).notNull(),
    volumeM3: decimal("volume_m3", { precision: 10, scale: 4 }),
    isStackable: boolean("is_stackable").notNull().default(true),
    maxStackWeightKg: decimal("max_stack_weight_kg", {
      precision: 10,
      scale: 2,
    }),
    isTiltable: boolean("is_tiltable").notNull().default(false),
    tempZoneId: uuid("temp_zone_id").references(() => temperatureZones.id),
    specialHandlingCodes: text("special_handling_codes").array(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("parcel_group_unique").on(table.awbId, table.groupNumber),
    index("idx_parcel_awb").on(table.awbId),
    index("idx_parcel_commodity").on(table.commodityCodeId),
  ]
);

/**
 * Individual cargo items for optimization
 */
export const cargoItems = pgTable(
  "cargo_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parcelGroupId: uuid("parcel_group_id").references(() => parcelGroups.id, {
      onDelete: "cascade",
    }),
    awbId: uuid("awb_id")
      .notNull()
      .references(() => airWaybills.id, { onDelete: "cascade" }),
    pieceNumber: integer("piece_number").notNull(),
    weightKg: decimal("weight_kg", { precision: 10, scale: 2 }).notNull(),
    lengthCm: decimal("length_cm", { precision: 10, scale: 2 }).notNull(),
    widthCm: decimal("width_cm", { precision: 10, scale: 2 }).notNull(),
    heightCm: decimal("height_cm", { precision: 10, scale: 2 }).notNull(),
    volumeM3: decimal("volume_m3", { precision: 10, scale: 4 }),
    isStackable: boolean("is_stackable").notNull().default(true),
    maxStackWeightKg: decimal("max_stack_weight_kg", {
      precision: 10,
      scale: 2,
    }),
    isTiltable: boolean("is_tiltable").notNull().default(false),
    isDangerousGoods: boolean("is_dangerous_goods").notNull().default(false),
    dgClassId: uuid("dg_class_id").references(() => dangerousGoodsClasses.id),
    tempZoneId: uuid("temp_zone_id").references(() => temperatureZones.id),
    isLiveAnimal: boolean("is_live_animal").notNull().default(false),
    isFoodstuff: boolean("is_foodstuff").notNull().default(false),
    specialHandlingCodes: text("special_handling_codes").array(),
    priority: varchar("priority", { length: 20 }).notNull().default("STANDARD"),
    destinationId: uuid("destination_id").references(() => locations.id),
    loadStatus: varchar("load_status", { length: 20 })
      .notNull()
      .default("PENDING"),
    assignedUldId: uuid("assigned_uld_id"), // FK added after uldAssignments defined
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_cargo_awb").on(table.awbId),
    index("idx_cargo_parcel").on(table.parcelGroupId),
    index("idx_cargo_status").on(table.loadStatus),
    index("idx_cargo_priority").on(table.priority),
    index("idx_cargo_dg").on(table.isDangerousGoods),
  ]
);

// ============================================================================
// PLANNING & OPTIMIZATION
// ============================================================================

/**
 * Load planning session and results
 */
export const loadPlans = pgTable(
  "load_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    flightId: uuid("flight_id")
      .notNull()
      .references(() => flights.id),
    aircraftId: uuid("aircraft_id")
      .notNull()
      .references(() => aircrafts.id),
    planNumber: varchar("plan_number", { length: 20 }).unique(),
    status: varchar("status", { length: 20 }).notNull().default("DRAFT"),
    operatingEmptyWeightKg: decimal("operating_empty_weight_kg", {
      precision: 10,
      scale: 2,
    }),
    dryOperatingWeightKg: decimal("dry_operating_weight_kg", {
      precision: 10,
      scale: 2,
    }),
    payloadKg: decimal("payload_kg", { precision: 10, scale: 2 }),
    zeroFuelWeightKg: decimal("zero_fuel_weight_kg", {
      precision: 10,
      scale: 2,
    }),
    takeoffFuelKg: decimal("takeoff_fuel_kg", { precision: 10, scale: 2 }),
    tripFuelKg: decimal("trip_fuel_kg", { precision: 10, scale: 2 }),
    takeoffWeightKg: decimal("takeoff_weight_kg", { precision: 10, scale: 2 }),
    landingWeightKg: decimal("landing_weight_kg", { precision: 10, scale: 2 }),
    zfwCgPercentMac: decimal("zfw_cg_percent_mac", { precision: 5, scale: 2 }),
    zfwCgIndex: decimal("zfw_cg_index", { precision: 10, scale: 2 }),
    towCgPercentMac: decimal("tow_cg_percent_mac", { precision: 5, scale: 2 }),
    towCgIndex: decimal("tow_cg_index", { precision: 10, scale: 2 }),
    ldwCgPercentMac: decimal("ldw_cg_percent_mac", { precision: 5, scale: 2 }),
    ldwCgIndex: decimal("ldw_cg_index", { precision: 10, scale: 2 }),
    stabilizerTrimUnits: decimal("stabilizer_trim_units", {
      precision: 5,
      scale: 2,
    }),
    withinWeightLimits: boolean("within_weight_limits"),
    withinCgEnvelope: boolean("within_cg_envelope"),
    constraintsSatisfied: boolean("constraints_satisfied"),
    lateralBalanceOk: boolean("lateral_balance_ok"),
    validationErrors: text("validation_errors").array(),
    validationWarnings: text("validation_warnings").array(),
    optimizationTimeMs: integer("optimization_time_ms"),
    optimizedAt: timestamp("optimized_at"),
    releasedAt: timestamp("released_at"),
    releasedBy: varchar("released_by", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_load_plans_flight").on(table.flightId),
    index("idx_load_plans_aircraft").on(table.aircraftId),
    index("idx_load_plans_status").on(table.status),
  ]
);

/**
 * Cargo-to-ULD assignment records
 */
export const uldAssignments = pgTable(
  "uld_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    loadPlanId: uuid("load_plan_id")
      .notNull()
      .references(() => loadPlans.id, { onDelete: "cascade" }),
    uldId: uuid("uld_id").references(() => ulds.id),
    uldTypeId: uuid("uld_type_id")
      .notNull()
      .references(() => uldTypes.id),
    uldNumber: varchar("uld_number", { length: 20 }),
    positionCode: varchar("position_code", { length: 10 }),
    sequence: integer("sequence").notNull(),
    totalWeightKg: decimal("total_weight_kg", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    tareWeightKg: decimal("tare_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    cargoWeightKg: decimal("cargo_weight_kg", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    volumeUsedM3: decimal("volume_used_m3", { precision: 10, scale: 4 })
      .notNull()
      .default("0"),
    volumeUtilization: decimal("volume_utilization", {
      precision: 5,
      scale: 2,
    }),
    weightUtilization: decimal("weight_utilization", {
      precision: 5,
      scale: 2,
    }),
    isVirtual: boolean("is_virtual").notNull().default(false),
    status: varchar("status", { length: 20 }).notNull().default("PLANNED"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_uld_assignments_plan").on(table.loadPlanId),
    index("idx_uld_assignments_uld").on(table.uldId),
    index("idx_uld_assignments_status").on(table.status),
  ]
);

/**
 * 3D packing coordinates within ULD
 */
export const packedItems = pgTable(
  "packed_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    uldAssignmentId: uuid("uld_assignment_id")
      .notNull()
      .references(() => uldAssignments.id, { onDelete: "cascade" }),
    cargoItemId: uuid("cargo_item_id")
      .notNull()
      .references(() => cargoItems.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    xPositionCm: decimal("x_position_cm", {
      precision: 10,
      scale: 2,
    }).notNull(),
    yPositionCm: decimal("y_position_cm", {
      precision: 10,
      scale: 2,
    }).notNull(),
    zPositionCm: decimal("z_position_cm", {
      precision: 10,
      scale: 2,
    }).notNull(),
    rotated: boolean("rotated").notNull().default(false),
    rotationAxis: varchar("rotation_axis", { length: 10 }),
    packedLengthCm: decimal("packed_length_cm", {
      precision: 10,
      scale: 2,
    }).notNull(),
    packedWidthCm: decimal("packed_width_cm", {
      precision: 10,
      scale: 2,
    }).notNull(),
    packedHeightCm: decimal("packed_height_cm", {
      precision: 10,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("packed_item_unique").on(table.uldAssignmentId, table.cargoItemId),
    index("idx_packed_items_assignment").on(table.uldAssignmentId),
    index("idx_packed_items_cargo").on(table.cargoItemId),
  ]
);

/**
 * ULD-to-aircraft position assignments
 */
export const positionLoads = pgTable(
  "position_loads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    loadPlanId: uuid("load_plan_id")
      .notNull()
      .references(() => loadPlans.id, { onDelete: "cascade" }),
    positionId: uuid("position_id")
      .notNull()
      .references(() => loadingPositions.id),
    uldAssignmentId: uuid("uld_assignment_id").references(
      () => uldAssignments.id
    ),
    positionCode: varchar("position_code", { length: 10 }).notNull(),
    grossWeightKg: decimal("gross_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    calculatedMoment: decimal("calculated_moment", { precision: 15, scale: 2 }),
    calculatedIndex: decimal("calculated_index", { precision: 10, scale: 2 }),
    status: varchar("status", { length: 20 }).notNull().default("PLANNED"),
    loadedAt: timestamp("loaded_at"),
    verifiedBy: varchar("verified_by", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("position_load_unique").on(table.loadPlanId, table.positionId),
    index("idx_position_loads_plan").on(table.loadPlanId),
    index("idx_position_loads_position").on(table.positionId),
  ]
);

/**
 * Natural language rules for LLM interpretation
 */
export const packingRules = pgTable(
  "packing_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ruleText: text("rule_text").notNull(),
    ruleType: varchar("rule_type", { length: 20 }).notNull(), // CONSTRAINT, PREFERENCE, PROHIBITION
    priority: integer("priority").notNull().default(50),
    category: varchar("category", { length: 50 }),
    isActive: boolean("is_active").notNull().default(true),
    examples: text("examples").array(),
    structuredRule: jsonb("structured_rule"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_packing_rules_type").on(table.ruleType),
    index("idx_packing_rules_active").on(table.isActive),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const locationsRelations = relations(locations, ({ many }) => ({
  originFlights: many(flights, { relationName: "originFlights" }),
  destinationFlights: many(flights, { relationName: "destinationFlights" }),
  ulds: many(ulds),
  originAwbs: many(airWaybills, { relationName: "originAwbs" }),
  destinationAwbs: many(airWaybills, { relationName: "destinationAwbs" }),
}));

export const dangerousGoodsClassesRelations = relations(
  dangerousGoodsClasses,
  ({ many }) => ({
    segregationRulesA: many(dgSegregationRules, { relationName: "classA" }),
    segregationRulesB: many(dgSegregationRules, { relationName: "classB" }),
    cargoItems: many(cargoItems),
  })
);

export const dgSegregationRulesRelations = relations(
  dgSegregationRules,
  ({ one }) => ({
    classA: one(dangerousGoodsClasses, {
      fields: [dgSegregationRules.classAId],
      references: [dangerousGoodsClasses.id],
      relationName: "classA",
    }),
    classB: one(dangerousGoodsClasses, {
      fields: [dgSegregationRules.classBId],
      references: [dangerousGoodsClasses.id],
      relationName: "classB",
    }),
  })
);

export const temperatureZonesRelations = relations(
  temperatureZones,
  ({ many }) => ({
    parcelGroups: many(parcelGroups),
    cargoItems: many(cargoItems),
  })
);

export const uldTypesRelations = relations(uldTypes, ({ many }) => ({
  ulds: many(ulds),
  uldAssignments: many(uldAssignments),
}));

export const uldsRelations = relations(ulds, ({ one, many }) => ({
  uldType: one(uldTypes, {
    fields: [ulds.uldTypeId],
    references: [uldTypes.id],
  }),
  location: one(locations, {
    fields: [ulds.locationId],
    references: [locations.id],
  }),
  uldAssignments: many(uldAssignments),
}));

export const aircraftsRelations = relations(aircrafts, ({ one, many }) => ({
  deckConfigurations: many(deckConfigurations),
  flights: many(flights),
  cgEnvelopes: many(cgEnvelopes),
  loadingZones: many(loadingZones),
  fuelConfiguration: one(fuelConfigurations),
  weightConstraints: many(weightConstraints),
  loadPlans: many(loadPlans),
}));

export const deckConfigurationPresetsRelations = relations(
  deckConfigurationPresets,
  ({ one, many }) => ({
    aircraft: one(aircrafts, {
      fields: [deckConfigurationPresets.aircraftId],
      references: [aircrafts.id],
    }),
    deckConfigurations: many(deckConfigurations),
  })
);

export const deckConfigurationsRelations = relations(
  deckConfigurations,
  ({ one, many }) => ({
    preset: one(deckConfigurationPresets, {
      fields: [deckConfigurations.presetId],
      references: [deckConfigurationPresets.id],
    }),
    loadingPositions: many(loadingPositions),
  })
);

export const loadingPositionsRelations = relations(
  loadingPositions,
  ({ one, many }) => ({
    deck: one(deckConfigurations, {
      fields: [loadingPositions.deckId],
      references: [deckConfigurations.id],
    }),
    positionLoads: many(positionLoads),
  })
);

export const flightsRelations = relations(flights, ({ one, many }) => ({
  aircraft: one(aircrafts, {
    fields: [flights.aircraftId],
    references: [aircrafts.id],
  }),
  origin: one(locations, {
    fields: [flights.originId],
    references: [locations.id],
    relationName: "originFlights",
  }),
  destination: one(locations, {
    fields: [flights.destinationId],
    references: [locations.id],
    relationName: "destinationFlights",
  }),
  loadPlans: many(loadPlans),
  airWaybills: many(airWaybills),
}));

export const cgEnvelopesRelations = relations(cgEnvelopes, ({ one, many }) => ({
  aircraft: one(aircrafts, {
    fields: [cgEnvelopes.aircraftId],
    references: [aircrafts.id],
  }),
  points: many(cgEnvelopePoints),
}));

export const cgEnvelopePointsRelations = relations(
  cgEnvelopePoints,
  ({ one }) => ({
    envelope: one(cgEnvelopes, {
      fields: [cgEnvelopePoints.envelopeId],
      references: [cgEnvelopes.id],
    }),
  })
);

export const loadingZonesRelations = relations(
  loadingZones,
  ({ one, many }) => ({
    aircraft: one(aircrafts, {
      fields: [loadingZones.aircraftId],
      references: [aircrafts.id],
    }),
    indexEntries: many(loadingZoneIndexEntries),
  })
);

export const loadingZoneIndexEntriesRelations = relations(
  loadingZoneIndexEntries,
  ({ one }) => ({
    zone: one(loadingZones, {
      fields: [loadingZoneIndexEntries.zoneId],
      references: [loadingZones.id],
    }),
  })
);

export const fuelConfigurationsRelations = relations(
  fuelConfigurations,
  ({ one, many }) => ({
    aircraft: one(aircrafts, {
      fields: [fuelConfigurations.aircraftId],
      references: [aircrafts.id],
    }),
    tanks: many(fuelTanks),
    indexEntries: many(fuelIndexEntries),
  })
);

export const fuelTanksRelations = relations(fuelTanks, ({ one, many }) => ({
  fuelConfig: one(fuelConfigurations, {
    fields: [fuelTanks.fuelConfigId],
    references: [fuelConfigurations.id],
  }),
  indexEntries: many(fuelIndexEntries),
}));

export const fuelIndexEntriesRelations = relations(
  fuelIndexEntries,
  ({ one }) => ({
    tank: one(fuelTanks, {
      fields: [fuelIndexEntries.fuelTankId],
      references: [fuelTanks.id],
    }),
    fuelConfig: one(fuelConfigurations, {
      fields: [fuelIndexEntries.fuelConfigId],
      references: [fuelConfigurations.id],
    }),
  })
);

export const weightConstraintsRelations = relations(
  weightConstraints,
  ({ one }) => ({
    aircraft: one(aircrafts, {
      fields: [weightConstraints.aircraftId],
      references: [aircrafts.id],
    }),
  })
);

export const airWaybillsRelations = relations(airWaybills, ({ one, many }) => ({
  flight: one(flights, {
    fields: [airWaybills.flightId],
    references: [flights.id],
  }),
  origin: one(locations, {
    fields: [airWaybills.originId],
    references: [locations.id],
    relationName: "originAwbs",
  }),
  destination: one(locations, {
    fields: [airWaybills.destinationId],
    references: [locations.id],
    relationName: "destinationAwbs",
  }),
  parcelGroups: many(parcelGroups),
  cargoItems: many(cargoItems),
}));

export const parcelGroupsRelations = relations(
  parcelGroups,
  ({ one, many }) => ({
    awb: one(airWaybills, {
      fields: [parcelGroups.awbId],
      references: [airWaybills.id],
    }),
    commodityCode: one(commodityCodes, {
      fields: [parcelGroups.commodityCodeId],
      references: [commodityCodes.id],
    }),
    tempZone: one(temperatureZones, {
      fields: [parcelGroups.tempZoneId],
      references: [temperatureZones.id],
    }),
    cargoItems: many(cargoItems),
  })
);

export const cargoItemsRelations = relations(cargoItems, ({ one, many }) => ({
  parcelGroup: one(parcelGroups, {
    fields: [cargoItems.parcelGroupId],
    references: [parcelGroups.id],
  }),
  awb: one(airWaybills, {
    fields: [cargoItems.awbId],
    references: [airWaybills.id],
  }),
  dgClass: one(dangerousGoodsClasses, {
    fields: [cargoItems.dgClassId],
    references: [dangerousGoodsClasses.id],
  }),
  tempZone: one(temperatureZones, {
    fields: [cargoItems.tempZoneId],
    references: [temperatureZones.id],
  }),
  destination: one(locations, {
    fields: [cargoItems.destinationId],
    references: [locations.id],
  }),
  packedItems: many(packedItems),
}));

export const loadPlansRelations = relations(loadPlans, ({ one, many }) => ({
  flight: one(flights, {
    fields: [loadPlans.flightId],
    references: [flights.id],
  }),
  aircraft: one(aircrafts, {
    fields: [loadPlans.aircraftId],
    references: [aircrafts.id],
  }),
  uldAssignments: many(uldAssignments),
  positionLoads: many(positionLoads),
}));

export const uldAssignmentsRelations = relations(
  uldAssignments,
  ({ one, many }) => ({
    loadPlan: one(loadPlans, {
      fields: [uldAssignments.loadPlanId],
      references: [loadPlans.id],
    }),
    uld: one(ulds, {
      fields: [uldAssignments.uldId],
      references: [ulds.id],
    }),
    uldType: one(uldTypes, {
      fields: [uldAssignments.uldTypeId],
      references: [uldTypes.id],
    }),
    packedItems: many(packedItems),
    positionLoads: many(positionLoads),
  })
);

export const packedItemsRelations = relations(packedItems, ({ one }) => ({
  uldAssignment: one(uldAssignments, {
    fields: [packedItems.uldAssignmentId],
    references: [uldAssignments.id],
  }),
  cargoItem: one(cargoItems, {
    fields: [packedItems.cargoItemId],
    references: [cargoItems.id],
  }),
}));

export const positionLoadsRelations = relations(positionLoads, ({ one }) => ({
  loadPlan: one(loadPlans, {
    fields: [positionLoads.loadPlanId],
    references: [loadPlans.id],
  }),
  position: one(loadingPositions, {
    fields: [positionLoads.positionId],
    references: [loadingPositions.id],
  }),
  uldAssignment: one(uldAssignments, {
    fields: [positionLoads.uldAssignmentId],
    references: [uldAssignments.id],
  }),
}));

export const commodityCodesRelations = relations(
  commodityCodes,
  ({ many }) => ({
    parcelGroups: many(parcelGroups),
  })
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Reference Data
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type CommodityCode = typeof commodityCodes.$inferSelect;
export type NewCommodityCode = typeof commodityCodes.$inferInsert;

export type DangerousGoodsClass = typeof dangerousGoodsClasses.$inferSelect;
export type NewDangerousGoodsClass = typeof dangerousGoodsClasses.$inferInsert;

export type DgSegregationRule = typeof dgSegregationRules.$inferSelect;
export type NewDgSegregationRule = typeof dgSegregationRules.$inferInsert;

export type TemperatureZone = typeof temperatureZones.$inferSelect;
export type NewTemperatureZone = typeof temperatureZones.$inferInsert;

// ULD & Aircraft
export type UldType = typeof uldTypes.$inferSelect;
export type NewUldType = typeof uldTypes.$inferInsert;

export type Uld = typeof ulds.$inferSelect;
export type NewUld = typeof ulds.$inferInsert;

export type Aircraft = typeof aircrafts.$inferSelect;
export type NewAircraft = typeof aircrafts.$inferInsert;

export type DeckConfiguration = typeof deckConfigurations.$inferSelect;
export type NewDeckConfiguration = typeof deckConfigurations.$inferInsert;

export type LoadingPosition = typeof loadingPositions.$inferSelect;
export type NewLoadingPosition = typeof loadingPositions.$inferInsert;

export type Flight = typeof flights.$inferSelect;
export type NewFlight = typeof flights.$inferInsert;

// Weight & Balance
export type CgEnvelope = typeof cgEnvelopes.$inferSelect;
export type NewCgEnvelope = typeof cgEnvelopes.$inferInsert;

export type CgEnvelopePoint = typeof cgEnvelopePoints.$inferSelect;
export type NewCgEnvelopePoint = typeof cgEnvelopePoints.$inferInsert;

export type LoadingZone = typeof loadingZones.$inferSelect;
export type NewLoadingZone = typeof loadingZones.$inferInsert;

export type LoadingZoneIndexEntry = typeof loadingZoneIndexEntries.$inferSelect;
export type NewLoadingZoneIndexEntry =
  typeof loadingZoneIndexEntries.$inferInsert;

export type FuelConfiguration = typeof fuelConfigurations.$inferSelect;
export type NewFuelConfiguration = typeof fuelConfigurations.$inferInsert;

export type FuelTank = typeof fuelTanks.$inferSelect;
export type NewFuelTank = typeof fuelTanks.$inferInsert;

export type FuelIndexEntry = typeof fuelIndexEntries.$inferSelect;
export type NewFuelIndexEntry = typeof fuelIndexEntries.$inferInsert;

export type WeightConstraint = typeof weightConstraints.$inferSelect;
export type NewWeightConstraint = typeof weightConstraints.$inferInsert;

// Cargo & AWB
export type AirWaybill = typeof airWaybills.$inferSelect;
export type NewAirWaybill = typeof airWaybills.$inferInsert;

export type ParcelGroup = typeof parcelGroups.$inferSelect;
export type NewParcelGroup = typeof parcelGroups.$inferInsert;

export type CargoItem = typeof cargoItems.$inferSelect;
export type NewCargoItem = typeof cargoItems.$inferInsert;

// Planning & Optimization
export type LoadPlan = typeof loadPlans.$inferSelect;
export type NewLoadPlan = typeof loadPlans.$inferInsert;

export type UldAssignment = typeof uldAssignments.$inferSelect;
export type NewUldAssignment = typeof uldAssignments.$inferInsert;

export type PackedItem = typeof packedItems.$inferSelect;
export type NewPackedItem = typeof packedItems.$inferInsert;

export type PositionLoad = typeof positionLoads.$inferSelect;
export type NewPositionLoad = typeof positionLoads.$inferInsert;

export type PackingRule = typeof packingRules.$inferSelect;
export type NewPackingRule = typeof packingRules.$inferInsert;
