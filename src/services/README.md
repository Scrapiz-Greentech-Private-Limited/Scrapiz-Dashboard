# Admin Dashboard API Services

This directory contains the API service layer for the admin dashboard, providing a clean abstraction over HTTP communication with the Django backend.

## Overview

The API service layer is organized into specialized service classes, each handling a specific domain of the application:

- **AuthService** - Authentication and current user management
- **UserService** - User management (admin operations)
- **OrderService** - Order management
- **InventoryService** - Category and product management
- **ServiceBookingService** - Service booking management
- **NotificationService** - Push notification management
- **ReferralService** - Referral system management
- **AuditService** - Audit log viewing

## Usage

### Importing Services

```typescript
import {
  AuthService,
  UserService,
  OrderService,
  InventoryService,
  ServiceBookingService,
  NotificationService,
  ReferralService,
  AuditService,
} from '@/services';
```

### Authentication

```typescript
// Login
const response = await AuthService.login({
  email: 'admin@example.com',
  password: 'password123'
});

// Get current user
const user = await AuthService.getUser();

// Logout
await AuthService.logout();
```

### User Management

```typescript
// Get all users
const users = await UserService.getAllUsers();

// Get specific user
const user = await UserService.getUserById(123);

// Update user
const updatedUser = await UserService.updateUser(123, {
  name: 'New Name'
});

// Get user addresses
const addresses = await UserService.getUserAddresses(123);
```

### Order Management

```typescript
// Get all orders
const orders = await OrderService.getAllOrders();

// Get specific order
const order = await OrderService.getOrderById(456);

// Update order status
const updatedOrder = await OrderService.updateOrderStatus(456, 'completed');

// Cancel order
await OrderService.cancelOrder({ order_id: 456 });
```

### Inventory Management

```typescript
// Get categories
const categories = await InventoryService.getCategories();

// Create category
const newCategory = await InventoryService.createCategory({
  name: 'Electronics',
  image_url: 'https://s3.amazonaws.com/...'
});

// Get products
const products = await InventoryService.getProducts();

// Update product
const updatedProduct = await InventoryService.updateProduct(789, {
  min_rate: 10,
  max_rate: 20
});
```

### Service Bookings

```typescript
// Get all bookings
const bookings = await ServiceBookingService.getBookings();

// Get specific booking
const booking = await ServiceBookingService.getBookingById(101);

// Update booking status
const updatedBooking = await ServiceBookingService.updateBookingStatus(
  101,
  'confirmed'
);
```

### Notifications

```typescript
// Send push notification
await NotificationService.sendPushNotification({
  title: 'New Promotion',
  message: 'Check out our latest offers!',
  category: 'promotional_offers'
});

// Get notification history
const history = await NotificationService.getNotificationHistory();

// Get user preferences
const preferences = await NotificationService.getUserPreferences(123);
```

### Referrals

```typescript
// Get all referred users
const referredUsers = await ReferralService.getReferredUsers();

// Get referral transactions
const transactions = await ReferralService.getReferralTransactions();

// Get user referral details
const details = await ReferralService.getUserReferralDetails(123);

// Redeem referral balance
await ReferralService.redeemReferralBalance(orderId, amount);
```

### Audit Logs

```typescript
// Get all audit logs
const logs = await AuditService.getAuditLogs();

// Get filtered audit logs
const filteredLogs = await AuditService.getAuditLogs({
  action: 'login',
  start_date: '2024-01-01',
  end_date: '2024-12-31'
});

// Get logs for specific user
const userLogs = await AuditService.getAuditLogsByUser(123);
```

## Error Handling

All service methods throw errors with descriptive messages. Always wrap service calls in try-catch blocks:

```typescript
try {
  const users = await UserService.getAllUsers();
  // Handle success
} catch (error: any) {
  console.error('Failed to fetch users:', error.message);
  // Handle error
}
```

## Global Error Interceptor

The API client includes a global error interceptor that:

1. **Handles 401/403 errors** - Clears auth token and triggers session expired dialog
2. **Handles network errors** - Provides retry mechanisms
3. **Logs errors** - Helps with debugging

### Session Expiration Handling

Set up the global session expired handler in your app:

```typescript
import { setGlobalSessionExpiredHandler } from '@/services';

setGlobalSessionExpiredHandler((shouldShow) => {
  if (shouldShow) {
    // Show session expired dialog
    // Redirect to login
  }
});
```

## Authentication Token Management

The API client automatically:

- Adds the JWT token to all requests via the `Authorization` header
- Stores the token in `localStorage` after successful login
- Clears the token on logout or authentication errors

## Environment Configuration

Configure the API base URL via environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.scrapiz.in/api
NEXT_PUBLIC_FRONTEND_SECRET=your-secret-key
```

## Type Safety

All services are fully typed with TypeScript interfaces. Import types as needed:

```typescript
import type {
  UserProfile,
  OrderSummary,
  ProductSummary,
  CategorySummary,
  ServiceBooking,
  AuditLog,
} from '@/services';
```

## Best Practices

1. **Always handle errors** - Wrap service calls in try-catch blocks
2. **Use TypeScript types** - Leverage the provided interfaces for type safety
3. **Refresh data after mutations** - Call GET endpoints after POST/PATCH/DELETE
4. **Show loading states** - Display loading indicators during API calls
5. **Validate inputs** - Validate form data before making API calls
6. **Handle session expiration** - Set up the global session expired handler

## API Endpoint Mapping

| Service Method | Django Endpoint | HTTP Method | Auth Required |
|---------------|-----------------|-------------|---------------|
| `AuthService.login()` | `/api/authentication/login/` | POST | No |
| `AuthService.logout()` | `/api/authentication/logout/` | POST | Yes |
| `AuthService.getUser()` | `/api/authentication/user/` | GET | Yes |
| `UserService.getAllUsers()` | `/api/authentication/users/` | GET | Yes (Staff) |
| `OrderService.getAllOrders()` | `/api/inventory/ordernos/` | GET | Yes |
| `InventoryService.getCategories()` | `/api/inventory/categories/` | GET | Yes |
| `InventoryService.getProducts()` | `/api/inventory/products/` | GET | Yes |
| `ServiceBookingService.getBookings()` | `/api/services/bookings/` | GET | Yes |
| `NotificationService.sendPushNotification()` | `/admin/notifications/send-push/` | POST | Yes (Staff) |
| `ReferralService.getReferredUsers()` | `/api/authentication/referrals/all-users/` | GET | Yes (Staff) |
| `AuditService.getAuditLogs()` | `/api/authentication/audit-logs/` | GET | Yes (Staff) |

## Testing

When testing components that use these services, mock the service methods:

```typescript
import { UserService } from '@/services';

jest.mock('@/services', () => ({
  UserService: {
    getAllUsers: jest.fn(),
  },
}));

// In your test
(UserService.getAllUsers as jest.Mock).mockResolvedValue([
  { id: 1, name: 'Test User', email: 'test@example.com' }
]);
```

## Contributing

When adding new service methods:

1. Add the method to the appropriate service class
2. Add proper TypeScript types
3. Include error handling
4. Update this README with usage examples
5. Add the endpoint to the API_CONFIG if needed
