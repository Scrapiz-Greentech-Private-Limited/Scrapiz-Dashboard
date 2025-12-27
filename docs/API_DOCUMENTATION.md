# API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Services](#api-services)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)

## Overview

This document provides comprehensive documentation for all API endpoints used by the Admin Dashboard to communicate with the Django backend.

**Base URL**: `https://api.scrapiz.in/api`  
**Authentication**: JWT Bearer Token  
**Content Type**: `application/json`

### API Architecture

```
Admin Dashboard (Next.js)
        ↓
  API Service Layer (TypeScript)
        ↓
  Django REST API
        ↓
  PostgreSQL Database
```

### Common Headers

All authenticated requests must include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Authentication

### Login

**Endpoint**: `POST /authentication/login/`  
**Authentication**: Not required  
**Description**: Authenticate admin user and receive JWT token

**Request Body**:
```json
{
  "email": "admin@scrapiz.in",
  "password": "securepassword"
}
```

**Response** (200 OK):
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid credentials
- `403 Forbidden`: Non-staff user attempting access

**Usage Example**:
```typescript
const response = await AuthService.login(email, password);
localStorage.setItem('authToken', response.jwt);
```


### Logout

**Endpoint**: `POST /authentication/logout/`  
**Authentication**: Required  
**Description**: Invalidate current session

**Request Body**: None

**Response** (200 OK):
```json
{
  "message": "Logout successful"
}
```

### Get Current User

**Endpoint**: `GET /authentication/user/`  
**Authentication**: Required  
**Description**: Get authenticated user profile

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@scrapiz.in",
  "phone_number": "+1234567890",
  "is_staff": true,
  "is_superuser": true,
  "is_active": true,
  "date_joined": "2024-01-01T00:00:00Z",
  "referral_code": "ABC123",
  "referred_balance": "50.00"
}
```

### Update User Profile

**Endpoint**: `PATCH /authentication/user/`  
**Authentication**: Required  
**Description**: Update current user profile

**Request Body**:
```json
{
  "name": "Updated Name",
  "phone_number": "+1234567890",
  "gender": "male"
}
```

**Response** (200 OK): Updated user object

### Delete Account

**Endpoint**: `DELETE /authentication/user/`  
**Authentication**: Required  
**Description**: Delete user account

**Request Body**:
```json
{
  "feedback": "Reason for deletion"
}
```

**Response** (204 No Content)

## API Services

### UserService

#### Get All Users

**Endpoint**: `GET /authentication/users/`  
**Authentication**: Required (Staff)  
**Description**: Retrieve all registered users

**Query Parameters**:
- `search`: Search by email, name, or phone
- `is_staff`: Filter by staff status (true/false)
- `is_active`: Filter by active status (true/false)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "is_staff": false,
    "is_active": true,
    "date_joined": "2024-01-01T00:00:00Z"
  }
]
```


#### Get User By ID

**Endpoint**: `GET /authentication/users/{id}/`  
**Authentication**: Required (Staff)  
**Description**: Get detailed user information

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",
  "gender": "male",
  "is_staff": false,
  "is_superuser": false,
  "is_active": true,
  "date_joined": "2024-01-01T00:00:00Z",
  "referral_code": "JOHN123",
  "referred_balance": "100.00",
  "has_completed_first_order": true,
  "profile_image": "https://s3.amazonaws.com/...",
  "orders": [],
  "addresses": []
}
```

### OrderService

#### Get All Orders

**Endpoint**: `GET /inventory/ordernos/`  
**Authentication**: Required (Staff)  
**Description**: Retrieve all orders

**Query Parameters**:
- `status`: Filter by status ID
- `user`: Filter by user ID
- `search`: Search by order number

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "order_number": "ORD-2024-001",
    "user": "john@example.com",
    "created_at": "2024-01-01T10:00:00Z",
    "status": {
      "id": 1,
      "name": "Pending"
    },
    "address": 1,
    "orders": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "Plastic Bottles",
          "max_rate": 20,
          "min_rate": 15,
          "unit": "kg"
        },
        "quantity": "5.5"
      }
    ],
    "estimated_order_value": 100.00,
    "redeemed_referral_bonus": 10.00,
    "images": ["https://s3.amazonaws.com/..."]
  }
]
```

#### Get Order By ID

**Endpoint**: `GET /inventory/ordernos/{id}/`  
**Authentication**: Required (Staff)  
**Description**: Get detailed order information

**Response** (200 OK): Same structure as order object above

#### Create Order

**Endpoint**: `POST /inventory/create-order/`  
**Authentication**: Required  
**Description**: Create new order

**Request Body**:
```json
{
  "user_id": 1,
  "address_id": 1,
  "orders": [
    {
      "product_id": 1,
      "quantity": "5.5"
    }
  ],
  "estimated_order_value": 100.00,
  "redeemed_referral_bonus": 10.00
}
```

**Response** (201 Created): Created order object


#### Update Order Status

**Endpoint**: `PATCH /inventory/ordernos/{id}/`  
**Authentication**: Required (Staff)  
**Description**: Update order status

**Request Body**:
```json
{
  "status": 2
}
```

**Response** (200 OK): Updated order object

#### Cancel Order

**Endpoint**: `POST /inventory/cancel-order/`  
**Authentication**: Required  
**Description**: Cancel an order

**Request Body**:
```json
{
  "order_id": 1,
  "reason": "Customer request"
}
```

**Response** (200 OK):
```json
{
  "message": "Order cancelled successfully"
}
```

### InventoryService

#### Get Categories

**Endpoint**: `GET /inventory/categories/`  
**Authentication**: Required  
**Description**: Retrieve all scrap categories

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Plastic",
    "image_url": "https://s3.amazonaws.com/..."
  }
]
```

#### Create Category

**Endpoint**: `POST /inventory/categories/`  
**Authentication**: Required (Staff)  
**Description**: Create new category

**Request Body**:
```json
{
  "name": "Metal",
  "image_url": "https://s3.amazonaws.com/..."
}
```

**Response** (201 Created): Created category object

#### Update Category

**Endpoint**: `PATCH /inventory/categories/{id}/`  
**Authentication**: Required (Staff)  
**Description**: Update category

**Request Body**:
```json
{
  "name": "Updated Name",
  "image_url": "https://s3.amazonaws.com/..."
}
```

**Response** (200 OK): Updated category object

#### Get Products

**Endpoint**: `GET /inventory/products/`  
**Authentication**: Required  
**Description**: Retrieve all products

**Query Parameters**:
- `category`: Filter by category ID

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Plastic Bottles",
    "max_rate": 20,
    "min_rate": 15,
    "unit": "kg",
    "description": "PET bottles",
    "category": 1,
    "image_url": "https://s3.amazonaws.com/..."
  }
]
```


#### Create Product

**Endpoint**: `POST /inventory/products/`  
**Authentication**: Required (Staff)  
**Description**: Create new product

**Request Body**:
```json
{
  "name": "Aluminum Cans",
  "max_rate": 30,
  "min_rate": 25,
  "unit": "kg",
  "description": "Aluminum beverage cans",
  "category": 1,
  "image_url": "https://s3.amazonaws.com/..."
}
```

**Response** (201 Created): Created product object

#### Update Product

**Endpoint**: `PATCH /inventory/products/{id}/`  
**Authentication**: Required (Staff)  
**Description**: Update product

**Request Body**:
```json
{
  "max_rate": 35,
  "min_rate": 28
}
```

**Response** (200 OK): Updated product object

### AddressService

#### Get User Addresses

**Endpoint**: `GET /user/address/`  
**Authentication**: Required  
**Description**: Get addresses for authenticated user

**Query Parameters**:
- `user`: Filter by user ID (staff only)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "phone_number": "+1234567890",
    "room_number": "Apt 101",
    "street": "Main Street",
    "area": "Downtown",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": 400001,
    "delivery_suggestion": "Ring doorbell",
    "user": 1
  }
]
```

#### Create Address

**Endpoint**: `POST /user/address/`  
**Authentication**: Required  
**Description**: Create new address

**Request Body**:
```json
{
  "name": "John Doe",
  "phone_number": "+1234567890",
  "room_number": "Apt 101",
  "street": "Main Street",
  "area": "Downtown",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": 400001,
  "delivery_suggestion": "Ring doorbell"
}
```

**Response** (201 Created): Created address object

#### Update Address

**Endpoint**: `PUT /user/address/{id}/`  
**Authentication**: Required  
**Description**: Update address

**Request Body**: Same as create address

**Response** (200 OK): Updated address object

#### Delete Address

**Endpoint**: `DELETE /user/address/{id}/`  
**Authentication**: Required  
**Description**: Delete address

**Response** (204 No Content)


### ServiceBookingService

#### Get All Bookings

**Endpoint**: `GET /services/bookings/`  
**Authentication**: Required (Staff)  
**Description**: Retrieve all service bookings

**Query Parameters**:
- `status`: Filter by status

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "service": "Bulk Pickup",
    "name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, Mumbai",
    "preferred_datetime": "2024-01-15T10:00:00Z",
    "status": "pending",
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "meeting_event_id": "event123",
    "created_at": "2024-01-01T10:00:00Z",
    "notes": "Large quantity of plastic"
  }
]
```

#### Get Booking By ID

**Endpoint**: `GET /services/bookings/{id}/`  
**Authentication**: Required (Staff)  
**Description**: Get detailed booking information

**Response** (200 OK): Same structure as booking object above

#### Update Booking Status

**Endpoint**: `PATCH /services/bookings/{id}/`  
**Authentication**: Required (Staff)  
**Description**: Update booking status

**Request Body**:
```json
{
  "status": "confirmed"
}
```

**Response** (200 OK): Updated booking object

### NotificationService

#### Send Push Notification

**Endpoint**: `POST /admin/notifications/send-push/`  
**Authentication**: Required (Staff)  
**Description**: Send push notification to users

**Request Body**:
```json
{
  "title": "New Promotion",
  "message": "Get 20% off on your next order!",
  "category": "promotions"
}
```

**Response** (200 OK):
```json
{
  "message": "Notification sent successfully",
  "recipient_count": 150
}
```

#### Get Notification History

**Endpoint**: `GET /admin/notifications/history/`  
**Authentication**: Required (Staff)  
**Description**: Retrieve sent notification history

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "New Promotion",
    "message": "Get 20% off on your next order!",
    "category": "promotions",
    "sent_at": "2024-01-01T10:00:00Z",
    "recipient_count": 150,
    "delivery_status": "sent"
  }
]
```

#### Get Push Tokens

**Endpoint**: `GET /api/user/register-push-token/`  
**Authentication**: Required (Staff)  
**Description**: Get all registered push tokens

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "user": 1,
    "token": "ExponentPushToken[...]",
    "device_type": "ios",
    "created_at": "2024-01-01T10:00:00Z"
  }
]
```


### ReferralService

#### Get Referred Users

**Endpoint**: `GET /authentication/referrals/users/`  
**Authentication**: Required  
**Description**: Get users referred by authenticated user (or all if staff)

**Response** (200 OK):
```json
[
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "date_joined": "2024-01-05T10:00:00Z",
    "has_completed_first_order": true
  }
]
```

#### Get Referral Transactions

**Endpoint**: `GET /authentication/referrals/transactions/`  
**Authentication**: Required  
**Description**: Get referral transaction history

**Query Parameters**:
- `user`: Filter by user ID (staff only)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "transaction_type": "referrer_bonus",
    "amount": "50.00",
    "created_at": "2024-01-05T12:00:00Z",
    "order_id": 5,
    "description": "Referral bonus for user signup"
  }
]
```

#### Redeem Referral Balance

**Endpoint**: `POST /authentication/referrals/redeem/`  
**Authentication**: Required  
**Description**: Redeem referral balance on order

**Request Body**:
```json
{
  "order_id": 10,
  "amount": "50.00"
}
```

**Response** (200 OK):
```json
{
  "message": "Balance redeemed successfully",
  "remaining_balance": "50.00"
}
```

### AuditService

#### Get Audit Logs

**Endpoint**: `GET /authentication/audit-logs/`  
**Authentication**: Required (Staff)  
**Description**: Retrieve audit logs

**Query Parameters**:
- `action`: Filter by action type
- `user`: Filter by user ID
- `start_date`: Filter by start date (YYYY-MM-DD)
- `end_date`: Filter by end date (YYYY-MM-DD)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "user": {
      "id": 1,
      "email": "john@example.com",
      "name": "John Doe"
    },
    "action": "login",
    "ip_address": "192.168.1.1",
    "timestamp": "2024-01-01T10:00:00Z"
  }
]
```

#### Get Audit Logs By User

**Endpoint**: `GET /authentication/audit-logs/?user={user_id}`  
**Authentication**: Required (Staff)  
**Description**: Get audit logs for specific user

**Response** (200 OK): Same structure as audit logs array

## Error Handling

### Error Response Format

All error responses follow this structure:

```json
{
  "error": "Error message",
  "detail": "Detailed error description",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content to return
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or token invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable


### Common Error Scenarios

#### Authentication Errors

**401 Unauthorized**:
```json
{
  "error": "Authentication required",
  "detail": "No valid authentication token provided"
}
```

**Action**: Redirect to login page, clear stored tokens

**403 Forbidden**:
```json
{
  "error": "Access denied",
  "detail": "Staff privileges required"
}
```

**Action**: Display access denied message

#### Validation Errors

**400 Bad Request**:
```json
{
  "error": "Validation failed",
  "detail": {
    "email": ["This field is required"],
    "phone_number": ["Invalid phone number format"]
  }
}
```

**Action**: Display field-specific error messages

#### Resource Not Found

**404 Not Found**:
```json
{
  "error": "Resource not found",
  "detail": "Order with ID 999 does not exist"
}
```

**Action**: Display "not found" message, redirect to list view

#### Server Errors

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "detail": "An unexpected error occurred"
}
```

**Action**: Display error message with retry option, log error

## Rate Limiting

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

**429 Too Many Requests**:
```json
{
  "error": "Rate limit exceeded",
  "detail": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

**Action**: Wait for specified time before retrying

### Rate Limits by Endpoint

- **Authentication**: 5 requests per minute
- **Read Operations**: 100 requests per minute
- **Write Operations**: 50 requests per minute
- **Bulk Operations**: 10 requests per minute

## Best Practices

### Request Optimization

1. **Use Pagination**: Always paginate large datasets
2. **Filter Data**: Apply filters to reduce response size
3. **Cache Responses**: Cache frequently accessed data
4. **Batch Requests**: Combine multiple operations when possible

### Error Handling

1. **Retry Logic**: Implement exponential backoff for failed requests
2. **Timeout Handling**: Set appropriate request timeouts
3. **User Feedback**: Display clear error messages to users
4. **Logging**: Log all errors for debugging

### Security

1. **Token Storage**: Store JWT tokens securely
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Refresh**: Implement token refresh mechanism
4. **Input Validation**: Validate all user inputs before sending

### Performance

1. **Minimize Requests**: Reduce number of API calls
2. **Use Compression**: Enable gzip compression
3. **Optimize Payloads**: Send only necessary data
4. **Monitor Performance**: Track API response times

## Testing

### Using Postman

1. Import API collection
2. Set environment variables:
   - `base_url`: API base URL
   - `auth_token`: JWT token
3. Run requests to test endpoints

### Using cURL

**Example Login**:
```bash
curl -X POST https://api.scrapiz.in/api/authentication/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@scrapiz.in","password":"password"}'
```

**Example Authenticated Request**:
```bash
curl -X GET https://api.scrapiz.in/api/inventory/ordernos/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Versioning

**Current Version**: v1  
**Base Path**: `/api/`

Future versions will use path-based versioning:
- v1: `/api/v1/`
- v2: `/api/v2/`

## Support

For API issues or questions:
- Check this documentation
- Review error messages and status codes
- Contact backend development team
- Report bugs with request/response details

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Backend Development Team
