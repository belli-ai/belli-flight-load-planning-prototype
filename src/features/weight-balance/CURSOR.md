# Weight & Balance Feature

## Purpose

Manages aircraft weight and balance calculations including CG envelope validation, loading zone index calculations, fuel impact, and weight constraints. This feature ensures load plans comply with aircraft certified limits and provides CG visualization.

## Domain Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `CgEnvelope` | CG envelope definitions | `envelopeType`, `forwardLimitPercentMac`, `aftLimitPercentMac` |
| `CgEnvelopePoint` | Envelope polygon points | `weightKg`, `cgPercentMac`, `cgIndex` |
| `LoadingZone` | Zone definitions with LMC | `zoneCode`, `positionCodes`, `lmcIndexImpact` |
| `LoadingZoneIndexEntry` | Weight-to-index lookup | `weightMinKg`, `weightMaxKg`, `indexUnits` |
| `FuelConfiguration` | Fuel system config | `maxFuelCapacityKg` |
| `FuelTank` | Individual tank specs | `tankCode`, `location`, `armStationCm` |
| `FuelIndexEntry` | Fuel weight-to-index | `weightKg`, `indexValue` |
| `WeightConstraint` | Combined weight limits | `affectedPositions`, `maxCombinedWeightKg` |

## Structure

```
weight-balance/
├── CURSOR.md
├── types.ts                    # Type definitions
├── index.ts                    # Public exports
├── components/                 # UI components
│   ├── CgEnvelopeChart.tsx     # CG envelope visualization
│   ├── WeightBreakdown.tsx     # Weight summary display
│   ├── IndexCalculation.tsx    # Index table display
│   ├── FuelInput.tsx           # Fuel quantity input
│   ├── ConstraintStatus.tsx    # Constraint validation status
│   └── TrimSetting.tsx         # Stabilizer trim display
├── actions/                    # Server actions
│   └── weight-balance.actions.ts
├── hooks/                      # Data fetching hooks
│   ├── use-cg-envelope.ts
│   ├── use-weight-breakdown.ts
│   └── use-constraints.ts
└── lib/                        # Business logic
    ├── calculations/
    │   ├── moment.ts           # Moment calculations
    │   ├── index.ts            # Index calculations
    │   ├── cg.ts               # CG calculations
    │   └── fuel-index.ts       # Fuel index lookup
    ├── validation/
    │   ├── envelope.ts         # Envelope validation
    │   ├── weight-limits.ts    # Weight limit checks
    │   └── constraints.ts      # Constraint validation
    └── envelope-geometry.ts    # Polygon math for envelope
```

## Key Responsibilities

### 1. CG Envelope Management
- Store and retrieve CG envelope definitions (Takeoff, ZFW, Landing)
- Define envelope boundaries as polygon points
- Validate CG position is within envelope
- Visualize envelope with current CG position

### 2. Index Calculations
- Look up cargo weight-to-index from zone tables
- Calculate fuel index from fuel load
- Apply LMC (Last Minute Change) adjustments
- Sum total index for CG determination

### 3. Fuel Impact
- Track fuel tank configurations
- Calculate fuel moment contribution
- Look up fuel index values
- Support manual fuel input

### 4. Weight Constraint Validation
- Validate combined position weight limits
- Check conditional constraints
- Report constraint violations

### 5. CG Visualization
- Display CG envelope chart
- Plot ZFW, TOW, LDW CG points
- Show forward/aft limits
- Indicate margin to limits

## Core Calculations

### Moment Calculation
```typescript
function calculateMoment(weightKg: number, armStationCm: number): number {
  return weightKg * armStationCm;
}
```

### CG Calculation
```typescript
function calculateCg(positions: PositionMoment[]): number {
  const totalWeight = positions.reduce((sum, p) => sum + p.weightKg, 0);
  const totalMoment = positions.reduce((sum, p) => sum + p.moment, 0);
  return totalMoment / totalWeight;
}
```

### Index Lookup
```typescript
function lookupIndex(zoneId: string, weightKg: number): number {
  const entry = indexEntries.find(
    (e) => e.zoneId === zoneId && 
           weightKg >= e.weightMinKg && 
           weightKg <= e.weightMaxKg
  );
  return entry?.indexUnits ?? 0;
}
```

### CG from Index (Normalized)
```typescript
function cgFromIndex(index: number, forwardLimit: number, aftLimit: number): number {
  return forwardLimit + (index * (aftLimit - forwardLimit) / 100);
}
```

## Usage Examples

### Calculate Weight & Balance
```typescript
import { calculateWeightBalance } from "@/features/weight-balance";

const result = await calculateWeightBalance({
  aircraftId,
  positionLoads,
  fuelInput: {
    leftWingKg: 3000,
    rightWingKg: 3000,
    centerKg: 5000,
    totalKg: 11000,
  },
});

if (!result.withinAllLimits) {
  console.log("Violations:", result.violations);
}
```

### Validate CG Envelope
```typescript
import { validateCgEnvelope } from "@/features/weight-balance";

const isValid = await validateCgEnvelope({
  aircraftId,
  envelopeType: "TAKEOFF",
  weightKg: 71500,
  cgPercentMac: 28.5,
});
```

### Display CG Envelope Chart
```typescript
import { CgEnvelopeChart } from "@/features/weight-balance";

<CgEnvelopeChart
  envelope={takeoffEnvelope}
  currentPoints={[
    { type: "ZFW", weight: 63500, cg: 28.5 },
    { type: "TOW", weight: 71500, cg: 26.8 },
    { type: "LDW", weight: 68500, cg: 27.2 },
  ]}
  showLimits
/>
```

## CG Envelope Visualization

```
Weight (kg)
    ^
80k │    ╱─────────────────────────╲
    │   ╱                           ╲
75k │  ╱      ┌─TOW (26.8%)          ╲
    │ │       │                       │
70k │ │       │  ┌─LDW (27.2%)        │
    │ │       │  │                    │
65k │ │       │  │  ┌─ZFW (28.5%)     │
    │ │       │  │  │                 │
60k │  ╲      │  │  │                ╱
    │   ╲     │  │  │               ╱
55k │    ╲────┴──┴──┴──────────────╱
    └──────────────────────────────────> CG (% MAC)
        15%   20%   25%   30%   35%   40%
              FWD ←────────────→ AFT
```

## Weight Limits (A321-211P2F Reference)

| Limit | Value | Description |
|-------|-------|-------------|
| MZFW | 63,000 kg | Maximum Zero Fuel Weight |
| MTOW | 77,000 kg | Maximum Takeoff Weight |
| MLW | 73,500 kg | Maximum Landing Weight |
| OEW | 48,000 kg | Operating Empty Weight |
| Max Payload | 25,000 kg | Maximum cargo capacity |

## Weight Constraints (A321-211P2F Reference)

From LOAD_PLANNING_SPEC.md:

| Constraint | Positions | Max Weight |
|------------|-----------|------------|
| Forward Cargo Hold | A1 + A2 + 11 + 12 | 3,674 kg |
| Lower Deck Combined | Lower aft + bulk + A8-A14 | 16,329 kg |
| Bulk Restriction | Bulk area | N/A if A13/A14 in use |

## LMC Index Impacts (A321-211P2F Reference)

| Zone | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 | U11 | U12 | U13 | U14 |
|------|----|----|----|----|----|----|----|----|----|----|-----|-----|-----|-----|
| LMC | -1.4 | -1.2 | -0.5 | -0.3 | -0.5 | -0.3 | 0.0 | +0.2 | +0.4 | +0.7 | +0.9 | +1.1 | +1.3 | +1.5 |

## Integration Points

| Feature | Integration |
|---------|-------------|
| Aircraft | Aircraft weight limits, MAC reference |
| Planning | Load plan CG validation, position loads |

## Validation Flow

```
Position Loads → Moment Calculation → Index Lookup
                       ↓
                 Fuel Index
                       ↓
                 Total Index
                       ↓
              CG % MAC Calculation
                       ↓
              Envelope Validation
                       ↓
            Constraint Validation
                       ↓
              Weight & Balance Result
```

## Performance Considerations

- **Pre-load envelope data**: Cache CG envelopes per aircraft
- **Memoize index lookups**: Zone index tables are static
- **Batch moment calculations**: Calculate all positions together
- **Validate incrementally**: Check on each position change

