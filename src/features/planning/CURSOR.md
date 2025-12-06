# Planning Feature

## Purpose

The core feature for load plan optimization. Manages load plans, ULD assignments, 3D packing coordinates, position loads, and packing rules. Implements the hybrid LLM + bin-packing algorithm for cargo optimization.

## Domain Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `LoadPlan` | Planning session and results | `status`, `payloadKg`, `zfwCgPercentMac`, `validationErrors` |
| `UldAssignment` | Cargo-to-ULD mapping | `uldTypeId`, `totalWeightKg`, `volumeUtilization` |
| `PackedItem` | 3D coordinates in ULD | `x/y/zPositionCm`, `rotated`, `packedDimensions` |
| `PositionLoad` | ULD-to-position assignment | `positionCode`, `grossWeightKg`, `calculatedMoment` |
| `PackingRule` | Natural language rules | `ruleText`, `ruleType`, `structuredRule` |

## Structure

```
planning/
├── CURSOR.md
├── types.ts                      # Type definitions
├── index.ts                      # Public exports
├── components/                   # UI components
│   ├── LoadPlanCard.tsx          # Plan summary card
│   ├── LoadPlanWorkspace.tsx     # Main workspace layout
│   ├── OptimizationPanel.tsx     # Run optimizer controls
│   ├── ResultsSummary.tsx        # Optimization results
│   ├── UldAssignmentCard.tsx     # Single ULD display
│   ├── PackingVisualization.tsx  # 3D/isometric view
│   └── BuildUpInstructions.tsx   # LLM-generated instructions
├── actions/                      # Server actions
│   ├── load-plan.actions.ts      # CRUD operations
│   ├── optimize.actions.ts       # Optimization trigger
│   ├── assignment.actions.ts     # ULD assignment operations
│   └── instructions.actions.ts   # Build-up instruction generation
├── hooks/                        # Data fetching hooks
│   ├── use-load-plan.ts
│   ├── use-optimization.ts
│   ├── use-uld-assignments.ts
│   └── use-packing-rules.ts
└── lib/                          # Business logic
    ├── algorithm/                # Bin-packing algorithm
    │   ├── bin-packing.ts        # 3D FFD algorithm
    │   ├── constraints.ts        # Constraint handling
    │   └── optimizer.ts          # Main optimizer
    ├── llm/                      # LLM integration
    │   ├── rule-processor.ts     # Parse natural language rules
    │   └── instruction-generator.ts # Generate build-up text
    └── validation/               # Load plan validation
        ├── weight-balance.ts     # Weight & CG checks
        └── constraints.ts        # Constraint validation
```

## Key Responsibilities

### 1. Load Plan Management
- Create load plans for flights
- Track optimization status (Draft → Optimizing → Optimized → Final → Released)
- Store weight and CG calculation results
- Validate against aircraft limits

### 2. ULD Build-Up Optimization
- Pack cargo items into ULDs using 3D bin-packing
- Minimize number of ULDs used
- Maximize volume/weight utilization
- Apply compatibility rules (DG, temperature, etc.)

### 3. Position Assignment
- Assign ULDs to aircraft positions
- Calculate moments for CG
- Validate against position weight limits
- Check combined weight constraints

### 4. LLM Integration
- Parse natural language packing rules
- Generate human-readable build-up instructions
- Explain optimization decisions

### 5. Visualization Data
- Provide 3D coordinates for packed items
- Support isometric and full 3D views
- Color-code by AWB, priority, or SHC

## Algorithm Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OPTIMIZATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. COLLECT INPUT                                                       │
│     ├── Cargo items (sorted by volume, priority)                        │
│     ├── Available ULD types                                             │
│     ├── Packing rules (natural language)                                │
│     └── Aircraft position constraints                                   │
│                                                                         │
│  2. LLM RULE PROCESSING                                                 │
│     ├── Parse natural language rules                                    │
│     └── Convert to structured constraints                               │
│                                                                         │
│  3. BIN-PACKING ALGORITHM (3D FFD)                                      │
│     ├── Sort cargo by volume (descending)                               │
│     ├── For each cargo item:                                            │
│     │   ├── Check compatibility with existing ULD contents              │
│     │   ├── Find best fit position (guillotine split)                   │
│     │   ├── Try rotations if allowed                                    │
│     │   └── Create new ULD if no fit                                    │
│     └── Return packing coordinates                                      │
│                                                                         │
│  4. POSITION ASSIGNMENT                                                 │
│     ├── Assign ULDs to aircraft positions                               │
│     ├── Calculate moments and indices                                   │
│     └── Validate CG envelope                                            │
│                                                                         │
│  5. VALIDATION                                                          │
│     ├── Weight limits (ZFW, TOW, LDW)                                   │
│     ├── CG envelope compliance                                          │
│     ├── Position constraints                                            │
│     └── Combined weight constraints                                     │
│                                                                         │
│  6. LLM OUTPUT GENERATION                                               │
│     └── Generate human-readable build-up instructions                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Usage Examples

### Create and Optimize Load Plan
```typescript
import { createLoadPlan, runOptimization } from "@/features/planning";

// Create plan for flight
const loadPlan = await createLoadPlan({
  flightId: flight.id,
  aircraftId: aircraft.id,
});

// Run optimization
const result = await runOptimization({
  loadPlanId: loadPlan.id,
  cargoItemIds: cargoItems.map((c) => c.id),
  availableUldTypeIds: ["ake-type-id", "pmc-type-id"],
  rules: activeRules,
  options: {
    objective: "MINIMIZE_ULDS",
    allowRotation: true,
  },
});
```

### Display Optimization Results
```typescript
import { ResultsSummary, useLoadPlan } from "@/features/planning";

function LoadPlanResults({ planId }: { planId: string }) {
  const { loadPlan, uldAssignments, isLoading } = useLoadPlan(planId);

  return (
    <ResultsSummary
      loadPlan={loadPlan}
      uldAssignments={uldAssignments}
      onViewUld={(assignment) => openVisualization(assignment.id)}
    />
  );
}
```

### Generate Build-Up Instructions
```typescript
import { generateBuildUpInstructions } from "@/features/planning";

const instructions = await generateBuildUpInstructions(uldAssignmentId);
// Returns BuildUpInstruction with human-readable steps
```

## Results Summary Component

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Optimization Results                                         [Export]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │    5 ULDs       │  │   82% Volume    │  │   75% Weight    │         │
│  │     Used        │  │  Utilization    │  │  Utilization    │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ CG: 28.5% MAC ✓   │   ZFW: 63,500 kg ✓   │   TOW: 71,500 kg ✓ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Savings: 3 fewer ULDs = $450 saved!                                    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ULD Assignments                                                        │
│  ┌────────┬────────────┬─────────┬─────────┬────────────┐              │
│  │ ULD    │ Position   │ Weight  │ Volume  │ Items      │              │
│  ├────────┼────────────┼─────────┼─────────┼────────────┤              │
│  │ AKE-1  │ U1         │ 1,450kg │ 85%     │ 8 pieces   │  [View]     │
│  │ AKE-2  │ U2         │ 1,380kg │ 78%     │ 6 pieces   │  [View]     │
│  │ PMC-1  │ U7         │ 4,200kg │ 92%     │ 15 pieces  │  [View]     │
│  └────────┴────────────┴─────────┴─────────┴────────────┘              │
│                                                                         │
│  ⚠️ 2 items unassigned (exceed weight limit)                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Packing Rules Examples

```typescript
const exampleRules: PackingRule[] = [
  {
    ruleText: "Heavy items (>100kg) must be placed at the bottom of the ULD",
    ruleType: "CONSTRAINT",
    priority: 90,
    category: "WEIGHT_DISTRIBUTION",
  },
  {
    ruleText: "Dangerous goods must not be placed in same ULD as foodstuffs",
    ruleType: "PROHIBITION",
    priority: 100,
    category: "DANGEROUS_GOODS",
  },
  {
    ruleText: "High priority cargo should be loaded last for easy access",
    ruleType: "PREFERENCE",
    priority: 70,
    category: "PRIORITY",
  },
  {
    ruleText: "Temperature-controlled items must be grouped in refrigerated ULDs",
    ruleType: "CONSTRAINT",
    priority: 95,
    category: "TEMPERATURE",
  },
];
```

## Integration Points

| Feature | Integration |
|---------|-------------|
| Aircraft | Uses positions, aircraft limits, ULD types |
| Cargo | Receives cargo items for optimization |
| Weight Balance | CG envelope validation, fuel impact |
| Reference Data | DG segregation, temperature compatibility |

## Milestone Alignment (from RUNNING_MILESTONES.md)

### M1: Core Algorithm (Hours 2-6)
- [M1.1] Implement 3D FFD bin-packing algorithm
- [M1.2] Create LLM prompt for rule interpretation
- [M1.3] Build optimization server action
- [M1.4] Wire up to planning workspace
- [M1.5] Display results summary

### M2: Visualization (Hours 6-12)
- [M2.1] Create isometric ULD component
- [M2.2] Implement cargo item rendering with colors
- [M2.3] Add aircraft top-down view
- [M2.4] Create ULD position indicators
- [M2.5] Add hover states and tooltips

### M4: WOW Factor (Hours 18-24)
- [M4.1] Upgrade to Three.js 3D visualization
- [M4.2] Add real-time optimization animation
- [M4.3] Implement "exploded view" for ULD

## Performance Considerations

- **Optimize in background**: Use server action with progress updates
- **Incremental results**: Stream ULD assignments as computed
- **Cache rule parsing**: LLM rule interpretation is expensive
- **Batch DB writes**: Write all assignments in single transaction
- **Timeout handling**: Set max optimization time (30s default)

