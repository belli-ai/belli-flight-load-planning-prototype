# db/ Directory - Database Layer

## Purpose

Contains Drizzle ORM configuration, database client, and all schema definitions for the Flight Load Planning application.

## Files

| File        | Purpose                  |
| ----------- | ------------------------ |
| `index.ts`  | Drizzle client singleton |
| `schema.ts` | All table definitions    |

## Schema Documentation

### Current Tables

#### `example` (placeholder)

Placeholder table for initial setup. Replace with actual domain tables.

### Planned Tables

The following tables should be implemented for the cargo flight load planning domain:

#### `aircraft`

Aircraft specifications for load planning calculations.

```typescript
export const aircraft = pgTable("aircraft", {
  id: uuid("id").defaultRandom().primaryKey(),
  registration: text("registration").notNull().unique(), // e.g., "G-BNLY"
  aircraftTypeId: uuid("aircraft_type_id").references(() => aircraftTypes.id),
  operator: text("operator"),
  status: text("status").default("active"), // active, maintenance, retired
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### `aircraft_types`

Aircraft type specifications (B777-300ER, A350-900, etc.).

```typescript
export const aircraftTypes = pgTable("aircraft_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  typeCode: text("type_code").notNull().unique(), // e.g., "B77W"
  manufacturer: text("manufacturer").notNull(), // e.g., "Boeing"
  model: text("model").notNull(), // e.g., "777-300ER"
  maxPayload: integer("max_payload").notNull(), // kg
  maxFuel: integer("max_fuel").notNull(), // kg
  operatingEmptyWeight: integer("oew").notNull(), // kg
  maxTakeoffWeight: integer("mtow").notNull(), // kg
  maxLandingWeight: integer("mlw").notNull(), // kg
  maxZeroFuelWeight: integer("mzfw").notNull(), // kg
  // CG envelope data stored as JSONB
  cgEnvelope: jsonb("cg_envelope"),
  cargoHolds: jsonb("cargo_holds"), // hold positions and limits
});
```

#### `flights`

Flight information for load planning.

```typescript
export const flights = pgTable("flights", {
  id: uuid("id").defaultRandom().primaryKey(),
  flightNumber: text("flight_number").notNull(), // e.g., "BA2847"
  aircraftId: uuid("aircraft_id").references(() => aircraft.id),
  departureAirport: text("departure_airport").notNull(), // ICAO code
  arrivalAirport: text("arrival_airport").notNull(),
  scheduledDeparture: timestamp("scheduled_departure").notNull(),
  status: text("status").default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### `cargo_items`

Individual cargo pieces/shipments.

```typescript
export const cargoItems = pgTable("cargo_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  awbNumber: text("awb_number"), // Air Waybill number
  description: text("description").notNull(),
  weight: integer("weight").notNull(), // kg
  length: integer("length"), // cm
  width: integer("width"), // cm
  height: integer("height"), // cm
  pieces: integer("pieces").default(1),
  specialHandling: text("special_handling").array(), // e.g., ["DGR", "PER"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### `ulds` (Unit Load Devices)

Containers and pallets.

```typescript
export const ulds = pgTable("ulds", {
  id: uuid("id").defaultRandom().primaryKey(),
  uldCode: text("uld_code").notNull().unique(), // e.g., "AKE12345BA"
  uldType: text("uld_type").notNull(), // LD3, LD7, PMC, etc.
  tareWeight: integer("tare_weight").notNull(), // kg
  maxGrossWeight: integer("max_gross_weight").notNull(),
  owner: text("owner"),
  status: text("status").default("available"),
});
```

#### `load_plans`

Load planning sessions/documents.

```typescript
export const loadPlans = pgTable("load_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  flightId: uuid("flight_id").references(() => flights.id),
  version: integer("version").default(1),
  status: text("status").default("draft"), // draft, final, amended
  totalPayload: integer("total_payload"),
  fuelLoad: integer("fuel_load"),
  calculatedCg: decimal("calculated_cg"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  finalizedAt: timestamp("finalized_at"),
});
```

#### `load_plan_items`

Items assigned to positions in a load plan.

```typescript
export const loadPlanItems = pgTable("load_plan_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  loadPlanId: uuid("load_plan_id").references(() => loadPlans.id),
  uldId: uuid("uld_id").references(() => ulds.id),
  cargoItemId: uuid("cargo_item_id").references(() => cargoItems.id),
  position: text("position").notNull(), // e.g., "11L", "21P"
  weight: integer("weight").notNull(),
});
```

## Usage Examples

### Querying with Relations

```typescript
import { db } from "@/lib/db";

// Get flight with aircraft details
const flight = await db.query.flights.findFirst({
  where: eq(flights.id, flightId),
  with: {
    aircraft: {
      with: {
        aircraftType: true,
      },
    },
  },
});
```

### Inserting Data

```typescript
import { db } from "@/lib/db";
import { flights } from "@/lib/db/schema";

await db.insert(flights).values({
  flightNumber: "BA2847",
  departureAirport: "EGLL",
  arrivalAirport: "KJFK",
  scheduledDeparture: new Date("2024-01-15T10:00:00Z"),
});
```

### Transactions

```typescript
import { db } from "@/lib/db";

await db.transaction(async (tx) => {
  const [loadPlan] = await tx.insert(loadPlans).values({ ... }).returning();
  await tx.insert(loadPlanItems).values([
    { loadPlanId: loadPlan.id, ... },
    { loadPlanId: loadPlan.id, ... },
  ]);
});
```

## Database Commands

```bash
pnpm db:generate  # Generate migration files from schema changes
pnpm db:migrate   # Apply migrations to database
pnpm db:push      # Push schema directly (development only)
pnpm db:studio    # Open Drizzle Studio GUI
```

## Adding New Tables

1. Define table in `schema.ts` with full documentation
2. Export types: `type TableName = typeof tableName.$inferSelect`
3. Add relations if needed using `relations()`
4. Update this CURSOR.md with table documentation
5. Run `pnpm db:push` (dev) or `pnpm db:generate && pnpm db:migrate` (prod)
