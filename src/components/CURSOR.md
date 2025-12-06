# components/ Directory

## Purpose

Contains **shared, generic UI components** used across multiple features. Feature-specific components should live within their feature folder, not here.

## Structure

```
components/
├── ui/              # ShadCN UI components (auto-generated)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── sonner.tsx
│   └── table.tsx
└── shared/          # Custom shared components (to be created)
    ├── Layout/
    ├── Navigation/
    └── DataDisplay/
```

## Guidelines

### ShadCN Components (ui/)

- **Do not modify** ShadCN components directly unless necessary
- Add variants by extending, not modifying source
- Install new components: `pnpm dlx shadcn@latest add [name]`

Available components:

- `avatar` - User avatars
- `button` - Action buttons with variants
- `card` - Content containers
- `dialog` - Modal dialogs
- `dropdown-menu` - Dropdown menus (hover: `bg-foreground/10`)
- `input` - Text inputs
- `label` - Form labels
- `navigation-menu` - Navigation with hover popovers (hover: `bg-foreground/10`)
- `sonner` - Toast notifications
- `table` - Data tables

#### Modified ShadCN Defaults

The following components have been customized for consistent hover styling:

| Component         | Modification                                               |
| ----------------- | ---------------------------------------------------------- |
| `navigation-menu` | Hover/focus uses `bg-foreground/10` instead of `bg-accent` |
| `dropdown-menu`   | Focus uses `bg-foreground/10` instead of `bg-accent`       |

**Hover styling convention:** Use 10% opacity backgrounds (`hover:bg-foreground/10`) to maintain text readability. Do NOT change text color on hover.

### Custom Shared Components

When creating shared components:

1. **Must be generic** - usable across multiple features
2. **Fully typed** - export prop types
3. **Composable** - accept `className`, `children` where appropriate
4. **Documented** - JSDoc for complex props

```typescript
// components/shared/PageHeader.tsx
type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Consistent page header with title, optional description, and action area.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("...", className)}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </header>
  );
}
```

### When to Add Here vs Feature Folder

| Add to `components/` | Add to `features/[name]/components/` |
| -------------------- | ------------------------------------ |
| Used by 3+ features  | Used by single feature               |
| Generic UI patterns  | Domain-specific display              |
| Layout primitives    | Feature workflows                    |
| Data display helpers | Feature-specific cards/lists         |

## Utilities

The `cn()` utility from `@/lib/utils` merges Tailwind classes:

```typescript
import { cn } from "@/lib/utils";

<div
  className={cn("base-styles", conditional && "conditional-styles", className)}
/>;
```
