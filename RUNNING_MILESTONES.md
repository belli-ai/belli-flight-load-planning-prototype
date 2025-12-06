# Flight Load Planning - Technical Milestones

> **Hackathon Context:** 24-hour build | Hybrid LLM + Algorithm approach | Maximum WOW factor

## Project Overview

An intelligent cargo load planning system that optimizes ULD (Unit Load Device) packing to minimize container count while maximizing capacity utilization. The system uses a hybrid approach combining traditional bin-packing algorithms for spatial optimization with LLM integration for natural language rule interpretation and human-readable output generation.

### Core Value Proposition

| Problem | Our Solution |
|---------|--------------|
| ~20% wasted cargo capacity | AI-optimized bin-packing algorithm |
| Manual spreadsheet planning | Automated optimization with visual feedback |
| $50-150 handling fees per extra ULD | Minimize ULD count through intelligent packing |
| Time pressure decisions | Real-time optimization with instant results |

---

## Data Architecture

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│  aircraft_types │       │    uld_types    │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ model           │       │ code            │
│ cargo_positions │       │ dimensions      │
│ max_payload     │       │ max_weight      │
└────────┬────────┘       │ tare_weight     │
         │                └────────┬────────┘
         │                         │
         │    ┌─────────────────┐  │
         └───►│  load_sessions  │◄─┘
              │─────────────────│
              │ id (PK)         │
              │ aircraft_type   │───────────────┐
              │ status          │               │
              │ created_at      │               │
              └────────┬────────┘               │
                       │                        │
         ┌─────────────┴─────────────┐          │
         │                           │          │
         ▼                           ▼          │
┌─────────────────┐       ┌─────────────────┐   │
│  cargo_items    │       │ uld_assignments │   │
│─────────────────│       │─────────────────│   │
│ id (PK)         │       │ id (PK)         │   │
│ session_id (FK) │       │ session_id (FK) │   │
│ awb             │       │ uld_type_id(FK) │───┘
│ dimensions      │       │ position        │
│ weight          │       │ cargo_ids[]     │
│ priority        │       │ total_weight    │
│ special_handling│       │ volume_used     │
└─────────────────┘       └─────────────────┘

┌─────────────────┐
│  packing_rules  │
│─────────────────│
│ id (PK)         │
│ rule_text       │  ← Natural language for LLM
│ rule_type       │
│ priority        │
│ is_active       │
└─────────────────┘
```

### Data Entity Definitions

#### 1. `aircraft_types` - Aircraft Specifications

```typescript
type AircraftType = {
  id: string;                    // UUID
  model: string;                 // e.g., "Boeing 777F", "Airbus A330-200F"
  maxPayloadKg: number;          // Maximum cargo weight capacity
  cargoPositions: CargoPosition[]; // Available ULD positions in cargo hold
  compatibleUldTypes: string[];  // ULD type codes compatible with this aircraft
};

type CargoPosition = {
  id: string;                    // Position identifier (e.g., "11L", "21R")
  deck: "main" | "lower";        // Main deck or lower hold
  maxWeightKg: number;           // Position weight limit
  acceptedContours: string[];    // Compatible ULD contours
  xOffset: number;               // Position for visualization (longitudinal)
  yOffset: number;               // Position for visualization (lateral)
};
```

#### 2. `uld_types` - Container Specifications

```typescript
type UldType = {
  id: string;                    // UUID
  code: string;                  // IATA code (e.g., "AKE", "PMC", "PAG")
  name: string;                  // Full name (e.g., "LD3 Container")
  contour: string;               // Shape classification
  dimensions: Dimensions;        // Internal dimensions
  maxGrossWeightKg: number;      // Maximum loaded weight
  tareWeightKg: number;          // Empty container weight
  volumeM3: number;              // Usable volume in cubic meters
};

type Dimensions = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};
```

#### 3. `cargo_items` - Individual Cargo Pieces

```typescript
type CargoItem = {
  id: string;                    // UUID
  sessionId: string;             // FK to load_sessions
  awb: string;                   // Air Waybill number
  description: string;           // Cargo description
  dimensions: Dimensions;        // Piece dimensions
  weightKg: number;              // Piece weight
  priority: "high" | "medium" | "low";
  specialHandling: SpecialHandling[];
  destination: string;           // Airport code
  isFragile: boolean;
  stackable: boolean;            // Can other items be placed on top
};

type SpecialHandling = 
  | "DGR"      // Dangerous goods
  | "PER"      // Perishable
  | "VAL"      // Valuable
  | "HEA"      // Heavy
  | "OHG"      // Overhanging
  | "TEMP";    // Temperature controlled
```

#### 4. `load_sessions` - Planning Session State

```typescript
type LoadSession = {
  id: string;                    // UUID
  aircraftTypeId: string;        // FK to aircraft_types
  flightNumber: string;          // e.g., "GA100"
  origin: string;                // Airport code
  destination: string;           // Airport code
  status: "draft" | "optimizing" | "optimized" | "finalized";
  createdAt: Date;
  updatedAt: Date;
  optimizationResult?: OptimizationResult;
};

type OptimizationResult = {
  totalUldsUsed: number;
  volumeUtilization: number;     // Percentage
  weightUtilization: number;     // Percentage
  unassignedCargo: string[];     // Cargo IDs that couldn't fit
  optimizationTimeMs: number;
};
```

#### 5. `uld_assignments` - Cargo-to-ULD Mapping

```typescript
type UldAssignment = {
  id: string;                    // UUID
  sessionId: string;             // FK to load_sessions
  uldTypeId: string;             // FK to uld_types
  position: string;              // Aircraft position ID
  cargoIds: string[];            // Array of cargo_item IDs
  totalWeightKg: number;         // Sum of cargo weights + tare
  volumeUsedM3: number;          // Volume occupied
  packingCoordinates: PackedItem[]; // 3D positions for visualization
};

type PackedItem = {
  cargoId: string;
  x: number;                     // Position within ULD
  y: number;
  z: number;
  rotated: boolean;              // Whether item was rotated to fit
};
```

#### 6. `packing_rules` - LLM-Interpretable Rules

```typescript
type PackingRule = {
  id: string;                    // UUID
  ruleText: string;              // Natural language rule
  ruleType: "constraint" | "preference" | "prohibition";
  priority: number;              // Higher = more important
  isActive: boolean;
  examples?: string[];           // Example scenarios for LLM context
};

// Example rules:
// - "Dangerous goods (DGR) must not be placed adjacent to perishables (PER)"
// - "High priority cargo should be loaded last for easy access"
// - "Heavy items (>100kg) must be placed at the bottom of the ULD"
// - "Temperature-controlled items must be grouped together"
```

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

| Task | Description | Output |
|------|-------------|--------|
| M0.1 | Define Drizzle schema for all 6 entities | `schema.ts` |
| M0.2 | Create seed script with realistic sample data | `seed.ts` |
| M0.3 | Set up feature folder structure | `src/features/*` |
| M0.4 | Create basic page routes (empty shells) | Route files |
| M0.5 | Implement session creation flow | Working `/` page |

**Deliverable:** Can create a session and see sample cargo data

---

### M1: Core Algorithm (Hours 2-6) - CRITICAL PATH

**Goal:** Working bin-packing with LLM integration

| Task | Description | Output |
|------|-------------|--------|
| M1.1 | Implement 3D FFD bin-packing algorithm | `algorithm.ts` |
| M1.2 | Create LLM prompt for rule interpretation | `prompts.ts` |
| M1.3 | Build optimization server action | `optimize.action.ts` |
| M1.4 | Wire up to planning workspace | Working optimization |
| M1.5 | Display results summary | Stats panel |

**Deliverable:** Click "Optimize" → get valid ULD assignments

---

### M2: Visualization (Hours 6-12) - HIGH IMPACT

**Goal:** Impressive visual representation

| Task | Description | Output |
|------|-------------|--------|
| M2.1 | Create isometric ULD component | `UldIsometric.tsx` |
| M2.2 | Implement cargo item rendering with colors | Color-coded boxes |
| M2.3 | Add aircraft top-down view | `AircraftLayout.tsx` |
| M2.4 | Create ULD position indicators | Clickable positions |
| M2.5 | Add hover states and tooltips | Interactive details |

**Deliverable:** Visual packing view with interactivity

---

### M3: Polish (Hours 12-18) - QUALITY

**Goal:** Professional finish and exports

| Task | Description | Output |
|------|-------------|--------|
| M3.1 | Add loading/optimizing animations | Skeleton states |
| M3.2 | Implement PDF export with react-pdf | PDF generation |
| M3.3 | Create build-up instruction format | Instruction layout |
| M3.4 | Add toast notifications | User feedback |
| M3.5 | Implement cargo drag-and-drop reorder | Enhanced UX |

**Deliverable:** Polished UX with PDF export

---

### M4: WOW Factor (Hours 18-24) - STRETCH

**Goal:** Hackathon-winning features

| Task | Description | Output |
|------|-------------|--------|
| M4.1 | Upgrade to Three.js 3D visualization | `UldViewer3D.tsx` |
| M4.2 | Add real-time optimization animation | Visual algorithm |
| M4.3 | Implement "exploded view" for ULD | Dramatic reveal |
| M4.4 | Add before/after comparison | Impact showcase |
| M4.5 | Create demo mode with guided tour | Judge-friendly |

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

| Concern | Decision | Rationale |
|---------|----------|-----------|
| 3D Rendering | React Three Fiber | Best React integration for Three.js |
| PDF Generation | @react-pdf/renderer | Pure React PDF creation |
| LLM Integration | OpenAI API | Fast, reliable, good at instructions |
| State Management | React Query + Zustand | Server state + client state split |
| Animations | Framer Motion | Smooth, declarative animations |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| 3D takes too long | Fallback to polished isometric view |
| LLM latency | Pre-compute common rule interpretations |
| Algorithm bugs | Extensive sample data testing |
| Time pressure | Strict milestone cutoffs, MVP-first |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| ULD reduction | 20-30% fewer ULDs vs naive packing |
| Volume utilization | >80% average |
| Optimization time | <3 seconds for 50 cargo items |
| Demo impact | "Wow" reaction from judges |

