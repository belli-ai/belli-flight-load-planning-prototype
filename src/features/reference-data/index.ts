/**
 * Reference Data Feature
 *
 * Static lookup data for airports, commodity codes, dangerous goods
 * classifications, segregation rules, and temperature zones.
 */

// Type exports
export * from "./types";

// Re-export commonly used types with aliases for convenience
export type {
  Location,
  NewLocation,
  CommodityCode,
  NewCommodityCode,
  DangerousGoodsClass,
  NewDangerousGoodsClass,
  DgSegregationRule,
  NewDgSegregationRule,
  TemperatureZone,
  NewTemperatureZone,
} from "./types";

