# Aircraft Feature

## Purpose

Manages aircraft configurations, ULD types, physical ULD inventory, deck layouts, loading positions, and flight schedules. This feature is central to the load planning system as it defines the physical constraints and capacity limits for cargo operations.

## Domain Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `Aircraft` | Aircraft configuration with weight limits | `typeCode`, `maxTakeoffWeightKg`, `operatingEmptyWeightKg` |
| `DeckConfiguration` | Main/lower deck definitions | `deckCode`, `maxStructuralWeightKg` |
| `LoadingPosition` | Individual cargo positions | `positionCode`, `maxWeightKg`, `armStationCm` |
| `UldType` | ULD specifications | `code`, `maxGrossWeightKg`, `dimensions` |
| `Uld` | Physical ULD instances | `uldNumber`, `status`, `locationId` |
| `Flight` | Flight schedule | `flightNumber`, `origin`, `destination`, `departure` |

## Structure

```
aircraft/
├── CURSOR.md
├── types.ts                    # Type definitions
├── index.ts                    # Public exports
├── components/                 # UI components
│   ├── AircraftSelector.tsx    # Aircraft type dropdown
│   ├── AircraftLayout.tsx      # Top-down aircraft view
│   ├── DeckView.tsx            # Single deck visualization
│   ├── PositionGrid.tsx        # Loading position grid
│   ├── UldTypeCard.tsx         # ULD type display
│   └── FlightCard.tsx          # Flight summary card
├── actions/                    # Server actions
│   ├── aircraft.actions.ts
│   ├── uld.actions.ts
│   └── flight.actions.ts
├── hooks/                      # Data fetching hooks
│   ├── use-aircraft.ts
│   ├── use-aircraft-layout.ts
│   ├── use-uld-types.ts
│   ├── use-available-ulds.ts
│   └── use-flights.ts
└── lib/                        # Business logic
    ├── position-utils.ts       # Position calculations
    └── uld-compatibility.ts    # ULD-position compatibility
```

## Key Responsibilities

### 1. Aircraft Configuration
- Store and retrieve aircraft specifications
- Provide weight limits (MZFW, MTOW, MLW, OEW)
- Define MAC reference for CG calculations
- Link to deck configurations and loading positions

### 2. Deck Layout Management
- Define deck structure (Main, Lower Fwd, Lower Aft, Bulk)
- Manage loading position layout for visualization
- Calculate deck-level weight constraints

### 3. Loading Position Management
- Define individual position weight limits
- Store arm stations for moment calculations
- Track ULD type compatibility per position
- Provide position coordinates for visualization

### 4. ULD Type Catalog
- Maintain ULD specifications (AKE, PMC, etc.)
- Define internal dimensions for packing algorithms
- Track refrigerated ULD capabilities
- Manage deck compatibility rules

### 5. ULD Inventory
- Track physical ULD locations
- Manage ULD availability status
- Support ULD selection for load planning

### 6. Flight Management
- Store flight schedules
- Link flights to aircraft
- Track flight status
- Provide flight selection for load planning

## Usage Examples

### Get Aircraft with Full Configuration
```typescript
import { getAircraftWithConfiguration } from "@/features/aircraft";

const aircraft = await getAircraftWithConfiguration(aircraftId);
// Returns aircraft with deckConfigurations, loadingPositions, cgEnvelopes
```

### Check ULD-Position Compatibility
```typescript
import { isUldCompatibleWithPosition } from "@/features/aircraft";

const compatible = isUldCompatibleWithPosition(uldType, position);
```

### Get Available ULDs at Location
```typescript
import { useAvailableUlds } from "@/features/aircraft";

const { ulds, isLoading } = useAvailableUlds({
  locationCode: "SIN",
  uldTypeCode: "AKE",
});
```

### Render Aircraft Layout
```typescript
import { AircraftLayout } from "@/features/aircraft";

<AircraftLayout
  aircraft={aircraft}
  loadPlan={loadPlan}
  onPositionClick={(position) => navigate(`/visualize/${position.id}`)}
/>
```

## Aircraft Layout Visualization

The `AircraftLayout` component renders a top-down view of the aircraft showing:

```
┌────────────────────────────────────────────────────────────────────────────┐
│  COCKPIT                                                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                           MAIN DECK                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │  U1  │ │  U2  │ │  U3  │ │  U4  │ │  U5  │ │  U6  │ │  U7  │ ...      │
│  │ 85%  │ │ 72%  │ │ 45%  │ │  --  │ │  --  │ │  --  │ │ 90%  │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                                       TAIL │
├────────────────────────────────────────────────────────────────────────────┤
│                          LOWER DECK                                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │ 11 │ │ 12 │ │ 21 │ │ 22 │ │ 23 │   │ 31 │ │ 32 │ │ 33 │ │ 41 │ ...   │
│  └────┘ └────┘ └────┘ └────┘ └────┘   └────┘ └────┘ └────┘ └────┘       │
└────────────────────────────────────────────────────────────────────────────┘
```

- Color-coded by utilization (green > 70%, yellow 40-70%, gray empty)
- Clickable positions navigate to ULD visualization
- Shows ULD assignment status

## ULD Types Reference

| Code | Name | Category | Max Weight | Volume | Col Span |
|------|------|----------|------------|--------|----------|
| AKE | LD-3 Container | CONTAINER | 1,588 kg | 4.5 m³ | 1 |
| AKC | LD-1 Container | CONTAINER | 1,588 kg | 5.0 m³ | 1 |
| DPE | LD-2 Container | CONTAINER | 1,225 kg | 3.5 m³ | 1 |
| PMC | P6P Pallet | PALLET | 4,500 kg | 21.2 m³ | 2 |
| PAG | 16ft Pallet | PALLET | 6,800 kg | 28.3 m³ | 2 |
| RKN | Refrigerated LD-3 | CONTAINER | 1,588 kg | 4.5 m³ | 1 |

## Integration Points

| Feature | Integration |
|---------|-------------|
| Reference Data | Uses locations for flight origin/destination |
| Weight Balance | Aircraft links to CG envelopes, fuel configs, constraints |
| Planning | Load plans reference flights and aircraft |
| Cargo | Cargo items assigned to ULDs at positions |

## A321-211P2F Position Layout (Reference)

From LOAD_PLANNING_SPEC.md:

### Main Deck (U1-U14)
| Position | Max Weight | Notes |
|----------|------------|-------|
| U1-U6 | 1,836 kg each | Standard ULD positions |
| U7 | 3,193 kg | Larger capacity |
| U8-U12 | 2,275 kg each | Aft section |
| U13 | 1,927 kg | Near bulk |
| U14 | Bulk | Loose cargo area |

### Lower Deck
| Section | Positions | Max Weight |
|---------|-----------|------------|
| Forward | 11, 12, 21, 22, 23 | 1,134 kg each |
| Aft | 31, 32, 33, 41, 42 | 1,013-1,696 kg |
| Bulk on CLS | 51, 52, 53 | Varies |

## Performance Considerations

- **Pre-load aircraft configurations**: Cache on app start
- **Lazy load positions**: Only when aircraft selected
- **Optimize position queries**: Use deck-based batching
- **ULD availability**: Real-time status polling

