/**
 * Messaging Feature
 *
 * IATA load-related message generation and handling
 * including LDM, CPM, UCM, MVT, and LPM messages.
 */

// Type exports
export * from "./types";

// Re-export commonly used types with aliases for convenience
export type {
  LoadMessage,
  NewLoadMessage,
  LdmContent,
  CpmContent,
  UcmContent,
  MessageGenerationRequest,
  MessageGenerationResult,
} from "./types";

