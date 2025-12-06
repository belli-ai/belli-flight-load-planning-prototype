/**
 * Cargo Feature
 *
 * Air waybills, parcel groups, and individual cargo items
 * for shipment tracking and optimization.
 */

// Type exports
export * from "./types";

// Re-export commonly used types with aliases for convenience
export type {
  AirWaybill,
  NewAirWaybill,
  AirWaybillWithLocations,
  ParcelGroup,
  NewParcelGroup,
  CargoItem,
  NewCargoItem,
  CargoItemForPacking,
  CargoItemDisplay,
  CargoInput,
  CargoStats,
} from "./types";

