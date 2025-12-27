import axios from 'axios';
import { API_CONFIG, ApiResponse, RegisterRequest, LoginRequest, VerifyOtpRequest, PasswordResetRequest, NotificationSettings, ServiceBookingPayload, ServiceBooking, PushNotificationPreferences } from './config';
import { ReferredUser, ReferralTransaction, ReferralStats, TopReferrer } from '@/types/referral';
import { DeletionFeedback } from '@/types/account';

export type { NotificationSettings, ServiceBookingPayload, ServiceBooking, PushNotificationPreferences } from './config';
export type { DeletionFeedback } from '@/types/account';
export type { ReferredUser, ReferralTransaction, ReferralStats, TopReferrer } from '@/types/referral';

// User types
export interface ProductSummary {
  id: number;
  name: string;
  max_rate: number;
  min_rate: number;
  unit: string;
  description: string;
  category: number;
  image_url?: string | null;
  trees_saved_per_unit?: number;
  co2_reduced_per_unit?: number;
}

export interface CategorySummary {
  id: number;
  name: string;
  image_url?: string | null;
}

export interface OrderItemSummary {
  id: number;
  order_no: number;
  product: ProductSummary;
  quantity: string;
}

export interface OrderStatus {
  id: number;
  name: string;
}

export interface OrderAddressDetails {
  id: number;
  name: string;
  phone_number: string;
  room_number: string;
  street: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
  delivery_suggestion: string;
}

export interface OrderSummary {
  id: number;
  order_number: string;
  user: string;
  user_id?: number;
  user_email?: string;
  user_phone?: string;
  created_at: string;
  status: OrderStatus | null;
  address: number | null;
  address_details?: OrderAddressDetails | null;
  orders: OrderItemSummary[];
  images?: string[];
  // Django DecimalField returns string
  estimated_order_value?: number | string;
  redeemed_referral_bonus?: number | string;
}

export interface AddressSummary {
  id: number;
  name: string;
  phone_number: string;
  room_number: string;
  street: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
  delivery_suggestion: string;
  user: number;
}

export interface CreateAddressRequest {
  name: string;
  phone_number: string;
  room_number: string;
  street: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
  delivery_suggestion?: string;
  user?: number;
}

export type UpdateAddressRequest = Partial<CreateAddressRequest>;

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active?: boolean; // Whether user account is active
  phone_number?: string; // User's phone number
  gender?: 'male' | 'female' | 'prefer_not_to_say'; // User's gender
  orders: OrderSummary[];
  addresses: AddressSummary[];
  referral_code?: string; // User's unique referral code to share
  referred_balance?: string; // Accumulated referral earnings
  has_completed_first_order?: boolean; // Whether user has completed their first order
  profile_image?: string; // URL to user's profile image
  date_joined?: string; // When the user registered
  avatarUrl?: string; // For compatibility with existing code
}

// Waitlist types
export interface WaitlistRequest {
  email?: string;
  phone_number?: string;
  city: string;
}

export interface WaitlistResponse {
  message: string;
  city: string;
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string | undefined;
    if (frontendKey) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any)['x-auth-app'] = frontendKey;
    }

    // Use adminAuthToken for admin dashboard authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null;
    if (token) {
      // Add Bearer prefix for admin auth
      if (!config.headers) config.headers = {} as any;
      (config.headers as any).Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global session expired handler (will be set by AuthProvider)
let globalSessionExpiredHandler: ((shouldShow: boolean) => void) | null = null;
let currentRouteGetter: (() => string | null) | null = null;
let lastSessionExpiredTrigger = 0;
const SESSION_EXPIRED_DEBOUNCE = 2000; // 2 seconds debounce

export const setGlobalSessionExpiredHandler = (handler: (shouldShow: boolean) => void) => {
  globalSessionExpiredHandler = handler;
};

export const setCurrentRouteGetter = (getter: () => string | null) => {
  currentRouteGetter = getter;
};

// Check if current route should show session expired dialog
const shouldShowSessionExpired = (currentRoute: string | null): boolean => {
  if (!currentRoute) return false;
  
  // Don't show on auth pages, splash screen, or initial loading
  const excludedRoutes = [
    '/(auth)',
    '/login',
    '/register',
    '/forgot-password',
    '/language-selection',
    '/location-permission',
    '/service-unavailable',
    '/oauthredirect',
    '/',
    
  ];
  
  // Check if current route matches any excluded route
  return !excludedRoutes.some(route => currentRoute.includes(route));
};

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error('API Error:', data || error.message);

    if (status === 401 || status === 403) {
      // Clear admin auth tokens on auth errors
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminPermissions');
      }
      
      // Debounce to prevent multiple rapid triggers
      const now = Date.now();
      if (now - lastSessionExpiredTrigger < SESSION_EXPIRED_DEBOUNCE) {
        return Promise.reject(error);
      }
      lastSessionExpiredTrigger = now;
      
      // Get current route and check if we should show dialog
      const currentRoute = currentRouteGetter ? currentRouteGetter() : null;
      const shouldShow = shouldShowSessionExpired(currentRoute);
      
      // Trigger session expired dialog only on protected routes
      if (globalSessionExpiredHandler && shouldShow) {
        globalSessionExpiredHandler(shouldShow);
      }
    }
    return Promise.reject(error);
  }
);

const notificationKeyMap: Record<keyof NotificationSettings, string> = {
  pushNotifications: 'push_notifications',
  pickupReminders: 'pickup_reminders',
  orderUpdates: 'order_updates',
  paymentAlerts: 'payment_alerts',
  promotionalOffers: 'promotional_offers',
  weeklyReports: 'weekly_reports',
  emailNotifications: 'email_notifications',
  smsNotifications: 'sms_notifications',
};

const mapNotificationResponse = (data: any): NotificationSettings => ({
  pushNotifications: !!data?.push_notifications,
  pickupReminders: !!data?.pickup_reminders,
  orderUpdates: !!data?.order_updates,
  paymentAlerts: !!data?.payment_alerts,
  promotionalOffers: !!data?.promotional_offers,
  weeklyReports: !!data?.weekly_reports,
  emailNotifications: !!data?.email_notifications,
  smsNotifications: !!data?.sms_notifications,
});

const mapNotificationPayload = (payload: Partial<NotificationSettings>) => {
  const result: Record<string, boolean> = {};
  Object.entries(payload).forEach(([key, value]) => {
    const mappedKey = notificationKeyMap[key as keyof NotificationSettings];
    if (mappedKey !== undefined && value !== undefined) {
      result[mappedKey] = value;
    }
  });
  return result;
};

// Authentication API Service
export class AuthService {
  // Register user
  static async register(data: RegisterRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  // Verify OTP
  static async verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.VERIFY_OTP, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'OTP verification failed');
    }
  }

  // Resend OTP
  static async resendOtp(email: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.RESEND_OTP, { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to resend OTP');
    }
  }

  // Login user
  static async login(data: LoginRequest): Promise<ApiResponse> {
    try {
      console.log('🔐 Login attempt:', {
        baseURL: API_CONFIG.BASE_URL,
        endpoint: API_CONFIG.ENDPOINTS.LOGIN,
        fullURL: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`,
        email: data.email
      });
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, data);
      
      console.log('✅ Login successful:', response.data);
      
      if (response.data.jwt) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', response.data.jwt);
        }
      }
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        isNetworkError: error.message === 'Network Error'
      });
      
      // Provide helpful error message for network errors
      if (error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Check if backend is running and URL is correct.');
      }
      
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  // Google OAuth login
  static async googleLogin(idToken: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.GOOGLE_LOGIN, {
        id_token: idToken,
      });
      if (response.data.jwt) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', response.data.jwt);
        }
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Google login failed');
    }
  }

  // Admin login (with OTP for superusers)
  static async adminLogin(data: LoginRequest): Promise<ApiResponse & { requires_otp?: boolean }> {
    try {
      console.log('🔐 Admin login attempt:', { email: data.email });
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_LOGIN, data);
      
      // Check if this is a superuser requiring OTP
      if (response.data.requires_otp) {
        console.log('🔒 OTP verification required for superuser');
        return { requires_otp: true, message: 'OTP sent to your email' };
      }
      
      console.log('✅ Admin login successful');
      
      if (response.data.jwt) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', response.data.jwt);
        }
      }
      return response.data;
    } catch (error: any) {
      console.error('❌ Admin login failed:', error.response?.data);
      
      if (error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Check if backend is running.');
      }
      
      throw new Error(error.response?.data?.error || error.response?.data?.detail || 'Login failed');
    }
  }

  // Admin OTP verification (superuser 2FA)
  static async adminVerifyOTP(data: { email: string; otp: string }): Promise<ApiResponse> {
    try {
      console.log('🔐 Verifying admin OTP for:', data.email);
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_VERIFY_OTP, data);
      
      console.log('✅ OTP verification successful');
      
      if (response.data.jwt) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', response.data.jwt);
        }
      }
      return response.data;
    } catch (error: any) {
      console.error('❌ OTP verification failed:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Invalid or expired OTP');
    }
  }

  // Admin resend OTP
  static async adminResendOTP(email: string): Promise<ApiResponse> {
    try {
      console.log('📧 Resending admin OTP to:', email);
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_RESEND_OTP, { email });
      
      console.log('✅ OTP resent successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to resend OTP:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to resend OTP');
    }
  }

  // Logout user
  static async logout(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      return response.data;
    } catch (error: any) {
      // Even if logout fails, remove local token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      throw new Error(error.response?.data?.error || 'Logout failed');
    }
  }

  // Password reset request
  static async passwordResetRequest(email: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.PASSWORD_RESET_REQUEST, { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Password reset request failed');
    }
  }

  // Password reset
  static async passwordReset(data: PasswordResetRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.PASSWORD_RESET, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Password reset failed');
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const token = localStorage.getItem('adminAuthToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Get stored auth token
  static async getAuthToken(): Promise<string | null> {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('adminAuthToken');
    } catch (error) {
      return null;
    }
  }

  // Get current user profile
  static async getUser(): Promise<UserProfile> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER);
      return response.data as UserProfile;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user');
    }
  }

  // Update current user's name
  static async updateUserName(name: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.patch(API_CONFIG.ENDPOINTS.USER, { name });
      return response.data as ApiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update user');
    }
  }

  // Update user profile (name and/or profile image)
  static async updateUserProfile(data: { 
    name?: string; 
    profile_image?: string | null; 
  }): Promise<UserProfile> {
    try {
      const formData = new FormData();
      
      // Add name if provided
      if (data.name !== undefined) {
        formData.append('name', data.name);
      }
      
      // Handle profile_image
      if (data.profile_image !== undefined) {
        if (data.profile_image === null || data.profile_image === '') {
          // Empty string means remove the image
          formData.append('profile_image', '');
        } else if (data.profile_image.startsWith('file://') || data.profile_image.startsWith('content://')) {
          // Local file URI - upload new image
          const filename = data.profile_image.split('/').pop() || 'profile.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formData.append('profile_image', {
            uri: data.profile_image,
            name: filename,
            type,
          } as any);
        }
        // If it's an S3 URL, don't include it (no change)
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null;
      const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string;

      const response = await apiClient.patch(
        API_CONFIG.ENDPOINTS.USER,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-app': frontendKey,
            Authorization: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '',
          },
        }
      );
      
      return response.data as UserProfile;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  }

  // Delete current user
  static async deleteUser(): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(API_CONFIG.ENDPOINTS.USER);
      return response.data as ApiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete user');
    }
  }

  // Delete current user with feedback
  static async deleteUserWithFeedback(
    feedback: DeletionFeedback
  ): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(API_CONFIG.ENDPOINTS.USER, {
        data: {
          reason: feedback.reason,
          comments: feedback.comments || ''
        }
      });
      
      // Clear local auth token on successful deletion
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      
      return response.data as ApiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete account');
    }
  }

  // Address APIs
  static async getAddresses(): Promise<AddressSummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_ADDRESSES);
      return response.data as AddressSummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch addresses');
    }
  }

  static async createAddress(payload: CreateAddressRequest): Promise<AddressSummary> {
    try {
      // Some backends require 'user' in payload; include it proactively
      let body: CreateAddressRequest = { ...payload };
      if (!body.user) {
        try {
          const user = await AuthService.getUser();
          body.user = user.id;
        } catch {}
      }
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.USER_ADDRESSES, body);
      return response.data as AddressSummary;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create address');
    }
  }

  static async updateAddress(id: number, payload: UpdateAddressRequest): Promise<AddressSummary> {
    try {
      let body: any = { ...payload };
      if (!('user' in body)) {
        try {
          const user = await AuthService.getUser();
          body.user = user.id;
        } catch {}
      }
      const response = await apiClient.put(`${API_CONFIG.ENDPOINTS.USER_ADDRESSES}${id}/`, body);
      return response.data as AddressSummary;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update address');
    }
  }

  static async deleteAddress(id: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(`${API_CONFIG.ENDPOINTS.USER_ADDRESSES}${id}/`);
      
      // 204 No Content is the standard response for successful DELETE
      // It may not have a response body
      if (response.status === 204) {
        return { message: 'Address deleted successfully' };
      }
      
      // 200 OK with a message body
      return response.data as ApiResponse;
    } catch (error: any) {
      console.error('Delete address error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete address');
    }
  }

  // Inventory APIs
  static async getCategories(): Promise<CategorySummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.INVENTORY_CATEGORIES);
      return response.data as CategorySummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch categories');
    }
  }

  static async getProducts(): Promise<ProductSummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.INVENTORY_PRODUCTS);
      return response.data as ProductSummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch products');
    }
  }

  static async getOrderNos(): Promise<OrderSummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.INVENTORY_ORDERNOS);
      return response.data as OrderSummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch orders');
    }
  }

  static async createOrder(
    items: Array<{ product_id: number; quantity: number }>,
    address_id?: number,
    imageUris?: string[],
    estimatedOrderValue?: number
  ): Promise<any> {
    try {
      console.log('createOrder called with:');
      console.log('- items:', items);
      console.log('- address_id:', address_id);
      console.log('- imageUris:', imageUris);
      console.log('- estimatedOrderValue:', estimatedOrderValue);
      
      const formData = new FormData();
      
      // Add items as JSON string
      formData.append('items', JSON.stringify(items));
      
      // Add address_id if provided
      if (address_id) {
        formData.append('address_id', address_id.toString());
      }

      // Add estimated_order_value if provided
      if (estimatedOrderValue !== undefined) {
        formData.append('estimated_order_value', estimatedOrderValue.toString());
      }

      // Add images if provided
      if (imageUris && imageUris.length > 0) {
        console.log(`Adding ${imageUris.length} images to FormData`);
        for (let i = 0; i < imageUris.length; i++) {
          const uri = imageUris[i];
          const filename = uri.split('/').pop() || `image_${i}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          console.log(`Image ${i}: uri=${uri}, filename=${filename}, type=${type}`);
          
          formData.append('images', {
            uri,
            name: filename,
            type,
          } as any);
        }
      } else {
        console.log('No images to upload');
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null;
      const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string;

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.INVENTORY_CREATE_ORDER,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-app': frontendKey,
            Authorization: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create order');
    }
  }

  static async cancelOrder(payload: { order_number?: string; order_id?: number }): Promise<any> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.INVENTORY_CANCEL_ORDER, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to cancel order');
    }
  }

  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_NOTIFICATION_SETTINGS);
      return mapNotificationResponse(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch notification settings');
    }
  }

  static async updateNotificationSettings(payload: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await apiClient.patch(
        API_CONFIG.ENDPOINTS.USER_NOTIFICATION_SETTINGS,
        mapNotificationPayload(payload)
      );
      return mapNotificationResponse(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update notification settings');
    }
  }

  static async createServiceBooking(payload: ServiceBookingPayload): Promise<ServiceBooking> {
    try {
      console.log('📡 API Call - Creating service booking');
      console.log('Endpoint:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SERVICE_BOOKINGS);
      console.log('Payload:', {
        service: payload.service,
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        preferred_datetime: payload.preferredDateTime,
        notes: payload.notes,
      });
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.SERVICE_BOOKINGS, {
        service: payload.service,
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        preferred_datetime: payload.preferredDateTime,
        notes: payload.notes,
      });
      
      console.log('📡 API Response:', response.data);
      return response.data?.booking as ServiceBooking;
    } catch (error: any) {
      console.error('📡 API Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.error || error.message || 'Failed to submit service booking');
    }
  }

  static async getServiceBookings(): Promise<ServiceBooking[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.SERVICE_BOOKINGS);
      return response.data as ServiceBooking[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch bookings');
    }
  }

  // Get list of users referred by current user
  static async getReferredUsers(): Promise<ReferredUser[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.REFERRED_USERS);
      return response.data.referrals as ReferredUser[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch referred users');
    }
  }

  // Get referral transaction history
  static async getReferralTransactions(): Promise<ReferralTransaction[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.REFERRAL_TRANSACTIONS);
      return response.data.transactions as ReferralTransaction[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch referral transactions');
    }
  }

  // Redeem referral balance on order
  static async redeemReferralBalance(orderId: number, amount: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REDEEM_REFERRAL_BALANCE, {
        order_id: orderId,
        amount: amount
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to redeem referral balance');
    }
  }

  // Register push notification token
  static async registerPushToken(token: string, deviceName?: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER_PUSH_TOKEN, {
        token,
        device_name: deviceName || ''
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to register push token');
    }
  }

  // Unregister push notification token
  static async unregisterPushToken(token: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.UNREGISTER_PUSH_TOKEN, {
        token
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to unregister push token');
    }
  }

  // Get push notification preferences
  static async getPushNotificationPreferences(): Promise<PushNotificationPreferences> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PUSH_NOTIFICATION_PREFERENCES);
      return response.data.preferences;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get push notification preferences');
    }
  }

  // Update push notification preferences
  static async updatePushNotificationPreferences(preferences: Partial<PushNotificationPreferences>): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.PUSH_NOTIFICATION_PREFERENCES, preferences);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update push notification preferences');
    }
  }
}

// Waitlist API Service
export class WaitlistService {
  // Submit waitlist entry
  static async submitWaitlist(data: WaitlistRequest): Promise<WaitlistResponse> {
    try {
      const response = await apiClient.post('/waitlist/', data, {
        headers: {
          'x-auth-app': API_CONFIG.HEADERS['x-auth-app'] as string,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to submit waitlist entry');
    }
  }
}

// ============================================================================
// ADMIN DASHBOARD API SERVICES
// ============================================================================

// User Stats Response Interface
export interface UserStatsResponse {
  total: number;
  active: number;
  inactive: number;
  staff: number;
  superusers: number;
  regular_users: number;
  with_orders: number;
  with_referrals: number;
  gender: {
    male: number;
    female: number;
    other: number;
  };
  recent_signups: number;
}

// User List Response Interface
export interface UserListResponse {
  users: UserProfile[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// User Management Service
export class UserService {
  // Get all users (admin only) - uses new admin endpoint with pagination
  static async getAllUsers(params?: {
    search?: string;
    status?: 'active' | 'inactive';
    role?: 'admin' | 'staff' | 'user';
    gender?: string;
    has_orders?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<UserProfile[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.gender) queryParams.append('gender', params.gender);
      if (params?.has_orders !== undefined) queryParams.append('has_orders', String(params.has_orders));
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.page_size) queryParams.append('page_size', String(params.page_size));
      
      const url = queryParams.toString() 
        ? `${API_CONFIG.ENDPOINTS.ADMIN_USER_LIST}?${queryParams.toString()}`
        : API_CONFIG.ENDPOINTS.ADMIN_USER_LIST;
      
      const response = await apiClient.get(url);
      
      // Handle both old and new response formats
      if (response.data.users) {
        return response.data.users as UserProfile[];
      }
      
      // Fallback to old endpoint format
      const data = response.data;
      if (Array.isArray(data)) {
        return data as UserProfile[];
      }
      return data ? [data as UserProfile] : [];
    } catch (error: any) {
      // Fallback to old endpoint if new one fails
      try {
        const fallbackResponse = await apiClient.get('/authentication/user/');
        const data = fallbackResponse.data;
        if (Array.isArray(data)) {
          return data as UserProfile[];
        }
        return data ? [data as UserProfile] : [];
      } catch (fallbackError: any) {
        throw new Error(fallbackError.response?.data?.error || 'Failed to fetch users');
      }
    }
  }

  // Get paginated users with metadata
  static async getUsersPaginated(params?: {
    search?: string;
    status?: 'active' | 'inactive';
    role?: 'admin' | 'staff' | 'user';
    gender?: string;
    has_orders?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<UserListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.gender) queryParams.append('gender', params.gender);
      if (params?.has_orders !== undefined) queryParams.append('has_orders', String(params.has_orders));
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.page_size) queryParams.append('page_size', String(params.page_size));
      
      const url = queryParams.toString() 
        ? `${API_CONFIG.ENDPOINTS.ADMIN_USER_LIST}?${queryParams.toString()}`
        : API_CONFIG.ENDPOINTS.ADMIN_USER_LIST;
      
      const response = await apiClient.get(url);
      return response.data as UserListResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch users');
    }
  }

  // Get user statistics
  static async getUserStats(): Promise<UserStatsResponse> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_USER_STATS);
      return response.data as UserStatsResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user statistics');
    }
  }

  // Get user by ID (admin only)
  static async getUserById(id: number): Promise<UserProfile> {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_USER_LIST}${id}/`);
      return response.data as UserProfile;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user');
    }
  }

  // Update user (admin only)
  static async updateUser(id: number, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await apiClient.patch(`${API_CONFIG.ENDPOINTS.ADMIN_USER_LIST}${id}/`, data);
      return response.data.user || response.data as UserProfile;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update user');
    }
  }

  // Delete user (admin only)
  static async deleteUser(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete(`${API_CONFIG.ENDPOINTS.ADMIN_USER_LIST}${id}/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete user');
    }
  }

  // Change user status (activate/deactivate/restrict)
  static async changeUserStatus(id: number, action: 'activate' | 'deactivate' | 'restrict', reason?: string): Promise<UserProfile> {
    try {
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN_USER_LIST}${id}/status/`, {
        action,
        reason
      });
      return response.data.user as UserProfile;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to change user status');
    }
  }

  // Bulk user actions
  static async bulkAction(action: 'activate' | 'deactivate' | 'delete', userIds: number[]): Promise<{ message: string; affected_count: number }> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_USER_BULK, {
        action,
        user_ids: userIds
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to perform bulk action');
    }
  }

  // Export users to CSV
  static async exportUsers(userIds?: number[]): Promise<Blob> {
    try {
      const url = userIds?.length 
        ? `${API_CONFIG.ENDPOINTS.ADMIN_USER_EXPORT}?user_ids=${userIds.join(',')}`
        : API_CONFIG.ENDPOINTS.ADMIN_USER_EXPORT;
      
      const response = await apiClient.get(url, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to export users');
    }
  }

  // Get user addresses (admin only) - uses admin endpoint
  static async getUserAddresses(userId: number): Promise<AddressSummary[]> {
    try {
      // Use the new admin endpoint that allows fetching addresses for any user
      const response = await apiClient.get(`/user/admin/addresses/${userId}/`);
      return response.data as AddressSummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user addresses');
    }
  }

  // Get account deletion feedback
  static async getAccountDeletionFeedback(): Promise<DeletionFeedback[]> {
    try {
      const response = await apiClient.get('/authentication/deletion-feedback/');
      return response.data as DeletionFeedback[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch deletion feedback');
    }
  }
}

// Order Management Service (Admin)
export class OrderService {
  // Get all orders (admin only) - uses admin endpoint for full data
  static async getAllOrders(): Promise<OrderSummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_ORDERS);
      return response.data as OrderSummary[];
    } catch (error: any) {
      // Fallback to regular endpoint if admin endpoint fails
      console.warn('Admin orders endpoint failed, trying regular endpoint:', error.message);
      try {
        const fallbackResponse = await apiClient.get(API_CONFIG.ENDPOINTS.INVENTORY_ORDERNOS);
        return fallbackResponse.data as OrderSummary[];
      } catch (fallbackError: any) {
        throw new Error(fallbackError.response?.data?.error || 'Failed to fetch orders');
      }
    }
  }

  // Get order by ID (admin only)
  static async getOrderById(id: number): Promise<OrderSummary> {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_ORDERS}${id}/`);
      return response.data as OrderSummary;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch order');
    }
  }

  // Get all available statuses
  static async getStatuses(): Promise<OrderStatus[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_ORDER_STATUSES);
      return response.data as OrderStatus[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch statuses');
    }
  }

  // Create order (admin)
  static async createOrder(
    items: Array<{ product_id: number; quantity: number }>,
    address_id?: number,
    imageUris?: string[],
    estimatedOrderValue?: number
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('items', JSON.stringify(items));
      
      if (address_id) {
        formData.append('address_id', address_id.toString());
      }

      if (estimatedOrderValue !== undefined) {
        formData.append('estimated_order_value', estimatedOrderValue.toString());
      }

      if (imageUris && imageUris.length > 0) {
        for (let i = 0; i < imageUris.length; i++) {
          const uri = imageUris[i];
          const filename = uri.split('/').pop() || `image_${i}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formData.append('images', {
            uri,
            name: filename,
            type,
          } as any);
        }
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null;
      const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string;

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.INVENTORY_CREATE_ORDER,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-app': frontendKey,
            Authorization: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create order');
    }
  }

  // Update order status (admin only) - uses admin endpoint
  static async updateOrderStatus(id: number, status: string): Promise<OrderSummary> {
    try {
      const response = await apiClient.patch(`${API_CONFIG.ENDPOINTS.ADMIN_ORDERS}${id}/status/`, {
        status
      });
      return response.data.order as OrderSummary;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update order status');
    }
  }

  // Cancel order (admin) - uses admin endpoint
  static async cancelOrder(payload: { order_number?: string; order_id?: number }): Promise<any> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_CANCEL_ORDER, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to cancel order');
    }
  }

  // Assign agent to order (admin only)
  static async assignAgent(orderId: number, agentId: number): Promise<OrderSummary> {
    try {
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN_ORDERS}${orderId}/assign-agent/`, {
        agent_id: agentId
      });
      return response.data.order as OrderSummary;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to assign agent');
    }
  }

  // Unassign agent from order (admin only)
  static async unassignAgent(orderId: number): Promise<OrderSummary> {
    try {
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN_ORDERS}${orderId}/unassign-agent/`);
      return response.data.order as OrderSummary;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to unassign agent');
    }
  }

  // Send notification to order's user (admin only)
  static async sendOrderNotification(orderId: number, title: string, message: string): Promise<any> {
    try {
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN_ORDERS}${orderId}/send-notification/`, {
        title,
        message
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send notification');
    }
  }

  // Send email to order's user (admin only)
  static async sendOrderEmail(orderId: number, title: string, subject: string, body: string): Promise<any> {
    try {
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN_ORDERS}${orderId}/send-email/`, {
        title,
        subject,
        body
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send email');
    }
  }
}

// Inventory Management Service
export class InventoryService {
  // Get all categories
  static async getCategories(): Promise<CategorySummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.INVENTORY_CATEGORIES);
      return response.data as CategorySummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch categories');
    }
  }

  // Create category (admin only) - supports file upload or URL
  static async createCategory(data: { name: string; image_url?: string; image?: File }): Promise<CategorySummary> {
    try {
      // If image file is provided, use FormData for multipart upload
      if (data.image) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('image', data.image);
        
        console.log('[InventoryService.createCategory] Sending FormData with file');
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.INVENTORY_CATEGORIES, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data as CategorySummary;
      }
      
      // Build payload - only include image_url if it has a value
      const payload: { name: string; image_url?: string } = {
        name: data.name,
      };
      
      if (data.image_url && data.image_url.trim()) {
        payload.image_url = data.image_url.trim();
      }
      
      console.log('[InventoryService.createCategory] Sending JSON payload:', JSON.stringify(payload));
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.INVENTORY_CATEGORIES, payload);
      console.log('[InventoryService.createCategory] Response:', response.data);
      return response.data as CategorySummary;
    } catch (error: any) {
      console.error('[InventoryService.createCategory] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to create category');
    }
  }

  // Update category (admin only) - supports file upload or URL
  static async updateCategory(id: number, data: Partial<CategorySummary> & { image?: File }): Promise<CategorySummary> {
    try {
      // If image file is provided, use FormData for multipart upload
      if (data.image) {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        formData.append('image', data.image);
        
        const response = await apiClient.patch(`${API_CONFIG.ENDPOINTS.INVENTORY_CATEGORIES}${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data as CategorySummary;
      }
      
      // Otherwise send JSON
      const response = await apiClient.patch(`${API_CONFIG.ENDPOINTS.INVENTORY_CATEGORIES}${id}/`, data);
      return response.data as CategorySummary;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update category');
    }
  }

  // Delete category (admin only)
  static async deleteCategory(id: number): Promise<void> {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.INVENTORY_CATEGORIES}${id}/`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete category');
    }
  }

  // Get all products
  static async getProducts(): Promise<ProductSummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.INVENTORY_PRODUCTS);
      return response.data as ProductSummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch products');
    }
  }

  // Create product (admin only) - supports file upload or URL
  static async createProduct(data: {
    name: string;
    category: number;
    min_rate: number;
    max_rate: number;
    unit: string;
    description: string;
    image_url?: string;
    image?: File;
  }): Promise<ProductSummary> {
    try {
      // If image file is provided, use FormData for multipart upload
      if (data.image) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('category', data.category.toString());
        formData.append('min_rate', data.min_rate.toString());
        formData.append('max_rate', data.max_rate.toString());
        formData.append('unit', data.unit);
        formData.append('description', data.description);
        formData.append('image', data.image);
        
        console.log('[InventoryService.createProduct] Sending FormData with file');
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.INVENTORY_PRODUCTS, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data as ProductSummary;
      }
      
      // Build payload - only include image_url if it has a value
      const payload: any = {
        name: data.name,
        category: data.category,
        min_rate: data.min_rate,
        max_rate: data.max_rate,
        unit: data.unit,
        description: data.description,
      };
      
      if (data.image_url && data.image_url.trim()) {
        payload.image_url = data.image_url.trim();
      }
      
      console.log('[InventoryService.createProduct] Sending JSON payload:', JSON.stringify(payload));
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.INVENTORY_PRODUCTS, payload);
      console.log('[InventoryService.createProduct] Response:', response.data);
      return response.data as ProductSummary;
    } catch (error: any) {
      console.error('[InventoryService.createProduct] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to create product');
    }
  }

  // Update product (admin only) - supports file upload or URL
  static async updateProduct(id: number, data: Partial<ProductSummary> & { image?: File }): Promise<ProductSummary> {
    try {
      // If image file is provided, use FormData for multipart upload
      if (data.image) {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.category) formData.append('category', data.category.toString());
        if (data.min_rate !== undefined) formData.append('min_rate', data.min_rate.toString());
        if (data.max_rate !== undefined) formData.append('max_rate', data.max_rate.toString());
        if (data.unit) formData.append('unit', data.unit);
        if (data.description !== undefined) formData.append('description', data.description);
        formData.append('image', data.image);
        
        const response = await apiClient.patch(`${API_CONFIG.ENDPOINTS.INVENTORY_PRODUCTS}${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data as ProductSummary;
      }
      
      // Otherwise send JSON
      const response = await apiClient.patch(`${API_CONFIG.ENDPOINTS.INVENTORY_PRODUCTS}${id}/`, data);
      return response.data as ProductSummary;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update product');
    }
  }

  // Delete product (admin only)
  static async deleteProduct(id: number): Promise<void> {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.INVENTORY_PRODUCTS}${id}/`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete product');
    }
  }
}

// Service Booking Management Service
export class ServiceBookingService {
  // Get all service bookings (admin only) - uses admin endpoint for full data
  static async getBookings(): Promise<ServiceBooking[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SERVICE_BOOKINGS);
      return response.data as ServiceBooking[];
    } catch (error: any) {
      // Fallback to regular endpoint if admin endpoint fails
      console.warn('Admin service bookings endpoint failed, trying regular endpoint:', error.message);
      try {
        const fallbackResponse = await apiClient.get(API_CONFIG.ENDPOINTS.SERVICE_BOOKINGS);
        return fallbackResponse.data as ServiceBooking[];
      } catch (fallbackError: any) {
        throw new Error(fallbackError.response?.data?.error || 'Failed to fetch bookings');
      }
    }
  }

  // Get booking by ID (admin only)
  static async getBookingById(id: number): Promise<ServiceBooking> {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_SERVICE_BOOKINGS}${id}/`);
      return response.data as ServiceBooking;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch booking');
    }
  }

  // Update booking status (admin only) - uses admin endpoint
  static async updateBookingStatus(id: number, status: string): Promise<ServiceBooking> {
    try {
      const response = await apiClient.patch(`${API_CONFIG.ENDPOINTS.ADMIN_SERVICE_BOOKINGS}${id}/status/`, {
        status
      });
      return response.data.booking as ServiceBooking;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update booking status');
    }
  }

  // Create service booking
  static async createServiceBooking(payload: ServiceBookingPayload): Promise<ServiceBooking> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.SERVICE_BOOKINGS, {
        service: payload.service,
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        preferred_datetime: payload.preferredDateTime,
        notes: payload.notes,
      });
      return response.data?.booking as ServiceBooking;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to submit service booking');
    }
  }
}

// Notification Management Service
export interface PushNotificationPayload {
  title: string;
  message: string;
  category?: string;
  target_users?: number[];
  deep_link_data?: {
    type: string;
    value: string;
    category?: string;
    orderId?: string;
  };
  image_url?: string;
}

export interface NotificationHistoryItem {
  id: number;
  title: string;
  message: string;
  category?: string;
  recipient_count: number;
  sent_count?: number;
  failed_count?: number;
  delivery_status: 'sent' | 'failed' | 'pending';
  created_at: string;
  admin_user_id?: number;
  deep_link_data?: any;
  image_url?: string;
  error?: string;
}

export interface PushTokenInfo {
  id: number;
  token: string;
  device_name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export interface UserWithPushToken {
  id: number;
  name: string;
  email: string;
  push_notification_enabled: boolean;
  preferences: {
    order_updates: boolean;
    promotions: boolean;
    announcements: boolean;
    general: boolean;
  };
  active_token_count: number;
}

export class NotificationService {
  // Send push notification (admin only)
  static async sendPushNotification(payload: PushNotificationPayload): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/notifications/admin/send/', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send push notification');
    }
  }

  // Get notification history (admin only)
  static async getNotificationHistory(): Promise<NotificationHistoryItem[]> {
    try {
      const response = await apiClient.get('/notifications/admin/history/');
      return response.data as NotificationHistoryItem[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch notification history');
    }
  }

  // Get all push tokens (admin only)
  static async getPushTokens(): Promise<PushTokenInfo[]> {
    try {
      const response = await apiClient.get('/notifications/admin/push-tokens/');
      return response.data as PushTokenInfo[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch push tokens');
    }
  }

  // Retry a failed notification (admin only)
  static async retryNotification(notificationId: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(`/notifications/admin/${notificationId}/retry/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to retry notification');
    }
  }

  // Get users with active push tokens (admin only)
  static async getUsersWithPushTokens(): Promise<UserWithPushToken[]> {
    try {
      const response = await apiClient.get('/notifications/admin/users-with-tokens/');
      return response.data as UserWithPushToken[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch users with push tokens');
    }
  }

  // Send notification to a specific user (admin only)
  static async sendToUser(userId: number, payload: { title: string; message: string; category?: string; image_url?: string }): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(`/notifications/admin/send-to-user/${userId}/`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send notification to user');
    }
  }

  // Get user notification preferences (admin only)
  static async getUserPreferences(userId: number): Promise<PushNotificationPreferences> {
    try {
      const response = await apiClient.get(`/user/notification-preferences/?user=${userId}`);
      return response.data.preferences;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get user notification preferences');
    }
  }
}

// Referral Management Service
export class ReferralService {
  // Get all referred users (admin only)
  static async getReferredUsers(): Promise<ReferredUser[]> {
    try {
      const response = await apiClient.get('/authentication/referrals/all-users/');
      return response.data.referrals as ReferredUser[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch referred users');
    }
  }

  // Get referral transactions (admin only)
  static async getReferralTransactions(): Promise<ReferralTransaction[]> {
    try {
      const response = await apiClient.get('/authentication/referrals/all-transactions/');
      return response.data.transactions as ReferralTransaction[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch referral transactions');
    }
  }

  // Get referral stats (admin only)
  static async getReferralStats(): Promise<{ stats: ReferralStats; top_referrers: TopReferrer[] }> {
    try {
      const response = await apiClient.get('/authentication/referrals/stats/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch referral stats');
    }
  }

  // Redeem referral balance (admin)
  static async redeemReferralBalance(orderId: number, amount: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REDEEM_REFERRAL_BALANCE, {
        order_id: orderId,
        amount: amount
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to redeem referral balance');
    }
  }

  // Get user referral details (admin only)
  static async getUserReferralDetails(userId: number): Promise<{
    referral_code: string;
    referred_balance: string;
    referred_users: ReferredUser[];
    transactions: ReferralTransaction[];
  }> {
    try {
      const response = await apiClient.get(`/authentication/referrals/user/${userId}/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user referral details');
    }
  }
}

// Audit Log Service
export interface AuditLog {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
  } | null;
  action: string;
  ip_address: string | null;
  timestamp: string;
}

export interface AuditLogFilters {
  action?: string;
  user_id?: number;
  start_date?: string;
  end_date?: string;
}

export class AuditService {
  // Get audit logs with filters (admin only)
  static async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.action) params.append('action', filters.action);
      if (filters?.user_id) params.append('user_id', filters.user_id.toString());
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);

      const queryString = params.toString();
      const url = `/authentication/audit-logs/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response.data as AuditLog[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch audit logs');
    }
  }

  // Get audit logs by user (admin only)
  static async getAuditLogsByUser(userId: number): Promise<AuditLog[]> {
    try {
      const response = await apiClient.get(`/authentication/audit-logs/?user_id=${userId}`);
      return response.data as AuditLog[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user audit logs');
    }
  }
}
