/**
 * Aircraft Feature
 *
 * Master data for aircraft configurations, ULD types, physical ULDs,
 * deck configurations, loading positions, and flight schedules.
 */

// Type exports
export * from "./types";

// Re-export commonly used types with aliases for convenience
export type {
  Aircraft,
  NewAircraft,
  AircraftWithConfiguration,
  DeckConfiguration,
  NewDeckConfiguration,
  LoadingPosition,
  NewLoadingPosition,
  UldType,
  NewUldType,
  Uld,
  NewUld,
  Flight,
  NewFlight,
  FlightWithDetails,
} from "./types";

