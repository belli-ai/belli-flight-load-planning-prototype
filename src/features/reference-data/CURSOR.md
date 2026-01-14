# Reference Data Feature

## Purpose

Manages static lookup data used across the application for airports, commodity classifications, dangerous goods segregation rules, and temperature zones. This feature provides the foundational reference tables that other features depend on for validation and compatibility checks.

## Domain Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `Location` | Airport/location master data | `airportCode`, `city`, `country`, `timezone` |
| `CommodityCode` | IATA commodity classifications | `code`, `isDangerousGoods`, `specialHandlingCodes[]` |
| `DangerousGoodsClass` | IATA DGR classes (1-9) | `classCode`, `division`, `isExemptFromSegregation` |
| `DgSegregationRule` | Table 9.3.A segregation matrix | `classAId`, `classBId`, `isSegregated` |
| `TemperatureZone` | Temperature range definitions | `code`, `minTempCelsius`, `maxTempCelsius` |

## Structure

```
reference-data/
├── CURSOR.md
├── types.ts              # Type definitions
├── index.ts              # Public exports
├── components/           # UI components
│   ├── LocationSelect.tsx
│   ├── CommodityCodeSelect.tsx
│   └── DgClassBadge.tsx
├── actions/              # Server actions
│   └── reference-data.actions.ts
├── hooks/                # Data fetching hooks
│   ├── use-locations.ts
│   ├── use-commodity-codes.ts
│   └── use-dg-classes.ts
└── lib/                  # Business logic
    └── compatibility.ts  # Cargo compatibility checks
```

## Key Responsibilities

### 1. Location Management
- Provide airport code autocomplete/search
- Support timezone-aware date/time calculations
- Cache location data for performance

### 2. Commodity Code Lookup
- Fast commodity code search by code or description
- Filter by dangerous goods status
- Map commodity codes to special handling requirements

### 3. Dangerous Goods Segregation
- Implement IATA Table 9.3.A lookup
- Determine if two DG classes can be mixed in same ULD
- Provide segregation rule explanations

### 4. Temperature Zone Compatibility
- Check if cargo items with different temperature requirements can be mixed
- Validate temperature-controlled cargo against ULD type capabilities

## Usage Examples

### Check DG Segregation
```typescript
import { canMixDgClasses } from "@/features/reference-data";

const canMix = await canMixDgClasses("5.1", "3"); // false - oxidizers + flammables
```

### Check Temperature Compatibility
```typescript
import { areTempZonesCompatible } from "@/features/reference-data";

const compatible = areTempZonesCompatible("FROZEN", "CHILLED"); // false
```

### Location Autocomplete
```typescript
import { useLocations } from "@/features/reference-data";

const { locations, isLoading } = useLocations({ search: "SIN" });
```

## Cargo Compatibility Rules

Based on IATA DGR and ULD build-up regulations:

### Dangerous Goods Segregation (Table 9.3.A)
- **Class 1 (Explosives)**: Cannot mix with most other classes
- **Class 5.1 (Oxidizers) + Class 3 (Flammables)**: PROHIBITED - spontaneous ignition risk
- **Class 8 (Corrosives) + Class 4 (Flammable solids)**: PROHIBITED - dangerous reaction
- **Exempt classes**: 1.4S, 6, 7, and 9 are typically exempt from segregation

### Temperature Incompatibility
- **Frozen cargo** cannot mix with **chilled** or **ambient**
- **Chilled cargo** cannot mix with **ambient**
- Temperature-controlled cargo requires refrigerated ULD types (RKN, RAP)

### Food Safety (49 CFR 175.630)
- **Class 6.1/6.2 (Toxic/Infectious)** cannot mix with **foodstuffs**
- **Class 2.3 (Poisonous gases)** cannot mix with **foodstuffs**

### Live Animals
- **Live animals cannot be loaded into ULDs** - go directly to aircraft compartments
- Excluded from ULD build-up optimization entirely

## Integration Points

| Feature | Integration |
|---------|-------------|
| Cargo | Uses commodity codes for classification, DG classes for cargo items |
| Planning | Uses segregation rules for ULD compatibility validation |
| Aircraft | Uses locations for flight origin/destination |

## Performance Considerations

- **Cache aggressively**: Reference data changes infrequently
- **Preload on app start**: Locations, DG classes, temp zones
- **Index by code**: Fast lookup by airport code, commodity code

## Seed Data Requirements

The following reference data must be seeded:

1. **Locations**: Major airports (at minimum: origin/destination for demo flights)
2. **Commodity Codes**: Common cargo types with DG/SHC mappings
3. **DG Classes**: All IATA DGR classes (1.1 through 9)
4. **Segregation Rules**: Full Table 9.3.A matrix
5. **Temperature Zones**: DEEP_FROZEN, FROZEN, CHILLED, COOL, AMBIENT

