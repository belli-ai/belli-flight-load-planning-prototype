# app/ Directory - Next.js Routes

## Purpose

Contains all Next.js App Router pages, layouts, and route handlers. This layer should be **thin** - it primarily composes feature components and handles routing concerns.

## Structure

```
app/
├── globals.css       # Global styles and CSS variables
├── layout.tsx        # Root layout (fonts, providers, metadata)
├── page.tsx          # Landing page
├── style-guide/      # Design system reference
│   └── page.tsx
└── dashboard/        # Dashboard with feature navigation
    ├── layout.tsx    # Dashboard layout with Navbar
    ├── page.tsx      # Dashboard home with stats & feature cards
    ├── flights/      # Flight schedule
    ├── build-up/     # ULD build up
    ├── load-balancing/ # Weight & balance
    ├── aircraft/     # Aircraft configuration
    ├── cargo/        # Cargo management
    └── reference-data/ # System settings
```

## Guidelines

### Page Components

Pages should:

1. Import and compose feature components
2. Handle route-specific data fetching (if server-side)
3. Pass URL params/search params to features
4. Remain thin - no business logic

```typescript
// Good: Thin page component
export default async function FlightsPage() {
  return (
    <MainLayout>
      <FlightList />
    </MainLayout>
  );
}

// Bad: Business logic in page
export default async function FlightsPage() {
  const flights = await db.query.flights.findMany(); // Move to feature
  const filtered = flights.filter(...); // Move to feature
  return <div>{/* rendering logic */}</div>;
}
```

### Layouts

- `layout.tsx` - Root layout with providers, fonts, global UI
- Feature-specific layouts go in route group folders

### Route Groups

Use route groups `(groupName)` for:

- Shared layouts within a section
- Organizing related routes without affecting URL

## Theme Configuration

CSS variables are defined in `globals.css`:

- Dark mode is default (`html` has `class="dark"`)
- Orange primary: `--primary: oklch(0.705 0.213 47.604)`
- xs radius: `--radius: 0.25rem`

## Key Files

| File                   | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `globals.css`          | Theme variables, Tailwind imports                         |
| `layout.tsx`           | Root layout, Geist Mono font, Toaster                     |
| `page.tsx`             | Landing page                                              |
| `style-guide/page.tsx` | Visual design system reference                            |
| `dashboard/layout.tsx` | Dashboard layout with Navbar                              |
| `dashboard/page.tsx`   | Dashboard home with stats, feature cards, pending flights |
