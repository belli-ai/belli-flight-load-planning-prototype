# Flight Load Planning - Cursor Agent Guidelines

## Project Overview

A cargo flight load planning application for managing weight & balance calculations, ULD (Unit Load Device) management, and load sheet generation.

## Tech Stack

| Layer         | Technology              |
| ------------- | ----------------------- |
| Framework     | Next.js 16 (App Router) |
| Language      | TypeScript              |
| Database      | PostgreSQL              |
| ORM           | Drizzle                 |
| UI Components | ShadCN UI               |
| Styling       | Tailwind CSS v4         |

## Core Principles

### 1. Feature-Domain Architecture

Structure code by **feature domains**, not technical layers. Each feature should be self-contained with its own components, hooks, actions, and types.

```
src/
├── features/
│   ├── flights/           # Flight management feature
│   ├── cargo/             # Cargo & ULD management
│   ├── load-planning/     # Weight & balance calculations
│   └── reports/           # Load sheets & reporting
├── components/
│   └── ui/                # Shared ShadCN components only
├── lib/
│   └── db/                # Database client & schema
└── app/                   # Next.js routes (thin layer)
```

### 2. Documentation Requirements

**Every folder MUST have a `CURSOR.md` file** containing:

- Purpose and responsibility of the folder
- Key exports and their usage
- Dependencies and relationships to other features
- Data flow patterns
- Examples where helpful

### 3. Component Guidelines

Components must be:

- **Modular**: Single responsibility, focused on one task
- **Reusable**: Accept props for customization, avoid hardcoded values
- **Extendable**: Use composition patterns, expose className props
- **Typed**: Full TypeScript types for all props

```typescript
// Good: Modular, typed, extendable
type CargoItemProps = {
  item: CargoItem;
  onSelect?: (id: string) => void;
  className?: string;
};

export function CargoItemCard({ item, onSelect, className }: CargoItemProps) {
  return <Card className={cn("...", className)}>{/* ... */}</Card>;
}
```

### 4. Database Schema Documentation

All schemas in `src/lib/db/schema.ts` must include:

- JSDoc comments explaining the table purpose
- Field descriptions for non-obvious columns
- Relationship documentation
- Index explanations

```typescript
/**
 * Aircraft table - stores aircraft specifications for load planning
 *
 * Relationships:
 * - One aircraft has many flights
 * - References aircraft_types for specifications
 */
export const aircraft = pgTable("aircraft", {
  /** Unique aircraft registration (e.g., "G-BNLY") */
  registration: text("registration").primaryKey(),
  // ...
});
```

## Styling Guidelines

| Property      | Value                                |
| ------------- | ------------------------------------ |
| Theme         | Dark mode (default)                  |
| Font          | Geist Mono                           |
| Primary Color | Orange (`oklch(0.705 0.213 47.604)`) |
| Border Radius | xs (0.25rem)                         |

Use CSS variables defined in `src/app/globals.css`. Never hardcode colors.

## File Naming Conventions

| Type           | Convention                   | Example                 |
| -------------- | ---------------------------- | ----------------------- |
| Components     | PascalCase                   | `CargoCard.tsx`         |
| Hooks          | camelCase with `use` prefix  | `useLoadCalculation.ts` |
| Utilities      | camelCase                    | `calculateCG.ts`        |
| Types          | PascalCase with `.types.ts`  | `cargo.types.ts`        |
| Server Actions | camelCase with `.actions.ts` | `flights.actions.ts`    |
| Directories    | kebab-case                   | `load-planning/`        |

## Database Scripts

```bash
pnpm db:generate  # Generate migrations from schema
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema directly (dev only)
pnpm db:studio    # Open Drizzle Studio
```

## Environment Variables

Required variables in `.env`:

- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://[user]:[password]@[host]:[port]/[database]`)

## Quick Reference

- **Add a new feature**: Create folder in `src/features/`, add `CURSOR.md`
- **Add UI component**: Use ShadCN CLI: `pnpm dlx shadcn@latest add [component]`
- **Add DB table**: Define in `src/lib/db/schema.ts`, run `pnpm db:push`
- **Style guide**: Visit `/style-guide` route for visual reference
