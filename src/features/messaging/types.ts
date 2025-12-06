/**
 * Messaging Feature - Type Definitions
 *
 * IATA load-related message generation and handling
 * including LDM, CPM, UCM, MVT, and LPM messages.
 */

// ============================================================================
// LOAD MESSAGES
// ============================================================================

/**
 * IATA load-related message records
 */
export type LoadMessage = {
  id: string;
  loadPlanId: string;
  messageType: MessageType;
  format: MessageFormat;
  content: string;
  version: number;
  sentAt: Date | null;
  recipient: string | null;
  status: MessageStatus;
  errorMessage: string | null;
  createdAt: Date;
};

export type NewLoadMessage = Omit<LoadMessage, "id" | "createdAt">;

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * IATA message type codes
 */
export const MESSAGE_TYPES = {
  LDM: "LDM", // Load Distribution Message
  CPM: "CPM", // Container/Pallet Message
  UCM: "UCM", // Unit Configuration Message
  MVT: "MVT", // Movement Message
  LPM: "LPM", // Load Planning Message
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

/**
 * Message type descriptions
 */
export const MESSAGE_TYPE_DESCRIPTIONS: Record<MessageType, string> = {
  LDM: "Load Distribution Message - Distribution of load by compartment",
  CPM: "Container/Pallet Message - Details of ULD contents",
  UCM: "Unit Configuration Message - ULD configuration details",
  MVT: "Movement Message - Aircraft movement notification",
  LPM: "Load Planning Message - Pre-planning load information",
};

// ============================================================================
// MESSAGE FORMATS
// ============================================================================

/**
 * Message format types
 */
export const MESSAGE_FORMATS = {
  TYPE_B: "TYPE_B", // IATA Type B teletype format
  CARGO_XML: "CARGO_XML", // IATA Cargo-XML format
} as const;

export type MessageFormat = (typeof MESSAGE_FORMATS)[keyof typeof MESSAGE_FORMATS];

// ============================================================================
// MESSAGE STATUS
// ============================================================================

/**
 * Message transmission status
 */
export const MESSAGE_STATUSES = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  ERROR: "ERROR",
} as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[keyof typeof MESSAGE_STATUSES];

// ============================================================================
// LDM (LOAD DISTRIBUTION MESSAGE)
// ============================================================================

/**
 * LDM content structure
 * Load distribution by compartment
 */
export type LdmContent = {
  flightNumber: string;
  date: string;
  departureStation: string;
  arrivalStation: string;
  aircraftType: string;
  registration: string;
  compartments: LdmCompartment[];
  totals: LdmTotals;
  supplementaryInfo?: string;
};

export type LdmCompartment = {
  compartmentId: string;
  weight: number;
  mailWeight?: number;
  cargoWeight?: number;
  baggageWeight?: number;
};

export type LdmTotals = {
  passengers: { male: number; female: number; children: number; infants: number };
  baggageWeight: number;
  baggagePieces: number;
  cargoWeight: number;
  mailWeight: number;
  totalPayload: number;
  deadload: number;
};

// ============================================================================
// CPM (CONTAINER/PALLET MESSAGE)
// ============================================================================

/**
 * CPM content structure
 * Details of ULD contents
 */
export type CpmContent = {
  flightNumber: string;
  date: string;
  departureStation: string;
  ulds: CpmUld[];
};

export type CpmUld = {
  uldNumber: string;
  uldType: string;
  position: string;
  destination: string;
  weight: number;
  contents: CpmContent_Item[];
  specialHandling?: string[];
  remarks?: string;
};

export type CpmContent_Item = {
  awbNumber: string;
  pieces: number;
  weight: number;
  destination: string;
  natureOfGoods?: string;
  specialHandling?: string[];
};

// ============================================================================
// UCM (UNIT CONFIGURATION MESSAGE)
// ============================================================================

/**
 * UCM content structure
 * ULD configuration details
 */
export type UcmContent = {
  flightNumber: string;
  date: string;
  departureStation: string;
  uldConfiguration: UcmUldConfig[];
};

export type UcmUldConfig = {
  uldNumber: string;
  uldType: string;
  ownerCode: string;
  destination: string;
  condition: "FULL" | "PART" | "EMPTY";
  weight: number;
  remarks?: string;
};

// ============================================================================
// MESSAGE GENERATION
// ============================================================================

/**
 * Message generation request
 */
export type MessageGenerationRequest = {
  loadPlanId: string;
  messageType: MessageType;
  format: MessageFormat;
  recipient?: string;
};

/**
 * Message generation result
 */
export type MessageGenerationResult = {
  success: boolean;
  message?: LoadMessage;
  content?: string;
  error?: string;
};

// ============================================================================
// TYPE B MESSAGE FORMATTING
// ============================================================================

/**
 * Type B message line structure
 */
export type TypeBLine = {
  lineNumber: number;
  content: string;
  lineType: "HEADER" | "DATA" | "SUPPLEMENTARY" | "END";
};

/**
 * Type B message structure
 */
export type TypeBMessage = {
  priority: "QU" | "QK" | "QD"; // Urgent, Normal, Deferred
  addresses: string[];
  origin: string;
  messageIdentifier: string;
  lines: TypeBLine[];
};

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

/**
 * LDM Type B template example:
 *
 * LDM
 * GA100/15.SIN
 * -SIN.0/12500.PAX/0.B/0
 * -HKG.0/0.PAX/0.B/0
 * SI SUPPLEMENTARY INFO
 */

/**
 * CPM Type B template example:
 *
 * CPM
 * GA100/15.SIN
 * AKE12345GA/A/U1.HKG.1250
 * -123-45678901.5P.250K.C
 * -123-45678902.3P.150K.C
 */

// ============================================================================
// MESSAGE HISTORY
// ============================================================================

/**
 * Message history entry for audit trail
 */
export type MessageHistoryEntry = {
  id: string;
  messageId: string;
  action: "CREATED" | "SENT" | "ACKNOWLEDGED" | "RESENT" | "CANCELLED";
  timestamp: Date;
  user: string;
  details?: string;
};

/**
 * Message with history
 */
export type LoadMessageWithHistory = LoadMessage & {
  history: MessageHistoryEntry[];
};

// ============================================================================
// FORWARD DECLARATIONS
// ============================================================================

// Messages are linked to load plans
type LoadPlan = {
  id: string;
  flightId: string;
  planNumber: string;
};

