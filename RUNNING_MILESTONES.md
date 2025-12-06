# Flight Load Planning - Technical Milestones

> **Hackathon Context:** 24-hour build | Hybrid LLM + Algorithm approach | Maximum WOW factor

## Project Overview

An intelligent cargo load planning system that optimizes ULD (Unit Load Device) packing to minimize container count while maximizing capacity utilization. The system uses a hybrid approach combining traditional bin-packing algorithms for spatial optimization with LLM integration for natural language rule interpretation and human-readable output generation.

### Core Value Proposition

| Problem                             | Our Solution                                   |
| ----------------------------------- | ---------------------------------------------- |
| ~20% wasted cargo capacity          | AI-optimized bin-packing algorithm             |
| Manual spreadsheet planning         | Automated optimization with visual feedback    |
| $50-150 handling fees per extra ULD | Minimize ULD count through intelligent packing |
| Time pressure decisions             | Real-time optimization with instant results    |

---

## Data Architecture

> **Full Schema Documentation:** See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete ERD, table definitions, and sample data.

### Schema Overview

The database is organized into 6 logical groups supporting both ULD build-up optimization and aircraft load planning:

| Group            | Tables                                                                                                                                                               | Purpose                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Reference Data   | `locations`, `commodity_codes`, `dangerous_goods_classes`, `dg_segregation_rules`, `temperature_zones`                                                               | Static lookup data for airports, DG classes, and compatibility rules |
| ULD & Aircraft   | `uld_types`, `ulds`, `aircrafts`, `deck_configurations`, `loading_positions`, `flights`                                                                              | Master data for containers, aircraft configs, and flight schedules   |
| Weight & Balance | `cg_envelopes`, `cg_envelope_points`, `loading_zones`, `loading_zone_index_entries`, `fuel_configurations`, `fuel_tanks`, `fuel_index_entries`, `weight_constraints` | CG calculations, fuel impact, and position constraints               |
| Cargo & AWB      | `air_waybills`, `parcel_groups`, `cargo_items`                                                                                                                       | Shipment and cargo piece data                                        |
| Planning         | `load_plans`, `uld_assignments`, `packed_items`, `position_loads`, `packing_rules`                                                                                   | Optimization sessions and results                                    |
| Messaging        | `load_messages`                                                                                                                                                      | IATA LDM/CPM/UCM message records                                     |

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              REFERENCE DATA                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  locations ─┬─< flights (origin/destination)                                    │
│             └─< ulds (current location)                                         │
│                                                                                 │
│  commodity_codes ─< parcel_groups                                               │
│                                                                                 │
│  dangerous_goods_classes ─┬─< dg_segregation_rules (class_a, class_b)           │
│                           └─< cargo_items (dg_class_id)                         │
│                                                                                 │
│  temperature_zones ─< cargo_items, parcel_groups                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ULD & AIRCRAFT DATA                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  uld_types ─┬─< ulds (physical instances)                                       │
│             └─< uld_assignments (type reference)                                │
│                                                                                 │
│  aircrafts ─┬─< deck_configurations ─< loading_positions                        │
│             ├─< cg_envelopes ─< cg_envelope_points                              │
│             ├─< loading_zones ─< loading_zone_index_entries                     │
│             ├─< fuel_configurations ─< fuel_tanks ─< fuel_index_entries         │
│             ├─< weight_constraints                                              │
│             ├─< flights                                                         │
│             └─< load_plans                                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CARGO & PLANNING                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  air_waybills ─< parcel_groups ─< cargo_items                                   │
│                                                                                 │
│  flights ─< load_plans ─┬─< uld_assignments ─< packed_items                     │
│                         ├─< position_loads                                      │
│                         └─< load_messages                                       │
│                                                                                 │
│  packing_rules (standalone - LLM-interpretable natural language rules)          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Core Entity Definitions

#### 1. `aircrafts` - Aircraft Configuration

```typescript
type Aircraft = {
  id: string; // UUID
  name: string; // e.g., "Airbus A321-211P2F"
  typeCode: string; // ICAO code (e.g., "A321")
  subtype: string; // Variant (e.g., "211P2F")
  registration: string; // Aircraft registration
  mainDeckMaxWeightKg: number; // Main deck weight limit
  lowerDeckMaxWeightKg: number; // Lower deck weight limit
  totalMaxPayloadKg: number; // Total payload capacity
  maxZeroFuelWeightKg: number; // MZFW
  maxTakeoffWeightKg: number; // MTOW
  maxLandingWeightKg: number; // MLW
  operatingEmptyWeightKg: number; // OEW
  macLeadingEdgeCm: number; // MAC reference for CG calc
  macLengthCm: number; // Mean Aerodynamic Chord length
};
```

#### 2. `uld_types` - Container Specifications

```typescript
type UldType = {
  id: string; // UUID
  code: string; // IATA code (e.g., "AKE", "PMC", "PAG")
  name: string; // Full name (e.g., "LD-3 Container")
  category: "CONTAINER" | "PALLET";
  contour: string; // HALF_WIDTH, FULL_WIDTH, CONTOURED
  maxGrossWeightKg: number; // Maximum loaded weight
  tareWeightKg: number; // Empty container weight
  maxVolumeM3: number; // Usable volume in cubic meters
  lengthCm: number; // External dimensions
  widthCm: number;
  heightCm: number;
  colSpan: 1 | 2; // Position column span
  isRefrigerated: boolean; // Temperature controlled capability
  deckCompatibility: string[]; // ["MAIN"], ["LOWER"], or both
};
```

#### 3. `cargo_items` - Individual Cargo Pieces

```typescript
type CargoItem = {
  id: string; // UUID
  awbId: string; // FK to air_waybills
  parcelGroupId: string; // FK to parcel_groups
  pieceNumber: number; // Piece ID within AWB
  weightKg: number; // Piece weight
  lengthCm: number; // Dimensions
  widthCm: number;
  heightCm: number;
  isStackable: boolean; // Can stack items on top
  maxStackWeightKg: number; // Max weight on top
  isDangerousGoods: boolean; // DG indicator
  dgClassId: string; // FK to dangerous_goods_classes
  tempZoneId: string; // FK to temperature_zones
  isLiveAnimal: boolean; // Live animal flag
  isFoodstuff: boolean; // Food item flag
  specialHandlingCodes: string[]; // IATA SHC codes
  priority: "HIGH" | "MEDIUM" | "LOW" | "STANDARD";
  loadStatus: "PENDING" | "ASSIGNED" | "LOADED" | "OFFLOADED";
};
```

#### 4. `load_plans` - Planning Session & Results

```typescript
type LoadPlan = {
  id: string; // UUID
  flightId: string; // FK to flights
  aircraftId: string; // FK to aircrafts
  status: "DRAFT" | "OPTIMIZING" | "OPTIMIZED" | "FINAL" | "RELEASED";
  // Weight calculations
  operatingEmptyWeightKg: number;
  payloadKg: number;
  zeroFuelWeightKg: number;
  takeoffFuelKg: number;
  takeoffWeightKg: number;
  landingWeightKg: number;
  // CG results
  zfwCgPercentMac: number;
  towCgPercentMac: number;
  ldwCgPercentMac: number;
  // Validation
  withinWeightLimits: boolean;
  withinCgEnvelope: boolean;
  constraintsSatisfied: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  optimizationTimeMs: number;
};
```

#### 5. `uld_assignments` - Cargo-to-ULD Mapping

```typescript
type UldAssignment = {
  id: string; // UUID
  loadPlanId: string; // FK to load_plans
  uldTypeId: string; // FK to uld_types
  uldId: string; // FK to ulds (physical ULD)
  uldNumber: string; // ULD identifier
  positionCode: string; // Aircraft position
  sequence: number; // Build-up sequence
  totalWeightKg: number; // Total loaded weight
  tareWeightKg: number; // ULD tare weight
  cargoWeightKg: number; // Cargo weight only
  volumeUsedM3: number; // Volume occupied
  volumeUtilization: number; // % volume used
  weightUtilization: number; // % weight capacity used
  isVirtual: boolean; // Virtual ULD for planning
  status: "PLANNED" | "BUILDING" | "COMPLETE" | "LOADED";
};
```

#### 6. `packed_items` - 3D Packing Coordinates

```typescript
type PackedItem = {
  id: string; // UUID
  uldAssignmentId: string; // FK to uld_assignments
  cargoItemId: string; // FK to cargo_items
  sequence: number; // Packing order
  xPositionCm: number; // X coordinate in ULD
  yPositionCm: number; // Y coordinate in ULD
  zPositionCm: number; // Z coordinate (height)
  rotated: boolean; // Item was rotated
  rotationAxis: "X" | "Y" | "Z"; // Rotation axis
  packedLengthCm: number; // Packed orientation dimensions
  packedWidthCm: number;
  packedHeightCm: number;
};
```

#### 7. `packing_rules` - LLM-Interpretable Rules

```typescript
type PackingRule = {
  id: string; // UUID
  ruleText: string; // Natural language rule
  ruleType: "CONSTRAINT" | "PREFERENCE" | "PROHIBITION";
  priority: number; // 1-100, higher = more important
  category: string; // Rule category
  isActive: boolean;
  examples: string[]; // Example scenarios for LLM
  structuredRule: object; // LLM-parsed structured rule (JSONB)
};

// Example rules:
// - "Dangerous goods (DGR) must not be placed in same ULD as foodstuffs"
// - "Heavy items (>100kg) must be placed at the bottom of the ULD"
// - "Temperature-controlled items must be grouped in refrigerated ULDs"
// - "Class 5.1 oxidizers cannot be mixed with Class 3 flammables"
```

### Cargo Compatibility Rules

The schema supports IATA DGR Table 9.3.A segregation via `dg_segregation_rules`:

| Incompatible Pairs                                | Reason                           |
| ------------------------------------------------- | -------------------------------- |
| Class 1 (Explosives) + most classes               | Safety risk                      |
| Class 5.1 (Oxidizers) + Class 3 (Flammables)      | Spontaneous ignition             |
| Class 8 (Corrosives) + Class 4 (Flammable solids) | Dangerous reaction               |
| Class 6.1/6.2 (Toxic/Infectious) + Foodstuffs     | Contamination                    |
| Different temperature zones                       | Temperature control              |
| Live animals + any ULD cargo                      | Animals go direct to compartment |

### Weight & Balance Support

The schema includes full CG envelope and index calculation support:

- `cg_envelopes` + `cg_envelope_points`: Define valid CG ranges at various weights
- `loading_zones` + `loading_zone_index_entries`: Weight-to-index lookup tables
- `fuel_configurations` + `fuel_tanks` + `fuel_index_entries`: Fuel impact on balance
- `weight_constraints`: Combined position weight limits (e.g., "A1 + A2 + 11 + 12 <= 3674 kg")

---

## Application Pages

### Page Architecture

```
src/app/
├── page.tsx                     # Landing + Session Creation
├── plan/
│   └── [id]/
│       ├── page.tsx             # Main Planning Workspace
│       ├── visualize/
│       │   └── page.tsx         # 2D/3D Visualization
│       └── export/
│           └── page.tsx         # PDF Export
└── rules/
    └── page.tsx                 # Rule Management
```

### Page Specifications

#### P0: Landing Page (`/`)

**Purpose:** Entry point, create new planning session

**Components:**

- Hero section with value proposition
- "New Planning Session" form
  - Aircraft type selector
  - Flight number input
  - Origin/Destination airport codes
- Recent sessions list (if any)
- Sample data loader button

**Key Interactions:**

- Create session → redirects to `/plan/[id]`
- Load sample data → pre-populates with demo cargo

---

#### P0: Main Planning Workspace (`/plan/[id]`)

**Purpose:** Core workspace for cargo input and optimization

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  Header: Flight Info | Status Badge | Actions          │
├─────────────────────┬───────────────────────────────────┤
│                     │                                   │
│   Cargo List        │      Aircraft Overview            │
│   (Scrollable)      │      (Top-down 2D view)          │
│                     │                                   │
│   [+ Add Cargo]     │      Shows ULD positions          │
│                     │      Color-coded by fill %        │
│                     │                                   │
├─────────────────────┴───────────────────────────────────┤
│  Optimization Panel                                     │
│  [Rules Applied] [Run Optimization] [View Results]      │
└─────────────────────────────────────────────────────────┘
```

**Components:**

- `CargoList` - Sortable table of cargo items
- `CargoInputForm` - Modal/drawer for adding cargo
- `AircraftOverview` - 2D top-down aircraft with ULD slots
- `OptimizationControls` - Run optimizer, view stats
- `ResultsSummary` - ULDs used, utilization %, warnings

**Key Interactions:**

- Add/edit/delete cargo items
- Trigger optimization algorithm
- Click ULD position → navigate to visualization
- Real-time stats update

---

#### P0: Visualization Page (`/plan/[id]/visualize`)

**Purpose:** Visual 3D packing representation

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  Header: Back to Plan | ULD Selector | View Controls    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              3D/Isometric ULD View                      │
│                                                         │
│              [Rotate] [Zoom] [Reset]                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Cargo Legend                    │  Packing Stats       │
│  - Item 1: AWB123 (Blue)         │  Volume: 85%        │
│  - Item 2: AWB456 (Green)        │  Weight: 72%        │
│  - ...                           │  Items: 12          │
└─────────────────────────────────────────────────────────┘
```

**Components:**

- `UldViewer3D` - Three.js or isometric canvas view
- `UldSelector` - Dropdown/tabs to switch between ULDs
- `CargoLegend` - Color-coded cargo item list
- `PackingStats` - Utilization metrics
- `ViewControls` - Rotate, zoom, explode view

**Visualization Modes:**

1. **Isometric 2D** (Default) - Fast, CSS-based pseudo-3D
2. **Full 3D** (Stretch) - Three.js with orbit controls

---

#### P1: Export Page (`/plan/[id]/export`)

**Purpose:** Generate PDF build-up instructions

**Components:**

- `ExportPreview` - Preview of generated PDF
- `ExportOptions` - Format selection, sections to include
- `DownloadButton` - Generate and download PDF

**PDF Sections:**

1. Flight summary (aircraft, route, date)
2. ULD summary table (count, types, positions)
3. Per-ULD build-up instructions
   - Cargo loading sequence
   - Weight distribution diagram
   - Special handling notes
4. Cargo manifest

---

#### P2: Rules Management (`/rules`)

**Purpose:** Configure packing rules for LLM interpretation

**Components:**

- `RulesList` - All configured rules with toggle
- `RuleEditor` - Natural language rule input
- `RuleTestPanel` - Test rule against sample scenario

---

## Algorithm Architecture

### Hybrid LLM + Bin-Packing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INPUT                              │
│  Cargo Items + Packing Rules (Natural Language)             │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    LLM RULE PROCESSOR                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Input: Natural language rules                          │  │
│  │ Output: Structured constraints                         │  │
│  │                                                        │  │
│  │ Example:                                               │  │
│  │ "Heavy items must go at bottom"                        │  │
│  │ → { type: "position", condition: "weight > 50kg",      │  │
│  │      constraint: "z = 0" }                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│               BIN-PACKING ALGORITHM                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Algorithm: 3D First Fit Decreasing (FFD)              │  │
│  │                                                        │  │
│  │ 1. Sort cargo by volume (descending)                  │  │
│  │ 2. For each cargo item:                               │  │
│  │    a. Find first ULD with space + weight capacity     │  │
│  │    b. Apply LLM-derived constraints                   │  │
│  │    c. Find valid position (guillotine split)          │  │
│  │    d. If no fit, open new ULD                         │  │
│  │ 3. Optimize: Try rotation for better fit              │  │
│  │ 4. Return packing coordinates                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 LLM OUTPUT GENERATOR                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Input: Packing result + original cargo data           │  │
│  │ Output: Human-readable build-up instructions          │  │
│  │                                                        │  │
│  │ "Start with ULD AKE-12345:                            │  │
│  │  1. Place heavy crate (AWB 123) at base, left side   │  │
│  │  2. Stack medium box (AWB 456) on top...              │  │
│  │  Note: Keep DGR item separated from perishables"      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Algorithm Implementation

```typescript
// Core bin-packing function signature
type PackingResult = {
  assignments: UldAssignment[];
  unassigned: CargoItem[];
  stats: {
    uldsUsed: number;
    avgVolumeUtilization: number;
    avgWeightUtilization: number;
    processingTimeMs: number;
  };
};

async function optimizeLoadPlan(
  cargo: CargoItem[],
  availableUlds: UldType[],
  rules: PackingRule[],
  aircraftPositions: CargoPosition[]
): Promise<PackingResult>;
```

---

## Technical Milestones

### M0: Foundation (Hours 0-2) - CRITICAL PATH

**Goal:** Database schema + sample data + basic UI shell

| Task | Description                                         | Output                    | Status |
| ---- | --------------------------------------------------- | ------------------------- | ------ |
| M0.1 | Define Drizzle schema for all entities (30+ tables) | `src/lib/db/schema.ts`    | DONE   |
| M0.2 | Create database schema documentation                | `docs/DATABASE_SCHEMA.md` | DONE   |
| M0.3 | Create seed script with realistic sample data       | `scripts/seed.ts`         | TODO   |
| M0.4 | Run database migrations                             | Drizzle migrate           | TODO   |
| M0.5 | Set up feature folder structure                     | `src/features/*`          | TODO   |
| M0.6 | Create basic page routes (empty shells)             | Route files               | TODO   |
| M0.7 | Implement session creation flow                     | Working `/` page          | TODO   |

**Schema Entities Implemented:**

- Reference Data: `locations`, `commodity_codes`, `dangerous_goods_classes`, `dg_segregation_rules`, `temperature_zones`
- ULD & Aircraft: `uld_types`, `ulds`, `aircrafts`, `deck_configurations`, `loading_positions`, `flights`
- Weight & Balance: `cg_envelopes`, `cg_envelope_points`, `loading_zones`, `loading_zone_index_entries`, `fuel_configurations`, `fuel_tanks`, `fuel_index_entries`, `weight_constraints`
- Cargo: `air_waybills`, `parcel_groups`, `cargo_items`
- Planning: `load_plans`, `uld_assignments`, `packed_items`, `position_loads`, `packing_rules`
- Messaging: `load_messages`

**Deliverable:** Can create a session and see sample cargo data

---

### M1: Core Algorithm (Hours 2-6) - CRITICAL PATH

**Goal:** Working bin-packing with LLM integration

| Task | Description                               | Output               |
| ---- | ----------------------------------------- | -------------------- |
| M1.1 | Implement 3D FFD bin-packing algorithm    | `algorithm.ts`       |
| M1.2 | Create LLM prompt for rule interpretation | `prompts.ts`         |
| M1.3 | Build optimization server action          | `optimize.action.ts` |
| M1.4 | Wire up to planning workspace             | Working optimization |
| M1.5 | Display results summary                   | Stats panel          |

**Deliverable:** Click "Optimize" → get valid ULD assignments

---

### M2: Visualization (Hours 6-12) - HIGH IMPACT

**Goal:** Impressive visual representation

| Task | Description                                | Output               |
| ---- | ------------------------------------------ | -------------------- |
| M2.1 | Create isometric ULD component             | `UldIsometric.tsx`   |
| M2.2 | Implement cargo item rendering with colors | Color-coded boxes    |
| M2.3 | Add aircraft top-down view                 | `AircraftLayout.tsx` |
| M2.4 | Create ULD position indicators             | Clickable positions  |
| M2.5 | Add hover states and tooltips              | Interactive details  |

**Deliverable:** Visual packing view with interactivity

---

### M3: Polish (Hours 12-18) - QUALITY

**Goal:** Professional finish and exports

| Task | Description                           | Output             |
| ---- | ------------------------------------- | ------------------ |
| M3.1 | Add loading/optimizing animations     | Skeleton states    |
| M3.2 | Implement PDF export with react-pdf   | PDF generation     |
| M3.3 | Create build-up instruction format    | Instruction layout |
| M3.4 | Add toast notifications               | User feedback      |
| M3.5 | Implement cargo drag-and-drop reorder | Enhanced UX        |

**Deliverable:** Polished UX with PDF export

---

### M4: WOW Factor (Hours 18-24) - STRETCH

**Goal:** Hackathon-winning features

| Task | Description                          | Output            |
| ---- | ------------------------------------ | ----------------- |
| M4.1 | Upgrade to Three.js 3D visualization | `UldViewer3D.tsx` |
| M4.2 | Add real-time optimization animation | Visual algorithm  |
| M4.3 | Implement "exploded view" for ULD    | Dramatic reveal   |
| M4.4 | Add before/after comparison          | Impact showcase   |
| M4.5 | Create demo mode with guided tour    | Judge-friendly    |

**Deliverable:** Jaw-dropping demo experience

---

## WOW Factor Elements

### Visual Impact Priorities

1. **Real-time Optimization Animation**

   - Show cargo "flying" into ULDs during optimization
   - Progress indicator with live stats
   - Satisfying completion animation

2. **3D Exploded View**

   - Click to "explode" ULD showing all cargo separated
   - Each piece animates out with label
   - Reassembles on click

3. **Before/After Toggle**

   - Split screen or slider comparison
   - "Manual planning: 8 ULDs" vs "Optimized: 5 ULDs"
   - Cost savings calculator ($150 × 3 = $450 saved!)

4. **Interactive Aircraft View**

   - Rotate aircraft, see load distribution
   - Weight balance indicator (CG visualization)
   - Click positions to drill into ULD

5. **AI Explanation Panel**
   - "Why this arrangement?"
   - LLM generates plain English explanation
   - Highlights rule applications

### Demo Flow Script

```
1. "Let me show you the problem..."
   → Show unoptimized cargo list (20 items)

2. "Traditional planning would use 8 ULDs..."
   → Display manual estimate

3. "Watch our AI optimize in real-time..."
   → Click optimize, show animation

4. "Result: Only 5 ULDs needed!"
   → Reveal savings: $450 per flight

5. "Let's look inside ULD #1..."
   → 3D visualization, exploded view

6. "The AI explains its decisions..."
   → Show LLM-generated instructions
```

---

## Dependencies & Tech Decisions

| Concern          | Decision              | Rationale                            |
| ---------------- | --------------------- | ------------------------------------ |
| 3D Rendering     | React Three Fiber     | Best React integration for Three.js  |
| PDF Generation   | @react-pdf/renderer   | Pure React PDF creation              |
| LLM Integration  | OpenAI API            | Fast, reliable, good at instructions |
| State Management | React Query + Zustand | Server state + client state split    |
| Animations       | Framer Motion         | Smooth, declarative animations       |

---

## Risk Mitigation

| Risk              | Mitigation                              |
| ----------------- | --------------------------------------- |
| 3D takes too long | Fallback to polished isometric view     |
| LLM latency       | Pre-compute common rule interpretations |
| Algorithm bugs    | Extensive sample data testing           |
| Time pressure     | Strict milestone cutoffs, MVP-first     |

---

## Success Metrics

| Metric             | Target                             |
| ------------------ | ---------------------------------- |
| ULD reduction      | 20-30% fewer ULDs vs naive packing |
| Volume utilization | >80% average                       |
| Optimization time  | <3 seconds for 50 cargo items      |
| Demo impact        | "Wow" reaction from judges         |
