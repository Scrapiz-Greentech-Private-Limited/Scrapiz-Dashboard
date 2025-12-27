---
inclusion: always
---

# Project Structure

## Directory Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth route group (login)
│   ├── dashboard/         # Dashboard pages (/dashboard/*)
│   ├── layout.tsx         # Root layout with fonts and metadata
│   ├── page.tsx           # Landing/home page (redirects to /login)
│   └── globals.css        # Global styles and Tailwind imports
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   │   ├── *-table-client.tsx    # Client-side table components
│   │   ├── *-dialog.tsx          # Modal dialogs
│   │   ├── *-chart.tsx           # Chart components
│   │   ├── header.tsx            # Dashboard header
│   │   ├── navigation.tsx        # Sidebar navigation
│   │   └── reports/              # Report-specific charts
│   └── ui/                # shadcn/ui components (Radix primitives)
├── lib/
│   ├── data.ts            # Mock/sample data
│   ├── types.ts           # TypeScript type definitions
│   ├── utils.ts           # Utility functions (cn helper)
│   └── placeholder-images.* # Image placeholder utilities
├── hooks/                 # Custom React hooks
│   ├── use-mobile.tsx     # Mobile detection hook
│   └── use-toast.ts       # Toast notification hook
└── ai/                    # Firebase Genkit AI workflows
    ├── genkit.ts          # Genkit configuration
    ├── dev.ts             # Development entry point
    └── flows/             # AI flow definitions
```

## Routing Conventions

- **Route Groups**: Use `(groupName)` for shared layouts without affecting URL structure (e.g., `(auth)` for login)
- **Dashboard Routes**: All admin pages under `dashboard/` folder with shared layout at `/dashboard/*`
- **Page Files**: Each route has a `page.tsx` file as the entry point
- **Layouts**: `layout.tsx` files provide shared UI for route segments

## Component Patterns

- **Client Components**: Mark with `"use client"` directive when using hooks or browser APIs
- **UI Components**: Reusable primitives in `components/ui/` (don't modify directly, regenerate via shadcn)
- **Dashboard Components**: Feature-specific components in `components/dashboard/`
- **Naming**: Use kebab-case for files, PascalCase for component names
- **Table Components**: Suffix with `-table-client.tsx` for data tables
- **Dialog Components**: Suffix with `-dialog.tsx` for modals

## Type System

- **Centralized Types**: All shared types defined in `src/lib/types.ts`
- **Type Exports**: Use named exports for all types
- **Enums as Unions**: Use string literal unions instead of enums (e.g., `type UserRole = 'seller' | 'buyer'`)

## Styling Conventions

- **Utility Function**: Use `cn()` from `@/lib/utils` to merge Tailwind classes
- **Design Tokens**: Use CSS variables defined in globals.css (e.g., `hsl(var(--primary))`)
- **Responsive**: Mobile-first approach with Tailwind breakpoints
- **Font Classes**: `font-body`, `font-headline` for typography

## Import Patterns

- **Path Alias**: Always use `@/` for imports from `src/` directory
- **Example**: `import { cn } from '@/lib/utils'`
- **Component Imports**: Import UI components from `@/components/ui/[component]`
