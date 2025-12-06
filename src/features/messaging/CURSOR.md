# Messaging Feature

## Purpose

Generates and manages IATA load-related messages including LDM (Load Distribution Message), CPM (Container/Pallet Message), UCM (Unit Configuration Message), and other standard aviation messages. Supports both Type B teletype and Cargo-XML formats.

## Domain Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `LoadMessage` | Message record | `messageType`, `format`, `content`, `status` |

## Structure

```
messaging/
├── CURSOR.md
├── types.ts                    # Type definitions
├── index.ts                    # Public exports
├── components/                 # UI components
│   ├── MessagePreview.tsx      # Message content preview
│   ├── MessageHistory.tsx      # Message audit trail
│   ├── MessageTypeSelector.tsx # Message type picker
│   └── SendMessageButton.tsx   # Send action button
├── actions/                    # Server actions
│   ├── generate-message.actions.ts
│   └── send-message.actions.ts
├── hooks/                      # Data fetching hooks
│   ├── use-messages.ts
│   └── use-message-history.ts
└── lib/                        # Business logic
    ├── generators/
    │   ├── ldm-generator.ts    # LDM message generator
    │   ├── cpm-generator.ts    # CPM message generator
    │   ├── ucm-generator.ts    # UCM message generator
    │   └── type-b-formatter.ts # Type B formatting
    └── parsers/
        └── type-b-parser.ts    # Type B parsing (for import)
```

## Key Responsibilities

### 1. Message Generation
- Generate LDM from load plan data
- Generate CPM from ULD assignments
- Generate UCM from ULD configurations
- Support Type B and Cargo-XML formats

### 2. Message Management
- Store generated messages
- Track message versions
- Maintain message history/audit trail
- Handle message status updates

### 3. Message Transmission (Future)
- Send messages to external systems
- Handle acknowledgments
- Retry failed transmissions
- Log transmission history

## Message Types

### LDM - Load Distribution Message

Communicates the distribution of load by compartment.

```
LDM
GA100/15.SIN
-SIN.0/12500.PAX/0.B/0.C/8500.M/500
-HKG.0/3500.PAX/0.B/0.C/3500.M/0
SI NIL
```

**Content:**
- Flight identification
- Load by station/destination
- Breakdown: Passengers, Baggage, Cargo, Mail
- Supplementary information

### CPM - Container/Pallet Message

Details the contents of each ULD.

```
CPM
GA100/15.SIN
AKE12345GA/A/U1.HKG.1250.C
-123-45678901.5P.250K.C/PER
-123-45678902.3P.150K.C
PMC67890GA/P/U7.HKG.4200.C
-123-45678903.10P.500K.C/HEA
```

**Content:**
- ULD identification and position
- Weight and destination
- AWB details: pieces, weight, SHC
- Special handling codes

### UCM - Unit Configuration Message

Provides ULD configuration status.

```
UCM
GA100/15.SIN
.AKE12345GA-SIN/FULL/1250
.PMC67890GA-SIN/FULL/4200
.AKE11111GA-HKG/PART/800
```

## Usage Examples

### Generate LDM
```typescript
import { generateLdm } from "@/features/messaging";

const ldmMessage = await generateLdm({
  loadPlanId: loadPlan.id,
  format: "TYPE_B",
});

console.log(ldmMessage.content);
// LDM
// GA100/15.SIN
// -SIN.0/12500...
```

### Generate CPM
```typescript
import { generateCpm } from "@/features/messaging";

const cpmMessage = await generateCpm({
  loadPlanId: loadPlan.id,
  format: "TYPE_B",
});
```

### Display Message Preview
```typescript
import { MessagePreview } from "@/features/messaging";

<MessagePreview
  message={ldmMessage}
  format="formatted" // or "raw"
  onCopy={() => copyToClipboard(ldmMessage.content)}
/>
```

## Message Preview Component

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Load Distribution Message (LDM)                    [Copy] [Download]  │
├─────────────────────────────────────────────────────────────────────────┤
│  Flight: GA100  │  Date: 15DEC24  │  Route: SIN-HKG                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  LDM                                                                    │
│  GA100/15.SIN                                                           │
│  -SIN.0/12500.PAX/0.B/0.C/8500.M/500                                   │
│  -HKG.0/3500.PAX/0.B/0.C/3500.M/0                                      │
│  SI TOTAL PAYLOAD 12000 KG                                              │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Status: DRAFT  │  Version: 1  │  Created: 2024-12-15 10:30            │
│                                                                         │
│  [Send Message]                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Type B Message Format

IATA Type B is a teletype-style format with specific line structure:

```
Priority: QU (Urgent) / QK (Normal) / QD (Deferred)
Addresses: .SINHQOF .HKGCXHK (destination addresses)
Origin: .SINOPGA
Message ID: LDM
Content lines: Fixed-width formatted data
End: ENDPART/LAST
```

### Line Format Rules
- Max 69 characters per line
- Continuation indicated by hyphen at start
- Stations in 3-letter IATA codes
- Weights in kilograms (K suffix)
- Pieces count (P suffix)

## Integration Points

| Feature | Integration |
|---------|-------------|
| Planning | Load plan data for message generation |
| Cargo | AWB and cargo details for CPM |
| Aircraft | ULD assignments and positions |

## Message Workflow

```
Load Plan Finalized
        ↓
Generate Messages (LDM, CPM, UCM)
        ↓
Review/Preview Messages
        ↓
Send to External Systems (Future)
        ↓
Track Acknowledgments (Future)
```

## Export Options

1. **Copy to Clipboard**: Quick copy for manual transmission
2. **Download as File**: Save as .txt or .xml
3. **PDF Export**: Include in load planning documentation

## Priority (Milestone Context)

This feature is **P1 (Nice to have)** for the hackathon:
- Basic message generation is useful for demo
- Full transmission capability is future scope
- Focus on LDM and CPM for MVP

## Future Enhancements

- **Message Transmission**: Integration with SITA/ARINC networks
- **Acknowledgment Handling**: Track message delivery
- **Cargo-XML Support**: Full XML format generation
- **Message Import**: Parse incoming messages
- **Automated Triggers**: Generate messages on plan finalization

