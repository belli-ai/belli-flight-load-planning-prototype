# Cargo Feature

## Purpose

Manages air waybills, parcel groups, and individual cargo items for shipment tracking and ULD build-up optimization. This feature handles cargo data entry, validation, classification, and provides cargo items to the planning optimization algorithm.

## Domain Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `AirWaybill` | AWB header information | `awbNumber`, `totalWeightKg`, `totalPieces`, `status` |
| `ParcelGroup` | Identical pieces within AWB | `pieces`, `dimensions`, `commodityCodeId`, `isStackable` |
| `CargoItem` | Individual piece for packing | `weightKg`, `dimensions`, `priority`, `loadStatus` |

## Structure

```
cargo/
├── CURSOR.md
├── types.ts                    # Type definitions
├── index.ts                    # Public exports
├── components/                 # UI components
│   ├── CargoList.tsx           # Cargo items table
│   ├── CargoCard.tsx           # Single cargo display
│   ├── CargoInputForm.tsx      # Add/edit cargo modal
│   ├── AwbLookup.tsx           # AWB search/autocomplete
│   ├── BulkCargoInput.tsx      # Quick bulk entry
│   ├── SpecialHandlingBadge.tsx # SHC display
│   └── CargoStats.tsx          # Statistics summary
├── actions/                    # Server actions
│   ├── cargo.actions.ts        # CRUD operations
│   ├── awb.actions.ts          # AWB operations
│   └── import-cargo.actions.ts # Bulk import
├── hooks/                      # Data fetching hooks
│   ├── use-cargo-items.ts
│   ├── use-awb.ts
│   └── use-cargo-stats.ts
└── lib/                        # Business logic
    ├── cargo-validation.ts     # Input validation
    ├── shc-parser.ts           # Special handling code parsing
    └── volume-calculator.ts    # Volume calculations
```

## Key Responsibilities

### 1. AWB Management
- Create and track air waybills
- Link AWBs to origin/destination locations
- Calculate totals from parcel groups

### 2. Parcel Group Management
- Group identical pieces for efficiency
- Calculate per-piece weights from totals
- Map commodity codes to special handling

### 3. Cargo Item Management
- Create individual items for optimization
- Track assignment status (pending → assigned → loaded)
- Support priority-based sorting

### 4. Cargo Classification
- Identify dangerous goods from commodity codes
- Parse special handling codes
- Apply temperature zone requirements

### 5. Cargo Input/Forms
- AWB data entry form
- Bulk cargo quick entry
- Import from external systems (future)

## Usage Examples

### Create Cargo from AWB
```typescript
import { createCargoFromAwb } from "@/features/cargo";

const awbData: CargoInput = {
  awbNumber: "123-45678901",
  originCode: "SIN",
  destinationCode: "HKG",
  groups: [
    {
      pieces: 5,
      weightKg: 250,
      lengthCm: 120,
      widthCm: 80,
      heightCm: 100,
      isStackable: true,
    },
  ],
};

const { awb, cargoItems } = await createCargoFromAwb(awbData);
```

### Get Cargo for Optimization
```typescript
import { getCargoForPacking } from "@/features/cargo";

const cargo = await getCargoForPacking(loadPlanId);
// Returns CargoItemForPacking[] with lightweight fields
```

### Display Cargo List
```typescript
import { CargoList, useCargoItems } from "@/features/cargo";

function CargoPanel({ loadPlanId }: { loadPlanId: string }) {
  const { items, isLoading, refetch } = useCargoItems(loadPlanId);

  return (
    <CargoList
      items={items}
      onEdit={(item) => openEditModal(item)}
      onDelete={(id) => deleteCargo(id)}
      onPriorityChange={(id, priority) => updatePriority(id, priority)}
    />
  );
}
```

## Cargo List Component

The `CargoList` component displays cargo items in a sortable table:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Cargo Items                                              [+ Add Cargo]      │
├─────────────────────────────────────────────────────────────────────────────┤
│ AWB           │ Pcs │ Weight │ Dims (L×W×H)   │ SHC     │ Priority │ Status │
├───────────────┼─────┼────────┼────────────────┼─────────┼──────────┼────────┤
│ 123-45678901  │  5  │ 250 kg │ 120×80×100     │ HEA     │ HIGH     │ ⏳     │
│ 123-45678902  │  3  │ 150 kg │ 60×40×50       │ PER,COL │ STANDARD │ ✓      │
│ 123-45678903  │ 10  │ 500 kg │ 80×60×70       │ DGR     │ MEDIUM   │ ⏳     │
└───────────────┴─────┴────────┴────────────────┴─────────┴──────────┴────────┘
│ Total: 18 pieces │ 900 kg │ Assigned: 3 │ Pending: 15                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- Sortable by weight, priority, status
- Filter by status, SHC, DG
- Inline priority editing
- Click row to view details
- Bulk selection for operations

## Special Handling Codes

Common IATA SHC codes supported:

| Code | Category | Description |
|------|----------|-------------|
| DGR | Dangerous | Dangerous goods requiring DG documentation |
| PER | Perishable | Perishable cargo |
| COL | Temperature | Cool goods (2-8°C) |
| FRO | Temperature | Frozen goods (<-18°C) |
| AVI | Live | Live animals |
| VAL | Security | Valuable cargo |
| HEA | Handling | Heavy cargo (>150kg/piece) |
| OHG | Handling | Overhanging cargo |
| AOG | Priority | Aircraft on ground - urgent |

## Cargo Validation Rules

1. **Weight validation**
   - Piece weight > 0
   - Total weight = sum of parcel group weights
   - Weight within ULD limits for assignment

2. **Dimension validation**
   - All dimensions > 0
   - Fits within target ULD internal dimensions
   - Volume = L × W × H / 1,000,000 (m³)

3. **DG validation**
   - If isDangerousGoods, must have dgClassId
   - DG class must be valid IATA class

4. **Temperature validation**
   - If tempZoneId set, validate against ULD type (must be refrigerated)

## Integration Points

| Feature | Integration |
|---------|-------------|
| Reference Data | Uses commodity codes, DG classes, temp zones |
| Aircraft | Cargo items assigned to ULDs at positions |
| Planning | Provides cargo items for optimization algorithm |

## Data Flow

```
AWB Entry → ParcelGroups → CargoItems → Optimization → UldAssignments
    ↓           ↓              ↓             ↓              ↓
 [BOOKED]   [Created]     [PENDING]    [ASSIGNED]      [LOADED]
```

## Performance Considerations

- **Paginate large cargo lists**: >100 items should paginate
- **Batch create items**: Create all pieces in single transaction
- **Cache AWB lookups**: Frequently accessed AWB data
- **Optimize stats queries**: Use aggregates, not client-side calculation

