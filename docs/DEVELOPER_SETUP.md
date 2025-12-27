# Developer Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Environment](#development-environment)
4. [Project Structure](#project-structure)
5. [Running the Application](#running-the-application)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: Latest version
- **Code Editor**: VS Code (recommended) or any modern IDE

### Recommended VS Code Extensions

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
- GitLens

### System Requirements

- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 2GB free space

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd admin-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15.3.3
- React 18.3.1
- TypeScript 5
- Tailwind CSS 3.4.1
- Radix UI components
- Recharts
- Axios
- And other dependencies

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_FRONTEND_SECRET=Scrapiz#0nn$(tab!z

# Optional: Firebase Configuration (if using)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

**Important**: Never commit `.env.local` to version control!


### 4. Verify Installation

```bash
npm run build
```

If the build succeeds, your setup is correct.

## Development Environment

### Backend Setup

The admin dashboard requires the Django backend to be running.

#### Option 1: Local Django Backend

1. Navigate to the server directory:
```bash
cd ../server
```

2. Set up Python virtual environment:
```bash
python -m venv myenv
source myenv/bin/activate  # On Windows: myenv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create superuser:
```bash
python manage.py createsuperuser
```

6. Start Django server:
```bash
python manage.py runserver
```

Backend will run on `http://localhost:8000`

#### Option 2: Use Staging Backend

Update `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://staging-api.scrapiz.in/api
```

### Database Setup (if running backend locally)

Ensure PostgreSQL is installed and running:

```bash
# Create database
createdb scrapiz_db

# Update server/.env with database credentials
DATABASE_URL=postgresql://user:password@localhost:5432/scrapiz_db
```

## Project Structure

```
admin-dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication routes
│   │   │   └── login/
│   │   └── dashboard/         # Protected dashboard routes
│   │       ├── users/
│   │       ├── orders/
│   │       ├── inventory/
│   │       └── ...
│   ├── components/            # React components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   ├── backend/          # API service layer
│   │   └── ui/               # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   ├── contexts/             # React contexts
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
├── docs/                     # Documentation
├── .env.local               # Environment variables (not in git)
├── .env.local.example       # Example environment file
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

### Key Directories

**`src/app/`**: Next.js pages using App Router
- Route groups: `(auth)` for public routes, `dashboard` for protected routes
- Each folder represents a route segment
- `page.tsx` files define the page component
- `layout.tsx` files define shared layouts

**`src/components/`**: Reusable React components
- `dashboard/`: Dashboard-specific components (tables, dialogs, etc.)
- `backend/`: API service layer and configuration
- `ui/`: Generic UI components (buttons, inputs, etc.)

**`src/hooks/`**: Custom React hooks
- `useAuth.ts`: Authentication state management
- `useUsers.ts`: User data fetching
- `useOrders.ts`: Order data fetching
- etc.

**`src/lib/`**: Utility functions and helpers
- `types.ts`: TypeScript interfaces and types
- `utils.ts`: Helper functions
- `api-cache.ts`: API caching utilities

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`

Features in development mode:
- Hot module replacement (HMR)
- Fast refresh
- Detailed error messages
- Source maps

### Production Build

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

### Linting and Type Checking

Run ESLint:
```bash
npm run lint
```

Run TypeScript compiler:
```bash
npx tsc --noEmit
```

## Development Workflow

### 1. Create a New Feature

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Commit your changes
git add .
git commit -m "Add: your feature description"

# Push to remote
git push origin feature/your-feature-name
```

### 2. Code Style Guidelines

**TypeScript**:
- Use TypeScript for all new files
- Define interfaces for all data structures
- Avoid `any` type when possible
- Use proper type annotations

**React Components**:
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

**Naming Conventions**:
- Components: PascalCase (`UserTable.tsx`)
- Hooks: camelCase with `use` prefix (`useUsers.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

**File Organization**:
- One component per file
- Co-locate related files
- Use index files for cleaner imports

### 3. API Integration

Create a new service in `src/components/backend/`:

```typescript
// src/components/backend/exampleService.ts
import apiClient from './config';

export const ExampleService = {
  getAll: async () => {
    const response = await apiClient.get('/endpoint');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await apiClient.get(`/endpoint/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post('/endpoint', data);
    return response.data;
  },
};
```

Use the service in a component:

```typescript
import { ExampleService } from '@/components/backend/exampleService';

const MyComponent = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await ExampleService.getAll();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);
  
  return <div>{/* Render data */}</div>;
};
```


### 4. Creating New Pages

Create a new page in the dashboard:

```bash
# Create directory
mkdir -p src/app/dashboard/new-feature

# Create page file
touch src/app/dashboard/new-feature/page.tsx
```

Basic page structure:

```typescript
// src/app/dashboard/new-feature/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function NewFeaturePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">New Feature</h1>
      {/* Your content */}
    </div>
  );
}
```

### 5. Adding UI Components

Use existing Radix UI components from `src/components/ui/`:

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';

// Use in your component
<Button onClick={handleClick}>Click Me</Button>
```

### 6. State Management

Use React hooks and Context API:

```typescript
// Create context
const MyContext = createContext<MyContextType | undefined>(undefined);

// Provider component
export const MyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
};

// Use context
const { state, setState } = useContext(MyContext);
```

## Testing

### Unit Tests

Run unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

### Writing Tests

Create test files with `.test.ts` or `.test.tsx` extension:

```typescript
// src/lib/utils.test.ts
import { formatDate } from './utils';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('Jan 1, 2024');
  });
});
```

### Property-Based Tests

Property-based tests use fast-check library:

```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  it('should maintain property across all inputs', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        // Test property
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

Test complete user flows:

```typescript
describe('Authentication Flow', () => {
  it('should login and access dashboard', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 9002
# On Unix/Mac:
lsof -ti:9002 | xargs kill -9

# On Windows:
netstat -ano | findstr :9002
taskkill /PID <PID> /F
```

#### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### Environment Variables Not Loading

- Ensure `.env.local` exists
- Restart development server after changing env vars
- Check variable names start with `NEXT_PUBLIC_` for client-side access

#### API Connection Issues

- Verify backend is running
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Check CORS configuration in Django backend
- Verify network connectivity

#### Build Failures

```bash
# Clear all caches
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Getting Help

1. Check this documentation
2. Review error messages carefully
3. Search existing issues in repository
4. Check Next.js documentation: https://nextjs.org/docs
5. Check React documentation: https://react.dev
6. Ask team members or create an issue

## Development Tools

### Debugging

**Browser DevTools**:
- Use React DevTools extension
- Check Network tab for API calls
- Use Console for logging
- Use Sources tab for breakpoints

**VS Code Debugging**:
Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

### Performance Profiling

Use React DevTools Profiler:
1. Open React DevTools
2. Go to Profiler tab
3. Click record
4. Perform actions
5. Stop recording and analyze

### Bundle Analysis

Analyze bundle size:

```bash
npm run analyze
```

This generates a visual report of bundle composition.

## Best Practices

### Performance

1. Use `React.memo` for expensive components
2. Implement code splitting with dynamic imports
3. Optimize images with Next.js Image component
4. Use pagination for large datasets
5. Implement proper caching strategies

### Security

1. Never commit sensitive data
2. Validate all user inputs
3. Sanitize data before rendering
4. Use HTTPS in production
5. Keep dependencies updated

### Code Quality

1. Write meaningful commit messages
2. Keep functions small and focused
3. Add comments for complex logic
4. Write tests for critical functionality
5. Review your own code before submitting

### Accessibility

1. Use semantic HTML
2. Add ARIA labels where needed
3. Ensure keyboard navigation works
4. Test with screen readers
5. Maintain proper color contrast

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team
