# Scrapiz Admin Dashboard

A comprehensive admin dashboard for managing a scrap pickup and recycling marketplace. Built with Next.js 15, TypeScript, and Firebase Genkit.

## Features

- **Order Management**: Create, track, and manage scrap pickup orders
- **User Management**: Handle sellers, buyers, agents, and admins with KYC verification
- **AI-Powered Agent Assignment**: Automatic agent assignment using Firebase Genkit
- **Pricing Management**: Dynamic scrap pricing with historical tracking
- **Payment Processing**: Track payouts and transactions
- **Analytics & Reporting**: Comprehensive reports and charts
- **Role-Based Access Control**: Secure access based on user roles

## Tech Stack

- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4 + shadcn/ui
- **AI**: Firebase Genkit 1.20 with Google Generative AI
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy environment variables:

```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:9002](http://localhost:9002)

Start Genkit AI development server:

```bash
npm run genkit:dev
```

### Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### Other Commands

```bash
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript compiler checks
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes with shared layout
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   └── ui/                # Reusable UI components (shadcn/ui)
├── lib/
│   ├── data.ts            # Mock data (replace with API calls)
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
├── hooks/                 # Custom React hooks
└── ai/                    # Firebase Genkit AI workflows
    ├── genkit.ts          # Genkit configuration
    └── flows/             # AI flow definitions
```

## Features Implemented

### ✅ Completed

- Clean, responsive UI with mobile support
- All major pages (Dashboard, Orders, Users, Agents, Payments, etc.)
- Order management with status tracking
- User management with role-based views
- AI-powered agent assignment
- Data tables with pagination
- Loading states and error boundaries
- Toast notifications
- Mock data for development

### 🔄 Ready for Backend Integration

- API integration layer (replace mock data)
- Authentication flow
- Real-time updates
- File uploads (KYC documents, proof photos)
- Export functionality (CSV/PDF)
- Advanced filtering and search

## Design System

- **Primary Color**: Soft Blue (#A0D2EB) - Trust and cleanliness
- **Background**: Light Gray (#F0F4F8) - Clean and readable
- **Accent**: Warm Orange (#F2BE22) - Call-to-action highlights
- **Typography**: Inter font family

## Contributing

This is a frontend-only implementation. Backend integration should be done by connecting to your API endpoints.

## License

Private - Scrapiz Admin Dashboard
