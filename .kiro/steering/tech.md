---
inclusion: always
---

# Tech Stack

## Framework & Runtime

- **Next.js 15.3.3** with App Router (React 18.3.1)
- **TypeScript 5** with strict mode enabled
- **Node.js** (ES2017 target)
- **Turbopack** for fast development builds

## UI & Styling

- **Tailwind CSS 3.4** with custom design tokens
- **Radix UI** primitives for accessible components
- **shadcn/ui** component library pattern
- **Lucide React** for icons
- **Recharts** for data visualization
- **Inter** font family (Google Fonts)

## AI & Backend

- **Firebase Genkit 1.20** for AI workflows
- **Google Generative AI** integration
- **Firebase** for backend services
- Cloud Functions for agent assignment logic

## Form & Validation

- **React Hook Form** for form management
- **Zod** for schema validation
- **date-fns** for date manipulation

## Development Tools

- **tsx** for TypeScript execution
- **genkit-cli** for AI development
- **patch-package** for dependency patches

## Common Commands

```bash
# Development
npm run dev              # Start Next.js dev server on port 9002 with Turbopack
npm run genkit:dev       # Start Genkit AI development server
npm run genkit:watch     # Start Genkit with hot reload

# Build & Deploy
npm run build            # Production build
npm start                # Start production server

# Quality Checks
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript compiler checks
```

## Configuration Notes

- Path alias `@/*` maps to `./src/*`
- TypeScript build errors ignored in production builds
- ESLint errors ignored during builds
- Remote images allowed from placehold.co, unsplash.com, picsum.photos
