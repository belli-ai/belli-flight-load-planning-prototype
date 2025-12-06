import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

// Example table - placeholder for future cargo flight load planning tables
// Tables to be added:
// - aircraft: Aircraft specifications (model, max weight, cargo hold dimensions)
// - flights: Flight information (flight number, route, departure time)
// - cargo: Cargo items (weight, dimensions, special handling)
// - uld: Unit Load Devices (container types, tare weight)
// - load_plans: Load planning records

export const example = pgTable("example", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export types for use in application
export type Example = typeof example.$inferSelect;
export type NewExample = typeof example.$inferInsert;

