/**
 * Admin Dashboard API Services
 * 
 * This module exports all API service classes for the admin dashboard.
 * Each service provides methods to interact with specific Django backend endpoints.
 */

export {
  // Core authentication and user services
  AuthService,
  
  // Admin-specific services
  UserService,
  OrderService,
  InventoryService,
  ServiceBookingService,
  NotificationService,
  ReferralService,
  AuditService,
  
  // Utility services
  WaitlistService,
  
  // Types
  type UserProfile,
  type UserStatsResponse,
  type UserListResponse,
  type OrderSummary,
  type OrderItemSummary,
  type OrderStatus,
  type OrderAddressDetails,
  type ProductSummary,
  type CategorySummary,
  type AddressSummary,
  type CreateAddressRequest,
  type UpdateAddressRequest,
  type ServiceBooking,
  type ServiceBookingPayload,
  type NotificationSettings,
  type PushNotificationPreferences,
  type PushNotificationPayload,
  type NotificationHistoryItem,
  type PushTokenInfo,
  type UserWithPushToken,
  type ReferredUser,
  type ReferralTransaction,
  type ReferralStats,
  type TopReferrer,
  type AuditLog,
  type AuditLogFilters,
  type DeletionFeedback,
  type ApiResponse,
  type WaitlistRequest,
  type WaitlistResponse,
  
  // Global handlers
  setGlobalSessionExpiredHandler,
  setCurrentRouteGetter,
} from '@/components/backend/apiService';

export { API_CONFIG } from '@/components/backend/config';

// Admin Dashboard Authentication Service
export { AdminAuthService } from './adminAuth';
export type {
  AdminUser,
  PagePermission,
  AdminPermissions,
  AdminLoginResponse,
  AdminAuditLog,
  AdminStats,
  AllPermissionsResponse,
} from './adminAuth';

// Agent Management Service
export { AgentService } from './agent';
export type {
  Agent,
  AgentListItem,
  AgentListResponse,
  AgentStats,
  AgentDocument,
  AgentAuditLog,
  CreateAgentRequest,
  UpdateAgentRequest,
  DocumentUploadRequest,
  VerifyDocumentRequest,
  AgentQueryParams,
  AuditLogQueryParams,
  AgentStatus,
  KycStatus,
  AvailabilityStatus,
  DocumentType,
  VerificationStatus,
  AuditAction,
  ServiceArea,
} from './agent';

// Serviceability Management Service
export { ServiceabilityService } from './serviceability';
export type {
  ServiceableCity,
  ServiceablePincode,
  CityListResponse,
  PincodeListResponse,
  CreateCityRequest,
  UpdateCityRequest,
  CreatePincodeRequest,
  UpdatePincodeRequest,
  CityQueryParams,
  PincodeQueryParams,
  CityStatus,
  ServiceAreaStats,
  ServiceabilityApiError,
  ServiceabilityErrorCode,
  LoadingState,
  ErrorState,
  CityFormDialogState,
  PincodeFormDialogState,
  AssignAgentDialogState,
  ConfirmDialogType,
  ConfirmDialogState,
} from './serviceability';

// Dashboard Statistics Service
export { DashboardService } from './dashboard';
export type {
  DashboardStats,
  ServiceStat,
  CategoryPerformance,
  TopAgent,
} from './dashboard';

// Rating Service
export { RatingService, RATING_TAG_LABELS } from './rating';
export type {
  OrderRating,
  RatingStats,
  RatingsResponse,
  RatingStatsResponse,
  RatingQueryParams,
  RatingTag,
} from './rating';
