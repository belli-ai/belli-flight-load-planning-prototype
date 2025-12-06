# src/ Directory

## Purpose

Root source directory containing all application code organized by responsibility.

## Structure

```
src/
├── app/           # Next.js App Router - routes and layouts
├── components/    # Shared UI components (ShadCN)
├── features/      # Feature-domain modules (to be created)
├── lib/           # Core utilities, database, and clients
└── hooks/         # Shared custom hooks (to be created)
```

## Guidelines

### Route Files (app/)

- Keep route files thin - delegate logic to features
- Use server components by default
- Add `"use client"` only when necessary

### Feature Modules (features/)

- Self-contained with own components, hooks, actions, types
- Each feature must have its own `CURSOR.md`
- Import shared components from `@/components/ui`
- Export public API through `index.ts`

### Shared Components (components/)

- Only truly shared, generic components
- Feature-specific components stay in their feature folder
- All ShadCN UI components live in `components/ui/`

### Library Code (lib/)

- Database client and schema definitions
- External service clients
- Pure utility functions

## Import Aliases

Use the `@/` alias for imports:

```typescript
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { CargoCard } from "@/features/cargo/components/CargoCard";
```
