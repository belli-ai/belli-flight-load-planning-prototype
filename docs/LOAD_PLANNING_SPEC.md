# Flight Load Planning Optimization Software - Data Model Specification

## Table of Contents

1. [Overview](#overview)
2. [Industry Standards Reference](#industry-standards-reference)
3. [Aircraft Configuration](#aircraft-configuration)
4. [CG Envelope](#cg-envelope)
5. [Deck Configuration](#deck-configuration)
6. [Loading Positions](#loading-positions)
7. [Loading Zones & Index Tables](#loading-zones--index-tables)
8. [ULD Types](#uld-types)
9. [Weight Constraints](#weight-constraints)
10. [Fuel Configuration](#fuel-configuration)
11. [Cargo Items](#cargo-items)
12. [Load Plan](#load-plan)
13. [Entity Relationship Diagram](#entity-relationship-diagram)

---

## Overview

This document defines the data model for a flight load planning optimization system. The model is derived from:

- The Raya Airways A321-211P2F Load and Trim Sheet (LS-A321-00-002 Rev. IR)
- IATA industry standards and regulations
- Aviation weight and balance best practices

---

## Industry Standards Reference

### Key IATA Publications

| Publication                         | Current Edition | Description                                                               |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------- |
| AHM (Airport Handling Manual)       | 46th (2026)     | Requirements for passenger, cargo & mail, aircraft handling, load control |
| ULDR (Unit Load Device Regulations) | 14th (2026)     | ULD specifications and regulations                                        |
| ICHM (Cargo Handling Manual)        | 10th (2026)     | Cargo handling procedures                                                 |
| Cargo-XML Toolkit                   | 14th (2026)     | Data exchange standards                                                   |

### Key Principles

> "Weight and balance calculations are a foundational element in aviation safety and operational efficiency. Load planning systems rely on these calculations to ensure that an aircraft operates within its certified limits."

---

## Aircraft Configuration

### Entity: `Aircraft`

| Field                      | Type       | Description                          | Example                    |
| -------------------------- | ---------- | ------------------------------------ | -------------------------- |
| `aircraft_id`              | UUID       | Primary key                          | -                          |
| `aircraft_type`            | string     | ICAO type designator                 | `"A321"`                   |
| `aircraft_subtype`         | string     | Variant/conversion type              | `"211P2F"`                 |
| `msn_numbers`              | array[int] | Applicable MSN range                 | `[1887, 1972]`             |
| `document_revision`        | string     | Load sheet document reference        | `"LS-A321-00-002 Rev. IR"` |
| `datum_location`           | string     | Reference point for arm measurements | `"NOSE"`                   |
| `mac_leading_edge_station` | float      | MAC reference (inches/cm)            | -                          |
| `mac_length_cm`            | float      | Mean Aerodynamic Chord length        | -                          |

### Weight Limits

| Field                       | Type  | Unit | Description                     |
| --------------------------- | ----- | ---- | ------------------------------- |
| `max_zero_fuel_weight_kg`   | float | kg   | Maximum weight without fuel     |
| `max_takeoff_weight_kg`     | float | kg   | Maximum takeoff weight (MTOW)   |
| `max_landing_weight_kg`     | float | kg   | Maximum landing weight (MLW)    |
| `max_taxi_weight_kg`        | float | kg   | Maximum taxi/ramp weight        |
| `operating_empty_weight_kg` | float | kg   | Aircraft empty weight with crew |

### JSON Schema

```json
{
  "aircraft": {
    "aircraft_id": "uuid",
    "aircraft_type": "A321",
    "aircraft_subtype": "211P2F",
    "msn_numbers": [1887, 1972],
    "document_revision": "LS-A321-00-002 Rev. IR",
    "datum_location": "NOSE",
    "mac_leading_edge_station": 0.0,
    "mac_length_cm": 0.0,
    "max_zero_fuel_weight_kg": 0.0,
    "max_takeoff_weight_kg": 0.0,
    "max_landing_weight_kg": 0.0,
    "max_taxi_weight_kg": 0.0,
    "operating_empty_weight_kg": 0.0
  }
}
```

---

## CG Envelope

The CG envelope defines the acceptable center of gravity range at various aircraft weights.

> "The most notable aspect of this system is the use of a C.G. envelope which has been normalized so the forward limit is zero and the aft limit is 100 on a scale designated as 'aft index.'"

### Entity: `CgEnvelope`

| Field                       | Type           | Description                       |
| --------------------------- | -------------- | --------------------------------- |
| `envelope_id`               | UUID           | Primary key                       |
| `aircraft_id`               | UUID           | Foreign key to Aircraft           |
| `envelope_type`             | enum           | `TAKEOFF`, `ZERO_FUEL`, `LANDING` |
| `forward_limit_percent_mac` | float          | Forward CG limit                  |
| `aft_limit_percent_mac`     | float          | Aft CG limit                      |
| `envelope_points`           | array[CgPoint] | Polygon defining envelope         |

### Entity: `CgPoint`

| Field                     | Type  | Unit  | Description                   |
| ------------------------- | ----- | ----- | ----------------------------- |
| `weight_kg`               | float | kg    | Aircraft weight at this point |
| `cg_position_percent_mac` | float | % MAC | CG position                   |
| `cg_position_index`       | float | I.U.  | Index units (if applicable)   |

### JSON Schema

```json
{
  "cg_envelope": {
    "envelope_id": "uuid",
    "aircraft_id": "uuid",
    "envelope_type": "TAKEOFF",
    "forward_limit_percent_mac": 15.0,
    "aft_limit_percent_mac": 38.0,
    "envelope_points": [
      { "weight_kg": 50000, "cg_position_percent_mac": 18.0 },
      { "weight_kg": 75000, "cg_position_percent_mac": 35.0 }
    ]
  }
}
```

---

## Deck Configuration

### Entity: `DeckConfiguration`

Based on the A321-211P2F document, the aircraft has:

- **Main Deck**: Positions U1-U14 + BULK
- **Lower Deck (Forward)**: Positions A1-A14
- **Lower Deck (Aft)**: Positions 11-53
- **Bulk Cargo**: Positions K1, K2, K3, P1

| Field                      | Type                   | Description                                      |
| -------------------------- | ---------------------- | ------------------------------------------------ |
| `deck_id`                  | UUID                   | Primary key                                      |
| `aircraft_id`              | UUID                   | Foreign key to Aircraft                          |
| `deck_code`                | string                 | `"MAIN"`, `"LOWER_FWD"`, `"LOWER_AFT"`, `"BULK"` |
| `deck_name`                | string                 | Display name                                     |
| `max_structural_weight_kg` | float                  | Maximum weight for entire deck                   |
| `positions`                | array[LoadingPosition] | All positions on this deck                       |

### JSON Schema

```json
{
  "deck_configuration": {
    "deck_id": "uuid",
    "aircraft_id": "uuid",
    "deck_code": "MAIN",
    "deck_name": "Main Deck",
    "max_structural_weight_kg": 25000.0,
    "positions": []
  }
}
```

---

## Loading Positions

### Entity: `LoadingPosition`

Extracted from the A321-211P2F Load Sheet:

#### Main Deck Positions (U1-U14)

| Position | Max Weight (kg) | Notes        |
| -------- | --------------- | ------------ |
| U1       | 1836            | ULD position |
| U2       | 1836            | ULD position |
| U3       | 1836            | ULD position |
| U4       | 1836            | ULD position |
| U5       | 1836            | ULD position |
| U6       | 1836            | ULD position |
| U7       | 3193            | ULD position |
| U8       | 2275            | ULD position |
| U9       | 2275            | ULD position |
| U10      | 2275            | ULD position |
| U11      | 2275            | ULD position |
| U12      | 2275            | ULD position |
| U13      | 1927            | ULD position |
| U14      | -               | BULK area    |

#### Lower Deck Forward (ULD Positions)

| Position | Max Weight (kg) |
| -------- | --------------- |
| 11       | 1134            |
| 12       | 1134            |
| 21       | 1134            |
| 22       | 1134            |
| 23       | 1134            |

#### Lower Deck Aft (ULD + BULK ON CLS)

| Position | Max Weight (kg) | Notes                       |
| -------- | --------------- | --------------------------- |
| 31       | 1013            |                             |
| 32       | 1189            |                             |
| 33       | 1189            |                             |
| 41       | 1189            |                             |
| 42       | 1696            |                             |
| 51-53    | Bulk on CLS     | 1289, 1177, 1121, 919, 1164 |

#### Bulk Cargo Options

| Position   | Max Weight (kg) | Option        |
| ---------- | --------------- | ------------- |
| Q1 P1      | 226 + 226       | Option Q1 P1  |
| K3 P1      | 226 + 226       | Option K3 P1  |
| K1 K2      | 331 + 331       | Option K1 K2  |
| BULK (770) | 770             | Standard bulk |

### Position Schema

| Field                  | Type          | Description                                        |
| ---------------------- | ------------- | -------------------------------------------------- |
| `position_id`          | UUID          | Primary key                                        |
| `deck_id`              | UUID          | Foreign key to DeckConfiguration                   |
| `position_code`        | string        | Position identifier (e.g., `"U1"`, `"A1"`, `"11"`) |
| `sequence_number`      | int           | Loading sequence order                             |
| `max_weight_kg`        | float         | Maximum structural weight limit                    |
| `arm_station_cm`       | float         | Distance from datum for moment calculation         |
| `compatible_uld_types` | array[string] | List of compatible ULD type codes                  |
| `accepts_bulk_cargo`   | boolean       | Whether position can accept loose cargo            |
| `floor_area_m2`        | float         | Position floor area                                |
| `max_height_cm`        | float         | Maximum cargo height                               |
| `contour_type`         | string        | Fuselage contour restriction                       |

### JSON Schema

```json
{
  "loading_position": {
    "position_id": "uuid",
    "deck_id": "uuid",
    "position_code": "U1",
    "sequence_number": 1,
    "max_weight_kg": 1836,
    "arm_station_cm": 500.0,
    "compatible_uld_types": ["PMC", "PAG", "AKE"],
    "accepts_bulk_cargo": false,
    "floor_area_m2": 2.5,
    "max_height_cm": 160,
    "contour_type": "FULL_WIDTH"
  }
}
```

---

## Loading Zones & Index Tables

### Entity: `LoadingZone`

From the A321-211P2F Cargo Loading Index Table:

| Field              | Type              | Description                     |
| ------------------ | ----------------- | ------------------------------- |
| `zone_id`          | UUID              | Primary key                     |
| `aircraft_id`      | UUID              | Foreign key to Aircraft         |
| `zone_code`        | string            | Zone identifier (U1-U14)        |
| `positions`        | array[string]     | Position codes in this zone     |
| `lmc_index_impact` | float             | Last Minute Change index factor |
| `index_table`      | array[IndexEntry] | Weight-to-index lookup table    |

### LMC (Last Minute Change) Index Table

From document:

| Zone             | U1   | U2   | U3   | U4   | U5   | U6   | U7  | U8   | U9   | U10  | U11  | U12  | U13  | U14  |
| ---------------- | ---- | ---- | ---- | ---- | ---- | ---- | --- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| LMC Index Impact | -1.4 | -1.2 | -0.5 | -0.3 | -0.5 | -0.3 | 0.0 | +0.2 | +0.4 | +0.7 | +0.9 | +1.1 | +1.3 | +1.5 |

### Entity: `IndexEntry`

| Field           | Type  | Description                       |
| --------------- | ----- | --------------------------------- |
| `weight_min_kg` | float | Lower bound of weight range       |
| `weight_max_kg` | float | Upper bound of weight range       |
| `index_units`   | float | Index value for this weight range |

### Cargo Loading Index Table (Sample from document)

| Total Main & Lower Load (kg) | U1  | U2  | U3  | U4  | U5  | U6  | U7  | U8  | U9  | U10 | U11 | U12 | U13 | U14 |
| ---------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1-100                        | -1  | -1  | 0   | -0  | 0   | -0  | 0   | +0  | +0  | +0  | +0  | +0  | +1  | +1  |
| 101-200                      | -2  | -2  | -1  | -1  | -1  | -0  | +0  | +1  | +1  | +1  | +1  | +2  | +2  | +2  |
| 201-300                      | -3  | -3  | -2  | -1  | -1  | -1  | 0   | +0  | +1  | +2  | +2  | +3  | +3  | +4  |
| ...                          | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| MAX                          | -25 | -47 | -28 | -28 | -9  | -5  | -1  | +4  | +15 | +30 | +30 | +37 | +30 | +31 |

### JSON Schema

```json
{
  "loading_zone": {
    "zone_id": "uuid",
    "aircraft_id": "uuid",
    "zone_code": "U1",
    "positions": ["U1"],
    "lmc_index_impact": -1.4,
    "index_table": [
      { "weight_min_kg": 1, "weight_max_kg": 100, "index_units": -1 },
      { "weight_min_kg": 101, "weight_max_kg": 200, "index_units": -2 },
      { "weight_min_kg": 201, "weight_max_kg": 300, "index_units": -3 }
    ]
  }
}
```

---

## ULD Types

### Overview

> "A unit load device (ULD) is a container used to load luggage, freight, and mail on wide-body aircraft and specific narrow-body aircraft. It allows preloading of cargo... enabling efficient planning of aircraft weight and balance."

> "ULDs come in two forms: pallets and containers."

### Entity: `UldType`

| Field                | Type   | Description                             |
| -------------------- | ------ | --------------------------------------- |
| `uld_type_id`        | UUID   | Primary key                             |
| `iata_code`          | string | IATA ULD code (e.g., `"AKE"`)           |
| `common_designation` | string | Common name (e.g., `"LD-3"`)            |
| `rate_class`         | string | IATA rate class (e.g., `"Type 8"`)      |
| `description`        | string | Container description                   |
| `uld_category`       | enum   | `CONTAINER`, `PALLET`                   |
| `contour_type`       | string | `HALF_WIDTH`, `FULL_WIDTH`, `CONTOURED` |

### Physical Specifications

| Field                    | Type  | Unit | Description            |
| ------------------------ | ----- | ---- | ---------------------- |
| `tare_weight_kg`         | float | kg   | Empty weight           |
| `max_gross_weight_kg`    | float | kg   | Maximum loaded weight  |
| `internal_volume_m3`     | float | m³   | AS1825 internal volume |
| `length_cm`              | float | cm   | External length        |
| `width_cm`               | float | cm   | External width         |
| `height_cm`              | float | cm   | External height        |
| `door_opening_width_cm`  | float | cm   | Door opening width     |
| `door_opening_height_cm` | float | cm   | Door opening height    |

### Special Features

| Field                 | Type          | Description                       |
| --------------------- | ------------- | --------------------------------- |
| `is_refrigerated`     | boolean       | Has cooling capability            |
| `is_forkable`         | boolean       | Has forklift holes                |
| `door_type`           | string        | `"CANVAS"`, `"SOLID"`             |
| `compatible_aircraft` | array[string] | List of compatible aircraft types |
| `deck_compatibility`  | array[string] | `["MAIN"]`, `["LOWER"]`, or both  |

### Common ULD Types Reference

| Designation | IATA Code | Tare (kg) | Max Gross (kg) | Volume (m³) | Compatible Aircraft                                      |
| ----------- | --------- | --------- | -------------- | ----------- | -------------------------------------------------------- |
| LD-3        | AKE       | 82        | 1,588          | 4.5         | 747, 767, 777, 787, DC-10, MD-11, A300, A310, A330, A340 |
| LD-2        | DPE       | 92        | 1,225          | 3.5         | 747, 767, 777, 787                                       |
| LD-1        | AKC       | 70-170    | 1,588          | 5.0         | 747, 767, 777, 787, MD-11                                |
| PMC/P6P     | PMC       | 120       | Varies         | 21.2        | Main deck freighters                                     |

### JSON Schema

```json
{
  "uld_type": {
    "uld_type_id": "uuid",
    "iata_code": "AKE",
    "common_designation": "LD-3",
    "rate_class": "Type 8",
    "description": "Half-width lower deck container with one angled side",
    "uld_category": "CONTAINER",
    "contour_type": "HALF_WIDTH",
    "tare_weight_kg": 82,
    "max_gross_weight_kg": 1588,
    "internal_volume_m3": 4.5,
    "length_cm": 156.2,
    "width_cm": 153.4,
    "height_cm": 162.6,
    "door_opening_width_cm": 147,
    "door_opening_height_cm": 155,
    "is_refrigerated": false,
    "is_forkable": true,
    "door_type": "CANVAS",
    "compatible_aircraft": ["A330", "A340", "747", "767", "777", "787"],
    "deck_compatibility": ["LOWER"]
  }
}
```

---

## Weight Constraints

### Overview

From the A321-211P2F document NOTES section, several combined weight constraints apply:

### Entity: `WeightConstraint`

| Field                    | Type          | Description                            |
| ------------------------ | ------------- | -------------------------------------- |
| `constraint_id`          | UUID          | Primary key                            |
| `aircraft_id`            | UUID          | Foreign key to Aircraft                |
| `constraint_name`        | string        | Descriptive name                       |
| `description`            | string        | Full description of constraint         |
| `affected_positions`     | array[string] | Position codes affected                |
| `max_combined_weight_kg` | float         | Maximum combined weight                |
| `condition_type`         | enum          | `ALWAYS`, `CONDITIONAL`                |
| `condition_expression`   | string        | Conditional logic (if applicable)      |
| `is_active`              | boolean       | Whether constraint is currently active |

### Constraints from A321-211P2F Document

| Constraint             | Positions Affected                                                             | Max Weight (kg) | Notes                                                                             |
| ---------------------- | ------------------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------- |
| Forward Cargo Hold     | A1 + A2 + ULD 11 + ULD 12                                                      | 3,674           | Combined gross weights of first two main deck pallets and ULD positions 11 and 12 |
| Lower Deck Combined    | Lower aft cargo + Lower rear bulk + A8-A14 + options (A14-K1/K2, K3/P1, Q1/P1) | 16,329          | Combined payload limit                                                            |
| Bulk Cargo Restriction | Bulk cargo hold                                                                | N/A             | Not permitted if main deck positions A13, A14, K1, K2, K3, P1, or Q1 are in use   |

### JSON Schema

```json
{
  "weight_constraint": {
    "constraint_id": "uuid",
    "aircraft_id": "uuid",
    "constraint_name": "Forward Cargo Hold Limit",
    "description": "The combined gross weights of the first two main deck pallets (A1 and A2) and ULD positions 11 and 12 in the forward cargo hold cannot exceed 3674 kg",
    "affected_positions": ["A1", "A2", "11", "12"],
    "max_combined_weight_kg": 3674,
    "condition_type": "ALWAYS",
    "condition_expression": null,
    "is_active": true
  }
}
```

---

## Fuel Configuration

### Overview

> "In order to overcome the fuel and cost problem, few measures can be taken including implementing effective aircraft loading system to optimize fuel weight and manage centre of gravity (CG)."

### Entity: `FuelConfiguration`

| Field                       | Type                  | Description                |
| --------------------------- | --------------------- | -------------------------- |
| `fuel_config_id`            | UUID                  | Primary key                |
| `aircraft_id`               | UUID                  | Foreign key to Aircraft    |
| `tanks`                     | array[FuelTank]       | List of fuel tanks         |
| `standard_fuel_index_table` | array[FuelIndexEntry] | Standard fuel index lookup |

### Entity: `FuelTank`

| Field             | Type                  | Description                                 |
| ----------------- | --------------------- | ------------------------------------------- |
| `tank_id`         | UUID                  | Primary key                                 |
| `fuel_config_id`  | UUID                  | Foreign key to FuelConfiguration            |
| `tank_code`       | string                | Tank identifier                             |
| `location`        | enum                  | `WING_LEFT`, `WING_RIGHT`, `CENTER`, `TRIM` |
| `max_capacity_kg` | float                 | Maximum fuel capacity                       |
| `arm_station_cm`  | float                 | Tank arm for moment calculation             |
| `index_table`     | array[FuelIndexEntry] | Tank-specific index table                   |

### Fuel Index Per Tank Table (from document)

#### Wing Tanks

| Weight (kg) | Index (density 0.8 kg/l) |
| ----------- | ------------------------ |
| 200         | -0.2                     |
| 400         | -0.4                     |
| 600         | -0.7                     |
| 800         | -0.9                     |
| 1000        | -1.1                     |
| 1200        | -1.3                     |
| 1400        | -1.5                     |
| 1600        | -1.7                     |
| 1800        | -1.9                     |
| 2000        | -2.1                     |
| ...         | ...                      |
| 3200 (MAX)  | -3.0                     |

#### Center Tank

| Weight (kg) | Index (density 0.8 kg/l) |
| ----------- | ------------------------ |
| 200         | -0.2                     |
| 400         | -0.4                     |
| 600         | -0.7                     |
| ...         | ...                      |
| 6400 (FULL) | -9.7                     |

### Entity: `FuelIndexEntry`

| Field          | Type  | Description                |
| -------------- | ----- | -------------------------- |
| `weight_kg`    | float | Fuel weight                |
| `index_value`  | float | Corresponding index value  |
| `density_kg_l` | float | Fuel density (default 0.8) |

### Standard Fuel Index Table (from document)

| Weight (kg) | Index | Weight (kg) | Index |
| ----------- | ----- | ----------- | ----- |
| 500         | -1    | 10000       | -6    |
| 1000        | -1    | 10500       | -6    |
| 1500        | -2    | 11000       | -5    |
| 2000        | -2    | 11500       | -5    |
| 2500        | -3    | 12000       | -4    |
| 3000        | -3    | 12500       | -3    |
| 3500        | -4    | 13000       | -3    |
| 4000        | -4    | 13500       | -3    |
| 4500        | -5    | 14000       | -3    |
| 5000        | -5    | 14500       | -5    |
| 5500        | -6    | 15000       | -5    |
| 6000        | -6    | 15500       | -5    |
| 6500        | -6    | 16000       | -7    |
| 7000        | -6    | 17000       | -10   |
| 7500        | -7    | 17500       | -10   |
| 8000        | -7    | 18000       | -11   |
| 8500        | -7    | 18500       | -12   |
| 9000        | -7    | FULL        | -13   |
| 9500        | -7    |             |       |

### Manual Fuel Index Table (from document)

| Tank       | Weight (kg) | Index |
| ---------- | ----------- | ----- |
| LEFT WING  | -           | -     |
| RIGHT WING | -           | -     |
| CENTER     | -           | -     |
| **TOTAL**  | -           | -     |

### JSON Schema

```json
{
  "fuel_configuration": {
    "fuel_config_id": "uuid",
    "aircraft_id": "uuid",
    "tanks": [
      {
        "tank_id": "uuid",
        "tank_code": "LEFT_WING",
        "location": "WING_LEFT",
        "max_capacity_kg": 3200,
        "arm_station_cm": 450.0,
        "index_table": [
          { "weight_kg": 200, "index_value": -0.2, "density_kg_l": 0.8 },
          { "weight_kg": 400, "index_value": -0.4, "density_kg_l": 0.8 }
        ]
      },
      {
        "tank_id": "uuid",
        "tank_code": "CENTER",
        "location": "CENTER",
        "max_capacity_kg": 6400,
        "arm_station_cm": 500.0,
        "index_table": []
      }
    ],
    "standard_fuel_index_table": [
      { "weight_kg": 500, "index_value": -1, "density_kg_l": 0.8 },
      { "weight_kg": 1000, "index_value": -1, "density_kg_l": 0.8 }
    ]
  }
}
```

---

## Cargo Items

### Entity: `CargoItem`

> "Integrating with cargo tracking systems that provide the exact weight and dimensions of each item ensures accurate weight and balance calculations."

| Field           | Type   | Description                 |
| --------------- | ------ | --------------------------- |
| `cargo_item_id` | UUID   | Primary key                 |
| `awb_number`    | string | Air Waybill number          |
| `piece_id`      | string | Individual piece identifier |
| `origin`        | string | Origin airport code         |
| `destination`   | string | Destination airport code    |

### Physical Properties

| Field             | Type  | Unit | Description                      |
| ----------------- | ----- | ---- | -------------------------------- |
| `gross_weight_kg` | float | kg   | Total weight including packaging |
| `volume_m3`       | float | m³   | Total volume                     |
| `length_cm`       | float | cm   | Length                           |
| `width_cm`        | float | cm   | Width                            |
| `height_cm`       | float | cm   | Height                           |

### Classification

| Field                    | Type          | Description                                                       |
| ------------------------ | ------------- | ----------------------------------------------------------------- |
| `cargo_type`             | enum          | `GENERAL`, `DGR`, `LIVE_ANIMAL`, `PERISHABLE`, `VALUABLE`, `MAIL` |
| `special_handling_codes` | array[string] | IATA Special Handling Codes (SHC)                                 |
| `dgr_class`              | string        | Dangerous goods class (if applicable)                             |
| `priority`               | int           | Loading priority                                                  |

### Loading Constraints

| Field                    | Type    | Description                         |
| ------------------------ | ------- | ----------------------------------- |
| `stackable`              | boolean | Can other items be stacked on top   |
| `max_stack_weight_kg`    | float   | Maximum weight that can be stacked  |
| `orientation_restricted` | boolean | Must maintain specific orientation  |
| `this_side_up`           | boolean | Must be kept upright                |
| `temperature_controlled` | boolean | Requires temperature control        |
| `temperature_min_c`      | float   | Minimum temperature (if controlled) |
| `temperature_max_c`      | float   | Maximum temperature (if controlled) |

### Assignment

| Field               | Type   | Description                                  |
| ------------------- | ------ | -------------------------------------------- |
| `assigned_position` | string | Position code (nullable until loaded)        |
| `assigned_uld`      | string | ULD number (if containerized)                |
| `load_status`       | enum   | `PENDING`, `ASSIGNED`, `LOADED`, `OFFLOADED` |

### JSON Schema

```json
{
  "cargo_item": {
    "cargo_item_id": "uuid",
    "awb_number": "123-45678901",
    "piece_id": "PCS001",
    "origin": "DXB",
    "destination": "LHR",
    "gross_weight_kg": 250.5,
    "volume_m3": 1.2,
    "length_cm": 120,
    "width_cm": 80,
    "height_cm": 100,
    "cargo_type": "GENERAL",
    "special_handling_codes": ["HEA"],
    "dgr_class": null,
    "priority": 1,
    "stackable": true,
    "max_stack_weight_kg": 500,
    "orientation_restricted": false,
    "this_side_up": false,
    "temperature_controlled": false,
    "temperature_min_c": null,
    "temperature_max_c": null,
    "assigned_position": "U1",
    "assigned_uld": "PMC12345XX",
    "load_status": "LOADED"
  }
}
```

---

## Load Plan

### Entity: `LoadPlan`

| Field                   | Type     | Description                  |
| ----------------------- | -------- | ---------------------------- |
| `load_plan_id`          | UUID     | Primary key                  |
| `flight_number`         | string   | Flight number                |
| `flight_date`           | date     | Date of flight               |
| `aircraft_registration` | string   | Aircraft registration        |
| `aircraft_id`           | UUID     | Foreign key to Aircraft      |
| `origin`                | string   | Departure airport code       |
| `destination`           | string   | Arrival airport code         |
| `created_at`            | datetime | Creation timestamp           |
| `updated_at`            | datetime | Last update timestamp        |
| `status`                | enum     | `DRAFT`, `FINAL`, `RELEASED` |

### Weight Calculations

| Field                       | Type  | Unit | Description           |
| --------------------------- | ----- | ---- | --------------------- |
| `operating_empty_weight_kg` | float | kg   | Aircraft OEW          |
| `dry_operating_weight_kg`   | float | kg   | DOW including crew    |
| `payload_kg`                | float | kg   | Total payload         |
| `zero_fuel_weight_kg`       | float | kg   | ZFW                   |
| `takeoff_fuel_kg`           | float | kg   | Fuel at takeoff       |
| `trip_fuel_kg`              | float | kg   | Fuel consumed enroute |
| `takeoff_weight_kg`         | float | kg   | TOW                   |
| `landing_weight_kg`         | float | kg   | Estimated LW          |

### CG Results

| Field                | Type  | Unit  | Description     |
| -------------------- | ----- | ----- | --------------- |
| `zfw_cg_percent_mac` | float | % MAC | ZFW CG position |
| `zfw_cg_index`       | float | I.U.  | ZFW index units |
| `tow_cg_percent_mac` | float | % MAC | TOW CG position |
| `tow_cg_index`       | float | I.U.  | TOW index units |
| `ldw_cg_percent_mac` | float | % MAC | LW CG position  |
| `ldw_cg_index`       | float | I.U.  | LW index units  |

### Trim & Validation

| Field                   | Type          | Description                      |
| ----------------------- | ------------- | -------------------------------- |
| `stabilizer_trim_units` | float         | Calculated trim setting          |
| `within_weight_limits`  | boolean       | All weight limits satisfied      |
| `within_cg_envelope`    | boolean       | CG within envelope at all phases |
| `constraints_satisfied` | boolean       | All weight constraints satisfied |
| `lateral_balance_ok`    | boolean       | Left/right balance acceptable    |
| `validation_errors`     | array[string] | List of validation errors        |
| `validation_warnings`   | array[string] | List of validation warnings      |

### Position Loads

| Field            | Type                | Description               |
| ---------------- | ------------------- | ------------------------- |
| `position_loads` | array[PositionLoad] | Load details per position |

### Entity: `PositionLoad`

| Field               | Type        | Description                    |
| ------------------- | ----------- | ------------------------------ |
| `position_load_id`  | UUID        | Primary key                    |
| `load_plan_id`      | UUID        | Foreign key to LoadPlan        |
| `position_id`       | UUID        | Foreign key to LoadingPosition |
| `position_code`     | string      | Position code                  |
| `uld_number`        | string      | ULD number (nullable for bulk) |
| `uld_type_id`       | UUID        | Foreign key to UldType         |
| `gross_weight_kg`   | float       | Total weight in position       |
| `tare_weight_kg`    | float       | ULD tare weight                |
| `cargo_weight_kg`   | float       | Cargo weight only              |
| `cargo_items`       | array[UUID] | Cargo item IDs                 |
| `calculated_moment` | float       | Weight × Arm                   |
| `calculated_index`  | float       | Index units                    |

### JSON Schema

```json
{
  "load_plan": {
    "load_plan_id": "uuid",
    "flight_number": "RY123",
    "flight_date": "2025-01-15",
    "aircraft_registration": "9M-XXX",
    "aircraft_id": "uuid",
    "origin": "KUL",
    "destination": "SIN",
    "created_at": "2025-01-15T08:00:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "status": "FINAL",
    "operating_empty_weight_kg": 48000,
    "dry_operating_weight_kg": 48500,
    "payload_kg": 15000,
    "zero_fuel_weight_kg": 63500,
    "takeoff_fuel_kg": 8000,
    "trip_fuel_kg": 3000,
    "takeoff_weight_kg": 71500,
    "landing_weight_kg": 68500,
    "zfw_cg_percent_mac": 28.5,
    "zfw_cg_index": 45.2,
    "tow_cg_percent_mac": 26.8,
    "tow_cg_index": 42.1,
    "ldw_cg_percent_mac": 27.2,
    "ldw_cg_index": 43.5,
    "stabilizer_trim_units": 3.2,
    "within_weight_limits": true,
    "within_cg_envelope": true,
    "constraints_satisfied": true,
    "lateral_balance_ok": true,
    "validation_errors": [],
    "validation_warnings": [],
    "position_loads": [
      {
        "position_load_id": "uuid",
        "load_plan_id": "uuid",
        "position_id": "uuid",
        "position_code": "U1",
        "uld_number": "PMC12345XX",
        "uld_type_id": "uuid",
        "gross_weight_kg": 1500,
        "tare_weight_kg": 120,
        "cargo_weight_kg": 1380,
        "cargo_items": ["uuid1", "uuid2"],
        "calculated_moment": 750000,
        "calculated_index": -12
      }
    ]
  }
}
```

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│      Aircraft       │
│─────────────────────│
│ aircraft_id (PK)    │
│ aircraft_type       │
│ aircraft_subtype    │
│ msn_numbers[]       │
│ weight_limits       │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐     1:N    ┌─────────────────────┐
│  DeckConfiguration  │◄──────────│   LoadingPosition   │
│─────────────────────│            │─────────────────────│
│ deck_id (PK)        │            │ position_id (PK)    │
│ aircraft_id (FK)    │            │ deck_id (FK)        │
│ deck_code           │            │ position_code       │
│ max_weight_kg       │            │ max_weight_kg       │
└─────────────────────┘            │ arm_station_cm      │
           │                       │ compatible_uld[]    │
           │                       └──────────┬──────────┘
           │                                  │
           │ 1:N                              │ N:M
           ▼                                  ▼
┌─────────────────────┐            ┌─────────────────────┐
│    LoadingZone      │            │      UldType        │
│─────────────────────│            │─────────────────────│
│ zone_id (PK)        │            │ uld_type_id (PK)    │
│ aircraft_id (FK)    │            │ iata_code           │
│ zone_code           │            │ common_designation  │
│ lmc_index_impact    │            │ tare_weight_kg      │
│ index_table[]       │            │ max_gross_weight_kg │
└─────────────────────┘            │ dimensions          │
                                   └─────────────────────┘
┌─────────────────────┐
│  WeightConstraint   │
│─────────────────────│
│ constraint_id (PK)  │
│ aircraft_id (FK)    │
│ affected_positions[]│
│ max_combined_kg     │
│ condition_type      │
└─────────────────────┘

┌─────────────────────┐            ┌─────────────────────┐
│  FuelConfiguration  │◄──────────│      FuelTank       │
│─────────────────────│    1:N    │─────────────────────│
│ fuel_config_id (PK) │            │ tank_id (PK)        │
│ aircraft_id (FK)    │            │ fuel_config_id (FK) │
│ index_table[]       │            │ tank_code           │
└─────────────────────┘            │ max_capacity_kg     │
                                   │ index_table[]       │
                                   └─────────────────────┘

┌─────────────────────┐
│      CgEnvelope     │
│─────────────────────│
│ envelope_id (PK)    │
│ aircraft_id (FK)    │
│ envelope_type       │
│ envelope_points[]   │
└─────────────────────┘

┌─────────────────────┐            ┌─────────────────────┐
│      LoadPlan       │◄──────────│    PositionLoad     │
│─────────────────────│    1:N    │─────────────────────│
│ load_plan_id (PK)   │            │ position_load_id(PK)│
│ aircraft_id (FK)    │            │ load_plan_id (FK)   │
│ flight_number       │            │ position_id (FK)    │
│ flight_date         │            │ uld_number          │
│ weights             │            │ gross_weight_kg     │
│ cg_results          │            │ cargo_items[]       │
│ validation_status   │            │ calculated_moment   │
└─────────────────────┘            └──────────┬──────────┘
                                              │
                                              │ N:M
                                              ▼
                                   ┌─────────────────────┐
                                   │     CargoItem       │
                                   │─────────────────────│
                                   │ cargo_item_id (PK)  │
                                   │ awb_number          │
                                   │ gross_weight_kg     │
                                   │ cargo_type          │
                                   │ assigned_position   │
                                   └─────────────────────┘
```

---

## Optimization Considerations

### Optimization Objectives

> "A mixed integer programming model is constructed to maximize the total payload and minimize the center of gravity (CG) deviation by considering the constraints of positions, weights, balance etc."

### Constraint Types

The air cargo loading optimization must handle four types of constraints:

1. **Assignment constraints** - Each cargo item assigned to exactly one position
2. **Maximum position weight limits** - Individual position structural limits
3. **Zero fuel weight limit** - ZFW must not exceed maximum
4. **CG envelope constraints** - CG must remain within envelope at all weights
5. **Combined weight constraints** - Groups of positions with shared limits
6. **Lateral imbalance limits** - Left/right balance for double-row configurations

### Optimization Algorithm Inputs

```json
{
  "optimization_request": {
    "aircraft_id": "uuid",
    "cargo_items": ["uuid1", "uuid2", "..."],
    "available_ulds": ["uuid1", "uuid2", "..."],
    "fuel_load_kg": 8000,
    "objective": "MINIMIZE_CG_DEVIATION",
    "target_cg_percent_mac": 28.0,
    "constraints": {
      "max_takeoff_weight_kg": 77000,
      "max_zero_fuel_weight_kg": 63000,
      "lateral_imbalance_limit_kg": 500
    }
  }
}
```

### Optimization Output

```json
{
  "optimization_result": {
    "status": "OPTIMAL",
    "objective_value": 0.5,
    "computation_time_ms": 150,
    "load_plan": {
      "position_assignments": [
        { "cargo_item_id": "uuid1", "position_code": "U3" },
        { "cargo_item_id": "uuid2", "position_code": "U7" }
      ],
      "total_payload_kg": 15000,
      "zfw_cg_percent_mac": 28.2,
      "tow_cg_percent_mac": 27.8,
      "lateral_imbalance_kg": 125
    }
  }
}
```

---

## Appendix A: A321-211P2F Position Layout

### Main Deck Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  COCKPIT                                                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                    │
│  │  U1  │ │  U2  │ │  U3  │ │  U4  │ │  U5  │ │  U6  │                    │
│  │ 1836 │ │ 1836 │ │ 1836 │ │ 1836 │ │ 1836 │ │ 1836 │                    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                    │
│                                                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐     │
│  │  U7  │ │  U8  │ │  U9  │ │  U10   │ │  U11   │ │  U12   │ │ U13  │BULK │
│  │ 3193 │ │ 2275 │ │ 2275 │ │  2275  │ │  2275  │ │  2275  │ │ 1927 │ U14 │
│  └──────┘ └──────┘ └──────┘ └────────┘ └────────┘ └────────┘ └──────┘     │
│                                                                       TAIL │
└────────────────────────────────────────────────────────────────────────────┘
```

### Lower Deck Layout

```
FORWARD CARGO HOLD                    AFT CARGO HOLD
┌─────────────────────────┐          ┌─────────────────────────────────────┐
│ ┌────┐ ┌────┐ ┌────┐   │          │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│ │ A1 │ │ A2 │ │ A3 │...│          │ │ 31 │ │ 32 │ │ 33 │ │ 41 │ │ 42 │ │
│ │1836│ │1836│ │1836│   │          │ │1013│ │1189│ │1189│ │1189│ │1696│ │
│ └────┘ └────┘ └────┘   │          │ └────┘ └────┘ └────┘ └────┘ └────┘ │
│                        │          │                                     │
│ ULD: 11, 12, 21, 22, 23│          │ BULK ON CLS: 51, 52, 53            │
│ (1134 kg each)         │          │ (1289, 1177, 1121, 919, 1164)      │
└─────────────────────────┘          └─────────────────────────────────────┘

BULK CARGO OPTIONS
┌───────────────────────────────────────┐
│ Q1 P1: 226 + 226 kg                   │
│ K3 P1: 226 + 226 kg                   │
│ K1 K2: 331 + 331 kg                   │
│ Standard BULK: 770 kg                 │
└───────────────────────────────────────┘
```

---

## Appendix B: Index Calculation Formula

### Basic Weight & Balance Formula

```
Moment = Weight × Arm
CG = Total Moment / Total Weight
```

### Index Calculation

```
Index = f(Weight, Position)

Where f is the lookup function from the Cargo Loading Index Table
```

### Total Index Calculation

```
Total Index = Σ (Position Index for each loaded position)
            + Fuel Index
            + LMC Adjustments (if applicable)
```

### CG from Index (Normalized)

```
CG (% MAC) = Forward Limit + (Index × (Aft Limit - Forward Limit) / 100)
```

---

## References

1. IATA Airport Handling Manual (AHM) - 46th Edition
2. IATA Unit Load Device Regulations (ULDR) - 14th Edition
3. IATA Cargo Handling Manual (ICHM) - 10th Edition
4. FAA Aircraft Weight and Balance Handbook (FAA-H-8083-1)
5. Raya Airways A321-211P2F Load and Trim Sheet (LS-A321-00-002 Rev. IR)

---

_Document Version: 1.0_
_Last Updated: December 2024_
