# Build Up Plan PDF Rendering Specification

> **Version:** 1.0  
> **Last Updated:** December 2024  
> **Reference Document:** Raya Airways A321-211P2F Load and Trim Sheet (BZB Loadsheet)

---

## Table of Contents

1. [Overview](#overview)
2. [Document Types](#document-types)
3. [ULD Build-Up Instructions PDF](#uld-build-up-instructions-pdf)
4. [Load Plan Summary PDF](#load-plan-summary-pdf)
5. [Cargo Loading Index Tables](#cargo-loading-index-tables)
6. [Visual Layout Specifications](#visual-layout-specifications)
7. [Data Types & Sources](#data-types--sources)
8. [Implementation Guidelines](#implementation-guidelines)

---

## Overview

This specification defines how Build Up Plan PDFs should be rendered for the Flight Load Planning system. The documents are designed for operational use by ground handlers, loadmasters, and flight crew.

### Purpose

- **ULD Build-Up Instructions**: Step-by-step guidance for packing cargo items into ULDs
- **Load Plan Summary**: Complete aircraft load distribution with weight/balance verification

### Reference Standards

- Raya Airways A321-211P2F Load and Trim Sheet (LS-A321-00-002 Rev. IR)
- IATA Airport Handling Manual (AHM) Chapter 7 - Load Control
- IATA Unit Load Device Regulations (ULDR)

---

## Document Types

### 1. ULD Build-Up Instructions PDF

Generated per ULD, providing detailed packing instructions for ground handlers.

### 2. Load Plan Summary PDF

Generated per flight, showing complete aircraft load distribution with CG calculations.

---

## ULD Build-Up Instructions PDF

### Page Layout

| Property       | Value                       |
| -------------- | --------------------------- |
| Page Size      | A4 Portrait (210mm × 297mm) |
| Margins        | 20mm all sides              |
| Font Family    | Helvetica                   |
| Base Font Size | 9pt                         |

### Document Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  ├── Document Title: "ULD BUILD-UP INSTRUCTION SHEET"           │
│  ├── Flight Info: Flight Number, Date, Route                    │
│  └── ULD Info: Type Code, ULD Number, Position Code             │
├─────────────────────────────────────────────────────────────────┤
│  ULD VISUALIZATION (Isometric View)                             │
│  ├── 3D representation of ULD with packed items                 │
│  ├── Items color-coded by AWB or priority                       │
│  ├── Dimension annotations                                      │
│  └── Orientation indicators (arrows for loading direction)      │
├─────────────────────────────────────────────────────────────────┤
│  ITEM PLACEMENT TABLE                                           │
│  ├── Sequence Number (loading order)                            │
│  ├── AWB Number                                                 │
│  ├── Piece ID                                                   │
│  ├── Dimensions (L × W × H cm)                                  │
│  ├── Weight (kg)                                                │
│  ├── Position (X, Y, Z coordinates in cm)                       │
│  ├── Rotation Applied                                           │
│  └── Special Handling Codes                                     │
├─────────────────────────────────────────────────────────────────┤
│  BUILD-UP NOTES                                                 │
│  ├── Stacking sequence instructions                             │
│  ├── Heavy-on-bottom requirements                               │
│  ├── Orientation restrictions (THIS SIDE UP, etc.)              │
│  └── Temperature/DG handling notes                              │
├─────────────────────────────────────────────────────────────────┤
│  SUMMARY                                                        │
│  ├── Total Weight: XXX kg                                       │
│  ├── Volume Utilization: XX%                                    │
│  ├── Weight Utilization: XX%                                    │
│  └── Items Count: X pieces                                      │
├─────────────────────────────────────────────────────────────────┤
│  VERIFICATION                                                   │
│  ├── Prepared By: _________________ Time: _____                 │
│  ├── Verified By: _________________ Time: _____                 │
│  └── Remarks: _________________________________                 │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER                                                         │
│  └── Generated timestamp, page number                           │
└─────────────────────────────────────────────────────────────────┘
```

### Section Details

#### 1. Header Section

```typescript
type BuildUpHeader = {
  documentTitle: "ULD BUILD-UP INSTRUCTION SHEET";
  flightNumber: string; // e.g., "RY123"
  flightDate: string; // e.g., "06 DEC 2024"
  route: string; // e.g., "KUL → SIN"
  uldTypeCode: string; // e.g., "PMC", "AKE"
  uldNumber: string; // e.g., "PMC-12345GA"
  positionCode: string; // e.g., "U1", "11"
  aircraftRegistration: string;
};
```

**Visual Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ULD BUILD-UP INSTRUCTION SHEET                                 │
│  ─────────────────────────────────────────────────              │
│  Flight: RY123          Date: 06 DEC 2024                       │
│  Route: KUL → SIN       Aircraft: 9M-XXX                        │
│  ─────────────────────────────────────────────────              │
│  ULD Type: PMC          ULD Number: PMC-12345GA                 │
│  Aircraft Position: U1                                          │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. ULD Visualization Section

Display an isometric or top-down view of the ULD showing:

- ULD container outline with dimensions
- Packed items rendered as 3D boxes
- Color coding by AWB number or cargo type
- Position labels for each item
- Loading direction arrow (indicating which side to load from)

**Visualization Specifications:**

| Element     | Specification                                    |
| ----------- | ------------------------------------------------ |
| ULD Outline | 1pt black stroke, light gray fill                |
| Cargo Items | Colored fills with 0.5pt dark stroke             |
| Labels      | 7pt Helvetica, positioned at item center         |
| Dimensions  | 6pt gray text with dimension lines               |
| Grid        | Optional 10cm reference grid, 0.25pt gray dashed |

**Color Coding Scheme:**

| Cargo Type             | Fill Color | Hex Code |
| ---------------------- | ---------- | -------- |
| General Cargo          | Light Blue | #93C5FD  |
| Priority/Express       | Orange     | #FDBA74  |
| Dangerous Goods        | Red        | #FCA5A5  |
| Perishable             | Green      | #86EFAC  |
| Valuable               | Purple     | #D8B4FE  |
| Temperature Controlled | Cyan       | #67E8F9  |

#### 3. Item Placement Table

```
┌─────┬────────────────┬────────┬─────────────┬────────┬─────────────────┬──────────┬──────┐
│ SEQ │ AWB NUMBER     │ PC ID  │ DIMENSIONS  │ WEIGHT │ POSITION (cm)   │ ROTATION │ SHC  │
│     │                │        │ (L×W×H)     │ (kg)   │ X    Y    Z     │          │      │
├─────┼────────────────┼────────┼─────────────┼────────┼─────────────────┼──────────┼──────┤
│  1  │ 123-45678901   │ P001   │ 120×80×60   │  150   │   0    0    0   │ None     │ HEA  │
│  2  │ 123-45678901   │ P002   │ 100×80×50   │  120   │ 120    0    0   │ Z-90°    │      │
│  3  │ 234-56789012   │ P001   │  80×60×40   │   45   │   0   80    0   │ None     │ PER  │
│  4  │ 234-56789012   │ P002   │  80×60×40   │   45   │  80   80    0   │ None     │ PER  │
│  5  │ 345-67890123   │ P001   │  60×40×30   │   25   │   0    0   60   │ None     │      │
└─────┴────────────────┴────────┴─────────────┴────────┴─────────────────┴──────────┴──────┘
```

**Column Definitions:**

| Column     | Width | Description                                        |
| ---------- | ----- | -------------------------------------------------- |
| SEQ        | 8%    | Loading sequence (1 = first to load, bottom layer) |
| AWB NUMBER | 18%   | Air Waybill number                                 |
| PC ID      | 10%   | Piece identifier within AWB                        |
| DIMENSIONS | 15%   | Length × Width × Height in cm                      |
| WEIGHT     | 10%   | Gross weight in kg                                 |
| POSITION   | 22%   | X, Y, Z coordinates from ULD origin                |
| ROTATION   | 10%   | Applied rotation (None, Z-90°, Z-180°, etc.)       |
| SHC        | 7%    | Special Handling Codes                             |

#### 4. Build-Up Notes Section

Display contextual instructions based on cargo characteristics:

```
┌─────────────────────────────────────────────────────────────────┐
│  BUILD-UP NOTES                                                 │
│  ─────────────────────────────────────────────────              │
│  ⚠ LOADING SEQUENCE:                                            │
│    • Load items in sequence order (1 → 5)                       │
│    • Heavy items (>100kg) positioned at bottom layer            │
│    • Do not stack items on P003 (marked fragile)                │
│                                                                 │
│  ⚠ SPECIAL HANDLING:                                            │
│    • Items P001-P002: Heavy cargo - use lifting equipment       │
│    • Items P003-P004: Perishable - minimize exposure time       │
│                                                                 │
│  ⚠ ORIENTATION:                                                 │
│    • All items must maintain marked orientation (↑ THIS SIDE UP)│
└─────────────────────────────────────────────────────────────────┘
```

**Note Categories:**

| Category         | Icon | Trigger Condition            |
| ---------------- | ---- | ---------------------------- |
| Loading Sequence | ⚠    | Always shown                 |
| Heavy Cargo      | ⚡   | Items > 100kg                |
| Fragile          | ⚠    | SHC contains "FRA"           |
| Perishable       | ❄    | SHC contains "PER"           |
| Dangerous Goods  | ☢    | isDangerousGoods = true      |
| Temperature      | 🌡    | temperatureControlled = true |
| Orientation      | ↑    | orientationRestricted = true |

#### 5. Summary Section

```
┌─────────────────────────────────────────────────────────────────┐
│  ULD SUMMARY                                                    │
│  ─────────────────────────────────────────────────              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ TOTAL WEIGHT│  │ VOLUME UTIL │  │ WEIGHT UTIL │              │
│  │   385 kg    │  │    78%      │  │    65%      │              │
│  │ Max: 1588kg │  │             │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                 │
│  Items: 5 pieces from 3 AWBs                                    │
│  ULD Tare Weight: 82 kg                                         │
│  Gross Weight: 467 kg (Tare + Cargo)                            │
└─────────────────────────────────────────────────────────────────┘
```

#### 6. Verification Section

```
┌─────────────────────────────────────────────────────────────────┐
│  VERIFICATION                                                   │
│  ─────────────────────────────────────────────────              │
│                                                                 │
│  Prepared By: _______________________  Date/Time: ____________  │
│                                                                 │
│  Verified By: _______________________  Date/Time: ____________  │
│                                                                 │
│  Remarks: ____________________________________________________  │
│           ____________________________________________________  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Load Plan Summary PDF

### Page Layout

| Property       | Value                            |
| -------------- | -------------------------------- |
| Page Size      | A4 Portrait (210mm × 297mm)      |
| Margins        | 30pt all sides                   |
| Font Family    | Helvetica                        |
| Base Font Size | 9pt                              |
| Pages          | Multi-page (typically 2-3 pages) |

### Document Structure

#### Page 1: Flight Information & Weight Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  LOAD & TRIM SHEET                    Computer Generated        │
│  ═══════════════════════════════════════════════════════════════│
│  Flight: RY123                        Date: 06 DEC 2024         │
│  Route: KUL → SIN                     A/C Reg: 9M-XXX           │
│  A/C Type: A321-211P2F                                          │
├─────────────────────────────────────────────────────────────────┤
│  WEIGHT SUMMARY (KG)                                            │
│  ───────────────────────────────────────────────────────────────│
│  Operating Empty Weight        │    48,000    │                 │
│  Dry Operating Weight          │    48,500    │                 │
│  Total Traffic Load (Payload)  │    15,000    │  Max: 25,000    │
│  ───────────────────────────────────────────────────────────────│
│  ZERO FUEL WEIGHT              │    63,500    │  Max: 63,000 ⚠  │
│  ───────────────────────────────────────────────────────────────│
│  Take-off Fuel                 │     8,000    │                 │
│  TAKE-OFF WEIGHT               │    71,500    │  Max: 77,000    │
│  ───────────────────────────────────────────────────────────────│
│  Trip Fuel                     │     3,000    │                 │
│  LANDING WEIGHT                │    68,500    │  Max: 73,500    │
├─────────────────────────────────────────────────────────────────┤
│  CENTER OF GRAVITY (% MAC)                                      │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │   ZFW CG      │ │   TOW CG      │ │   LDW CG      │          │
│  │   28.5%       │ │   26.8%       │ │   27.2%       │          │
│  │  ✓ Within     │ │  ✓ Within     │ │  ✓ Within     │          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  ╔═══════════════════════════════════════╗                      │
│  ║     STABILIZER TRIM SETTING           ║                      │
│  ║            5.2 UNITS                  ║                      │
│  ╚═══════════════════════════════════════╝                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Page 2: Aircraft Position Layout & ULD Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│  MAIN DECK LOADING POSITIONS (A321-211P2F)                      │
│  ═══════════════════════════════════════════════════════════════│
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  COCKPIT                                                  │   │
│  ├────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────────┤   │
│  │ U1 │ U2 │ U3 │ U4 │ U5 │ U6 │ U7 │ U8 │ U9 │U10 │U11-U14 │   │
│  │PMC │PMC │PMC │PMC │PMC │PMC │PMC │PMC │PMC │PMC │  BULK  │   │
│  │1450│1380│1200│1100│1050│ 980│2100│1800│1650│1500│  770   │   │
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────────┘   │
│                                                           TAIL  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  MAIN DECK ULD DISTRIBUTION                                     │
│  ───────────────────────────────────────────────────────────────│
│  POS │ ULD TYPE │ ULD NUMBER    │ WEIGHT(kg) │ VOL% │ INDEX    │
│  ────┼──────────┼───────────────┼────────────┼──────┼──────────│
│  U1  │ PMC      │ PMC-00001GA   │    1,450   │  85% │   -12    │
│  U2  │ PMC      │ PMC-00002GA   │    1,380   │  78% │   -11    │
│  U3  │ PMC      │ PMC-00003GA   │    1,200   │  72% │    -8    │
│  U4  │ PMC      │ PMC-00004GA   │    1,100   │  65% │    -6    │
│  U5  │ PMC      │ PMC-00005GA   │    1,050   │  62% │    -5    │
│  U6  │ PMC      │ PMC-00006GA   │      980   │  58% │    -3    │
│  U7  │ PMC      │ PMC-00007GA   │    2,100   │  92% │     0    │
│  U8  │ PMC      │ PMC-00008GA   │    1,800   │  82% │    +3    │
│  U9  │ PMC      │ PMC-00009GA   │    1,650   │  75% │    +6    │
│  U10 │ PMC      │ PMC-00010GA   │    1,500   │  68% │   +10    │
│  ────┴──────────┴───────────────┴────────────┴──────┴──────────│
│  TOTAL MAIN DECK                │   14,210   │      │   -26    │
├─────────────────────────────────────────────────────────────────┤
│  LOWER DECK / BULK CARGO                                        │
│  ───────────────────────────────────────────────────────────────│
│  POS │ ULD TYPE │ ULD NUMBER    │ WEIGHT(kg) │ VOL% │ INDEX    │
│  ────┼──────────┼───────────────┼────────────┼──────┼──────────│
│  FWD │ AKE      │ AKE-12345GA   │      790   │  60% │    -2    │
│  AFT │ BULK     │ -             │      450   │  45% │    +1    │
│  ────┴──────────┴───────────────┴────────────┴──────┴──────────│
│  TOTAL LOWER DECK               │    1,240   │      │    -1    │
└─────────────────────────────────────────────────────────────────┘
```

#### Page 3: Index Calculations & Validation

```
┌─────────────────────────────────────────────────────────────────┐
│  CARGO LOADING INDEX CALCULATION                                │
│  ═══════════════════════════════════════════════════════════════│
│                                                                 │
│  Total Main & Lower Load: 15,450 kg                             │
│                                                                 │
│  ZONE INDEX VALUES (from A321-211P2F Index Table)               │
│  ───────────────────────────────────────────────────────────────│
│       │ U1  │ U2  │ U3  │ U4  │ U5  │ U6  │ U7  │ U8  │         │
│  ─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────────│
│  Load │1450 │1380 │1200 │1100 │1050 │ 980 │2100 │1800 │         │
│  Index│ -12 │ -11 │  -8 │  -6 │  -5 │  -3 │   0 │  +3 │         │
│  ─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────────│
│                                                                 │
│       │ U9  │ U10 │ U11 │ U12 │ U13 │ U14 │LOWER│               │
│  ─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────────────│
│  Load │1650 │1500 │   0 │   0 │   0 │ 770 │1240 │               │
│  Index│  +6 │ +10 │   0 │   0 │   0 │  +4 │  -1 │               │
│  ─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴───────────────│
│                                                                 │
│  TOTAL CARGO INDEX:                              -23            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  FUEL INDEX CALCULATION                                         │
│  ───────────────────────────────────────────────────────────────│
│  Fuel Load: 8,000 kg                                            │
│  Fuel Index (from Standard Fuel Index Table):     -7            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  BALANCE SUMMARY                                                │
│  ───────────────────────────────────────────────────────────────│
│  DOW Index (from aircraft data):                 +45            │
│  Cargo Index:                                    -23            │
│  Fuel Index:                                      -7            │
│  ───────────────────────────────────────────────────────────────│
│  TOTAL INDEX:                                    +15            │
│  ZFW CG (% MAC):                               28.5%            │
│  ───────────────────────────────────────────────────────────────│
│  Forward Limit: 15% MAC    ✓ OK                                 │
│  Aft Limit: 38% MAC        ✓ OK                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  WEIGHT CONSTRAINTS VALIDATION                                  │
│  ───────────────────────────────────────────────────────────────│
│  Forward Cargo Hold (A1+A2+11+12):                              │
│    Limit: 3,674 kg    Actual: 2,450 kg    ✓ OK                  │
│                                                                 │
│  Lower Deck Combined:                                           │
│    Limit: 16,329 kg   Actual: 1,240 kg    ✓ OK                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  SIGNATURES                                                     │
│  ───────────────────────────────────────────────────────────────│
│                                                                 │
│  Captain: _______________________    Loadmaster: ______________ │
│                                                                 │
│  Date/Time: _____________________                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cargo Loading Index Tables

Based on the Raya Airways A321-211P2F BZB Loadsheet, index values are determined by:

1. **Total Main & Lower Load (kg)** - cumulative weight
2. **Zone Code** - position on aircraft (U1-U14 for main deck)

### Index Table Structure

```typescript
type LoadingZoneIndexTable = {
  zoneCode: string; // U1, U2, ... U14
  entries: IndexEntry[];
};

type IndexEntry = {
  weightMinKg: number; // Lower bound (inclusive)
  weightMaxKg: number; // Upper bound (inclusive)
  indexUnits: number; // Index value for this weight range
};
```

### Sample Index Values (A321-211P2F Reference)

| Total Load (kg) | U1  | U2  | U3  | U4  | U5  | U6  | U7  | U8  | U9  | U10  | U11  | U12  | U13  | U14  |
| --------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---- | ---- | ---- | ---- | ---- |
| 100             | -1  | -1  | 0   | 0   | 0   | 0   | 0   | 0   | 0   | +0.5 | +0.5 | +0.5 | +0.5 | +0.7 |
| 500             | -3  | -3  | -1  | -1  | -1  | 0   | 0   | +1  | +2  | +2   | +3   | +3   | +4   | +4   |
| 1000            | -6  | -5  | -3  | -2  | -2  | -1  | 0   | +2  | +4  | +5   | +6   | +7   | +8   | +9   |
| 2000            | -10 | -9  | -5  | -4  | -4  | -2  | 0   | +3  | +7  | +10  | +12  | +14  | +15  | +17  |
| 5000            | -18 | -16 | -10 | -8  | -7  | -4  | 0   | +5  | +11 | +18  | +22  | +26  | +28  | +30  |
| MAX             | -25 | -47 | -28 | -28 | -9  | -5  | -1  | +4  | +15 | +30  | +30  | +37  | +30  | +31  |

### LMC (Last Minute Change) Index Impacts

| Zone       | U1   | U2   | U3   | U4   | U5   | U6   | U7  | U8   | U9   | U10  | U11  | U12  | U13  | U14  |
| ---------- | ---- | ---- | ---- | ---- | ---- | ---- | --- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| LMC Impact | -1.4 | -1.2 | -0.5 | -0.3 | -0.5 | -0.3 | 0.0 | +0.2 | +0.4 | +0.7 | +0.9 | +1.1 | +1.3 | +1.5 |

---

## Visual Layout Specifications

### Typography

| Element            | Font           | Size | Weight | Color   |
| ------------------ | -------------- | ---- | ------ | ------- |
| Document Title     | Helvetica-Bold | 16pt | Bold   | #000000 |
| Section Title      | Helvetica-Bold | 10pt | Bold   | #000000 |
| Section Background | -              | -    | -      | #F0F0F0 |
| Body Text          | Helvetica      | 9pt  | Normal | #333333 |
| Table Header       | Helvetica-Bold | 8pt  | Bold   | #000000 |
| Table Cell         | Helvetica      | 8pt  | Normal | #333333 |
| Labels             | Helvetica      | 8pt  | Normal | #666666 |
| Emphasis Values    | Helvetica-Bold | 10pt | Bold   | #000000 |
| Warning Text       | Helvetica-Bold | 9pt  | Bold   | #DC2626 |
| Success Text       | Helvetica-Bold | 9pt  | Bold   | #16A34A |
| Footer             | Helvetica      | 7pt  | Normal | #666666 |

### Colors

| Purpose            | Hex Code | Usage                |
| ------------------ | -------- | -------------------- |
| Primary Black      | #000000  | Titles, borders      |
| Body Text          | #333333  | Main content         |
| Secondary Text     | #666666  | Labels, descriptions |
| Muted Text         | #999999  | Placeholders         |
| Section Background | #F0F0F0  | Section headers      |
| Row Highlight      | #F5F5F5  | Alternating rows     |
| Table Header       | #E0E0E0  | Table headers        |
| Border Light       | #CCCCCC  | Table borders        |
| Success            | #16A34A  | ✓ indicators         |
| Warning            | #F97316  | ⚠ indicators         |
| Error              | #DC2626  | Exceeded limits      |

### Spacing

| Element            | Value                           |
| ------------------ | ------------------------------- |
| Page Margin        | 30pt (top, right, bottom, left) |
| Section Gap        | 12pt                            |
| Row Padding        | 3pt vertical                    |
| Table Cell Padding | 4pt                             |
| CG Box Padding     | 8pt                             |

---

## Data Types & Sources

### Input Data Types

```typescript
// Build-Up Instructions Input
type BuildUpPdfInput = {
  // Flight context
  flightNumber: string;
  flightDate: Date;
  origin: string;
  destination: string;
  aircraftRegistration: string;

  // ULD context
  uldAssignment: {
    uldTypeCode: string;
    uldNumber: string;
    positionCode: string;
    tareWeightKg: number;
    maxGrossWeightKg: number;
    dimensions: {
      lengthCm: number;
      widthCm: number;
      heightCm: number;
    };
  };

  // Packed items with coordinates
  packedItems: PackedItemData[];

  // Summary statistics
  totalWeightKg: number;
  volumeUtilization: number;
  weightUtilization: number;

  // Build-up instructions (optional, from LLM)
  instructions?: BuildUpInstruction;
};

type PackedItemData = {
  cargoItemId: string;
  awbNumber: string;
  pieceId: string;
  sequenceNumber: number;

  // Physical properties
  weightKg: number;
  originalDimensions: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  packedDimensions: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };

  // Position in ULD (origin at bottom-front-left corner)
  position: {
    xCm: number; // Along length (front to back)
    yCm: number; // Along width (left to right)
    zCm: number; // Along height (bottom to top)
  };

  // Rotation applied
  rotationApplied: "NONE" | "Z_90" | "Z_180" | "Z_270" | "XY_SWAP";

  // Special handling
  specialHandlingCodes: string[];
  isDangerousGoods: boolean;
  isPerishable: boolean;
  isFragile: boolean;
  orientationRestricted: boolean;
};
```

### Data Sources Mapping

| Data                  | Source Location                         | Type     |
| --------------------- | --------------------------------------- | -------- |
| Flight Info           | `flights` table via `useSelectedFlight` | Database |
| ULD Assignment        | `UldAssignmentResult` from optimization | Runtime  |
| Packed Items          | `PackedItem[]` from FFD-3D optimizer    | Runtime  |
| Build-Up Instructions | `BuildUpInstruction` from LLM           | Runtime  |
| Cargo Details         | `cargo_items` table                     | Database |
| Index Tables          | `loading_zone_index_entries` table      | Database |
| Aircraft Positions    | `loading_positions` table               | Database |
| Weight Limits         | `aircrafts` table                       | Database |
| CG Data               | Calculated from `optimizeBalance()`     | Runtime  |

---

## Implementation Guidelines

### File Structure

```
src/features/planning/lib/
├── build-up-pdf/
│   ├── build-up-pdf-generator.tsx   # Main PDF generator
│   ├── components/
│   │   ├── header.tsx               # Header section
│   │   ├── uld-visualization.tsx    # Isometric ULD view
│   │   ├── item-table.tsx           # Item placement table
│   │   ├── notes-section.tsx        # Build-up notes
│   │   ├── summary-section.tsx      # Weight/volume summary
│   │   └── verification.tsx         # Signatures section
│   ├── styles.ts                    # PDF styles
│   └── types.ts                     # Type definitions
```

### React-PDF Component Pattern

```typescript
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// Generate PDF blob
export async function generateBuildUpPdf(data: BuildUpPdfInput): Promise<Blob> {
  const doc = <BuildUpDocument data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

// Download helper
export function downloadBuildUpPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### Integration Points

1. **Build-Up Page** (`src/app/dashboard/build-up/page.tsx`)

   - Add "Export Build-Up Instructions" button per ULD
   - Trigger `generateBuildUpPdf()` after optimization

2. **Load Balancing Page** (`src/app/dashboard/load-balancing/page.tsx`)

   - Enhance existing "Export Load Sheet" with index table sections
   - Add complete load plan PDF with all calculations

3. **Results Summary Component** (`src/features/planning/components/results-summary.tsx`)
   - Add PDF export action per ULD assignment
   - Bulk export option for all ULDs

### Export Filename Convention

```
BuildUp_<FlightNumber>_<ULDNumber>_<Date>.pdf
Example: BuildUp_RY123_PMC-00001GA_2024-12-06.pdf

LoadPlan_<FlightNumber>_<Date>.pdf
Example: LoadPlan_RY123_2024-12-06.pdf
```

---

## References

1. Raya Airways A321-211P2F Load and Trim Sheet (LS-A321-00-002 Rev. IR)
2. IATA Airport Handling Manual (AHM) - 46th Edition, Chapter 7
3. IATA Unit Load Device Regulations (ULDR) - 14th Edition
4. Existing Load Sheet Generator: `src/features/weight-balance/lib/load-sheet-generator.tsx`
5. Load Planning Spec: `docs/LOAD_PLANNING_SPEC.md`
6. Database Schema: `docs/DATABASE_SCHEMA.md`

---

_Document Version: 1.0_  
_Last Updated: December 2024_





