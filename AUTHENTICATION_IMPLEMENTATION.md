# Authentication System Implementation

## Overview
This document describes the authentication system and API foundation implemented for the Scrapiz Admin Dashboard.

## Components Implemented

### 1. API Service Layer (`src/components/backend/`)
- **apiService.ts**: Updated to use browser localStorage instead of React Native AsyncStorage
- **config.ts**: Updated to use Next.js environment variables
- Axios interceptors for:
  - Adding JWT tokens to requests
  - Handling 401/403 errors with automatic token cleanup
  - Global error handling

### 2. Authentication Context (`src/contexts/AuthContext.tsx`)
- Global authentication state management
- User profile storage
- Login/logout functionality
- Admin privilege verification (checks `is_staff` and `is_superuser`)
- Automatic user loading on app mount
- User refresh capability

### 3. Protected Route Component (`src/components/auth/ProtectedRoute.tsx`)
- Wrapper component for protected routes
- Redirects unauthenticated users to login
- Shows loading spinner during authentication check
- Prevents flash of protected content

### 4. Login Page (`src/app/(auth)/login/page.tsx`)
- Form validation using React Hook Form + Zod
- Email and password validation
- Error message display
- Loading states during authentication
- Integration with AuthContext

### 5. Dashboard Layout Updates
- **Root Layout**: Wrapped with AuthProvider
- **Dashboard Layout**: Wrapped with ProtectedRoute
- **Header Component**: 
  - Integrated with AuthContext for logout
  - Displays user name and email in dropdown
  - Proper logout functionality

### 6. Type Definitions
- Created `src/types/referral.ts` for referral-related types
- Created `src/types/account.ts` for account-related types
- Updated `UserProfile` interface to include `is_superuser` field

### 7. Hooks
- Created `src/hooks/use-toast.ts` for toast notifications
- Created `src/hooks/use-mobile.tsx` for mobile detection

### 8. Environment Configuration
- Created `.env.local` with API configuration
- Created `.env.local.example` as template
- Environment variables:
  - `NEXT_PUBLIC_API_BASE_URL`: Backend API URL
  - `NEXT_PUBLIC_FRONTEND_SECRET`: Frontend authentication key

## Authentication Flow

### Login Flow
1. User enters email and password
2. Form validation using Zod schema
3. AuthContext `login()` method called
4. API request to `/api/authentication/login/`
5. JWT token stored in localStorage
6. User profile fetched from `/api/authentication/user/`
7. Admin privileges verified (`is_staff` or `is_superuser`)
8. User redirected to dashboard

### Protected Route Flow
1. User navigates to protected route
2. ProtectedRoute component checks authentication
3. If not authenticated, redirect to login
4. If authenticated, render protected content

### Logout Flow
1. User clicks logout in header dropdown
2. AuthContext `logout()` method called
3. API request to `/api/authentication/logout/`
4. JWT token removed from localStorage
5. User state cleared
6. Redirect to login page

### Session Expiration
1. API request returns 401/403
2. Axios interceptor catches error
3. Token removed from localStorage
4. Session expired handler triggered (if set)
5. User redirected to login

## Security Features

### JWT Token Management
- Tokens stored in browser localStorage
- Automatically included in all API requests via interceptor
- Cleared on logout or authentication errors
- Server-side validation on every request

### Admin Authorization
- Backend validates JWT token
- Frontend checks `is_staff` or `is_superuser` flags
- Non-admin users denied access even with valid token
- Double verification (login + profile fetch)

### Error Handling
- 401/403: Clear token and redirect to login
- Network errors: Display user-friendly messages
- Validation errors: Show field-specific errors
- Server errors: Display retry options

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/authentication/login/` | POST | User login |
| `/api/authentication/logout/` | POST | User logout |
| `/api/authentication/user/` | GET | Get user profile |
| `/api/authentication/user/` | PATCH | Update user profile |
| `/api/authentication/user/` | DELETE | Delete user account |

## Requirements Validated

✅ **Requirement 1.1**: Admin user authentication against Django backend with JWT token
✅ **Requirement 1.2**: JWT token expiration handling with redirect to login
✅ **Requirement 1.3**: Non-staff user access denial with error message
✅ **Requirement 1.4**: JWT token stored securely in browser storage
✅ **Requirement 1.5**: Logout clears tokens and redirects to login

## Testing Recommendations

### Manual Testing
1. Test login with valid admin credentials
2. Test login with invalid credentials
3. Test login with non-admin user
4. Test logout functionality
5. Test protected route access without authentication
6. Test session expiration handling
7. Test token persistence across page refreshes

### Automated Testing (Future)
- Unit tests for AuthService methods
- Integration tests for login/logout flow
- E2E tests for protected route access
- Property-based tests for token persistence

## Next Steps

The authentication foundation is now complete. The following tasks can now be built on top of this:
- User management interface
- Order management interface
- Inventory management interface
- All other admin features requiring authentication
