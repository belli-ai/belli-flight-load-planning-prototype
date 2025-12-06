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

## Hackathon Context & WOW Factor

> **This is a 24-hour hackathon project. Prioritize visual impact and demo-ability.**

### WOW Factor Priorities (in order)

1. **Real-time Optimization Animation** - Show cargo "flying" into ULDs during optimization
2. **3D/Isometric Visualization** - Start with isometric 2D, upgrade to Three.js if time permits
3. **Before/After Comparison** - "8 ULDs → 5 ULDs = $450 saved per flight"
4. **AI Explanation Panel** - LLM-generated plain English loading instructions
5. **Exploded View** - Dramatic cargo reveal animation

### Algorithm Architecture

Uses **hybrid LLM + bin-packing approach**:

| Component            | Technology       | Purpose                                               |
| -------------------- | ---------------- | ----------------------------------------------------- |
| Rule Interpretation  | LLM (OpenAI)     | Parse natural language rules → structured constraints |
| Spatial Optimization | 3D FFD Algorithm | Actual bin-packing computation                        |
| Output Generation    | LLM (OpenAI)     | Human-readable build-up instructions                  |

### Demo Flow

1. Show unoptimized cargo list
2. Display "traditional" estimate (manual planning)
3. Run AI optimization with animation
4. Reveal savings and optimized result
5. 3D visualization with exploded view
6. AI-generated loading instructions

---

## Data Structure Crosscheck

**CRITICAL: Always verify data structures against actual implementation.**

When data structure prompts are provided:

1. **Before implementing**: Cross-reference with `src/lib/db/schema.ts`
2. **Check type definitions**: Verify against `.types.ts` files in feature folders
3. **Resolve conflicts**: Implementation in code takes precedence over prompts
4. **Update documentation**: If implementation differs, update `RUNNING_MILESTONES.md`

```typescript
// Always check these files for source of truth:
// - src/lib/db/schema.ts          (database schema)
// - src/features/*/types.ts       (feature-specific types)
// - RUNNING_MILESTONES.md         (architecture documentation)
```

---

## Quick Reference

- **Add a new feature**: Create folder in `src/features/`, add `CURSOR.md`
- **Add UI component**: Use ShadCN CLI: `pnpm dlx shadcn@latest add [component]`
- **Add DB table**: Define in `src/lib/db/schema.ts`, run `pnpm db:push`
- **Style guide**: Visit `/style-guide` route for visual reference
- **Milestones**: See `RUNNING_MILESTONES.md` for technical roadmap
