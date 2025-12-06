# features/ Directory

## Purpose

Contains feature-domain modules that encapsulate business logic, components, hooks, and actions for specific domains of the application. Each feature is self-contained and exports a public API through its `index.ts`.

## Structure

```
features/
├── CURSOR.md
├── reference-data/       # Static lookup data (locations, DG classes, etc.)
├── aircraft/             # Aircraft configs, ULDs, positions, flights
├── cargo/                # AWBs, parcel groups, cargo items
├── planning/             # Load plans, optimization, ULD assignments
├── weight-balance/       # CG envelopes, fuel, weight constraints
└── messaging/            # IATA messages (LDM, CPM, UCM)
```

## Feature Domains

| Feature | Description | Key Entities |
|---------|-------------|--------------|
| `reference-data` | Static lookup data | Locations, Commodity Codes, DG Classes, Temp Zones |
| `aircraft` | Aircraft & ULD management | Aircrafts, Decks, Positions, ULD Types, ULDs, Flights |
| `cargo` | Cargo shipment data | Air Waybills, Parcel Groups, Cargo Items |
| `planning` | Load optimization | Load Plans, ULD Assignments, Packed Items, Rules |
| `weight-balance` | Weight & balance calcs | CG Envelopes, Loading Zones, Fuel, Constraints |
| `messaging` | IATA messages | Load Messages (LDM, CPM, UCM) |

## Feature Module Structure

Each feature follows this structure:

```
feature-name/
├── CURSOR.md             # Feature documentation
├── types.ts              # TypeScript type definitions
├── index.ts              # Public exports
├── components/           # React components
│   └── *.tsx
├── actions/              # Server actions
│   └── *.actions.ts
├── hooks/                # React hooks
│   └── use-*.ts
└── lib/                  # Business logic
    └── *.ts
```

## Guidelines

### Creating a New Feature

1. Create the feature folder under `features/`
2. Add `CURSOR.md` with feature documentation
3. Define types in `types.ts`
4. Create `index.ts` with public exports
5. Add components, actions, hooks as needed

### Feature Dependencies

Features can import from:
- `@/lib/*` - Core utilities and database
- `@/components/ui/*` - Shared UI components
- Other features (via their `index.ts` exports)

```typescript
// Good: Import from feature public API
import { Aircraft, useAircraft } from "@/features/aircraft";

// Bad: Import from feature internals
import { Aircraft } from "@/features/aircraft/types";
```

### Type Definitions

- Define all entity types in `types.ts`
- Export both main types and "New" variants (for inserts)
- Use const objects for enum-like values
- Include related types (WithDetails, ForPacking, etc.)

### Server Actions

- Name files with `.actions.ts` suffix
- Use `"use server"` directive
- Return typed responses
- Handle errors gracefully

### Hooks

- Name files with `use-` prefix
- Use React Query for data fetching
- Return loading/error states
- Provide refetch capabilities

## Import Aliases

```typescript
// Feature imports
import { LoadPlan, useLoadPlan } from "@/features/planning";
import { Aircraft } from "@/features/aircraft";
import { CargoItem } from "@/features/cargo";

// UI component imports
import { Button } from "@/components/ui/button";

// Utility imports
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
```

## Feature Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        reference-data                            │
│  (locations, commodity codes, DG classes, temp zones)           │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    aircraft     │  │     cargo       │  │  weight-balance │
│                 │  │                 │  │                 │
│  - Aircrafts    │  │  - AWBs         │  │  - CG Envelopes │
│  - ULD Types    │  │  - Parcel Grps  │  │  - Fuel Config  │
│  - Positions    │  │  - Cargo Items  │  │  - Constraints  │
│  - Flights      │  │                 │  │                 │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
               ┌─────────────────────────┐
               │        planning         │
               │                         │
               │  - Load Plans           │
               │  - ULD Assignments      │
               │  - Packed Items         │
               │  - Optimization         │
               └────────────┬────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │       messaging         │
               │                         │
               │  - LDM, CPM, UCM        │
               │  - Message Generation   │
               └─────────────────────────┘
```

## Milestone Alignment

From `RUNNING_MILESTONES.md`:

| Milestone | Primary Feature(s) |
|-----------|-------------------|
| M0: Foundation | All features (schema, types) |
| M1: Core Algorithm | `planning` (optimization) |
| M2: Visualization | `planning`, `aircraft` (components) |
| M3: Polish | `messaging` (exports), `cargo` (UX) |
| M4: WOW Factor | `planning` (3D visualization) |

