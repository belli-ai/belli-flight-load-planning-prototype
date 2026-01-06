# Flight Load Planning - Database Schema Specification

> **Version:** 1.0  
> **Last Updated:** December 2024  
> **Database:** PostgreSQL with Drizzle ORM

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Schema Groups](#schema-groups)
4. [Reference Data Tables](#reference-data-tables)
5. [ULD & Aircraft Master Data](#uld--aircraft-master-data)
6. [Weight & Balance Configuration](#weight--balance-configuration)
7. [Cargo & AWB Data](#cargo--awb-data)
8. [Planning & Optimization](#planning--optimization)
9. [Indexes & Performance](#indexes--performance)
10. [Sample Data](#sample-data)

---

## Overview

This document defines the complete database schema for the Flight Load Planning system, supporting:

- **ULD Build-up Optimization**: 3D bin packing of cargo items into ULDs
- **Aircraft Load Planning**: Placing ULDs into aircraft positions with weight/balance calculations
- **Cargo Compatibility Rules**: DG segregation, temperature zones, food safety compliance
- **CG Envelope Validation**: Center of gravity calculations and envelope compliance

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              REFERENCE DATA                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐         │
│  │    locations    │      │  commodity_codes    │      │ dangerous_goods_    │         │
│  │─────────────────│      │─────────────────────│      │      classes        │         │
│  │ id (PK)         │      │ id (PK)             │      │─────────────────────│         │
│  │ airport_code    │      │ code                │      │ id (PK)             │         │
│  │ city            │      │ description         │      │ class_code          │         │
│  │ country         │      │ is_dangerous_goods  │      │ division            │         │
│  │ timezone        │      │ dg_codes[]          │      │ name                │         │
│  └────────┬────────┘      │ shc_codes[]         │      │ description         │         │
│           │               └──────────┬──────────┘      └──────────┬──────────┘         │
│           │                          │                            │                    │
│           │               ┌──────────┴──────────┐      ┌──────────┴──────────┐         │
│           │               │                     │      │  dg_segregation_    │         │
│           │               │                     │      │       rules         │         │
│           │               │                     │      │─────────────────────│         │
│           │               │                     │      │ id (PK)             │         │
│           │               │                     │      │ class_a_id (FK)     │         │
│           │               │                     │      │ class_b_id (FK)     │         │
│           │               │                     │      │ is_segregated       │         │
│           │               │                     │      └─────────────────────┘         │
│           │               │                     │                                      │
│  ┌────────┴────────┐      │    ┌────────────────┴────────┐                             │
│  │ temperature_    │      │    │                         │                             │
│  │     zones       │      │    │                         │                             │
│  │─────────────────│      │    │                         │                             │
│  │ id (PK)         │      │    │                         │                             │
│  │ code            │      │    │                         │                             │
│  │ name            │      │    │                         │                             │
│  │ min_temp_c      │      │    │                         │                             │
│  │ max_temp_c      │      │    │                         │                             │
│  └─────────────────┘      │    │                         │                             │
│                           │    │                         │                             │
└───────────────────────────┼────┼─────────────────────────┼─────────────────────────────┘
                            │    │                         │
┌───────────────────────────┼────┼─────────────────────────┼─────────────────────────────┐
│                           │    │  ULD & AIRCRAFT DATA    │                             │
├───────────────────────────┼────┼─────────────────────────┼─────────────────────────────┤
│                           │    │                         │                             │
│  ┌─────────────────┐      │    │    ┌─────────────────┐  │                             │
│  │    uld_types    │      │    │    │    aircrafts    │  │                             │
│  │─────────────────│      │    │    │─────────────────│  │                             │
│  │ id (PK)         │◄─────┼────┼────│ id (PK)         │──┼──────────────────────┐      │
│  │ code            │      │    │    │ name            │  │                      │      │
│  │ name            │      │    │    │ type_code       │  │                      │      │
│  │ max_weight_kg   │      │    │    │ subtype         │  │                      │      │
│  │ max_volume_m3   │      │    │    │ main_deck_max_  │  │                      │      │
│  │ tare_weight_kg  │      │    │    │   weight_kg     │  │                      │      │
│  │ dimensions      │      │    │    │ lower_deck_max_ │  │                      │      │
│  │ col_span        │      │    │    │   weight_kg     │  │                      │      │
│  └────────┬────────┘      │    │    │ total_max_      │  │                      │      │
│           │               │    │    │   weight_kg     │  │                      │      │
│           │               │    │    └────────┬────────┘  │                      │      │
│           │               │    │             │           │                      │      │
│  ┌────────┴────────┐      │    │    ┌────────┴────────┐  │    ┌─────────────────┐      │
│  │      ulds       │      │    │    │ deck_configs    │  │    │    flights      │      │
│  │─────────────────│      │    │    │─────────────────│  │    │─────────────────│      │
│  │ id (PK)         │      │    │    │ id (PK)         │  │    │ id (PK)         │      │
│  │ uld_number      │      │    │    │ aircraft_id(FK) │◄─┼────│ aircraft_id(FK) │      │
│  │ uld_type_id(FK) │      │    │    │ deck_code       │  │    │ flight_number   │      │
│  │ location_id(FK) │◄─────┘    │    │ deck_name       │  │    │ origin_id (FK)  │──────┤
│  │ status          │           │    │ max_weight_kg   │  │    │ destination_id  │──────┤
│  └─────────────────┘           │    └────────┬────────┘  │    │ departure_dt    │      │
│                                │             │           │    │ arrival_dt      │      │
│                                │    ┌────────┴────────┐  │    └─────────────────┘      │
│                                │    │loading_positions│  │                             │
│                                │    │─────────────────│  │                             │
│                                │    │ id (PK)         │  │                             │
│                                │    │ deck_id (FK)    │  │                             │
│                                │    │ position_code   │  │                             │
│                                │    │ sequence_num    │  │                             │
│                                │    │ max_weight_kg   │  │                             │
│                                │    │ arm_station_cm  │  │                             │
│                                │    │ compatible_ulds │  │                             │
│                                │    └─────────────────┘  │                             │
│                                │                         │                             │
└────────────────────────────────┼─────────────────────────┼─────────────────────────────┘
                                 │                         │
┌────────────────────────────────┼─────────────────────────┼─────────────────────────────┐
│                                │  WEIGHT & BALANCE       │                             │
├────────────────────────────────┼─────────────────────────┼─────────────────────────────┤
│                                │                         │                             │
│  ┌─────────────────┐           │    ┌─────────────────┐  │    ┌─────────────────┐      │
│  │  cg_envelopes   │           │    │  loading_zones  │  │    │weight_constraints│     │
│  │─────────────────│           │    │─────────────────│  │    │─────────────────│      │
│  │ id (PK)         │           │    │ id (PK)         │  │    │ id (PK)         │      │
│  │ aircraft_id(FK) │◄──────────┼────│ aircraft_id(FK) │◄─┼────│ aircraft_id(FK) │      │
│  │ envelope_type   │           │    │ zone_code       │  │    │ name            │      │
│  │ fwd_limit_%mac  │           │    │ positions[]     │  │    │ positions[]     │      │
│  │ aft_limit_%mac  │           │    │ lmc_index_impact│  │    │ max_combined_kg │      │
│  └────────┬────────┘           │    └────────┬────────┘  │    │ condition_type  │      │
│           │                    │             │           │    └─────────────────┘      │
│  ┌────────┴────────┐           │    ┌────────┴────────┐  │                             │
│  │cg_envelope_     │           │    │loading_zone_    │  │                             │
│  │    points       │           │    │  index_entries  │  │                             │
│  │─────────────────│           │    │─────────────────│  │                             │
│  │ id (PK)         │           │    │ id (PK)         │  │                             │
│  │ envelope_id(FK) │           │    │ zone_id (FK)    │  │                             │
│  │ weight_kg       │           │    │ weight_min_kg   │  │                             │
│  │ cg_%_mac        │           │    │ weight_max_kg   │  │                             │
│  │ cg_index        │           │    │ index_units     │  │                             │
│  └─────────────────┘           │    └─────────────────┘  │                             │
│                                │                         │                             │
│  ┌─────────────────┐           │                         │                             │
│  │fuel_configs     │           │                         │                             │
│  │─────────────────│           │                         │                             │
│  │ id (PK)         │           │                         │                             │
│  │ aircraft_id(FK) │◄──────────┘                         │                             │
│  └────────┬────────┘                                     │                             │
│           │                                              │                             │
│  ┌────────┴────────┐      ┌─────────────────┐            │                             │
│  │   fuel_tanks    │      │ fuel_index_     │            │                             │
│  │─────────────────│      │    entries      │            │                             │
│  │ id (PK)         │      │─────────────────│            │                             │
│  │ fuel_config(FK) │──────│ id (PK)         │            │                             │
│  │ tank_code       │      │ tank_id (FK)    │            │                             │
│  │ location        │      │ weight_kg       │            │                             │
│  │ max_capacity_kg │      │ index_value     │            │                             │
│  │ arm_station_cm  │      │ density_kg_l    │            │                             │
│  └─────────────────┘      └─────────────────┘            │                             │
│                                                          │                             │
└──────────────────────────────────────────────────────────┼─────────────────────────────┘
                                                           │
┌──────────────────────────────────────────────────────────┼─────────────────────────────┐
│                                  CARGO & AWB DATA        │                             │
├──────────────────────────────────────────────────────────┼─────────────────────────────┤
│                                                          │                             │
│  ┌─────────────────┐      ┌─────────────────┐            │                             │
│  │  air_waybills   │      │  parcel_groups  │            │                             │
│  │─────────────────│      │─────────────────│            │                             │
│  │ id (PK)         │◄─────│ id (PK)         │            │                             │
│  │ awb_number      │      │ awb_id (FK)     │            │                             │
│  │ origin_id (FK)  │──────│ commodity_id(FK)│────────────┘                             │
│  │ destination_id  │──────│ pieces          │                                          │
│  │ total_weight_kg │      │ weight_kg       │                                          │
│  │ total_volume_m3 │      │ dimensions      │                                          │
│  │ total_pieces    │      │ is_stackable    │                                          │
│  │ nature_of_goods │      │ temp_zone_id(FK)│───────────────────────────┐              │
│  │ shipper         │      └────────┬────────┘                           │              │
│  │ consignee       │               │                                    │              │
│  └─────────────────┘      ┌────────┴────────┐      ┌────────────────────┘              │
│                           │  cargo_items    │      │                                   │
│                           │─────────────────│      │                                   │
│                           │ id (PK)         │      │                                   │
│                           │ parcel_group_id │      │                                   │
│                           │ awb_id (FK)     │      │                                   │
│                           │ piece_number    │      │                                   │
│                           │ weight_kg       │      │                                   │
│                           │ dimensions      │      │                                   │
│                           │ is_stackable    │      │                                   │
│                           │ is_dgr          │      │                                   │
│                           │ dg_class_id(FK) │──────┤                                   │
│                           │ temp_zone_id(FK)│──────┘                                   │
│                           │ is_live_animal  │                                          │
│                           │ is_foodstuff    │                                          │
│                           │ shc_codes[]     │                                          │
│                           │ priority        │                                          │
│                           └─────────────────┘                                          │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PLANNING & OPTIMIZATION                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐                │
│  │   load_plans    │      │ uld_assignments │      │  packed_items   │                │
│  │─────────────────│      │─────────────────│      │─────────────────│                │
│  │ id (PK)         │◄─────│ id (PK)         │◄─────│ id (PK)         │                │
│  │ flight_id (FK)  │      │ load_plan_id(FK)│      │ assignment_id   │                │
│  │ aircraft_id(FK) │      │ uld_id (FK)     │      │ cargo_item_id   │                │
│  │ status          │      │ uld_type_id(FK) │      │ x, y, z         │                │
│  │ oew_kg          │      │ position_code   │      │ rotated         │                │
│  │ dow_kg          │      │ total_weight_kg │      │ rotation_axis   │                │
│  │ payload_kg      │      │ volume_used_m3  │      └─────────────────┘                │
│  │ zfw_kg          │      │ is_virtual      │                                         │
│  │ tow_kg          │      └─────────────────┘                                         │
│  │ ldw_kg          │                                                                  │
│  │ zfw_cg_%mac     │      ┌─────────────────┐      ┌─────────────────┐                │
│  │ tow_cg_%mac     │      │ position_loads  │      │  packing_rules  │                │
│  │ ldw_cg_%mac     │      │─────────────────│      │─────────────────│                │
│  │ validation_ok   │◄─────│ id (PK)         │      │ id (PK)         │                │
│  │ errors[]        │      │ load_plan_id(FK)│      │ rule_text       │                │
│  │ warnings[]      │      │ position_id(FK) │      │ rule_type       │                │
│  └────────┬────────┘      │ uld_assign_id   │      │ priority        │                │
│           │               │ gross_weight_kg │      │ is_active       │                │
│           │               │ calc_moment     │      │ examples[]      │                │
│           │               │ calc_index      │      └─────────────────┘                │
│           │               └─────────────────┘                                         │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Schema Groups

### Group 1: Reference Data

Static lookup tables for locations, commodity codes, dangerous goods classifications, and temperature zones.

### Group 2: ULD & Aircraft Master Data

Master data for ULD types, physical ULD instances, aircraft configurations, and loading positions.

### Group 3: Weight & Balance Configuration

Configuration data for CG envelopes, fuel systems, loading zones with index tables, and weight constraints.

### Group 4: Cargo & AWB Data

Transactional data for air waybills, parcel groups, and individual cargo items.

### Group 5: Planning & Optimization

Planning session data including load plans, ULD assignments, 3D packing coordinates, and position loads.

---

## Reference Data Tables

### `locations`

Airport and location master data.

| Column         | Type         | Constraints                   | Description          |
| -------------- | ------------ | ----------------------------- | -------------------- |
| `id`           | UUID         | PK, DEFAULT gen_random_uuid() | Primary key          |
| `airport_code` | VARCHAR(4)   | NOT NULL, UNIQUE              | IATA airport code    |
| `city`         | VARCHAR(100) | NOT NULL                      | City name            |
| `country`      | VARCHAR(100) | NOT NULL                      | Country name         |
| `country_code` | VARCHAR(3)   | NOT NULL                      | ISO country code     |
| `timezone`     | VARCHAR(50)  | NOT NULL                      | IANA timezone        |
| `created_at`   | TIMESTAMP    | NOT NULL, DEFAULT NOW()       | Record creation time |
| `updated_at`   | TIMESTAMP    | NOT NULL, DEFAULT NOW()       | Record update time   |

---

### `commodity_codes`

IATA commodity classification codes.

| Column                   | Type        | Constraints                   | Description                        |
| ------------------------ | ----------- | ----------------------------- | ---------------------------------- |
| `id`                     | UUID        | PK, DEFAULT gen_random_uuid() | Primary key                        |
| `code`                   | VARCHAR(10) | NOT NULL, UNIQUE              | Commodity code                     |
| `description`            | TEXT        | NOT NULL                      | Description of commodity           |
| `is_dangerous_goods`     | BOOLEAN     | NOT NULL, DEFAULT FALSE       | Whether commodity is DG            |
| `dangerous_goods_codes`  | TEXT[]      |                               | Array of applicable DG class codes |
| `special_handling_codes` | TEXT[]      |                               | Array of IATA SHC codes            |
| `requires_temp_control`  | BOOLEAN     | NOT NULL, DEFAULT FALSE       | Requires temperature control       |
| `is_live_animal`         | BOOLEAN     | NOT NULL, DEFAULT FALSE       | Live animal indicator              |
| `is_foodstuff`           | BOOLEAN     | NOT NULL, DEFAULT FALSE       | Food/edible material               |
| `created_at`             | TIMESTAMP   | NOT NULL, DEFAULT NOW()       | Record creation time               |
| `updated_at`             | TIMESTAMP   | NOT NULL, DEFAULT NOW()       | Record update time                 |

---

### `dangerous_goods_classes`

IATA Dangerous Goods Regulations class definitions.

| Column                       | Type         | Constraints                   | Description                             |
| ---------------------------- | ------------ | ----------------------------- | --------------------------------------- |
| `id`                         | UUID         | PK, DEFAULT gen_random_uuid() | Primary key                             |
| `class_code`                 | VARCHAR(10)  | NOT NULL, UNIQUE              | DG class code (e.g., "1.1", "3", "6.1") |
| `division`                   | VARCHAR(10)  |                               | Division within class                   |
| `name`                       | VARCHAR(100) | NOT NULL                      | Class name                              |
| `description`                | TEXT         |                               | Detailed description                    |
| `is_exempt_from_segregation` | BOOLEAN      | NOT NULL, DEFAULT FALSE       | Exempt from Table 9.3.A                 |
| `created_at`                 | TIMESTAMP    | NOT NULL, DEFAULT NOW()       | Record creation time                    |

**Reference Data (IATA DGR Classes):**

- Class 1: Explosives (1.1-1.6)
- Class 2: Gases (2.1 Flammable, 2.2 Non-flammable, 2.3 Toxic)
- Class 3: Flammable liquids
- Class 4: Flammable solids (4.1, 4.2, 4.3)
- Class 5: Oxidizers (5.1, 5.2)
- Class 6: Toxic/Infectious (6.1, 6.2)
- Class 7: Radioactive
- Class 8: Corrosives
- Class 9: Miscellaneous

---

### `dg_segregation_rules`

IATA Table 9.3.A - Segregation of packages matrix.

| Column             | Type        | Constraints                   | Description                          |
| ------------------ | ----------- | ----------------------------- | ------------------------------------ |
| `id`               | UUID        | PK, DEFAULT gen_random_uuid() | Primary key                          |
| `class_a_id`       | UUID        | FK → dangerous_goods_classes  | First DG class                       |
| `class_b_id`       | UUID        | FK → dangerous_goods_classes  | Second DG class                      |
| `is_segregated`    | BOOLEAN     | NOT NULL                      | TRUE = must be segregated            |
| `segregation_type` | VARCHAR(20) |                               | 'PROHIBITED', 'SEPARATED', 'ALLOWED' |
| `notes`            | TEXT        |                               | Additional segregation notes         |
| `created_at`       | TIMESTAMP   | NOT NULL, DEFAULT NOW()       | Record creation time                 |

**Unique Constraint:** `(class_a_id, class_b_id)`

---

### `temperature_zones`

Temperature zone definitions for cargo compatibility.

| Column             | Type         | Constraints                   | Description                          |
| ------------------ | ------------ | ----------------------------- | ------------------------------------ |
| `id`               | UUID         | PK, DEFAULT gen_random_uuid() | Primary key                          |
| `code`             | VARCHAR(20)  | NOT NULL, UNIQUE              | Zone code (FROZEN, CHILLED, AMBIENT) |
| `name`             | VARCHAR(50)  | NOT NULL                      | Display name                         |
| `min_temp_celsius` | DECIMAL(5,2) |                               | Minimum temperature                  |
| `max_temp_celsius` | DECIMAL(5,2) |                               | Maximum temperature                  |
| `description`      | TEXT         |                               | Zone description                     |
| `created_at`       | TIMESTAMP    | NOT NULL, DEFAULT NOW()       | Record creation time                 |

**Standard Zones:**

- DEEP_FROZEN: < -18°C
- FROZEN: -18°C to -12°C
- CHILLED: 2°C to 8°C
- COOL: 8°C to 15°C
- AMBIENT: 15°C to 25°C
- CONTROLLED_ROOM: 15°C to 25°C (stricter control)

---

## ULD & Aircraft Master Data

### `uld_types`

Unit Load Device type specifications.

| Column                | Type          | Constraints                   | Description                             |
| --------------------- | ------------- | ----------------------------- | --------------------------------------- |
| `id`                  | UUID          | PK, DEFAULT gen_random_uuid() | Primary key                             |
| `code`                | VARCHAR(10)   | NOT NULL, UNIQUE              | IATA ULD code (e.g., AKE, PMC)          |
| `name`                | VARCHAR(50)   | NOT NULL                      | Common name (e.g., LD-3)                |
| `description`         | TEXT          |                               | Detailed description                    |
| `category`            | VARCHAR(20)   | NOT NULL                      | 'CONTAINER' or 'PALLET'                 |
| `contour`             | VARCHAR(20)   |                               | 'HALF_WIDTH', 'FULL_WIDTH', 'CONTOURED' |
| `max_gross_weight_kg` | DECIMAL(10,2) | NOT NULL                      | Maximum loaded weight                   |
| `tare_weight_kg`      | DECIMAL(10,2) | NOT NULL                      | Empty container weight                  |
| `max_volume_m3`       | DECIMAL(10,4) | NOT NULL                      | Internal volume                         |
| `length_cm`           | DECIMAL(10,2) | NOT NULL                      | External length                         |
| `width_cm`            | DECIMAL(10,2) | NOT NULL                      | External width                          |
| `height_cm`           | DECIMAL(10,2) | NOT NULL                      | External height                         |
| `internal_length_cm`  | DECIMAL(10,2) |                               | Internal length                         |
| `internal_width_cm`   | DECIMAL(10,2) |                               | Internal width                          |
| `internal_height_cm`  | DECIMAL(10,2) |                               | Internal height                         |
| `door_width_cm`       | DECIMAL(10,2) |                               | Door opening width                      |
| `door_height_cm`      | DECIMAL(10,2) |                               | Door opening height                     |
| `col_span`            | INTEGER       | NOT NULL, DEFAULT 1           | Position column span (1 or 2)           |
| `is_refrigerated`     | BOOLEAN       | NOT NULL, DEFAULT FALSE       | Temperature controlled                  |
| `deck_compatibility`  | TEXT[]        |                               | ['MAIN'], ['LOWER'], or both            |
| `created_at`          | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time                    |
| `updated_at`          | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record update time                      |

---

### `ulds`

Physical ULD instance tracking.

| Column                 | Type        | Constraints                   | Description                             |
| ---------------------- | ----------- | ----------------------------- | --------------------------------------- |
| `id`                   | UUID        | PK, DEFAULT gen_random_uuid() | Primary key                             |
| `uld_number`           | VARCHAR(20) | NOT NULL, UNIQUE              | ULD serial number                       |
| `uld_type_id`          | UUID        | FK → uld_types, NOT NULL      | ULD type reference                      |
| `location_id`          | UUID        | FK → locations                | Current location                        |
| `owner_code`           | VARCHAR(10) |                               | Owner airline code                      |
| `status`               | VARCHAR(20) | NOT NULL, DEFAULT 'AVAILABLE' | AVAILABLE, IN_USE, MAINTENANCE, DAMAGED |
| `last_inspection_date` | DATE        |                               | Last inspection date                    |
| `created_at`           | TIMESTAMP   | NOT NULL, DEFAULT NOW()       | Record creation time                    |
| `updated_at`           | TIMESTAMP   | NOT NULL, DEFAULT NOW()       | Record update time                      |

---

### `aircrafts`

Aircraft configuration master data.

| Column                      | Type          | Constraints                   | Description                   |
| --------------------------- | ------------- | ----------------------------- | ----------------------------- |
| `id`                        | UUID          | PK, DEFAULT gen_random_uuid() | Primary key                   |
| `name`                      | VARCHAR(100)  | NOT NULL                      | Full aircraft name            |
| `type_code`                 | VARCHAR(10)   | NOT NULL                      | ICAO type code (e.g., A321)   |
| `subtype`                   | VARCHAR(20)   |                               | Variant (e.g., 211P2F)        |
| `registration`              | VARCHAR(20)   | UNIQUE                        | Aircraft registration         |
| `msn`                       | VARCHAR(20)   |                               | Manufacturer serial number    |
| `main_deck_max_weight_kg`   | DECIMAL(10,2) | NOT NULL                      | Main deck weight limit        |
| `main_deck_max_volume_m3`   | DECIMAL(10,4) |                               | Main deck volume capacity     |
| `lower_deck_max_weight_kg`  | DECIMAL(10,2) | NOT NULL                      | Lower deck weight limit       |
| `lower_deck_max_volume_m3`  | DECIMAL(10,4) |                               | Lower deck volume capacity    |
| `total_max_payload_kg`      | DECIMAL(10,2) | NOT NULL                      | Total payload limit           |
| `total_max_volume_m3`       | DECIMAL(10,4) |                               | Total volume capacity         |
| `max_zero_fuel_weight_kg`   | DECIMAL(10,2) | NOT NULL                      | MZFW                          |
| `max_takeoff_weight_kg`     | DECIMAL(10,2) | NOT NULL                      | MTOW                          |
| `max_landing_weight_kg`     | DECIMAL(10,2) | NOT NULL                      | MLW                           |
| `max_taxi_weight_kg`        | DECIMAL(10,2) |                               | Max ramp weight               |
| `operating_empty_weight_kg` | DECIMAL(10,2) | NOT NULL                      | OEW                           |
| `datum_location`            | VARCHAR(20)   | DEFAULT 'NOSE'                | Reference point for arms      |
| `mac_leading_edge_cm`       | DECIMAL(10,2) |                               | MAC leading edge station      |
| `mac_length_cm`             | DECIMAL(10,2) |                               | Mean Aerodynamic Chord length |
| `created_at`                | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time          |
| `updated_at`                | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record update time            |

---

### `deck_configurations`

Deck configuration per aircraft.

| Column                     | Type          | Constraints                   | Description                      |
| -------------------------- | ------------- | ----------------------------- | -------------------------------- |
| `id`                       | UUID          | PK, DEFAULT gen_random_uuid() | Primary key                      |
| `aircraft_id`              | UUID          | FK → aircrafts, NOT NULL      | Aircraft reference               |
| `deck_code`                | VARCHAR(20)   | NOT NULL                      | MAIN, LOWER_FWD, LOWER_AFT, BULK |
| `deck_name`                | VARCHAR(50)   | NOT NULL                      | Display name                     |
| `max_structural_weight_kg` | DECIMAL(10,2) |                               | Deck weight limit                |
| `sequence`                 | INTEGER       | NOT NULL                      | Display order                    |
| `created_at`               | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time             |

**Unique Constraint:** `(aircraft_id, deck_code)`

---

### `loading_positions`

Individual cargo loading positions.

| Column                 | Type          | Constraints                        | Description                    |
| ---------------------- | ------------- | ---------------------------------- | ------------------------------ |
| `id`                   | UUID          | PK, DEFAULT gen_random_uuid()      | Primary key                    |
| `deck_id`              | UUID          | FK → deck_configurations, NOT NULL | Deck reference                 |
| `position_code`        | VARCHAR(10)   | NOT NULL                           | Position ID (e.g., U1, A1, 11) |
| `sequence_number`      | INTEGER       | NOT NULL                           | Loading sequence               |
| `max_weight_kg`        | DECIMAL(10,2) | NOT NULL                           | Position weight limit          |
| `arm_station_cm`       | DECIMAL(10,2) | NOT NULL                           | Distance from datum            |
| `compatible_uld_types` | TEXT[]        |                                    | Compatible ULD type codes      |
| `accepts_bulk_cargo`   | BOOLEAN       | NOT NULL, DEFAULT FALSE            | Can accept loose cargo         |
| `floor_area_m2`        | DECIMAL(10,4) |                                    | Position floor area            |
| `max_height_cm`        | DECIMAL(10,2) |                                    | Maximum cargo height           |
| `contour_code`         | VARCHAR(20)   |                                    | Fuselage contour restriction   |
| `x_offset`             | DECIMAL(10,2) |                                    | X position for visualization   |
| `y_offset`             | DECIMAL(10,2) |                                    | Y position for visualization   |
| `col_index`            | INTEGER       |                                    | Column index (0-based)         |
| `row_index`            | INTEGER       |                                    | Row index (0-based)            |
| `created_at`           | TIMESTAMP     | NOT NULL, DEFAULT NOW()            | Record creation time           |

**Unique Constraint:** `(deck_id, position_code)`

---

### `flights`

Flight schedule data.

| Column                | Type                     | Constraints                   | Description                                       |
| --------------------- | ------------------------ | ----------------------------- | ------------------------------------------------- |
| `id`                  | UUID                     | PK, DEFAULT gen_random_uuid() | Primary key                                       |
| `flight_number`       | VARCHAR(10)              | NOT NULL                      | Flight number                                     |
| `aircraft_id`         | UUID                     | FK → aircrafts, NOT NULL      | Aircraft reference                                |
| `origin_id`           | UUID                     | FK → locations, NOT NULL      | Origin airport                                    |
| `destination_id`      | UUID                     | FK → locations, NOT NULL      | Destination airport                               |
| `scheduled_departure` | TIMESTAMP WITH TIME ZONE | NOT NULL                      | Scheduled departure time                          |
| `scheduled_arrival`   | TIMESTAMP WITH TIME ZONE | NOT NULL                      | Scheduled arrival time                            |
| `actual_departure`    | TIMESTAMP WITH TIME ZONE |                               | Actual departure time                             |
| `actual_arrival`      | TIMESTAMP WITH TIME ZONE |                               | Actual arrival time                               |
| `status`              | VARCHAR(20)              | NOT NULL, DEFAULT 'SCHEDULED' | SCHEDULED, BOARDING, DEPARTED, ARRIVED, CANCELLED |
| `created_at`          | TIMESTAMP                | NOT NULL, DEFAULT NOW()       | Record creation time                              |
| `updated_at`          | TIMESTAMP                | NOT NULL, DEFAULT NOW()       | Record update time                                |

**Unique Constraint:** `(flight_number, scheduled_departure)`

---

## Weight & Balance Configuration

### `cg_envelopes`

Center of Gravity envelope definitions.

| Column                      | Type         | Constraints                   | Description                 |
| --------------------------- | ------------ | ----------------------------- | --------------------------- |
| `id`                        | UUID         | PK, DEFAULT gen_random_uuid() | Primary key                 |
| `aircraft_id`               | UUID         | FK → aircrafts, NOT NULL      | Aircraft reference          |
| `envelope_type`             | VARCHAR(20)  | NOT NULL                      | TAKEOFF, ZERO_FUEL, LANDING |
| `forward_limit_percent_mac` | DECIMAL(5,2) | NOT NULL                      | Forward CG limit            |
| `aft_limit_percent_mac`     | DECIMAL(5,2) | NOT NULL                      | Aft CG limit                |
| `description`               | TEXT         |                               | Envelope description        |
| `created_at`                | TIMESTAMP    | NOT NULL, DEFAULT NOW()       | Record creation time        |

**Unique Constraint:** `(aircraft_id, envelope_type)`

---

### `cg_envelope_points`

CG envelope polygon points.

| Column           | Type          | Constraints                   | Description          |
| ---------------- | ------------- | ----------------------------- | -------------------- |
| `id`             | UUID          | PK, DEFAULT gen_random_uuid() | Primary key          |
| `envelope_id`    | UUID          | FK → cg_envelopes, NOT NULL   | Envelope reference   |
| `sequence`       | INTEGER       | NOT NULL                      | Point order          |
| `weight_kg`      | DECIMAL(10,2) | NOT NULL                      | Weight at this point |
| `cg_percent_mac` | DECIMAL(5,2)  | NOT NULL                      | CG position (% MAC)  |
| `cg_index`       | DECIMAL(10,2) |                               | Index units          |
| `created_at`     | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time |

---

### `loading_zones`

Loading zone definitions with LMC index impacts.

| Column             | Type         | Constraints                   | Description              |
| ------------------ | ------------ | ----------------------------- | ------------------------ |
| `id`               | UUID         | PK, DEFAULT gen_random_uuid() | Primary key              |
| `aircraft_id`      | UUID         | FK → aircrafts, NOT NULL      | Aircraft reference       |
| `zone_code`        | VARCHAR(10)  | NOT NULL                      | Zone identifier (U1-U14) |
| `position_codes`   | TEXT[]       | NOT NULL                      | Positions in this zone   |
| `lmc_index_impact` | DECIMAL(5,2) | NOT NULL                      | Last Minute Change index |
| `description`      | TEXT         |                               | Zone description         |
| `created_at`       | TIMESTAMP    | NOT NULL, DEFAULT NOW()       | Record creation time     |

**Unique Constraint:** `(aircraft_id, zone_code)`

---

### `loading_zone_index_entries`

Weight-to-index lookup table per zone.

| Column          | Type          | Constraints                   | Description          |
| --------------- | ------------- | ----------------------------- | -------------------- |
| `id`            | UUID          | PK, DEFAULT gen_random_uuid() | Primary key          |
| `zone_id`       | UUID          | FK → loading_zones, NOT NULL  | Zone reference       |
| `weight_min_kg` | DECIMAL(10,2) | NOT NULL                      | Lower weight bound   |
| `weight_max_kg` | DECIMAL(10,2) | NOT NULL                      | Upper weight bound   |
| `index_units`   | DECIMAL(10,2) | NOT NULL                      | Index value          |
| `created_at`    | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time |

---

### `fuel_configurations`

Aircraft fuel system configuration.

| Column                 | Type          | Constraints                      | Description          |
| ---------------------- | ------------- | -------------------------------- | -------------------- |
| `id`                   | UUID          | PK, DEFAULT gen_random_uuid()    | Primary key          |
| `aircraft_id`          | UUID          | FK → aircrafts, NOT NULL, UNIQUE | Aircraft reference   |
| `max_fuel_capacity_kg` | DECIMAL(10,2) | NOT NULL                         | Total fuel capacity  |
| `description`          | TEXT          |                                  | Configuration notes  |
| `created_at`           | TIMESTAMP     | NOT NULL, DEFAULT NOW()          | Record creation time |

---

### `fuel_tanks`

Individual fuel tank specifications.

| Column            | Type          | Constraints                        | Description                         |
| ----------------- | ------------- | ---------------------------------- | ----------------------------------- |
| `id`              | UUID          | PK, DEFAULT gen_random_uuid()      | Primary key                         |
| `fuel_config_id`  | UUID          | FK → fuel_configurations, NOT NULL | Config reference                    |
| `tank_code`       | VARCHAR(20)   | NOT NULL                           | Tank identifier                     |
| `location`        | VARCHAR(20)   | NOT NULL                           | WING_LEFT, WING_RIGHT, CENTER, TRIM |
| `max_capacity_kg` | DECIMAL(10,2) | NOT NULL                           | Tank capacity                       |
| `arm_station_cm`  | DECIMAL(10,2) | NOT NULL                           | Tank arm for moment calc            |
| `sequence`        | INTEGER       | NOT NULL                           | Fill/usage order                    |
| `created_at`      | TIMESTAMP     | NOT NULL, DEFAULT NOW()            | Record creation time                |

**Unique Constraint:** `(fuel_config_id, tank_code)`

---

### `fuel_index_entries`

Fuel weight-to-index lookup table.

| Column           | Type          | Constraints                   | Description                     |
| ---------------- | ------------- | ----------------------------- | ------------------------------- |
| `id`             | UUID          | PK, DEFAULT gen_random_uuid() | Primary key                     |
| `fuel_tank_id`   | UUID          | FK → fuel_tanks               | Tank-specific (NULL = standard) |
| `fuel_config_id` | UUID          | FK → fuel_configurations      | Config reference                |
| `weight_kg`      | DECIMAL(10,2) | NOT NULL                      | Fuel weight                     |
| `index_value`    | DECIMAL(10,2) | NOT NULL                      | Index value                     |
| `density_kg_l`   | DECIMAL(5,3)  | DEFAULT 0.8                   | Fuel density                    |
| `created_at`     | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time            |

---

### `weight_constraints`

Combined position weight constraints.

| Column                   | Type          | Constraints                   | Description                       |
| ------------------------ | ------------- | ----------------------------- | --------------------------------- |
| `id`                     | UUID          | PK, DEFAULT gen_random_uuid() | Primary key                       |
| `aircraft_id`            | UUID          | FK → aircrafts, NOT NULL      | Aircraft reference                |
| `name`                   | VARCHAR(100)  | NOT NULL                      | Constraint name                   |
| `description`            | TEXT          |                               | Detailed description              |
| `affected_positions`     | TEXT[]        | NOT NULL                      | Position codes affected           |
| `max_combined_weight_kg` | DECIMAL(10,2) | NOT NULL                      | Combined weight limit             |
| `condition_type`         | VARCHAR(20)   | NOT NULL, DEFAULT 'ALWAYS'    | ALWAYS, CONDITIONAL               |
| `condition_expression`   | TEXT          |                               | Logic expression (if conditional) |
| `is_active`              | BOOLEAN       | NOT NULL, DEFAULT TRUE        | Whether constraint is active      |
| `created_at`             | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time              |

---

## Cargo & AWB Data

### `air_waybills`

Air Waybill header information.

| Column                   | Type          | Constraints                   | Description                         |
| ------------------------ | ------------- | ----------------------------- | ----------------------------------- |
| `id`                     | UUID          | PK, DEFAULT gen_random_uuid() | Primary key                         |
| `awb_number`             | VARCHAR(20)   | NOT NULL, UNIQUE              | AWB number (e.g., 123-45678901)     |
| `origin_id`              | UUID          | FK → locations, NOT NULL      | Origin airport                      |
| `destination_id`         | UUID          | FK → locations, NOT NULL      | Destination airport                 |
| `shipper_name`           | VARCHAR(200)  |                               | Shipper name                        |
| `shipper_address`        | TEXT          |                               | Shipper address                     |
| `consignee_name`         | VARCHAR(200)  |                               | Consignee name                      |
| `consignee_address`      | TEXT          |                               | Consignee address                   |
| `total_pieces`           | INTEGER       | NOT NULL                      | Total piece count                   |
| `total_weight_kg`        | DECIMAL(10,2) | NOT NULL                      | Total gross weight                  |
| `total_volume_m3`        | DECIMAL(10,4) | NOT NULL                      | Total volume                        |
| `chargeable_weight_kg`   | DECIMAL(10,2) |                               | Chargeable weight                   |
| `nature_of_goods`        | TEXT          |                               | Goods description                   |
| `special_handling_codes` | TEXT[]        |                               | AWB-level SHC codes                 |
| `booking_reference`      | VARCHAR(50)   |                               | Booking reference                   |
| `status`                 | VARCHAR(20)   | NOT NULL, DEFAULT 'BOOKED'    | BOOKED, RECEIVED, LOADED, DELIVERED |
| `created_at`             | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time                |
| `updated_at`             | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record update time                  |

---

### `parcel_groups`

Cargo piece groups within an AWB.

| Column                   | Type          | Constraints                   | Description               |
| ------------------------ | ------------- | ----------------------------- | ------------------------- |
| `id`                     | UUID          | PK, DEFAULT gen_random_uuid() | Primary key               |
| `awb_id`                 | UUID          | FK → air_waybills, NOT NULL   | AWB reference             |
| `commodity_code_id`      | UUID          | FK → commodity_codes          | Commodity classification  |
| `group_number`           | INTEGER       | NOT NULL                      | Group sequence within AWB |
| `pieces`                 | INTEGER       | NOT NULL                      | Number of pieces in group |
| `weight_kg`              | DECIMAL(10,2) | NOT NULL                      | Total weight of group     |
| `length_cm`              | DECIMAL(10,2) | NOT NULL                      | Piece length              |
| `width_cm`               | DECIMAL(10,2) | NOT NULL                      | Piece width               |
| `height_cm`              | DECIMAL(10,2) | NOT NULL                      | Piece height              |
| `volume_m3`              | DECIMAL(10,4) |                               | Calculated volume         |
| `is_stackable`           | BOOLEAN       | NOT NULL, DEFAULT TRUE        | Can stack on top          |
| `max_stack_weight_kg`    | DECIMAL(10,2) |                               | Max weight on top         |
| `is_tiltable`            | BOOLEAN       | NOT NULL, DEFAULT FALSE       | Can tilt/rotate           |
| `temp_zone_id`           | UUID          | FK → temperature_zones        | Temperature requirement   |
| `special_handling_codes` | TEXT[]        |                               | Group-level SHC codes     |
| `description`            | TEXT          |                               | Group description         |
| `created_at`             | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time      |
| `updated_at`             | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record update time        |

**Unique Constraint:** `(awb_id, group_number)`

---

### `cargo_items`

Individual cargo items for optimization.

| Column                   | Type          | Constraints                   | Description                          |
| ------------------------ | ------------- | ----------------------------- | ------------------------------------ |
| `id`                     | UUID          | PK, DEFAULT gen_random_uuid() | Primary key                          |
| `parcel_group_id`        | UUID          | FK → parcel_groups            | Parent group                         |
| `awb_id`                 | UUID          | FK → air_waybills, NOT NULL   | AWB reference                        |
| `piece_number`           | INTEGER       | NOT NULL                      | Piece ID within AWB                  |
| `weight_kg`              | DECIMAL(10,2) | NOT NULL                      | Individual piece weight              |
| `length_cm`              | DECIMAL(10,2) | NOT NULL                      | Length                               |
| `width_cm`               | DECIMAL(10,2) | NOT NULL                      | Width                                |
| `height_cm`              | DECIMAL(10,2) | NOT NULL                      | Height                               |
| `volume_m3`              | DECIMAL(10,4) |                               | Calculated volume                    |
| `is_stackable`           | BOOLEAN       | NOT NULL, DEFAULT TRUE        | Can stack items on top               |
| `max_stack_weight_kg`    | DECIMAL(10,2) |                               | Max weight on top                    |
| `is_tiltable`            | BOOLEAN       | NOT NULL, DEFAULT FALSE       | Can rotate/tilt                      |
| `is_dangerous_goods`     | BOOLEAN       | NOT NULL, DEFAULT FALSE       | DG indicator                         |
| `dg_class_id`            | UUID          | FK → dangerous_goods_classes  | DG class reference                   |
| `temp_zone_id`           | UUID          | FK → temperature_zones        | Temperature zone                     |
| `is_live_animal`         | BOOLEAN       | NOT NULL, DEFAULT FALSE       | Live animal flag                     |
| `is_foodstuff`           | BOOLEAN       | NOT NULL, DEFAULT FALSE       | Food item flag                       |
| `special_handling_codes` | TEXT[]        |                               | Item-level SHC codes                 |
| `priority`               | VARCHAR(20)   | NOT NULL, DEFAULT 'STANDARD'  | HIGH, MEDIUM, LOW, STANDARD          |
| `destination_id`         | UUID          | FK → locations                | Final destination                    |
| `load_status`            | VARCHAR(20)   | NOT NULL, DEFAULT 'PENDING'   | PENDING, ASSIGNED, LOADED, OFFLOADED |
| `assigned_uld_id`        | UUID          | FK → uld_assignments          | Assigned ULD                         |
| `created_at`             | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time                 |
| `updated_at`             | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record update time                   |

---

## Planning & Optimization

### `load_plans`

Load planning session and results.

| Column                      | Type          | Constraints                   | Description                                   |
| --------------------------- | ------------- | ----------------------------- | --------------------------------------------- |
| `id`                        | UUID          | PK, DEFAULT gen_random_uuid() | Primary key                                   |
| `flight_id`                 | UUID          | FK → flights, NOT NULL        | Flight reference                              |
| `aircraft_id`               | UUID          | FK → aircrafts, NOT NULL      | Aircraft reference                            |
| `plan_number`               | VARCHAR(20)   | UNIQUE                        | Plan identifier                               |
| `status`                    | VARCHAR(20)   | NOT NULL, DEFAULT 'DRAFT'     | DRAFT, OPTIMIZING, OPTIMIZED, FINAL, RELEASED |
| `operating_empty_weight_kg` | DECIMAL(10,2) |                               | OEW                                           |
| `dry_operating_weight_kg`   | DECIMAL(10,2) |                               | DOW                                           |
| `payload_kg`                | DECIMAL(10,2) |                               | Total payload                                 |
| `zero_fuel_weight_kg`       | DECIMAL(10,2) |                               | ZFW                                           |
| `takeoff_fuel_kg`           | DECIMAL(10,2) |                               | Fuel at takeoff                               |
| `trip_fuel_kg`              | DECIMAL(10,2) |                               | Enroute fuel burn                             |
| `takeoff_weight_kg`         | DECIMAL(10,2) |                               | TOW                                           |
| `landing_weight_kg`         | DECIMAL(10,2) |                               | Estimated LW                                  |
| `zfw_cg_percent_mac`        | DECIMAL(5,2)  |                               | ZFW CG position                               |
| `zfw_cg_index`              | DECIMAL(10,2) |                               | ZFW index units                               |
| `tow_cg_percent_mac`        | DECIMAL(5,2)  |                               | TOW CG position                               |
| `tow_cg_index`              | DECIMAL(10,2) |                               | TOW index units                               |
| `ldw_cg_percent_mac`        | DECIMAL(5,2)  |                               | LW CG position                                |
| `ldw_cg_index`              | DECIMAL(10,2) |                               | LW index units                                |
| `stabilizer_trim_units`     | DECIMAL(5,2)  |                               | Calculated trim setting                       |
| `within_weight_limits`      | BOOLEAN       |                               | All weights OK                                |
| `within_cg_envelope`        | BOOLEAN       |                               | CG within envelope                            |
| `constraints_satisfied`     | BOOLEAN       |                               | All constraints OK                            |
| `lateral_balance_ok`        | BOOLEAN       |                               | Left/right balanced                           |
| `validation_errors`         | TEXT[]        |                               | List of errors                                |
| `validation_warnings`       | TEXT[]        |                               | List of warnings                              |
| `optimization_time_ms`      | INTEGER       |                               | Algorithm runtime                             |
| `optimized_at`              | TIMESTAMP     |                               | Optimization timestamp                        |
| `released_at`               | TIMESTAMP     |                               | Release timestamp                             |
| `released_by`               | VARCHAR(100)  |                               | Releasing user                                |
| `created_at`                | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time                          |
| `updated_at`                | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record update time                            |

---

### `uld_assignments`

Cargo-to-ULD assignment records.

| Column               | Type          | Constraints                   | Description                         |
| -------------------- | ------------- | ----------------------------- | ----------------------------------- |
| `id`                 | UUID          | PK, DEFAULT gen_random_uuid() | Primary key                         |
| `load_plan_id`       | UUID          | FK → load_plans, NOT NULL     | Plan reference                      |
| `uld_id`             | UUID          | FK → ulds                     | Physical ULD (NULL if virtual)      |
| `uld_type_id`        | UUID          | FK → uld_types, NOT NULL      | ULD type                            |
| `uld_number`         | VARCHAR(20)   |                               | ULD identifier                      |
| `position_code`      | VARCHAR(10)   |                               | Assigned position                   |
| `sequence`           | INTEGER       | NOT NULL                      | Build-up sequence                   |
| `total_weight_kg`    | DECIMAL(10,2) | NOT NULL, DEFAULT 0           | Total loaded weight                 |
| `tare_weight_kg`     | DECIMAL(10,2) | NOT NULL                      | ULD tare weight                     |
| `cargo_weight_kg`    | DECIMAL(10,2) | NOT NULL, DEFAULT 0           | Cargo weight only                   |
| `volume_used_m3`     | DECIMAL(10,4) | NOT NULL, DEFAULT 0           | Volume occupied                     |
| `volume_utilization` | DECIMAL(5,2)  |                               | % volume used                       |
| `weight_utilization` | DECIMAL(5,2)  |                               | % weight capacity used              |
| `is_virtual`         | BOOLEAN       | NOT NULL, DEFAULT FALSE       | Virtual ULD for planning            |
| `status`             | VARCHAR(20)   | NOT NULL, DEFAULT 'PLANNED'   | PLANNED, BUILDING, COMPLETE, LOADED |
| `notes`              | TEXT          |                               | Build-up notes                      |
| `created_at`         | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record creation time                |
| `updated_at`         | TIMESTAMP     | NOT NULL, DEFAULT NOW()       | Record update time                  |

---

### `packed_items`

3D packing coordinates within ULD.

| Column              | Type          | Constraints                    | Description               |
| ------------------- | ------------- | ------------------------------ | ------------------------- |
| `id`                | UUID          | PK, DEFAULT gen_random_uuid()  | Primary key               |
| `uld_assignment_id` | UUID          | FK → uld_assignments, NOT NULL | ULD assignment            |
| `cargo_item_id`     | UUID          | FK → cargo_items, NOT NULL     | Cargo item                |
| `sequence`          | INTEGER       | NOT NULL                       | Packing sequence          |
| `x_position_cm`     | DECIMAL(10,2) | NOT NULL                       | X coordinate in ULD       |
| `y_position_cm`     | DECIMAL(10,2) | NOT NULL                       | Y coordinate in ULD       |
| `z_position_cm`     | DECIMAL(10,2) | NOT NULL                       | Z coordinate (height)     |
| `rotated`           | BOOLEAN       | NOT NULL, DEFAULT FALSE        | Item was rotated          |
| `rotation_axis`     | VARCHAR(10)   |                                | Rotation axis (X, Y, Z)   |
| `packed_length_cm`  | DECIMAL(10,2) | NOT NULL                       | Packed orientation length |
| `packed_width_cm`   | DECIMAL(10,2) | NOT NULL                       | Packed orientation width  |
| `packed_height_cm`  | DECIMAL(10,2) | NOT NULL                       | Packed orientation height |
| `created_at`        | TIMESTAMP     | NOT NULL, DEFAULT NOW()        | Record creation time      |

**Unique Constraint:** `(uld_assignment_id, cargo_item_id)`

---

### `position_loads`

ULD-to-aircraft position assignments.

| Column              | Type          | Constraints                      | Description               |
| ------------------- | ------------- | -------------------------------- | ------------------------- |
| `id`                | UUID          | PK, DEFAULT gen_random_uuid()    | Primary key               |
| `load_plan_id`      | UUID          | FK → load_plans, NOT NULL        | Plan reference            |
| `position_id`       | UUID          | FK → loading_positions, NOT NULL | Aircraft position         |
| `uld_assignment_id` | UUID          | FK → uld_assignments             | Assigned ULD              |
| `position_code`     | VARCHAR(10)   | NOT NULL                         | Position code             |
| `gross_weight_kg`   | DECIMAL(10,2) | NOT NULL                         | Total weight in position  |
| `calculated_moment` | DECIMAL(15,2) |                                  | Weight × Arm              |
| `calculated_index`  | DECIMAL(10,2) |                                  | Index units               |
| `status`            | VARCHAR(20)   | NOT NULL, DEFAULT 'PLANNED'      | PLANNED, LOADED, VERIFIED |
| `loaded_at`         | TIMESTAMP     |                                  | Load completion time      |
| `verified_by`       | VARCHAR(100)  |                                  | Verification user         |
| `created_at`        | TIMESTAMP     | NOT NULL, DEFAULT NOW()          | Record creation time      |
| `updated_at`        | TIMESTAMP     | NOT NULL, DEFAULT NOW()          | Record update time        |

**Unique Constraint:** `(load_plan_id, position_id)`

---

### `packing_rules`

Natural language rules for LLM interpretation.

| Column            | Type        | Constraints                   | Description                               |
| ----------------- | ----------- | ----------------------------- | ----------------------------------------- |
| `id`              | UUID        | PK, DEFAULT gen_random_uuid() | Primary key                               |
| `rule_text`       | TEXT        | NOT NULL                      | Natural language rule                     |
| `rule_type`       | VARCHAR(20) | NOT NULL                      | CONSTRAINT, PREFERENCE, PROHIBITION       |
| `priority`        | INTEGER     | NOT NULL, DEFAULT 50          | Priority (1-100, higher = more important) |
| `category`        | VARCHAR(50) |                               | Rule category                             |
| `is_active`       | BOOLEAN     | NOT NULL, DEFAULT TRUE        | Rule is active                            |
| `examples`        | TEXT[]      |                               | Example scenarios                         |
| `structured_rule` | JSONB       |                               | LLM-parsed structured rule                |
| `created_at`      | TIMESTAMP   | NOT NULL, DEFAULT NOW()       | Record creation time                      |
| `updated_at`      | TIMESTAMP   | NOT NULL, DEFAULT NOW()       | Record update time                        |

---

## Indexes & Performance

### Primary Indexes (Auto-created)

All primary keys have automatic B-tree indexes.

### Foreign Key Indexes

```sql
-- Critical relationship indexes
CREATE INDEX idx_ulds_location ON ulds(location_id);
CREATE INDEX idx_ulds_type ON ulds(uld_type_id);
CREATE INDEX idx_flights_aircraft ON flights(aircraft_id);
CREATE INDEX idx_flights_origin ON flights(origin_id);
CREATE INDEX idx_flights_destination ON flights(destination_id);
CREATE INDEX idx_flights_departure ON flights(scheduled_departure);

-- Cargo data indexes
CREATE INDEX idx_awb_origin ON air_waybills(origin_id);
CREATE INDEX idx_awb_destination ON air_waybills(destination_id);
CREATE INDEX idx_awb_number ON air_waybills(awb_number);
CREATE INDEX idx_parcel_awb ON parcel_groups(awb_id);
CREATE INDEX idx_cargo_awb ON cargo_items(awb_id);
CREATE INDEX idx_cargo_parcel ON cargo_items(parcel_group_id);
CREATE INDEX idx_cargo_status ON cargo_items(load_status);
CREATE INDEX idx_cargo_dg ON cargo_items(is_dangerous_goods) WHERE is_dangerous_goods = TRUE;

-- Planning indexes
CREATE INDEX idx_load_plans_flight ON load_plans(flight_id);
CREATE INDEX idx_load_plans_status ON load_plans(status);
CREATE INDEX idx_uld_assignments_plan ON uld_assignments(load_plan_id);
CREATE INDEX idx_packed_items_assignment ON packed_items(uld_assignment_id);
CREATE INDEX idx_position_loads_plan ON position_loads(load_plan_id);

-- Aircraft config indexes
CREATE INDEX idx_deck_aircraft ON deck_configurations(aircraft_id);
CREATE INDEX idx_positions_deck ON loading_positions(deck_id);
CREATE INDEX idx_zones_aircraft ON loading_zones(aircraft_id);
CREATE INDEX idx_cg_envelope_aircraft ON cg_envelopes(aircraft_id);
```

### GIN Indexes for Array Columns

```sql
CREATE INDEX idx_commodity_dg_codes ON commodity_codes USING GIN(dangerous_goods_codes);
CREATE INDEX idx_commodity_shc ON commodity_codes USING GIN(special_handling_codes);
CREATE INDEX idx_cargo_shc ON cargo_items USING GIN(special_handling_codes);
CREATE INDEX idx_positions_uld_types ON loading_positions USING GIN(compatible_uld_types);
```

---

## Sample Data

### Temperature Zones

```sql
INSERT INTO temperature_zones (code, name, min_temp_celsius, max_temp_celsius) VALUES
('DEEP_FROZEN', 'Deep Frozen', NULL, -18),
('FROZEN', 'Frozen', -18, -12),
('CHILLED', 'Chilled/Refrigerated', 2, 8),
('COOL', 'Cool', 8, 15),
('AMBIENT', 'Ambient/Room Temperature', 15, 25);
```

### Dangerous Goods Classes

```sql
INSERT INTO dangerous_goods_classes (class_code, division, name, is_exempt_from_segregation) VALUES
('1', '1.1', 'Explosives - Mass explosion hazard', FALSE),
('1', '1.4S', 'Explosives - No significant blast hazard', TRUE),
('2', '2.1', 'Flammable gases', FALSE),
('2', '2.2', 'Non-flammable, non-toxic gases', FALSE),
('2', '2.3', 'Toxic gases', FALSE),
('3', NULL, 'Flammable liquids', FALSE),
('4', '4.1', 'Flammable solids', FALSE),
('4', '4.2', 'Spontaneously combustible', FALSE),
('4', '4.3', 'Dangerous when wet', FALSE),
('5', '5.1', 'Oxidizers', FALSE),
('5', '5.2', 'Organic peroxides', FALSE),
('6', '6.1', 'Toxic substances', FALSE),
('6', '6.2', 'Infectious substances', FALSE),
('7', NULL, 'Radioactive materials', TRUE),
('8', NULL, 'Corrosives', FALSE),
('9', NULL, 'Miscellaneous dangerous goods', TRUE);
```

### ULD Types

```sql
INSERT INTO uld_types (code, name, category, max_gross_weight_kg, tare_weight_kg, max_volume_m3, length_cm, width_cm, height_cm, col_span) VALUES
('AKE', 'LD-3 Container', 'CONTAINER', 1588, 82, 4.5, 156.2, 153.4, 162.6, 1),
('AKC', 'LD-1 Container', 'CONTAINER', 1588, 70, 5.0, 156.2, 153.4, 162.6, 1),
('DPE', 'LD-2 Container', 'CONTAINER', 1225, 92, 3.5, 156.2, 119.4, 162.6, 1),
('PMC', 'P6P Pallet', 'PALLET', 4500, 120, 21.2, 317.5, 223.5, 162.6, 2),
('PAG', '16ft Pallet', 'PALLET', 6800, 150, 28.3, 498.0, 223.5, 162.6, 2);
```

---

## Changelog

| Version | Date     | Changes               |
| ------- | -------- | --------------------- |
| 1.0     | Dec 2024 | Initial schema design |
