// API Configuration
const FRONTEND_KEY =
  process.env.NEXT_PUBLIC_ADMIN_FRONTEND_SECRET ||
  process.env.NEXT_PUBLIC_FRONTEND_SECRET ; 

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.scrapiz.in/api',
  ENDPOINTS: {
    // Authentication endpoints
    REGISTER: '/authentication/register/',
    LOGIN: '/authentication/login/',
    LOGOUT: '/authentication/logout/',
    VERIFY_OTP: '/authentication/register/', // PUT request
    RESEND_OTP: '/authentication/resendotp/',
    PASSWORD_RESET_REQUEST: '/authentication/password-reset-request/',
    PASSWORD_RESET: '/authentication/password-reset/',
    USER: '/authentication/user/',
    GOOGLE_LOGIN: '/authentication/google-login/',
    USER_ADDRESSES: '/user/address/',
    USER_NOTIFICATION_SETTINGS: '/user/notification-settings/',
    SERVICE_BOOKINGS: '/services/bookings/',
    REGISTER_PUSH_TOKEN: '/user/register-push-token/',
    UNREGISTER_PUSH_TOKEN: '/user/unregister-push-token/',
    PUSH_NOTIFICATION_PREFERENCES: '/user/notification-preferences/',
    
    // Referral endpoints
    REFERRED_USERS: '/authentication/referrals/users/',
    REFERRAL_TRANSACTIONS: '/authentication/referrals/transactions/',
    REDEEM_REFERRAL_BALANCE: '/authentication/referrals/redeem/',
    
    // Inventory
    INVENTORY_CATEGORIES: '/inventory/categories/',
    INVENTORY_PRODUCTS: '/inventory/products/',
    INVENTORY_ORDERNOS: '/inventory/ordernos/',
    INVENTORY_CREATE_ORDER: '/inventory/create-order/',
    INVENTORY_CANCEL_ORDER: '/inventory/cancel-order/',
    
    // Admin Inventory endpoints
    ADMIN_ORDERS: '/inventory/admin/orders/',
    ADMIN_ORDER_STATUSES: '/inventory/admin/statuses/',
    ADMIN_CANCEL_ORDER: '/inventory/admin/orders/cancel/',
    
    // Admin Dashboard Authentication (with superuser 2FA)
    ADMIN_LOGIN: '/admin/login/',
    ADMIN_VERIFY_OTP: '/admin/verify-otp/',
    ADMIN_RESEND_OTP: '/admin/resend-otp/',
    
    // Admin Dashboard Auth (new role-based system)
    ADMIN_DASHBOARD_LOGIN: '/authentication/admin-auth/login/',
    ADMIN_DASHBOARD_LOGOUT: '/authentication/admin-auth/logout/',
    ADMIN_DASHBOARD_VERIFY_EMAIL: '/authentication/admin-auth/verify-email/',
    ADMIN_DASHBOARD_RESEND_OTP: '/authentication/admin-auth/resend-otp/',
    ADMIN_DASHBOARD_ME: '/authentication/admin-auth/me/',
    ADMIN_DASHBOARD_USERS: '/authentication/admin-auth/users/',
    ADMIN_DASHBOARD_USERS_LIST: '/authentication/admin-auth/users/list/',
    ADMIN_DASHBOARD_PAGES: '/authentication/admin-auth/pages/',
    ADMIN_DASHBOARD_PERMISSIONS: '/authentication/admin-auth/permissions/',
    ADMIN_DASHBOARD_AUDIT_LOGS: '/authentication/admin-auth/audit-logs/',
    ADMIN_DASHBOARD_STATS: '/authentication/admin-auth/stats/',
    
    // Admin endpoints
    ADMIN_USERS: '/authentication/user/',
    ADMIN_DELETION_FEEDBACK: '/authentication/deletion-feedback/',
    ADMIN_SEND_PUSH_NOTIFICATION: '/admin/notifications/send-push/',
    ADMIN_NOTIFICATION_HISTORY: '/admin/notifications/history/',
    ADMIN_PUSH_TOKENS: '/admin/notifications/push-tokens/',
    ADMIN_REFERRALS_ALL_USERS: '/authentication/referrals/all-users/',
    ADMIN_REFERRALS_ALL_TRANSACTIONS: '/authentication/referrals/all-transactions/',
    ADMIN_AUDIT_LOGS: '/authentication/audit-logs/',
    
    // Admin User Management endpoints
    ADMIN_USER_LIST: '/authentication/admin/users/',
    ADMIN_USER_STATS: '/authentication/admin/users/stats/',
    ADMIN_USER_EXPORT: '/authentication/admin/users/export/',
    ADMIN_USER_BULK: '/authentication/admin/users/bulk/',
    ADMIN_USER_ADDRESSES: '/user/admin/addresses/',
    
    // Admin Service Bookings endpoints
    ADMIN_SERVICE_BOOKINGS: '/services/admin/bookings/',
    
    // Dashboard Statistics endpoint
    DASHBOARD_STATS: '/dashboard/stats/',
    
    // Feedback & Ratings endpoints
    FEEDBACK_RATINGS_ALL: '/feedback/ratings/all/',
    FEEDBACK_RATINGS_STATS: '/feedback/ratings/stats/',
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'x-auth-app': FRONTEND_KEY,
  },
};

// API Response types
export interface ApiResponse {
  message?: string;
  jwt?: string;
  error?: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  confirm_password: string;
  promo_code?: string; // Optional referral/promo code
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}
export interface PasswordResetRequest {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  pickupReminders: boolean;
  orderUpdates: boolean;
  paymentAlerts: boolean;
  promotionalOffers: boolean;
  weeklyReports: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface PushNotificationPreferences {
  push_notification_enabled: boolean;
  order_updates: boolean;
  promotions: boolean;
  announcements: boolean;
  general: boolean;
}

export interface ServiceBookingPayload {
  service: string;
  name: string;
  phone: string;
  address: string;
  preferredDateTime: string;
  notes?: string;
}

export interface ServiceBooking {
  id: number;
  service: string;
  name: string;
  phone: string;
  address: string;
  preferred_datetime: string;
  status: string;
  meeting_link?: string | null;
  meeting_event_id?: string | null;
  created_at: string;
  notes?: string | null;
}

export interface GoogleLoginRequest {
  id_token: string;
}

export interface GoogleLoginResponse extends ApiResponse {
  jwt?: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}
