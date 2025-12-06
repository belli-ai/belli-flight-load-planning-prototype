# lib/ Directory

## Purpose

Contains core infrastructure code: database clients, external service integrations, and shared utilities. This is **not** for feature-specific logic.

## Structure

```
lib/
├── db/
│   ├── index.ts      # Drizzle client instance
│   └── schema.ts     # All database table definitions
└── utils.ts          # ShadCN utility (cn function)
```

## Database (db/)

### Client (`index.ts`)

Singleton Drizzle client connected to PostgreSQL:

```typescript
import { db } from "@/lib/db";

// Query example
const flights = await db.query.flights.findMany();

// Insert example
await db.insert(flights).values({ ... });
```

### Schema (`schema.ts`)

**All database tables must be defined here** with proper documentation.

Documentation requirements:

1. Table-level JSDoc explaining purpose and relationships
2. Column comments for non-obvious fields
3. Type exports for select/insert operations

See the schema file for current tables and add new ones following the established pattern.

## Utilities (utils.ts)

Contains the `cn()` function for merging Tailwind classes:

```typescript
import { cn } from "@/lib/utils";

cn("base", condition && "conditional", className);
```

## Adding New Libraries

When adding new integrations:

1. Create a subfolder: `lib/[service-name]/`
2. Add `CURSOR.md` documenting the integration
3. Export a singleton client
4. Keep configuration in environment variables
