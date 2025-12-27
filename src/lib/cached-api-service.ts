/**
 * Cached API Service Wrapper
 * Wraps API service calls with caching layer for better performance
 */

import { 
  UserService, 
  OrderService, 
  InventoryService, 
  ServiceBookingService,
  NotificationService,
  ReferralService,
  AuditService,
  type UserProfile,
  type OrderSummary,
  type CategorySummary,
  type ProductSummary,
  type ServiceBooking,
  type NotificationHistoryItem,
  type AuditLog,
  type AuditLogFilters
} from '@/components/backend/apiService';
import { cachedFetch, createCacheKey, apiCache } from './api-cache';
import type { ReferredUser, ReferralTransaction } from '@/types/referral';

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  USERS: 2 * 60 * 1000,        // 2 minutes
  ORDERS: 1 * 60 * 1000,       // 1 minute
  INVENTORY: 5 * 60 * 1000,    // 5 minutes (changes less frequently)
  BOOKINGS: 2 * 60 * 1000,     // 2 minutes
  NOTIFICATIONS: 5 * 60 * 1000, // 5 minutes
  REFERRALS: 3 * 60 * 1000,    // 3 minutes
  AUDIT_LOGS: 5 * 60 * 1000,   // 5 minutes
};

/**
 * Cached User Service
 */
export class CachedUserService {
  static async getAllUsers(forceRefresh = false): Promise<UserProfile[]> {
    const key = createCacheKey('/users/all');
    return cachedFetch(
      key,
      () => UserService.getAllUsers(),
      { ttl: CACHE_TTL.USERS, forceRefresh }
    );
  }

  static async getUserById(id: number, forceRefresh = false): Promise<UserProfile> {
    const key = createCacheKey(`/users/${id}`);
    return cachedFetch(
      key,
      () => UserService.getUserById(id),
      { ttl: CACHE_TTL.USERS, forceRefresh }
    );
  }

  static async updateUser(id: number, data: Partial<UserProfile>): Promise<UserProfile> {
    const result = await UserService.updateUser(id, data);
    // Invalidate related caches
    apiCache.invalidatePattern('/users/');
    return result;
  }

  static async getUserAddresses(userId: number, forceRefresh = false) {
    const key = createCacheKey(`/users/${userId}/addresses`);
    return cachedFetch(
      key,
      () => UserService.getUserAddresses(userId),
      { ttl: CACHE_TTL.USERS, forceRefresh }
    );
  }

  static async getAccountDeletionFeedback(forceRefresh = false) {
    const key = createCacheKey('/users/deletion-feedback');
    return cachedFetch(
      key,
      () => UserService.getAccountDeletionFeedback(),
      { ttl: CACHE_TTL.USERS, forceRefresh }
    );
  }
}

/**
 * Cached Order Service
 */
export class CachedOrderService {
  static async getAllOrders(forceRefresh = false): Promise<OrderSummary[]> {
    const key = createCacheKey('/orders/all');
    return cachedFetch(
      key,
      () => OrderService.getAllOrders(),
      { ttl: CACHE_TTL.ORDERS, forceRefresh }
    );
  }

  static async getOrderById(id: number, forceRefresh = false): Promise<OrderSummary> {
    const key = createCacheKey(`/orders/${id}`);
    return cachedFetch(
      key,
      () => OrderService.getOrderById(id),
      { ttl: CACHE_TTL.ORDERS, forceRefresh }
    );
  }

  static async createOrder(
    items: Array<{ product_id: number; quantity: number }>,
    address_id?: number,
    imageUris?: string[],
    estimatedOrderValue?: number
  ) {
    const result = await OrderService.createOrder(items, address_id, imageUris, estimatedOrderValue);
    // Invalidate order caches
    apiCache.invalidatePattern('/orders/');
    return result;
  }

  static async updateOrderStatus(id: number, status: string): Promise<OrderSummary> {
    const result = await OrderService.updateOrderStatus(id, status);
    // Invalidate order caches
    apiCache.invalidatePattern('/orders/');
    return result;
  }

  static async cancelOrder(payload: { order_number?: string; order_id?: number }) {
    const result = await OrderService.cancelOrder(payload);
    // Invalidate order caches
    apiCache.invalidatePattern('/orders/');
    return result;
  }
}

/**
 * Cached Inventory Service
 */
export class CachedInventoryService {
  static async getCategories(forceRefresh = false): Promise<CategorySummary[]> {
    const key = createCacheKey('/inventory/categories');
    return cachedFetch(
      key,
      () => InventoryService.getCategories(),
      { ttl: CACHE_TTL.INVENTORY, forceRefresh }
    );
  }

  static async createCategory(data: { name: string; image_url?: string; image?: File }): Promise<CategorySummary> {
    const result = await InventoryService.createCategory(data);
    // Invalidate category caches
    apiCache.invalidate(createCacheKey('/inventory/categories'));
    return result;
  }

  static async updateCategory(id: number, data: Partial<CategorySummary> & { image?: File }): Promise<CategorySummary> {
    const result = await InventoryService.updateCategory(id, data);
    // Invalidate category caches
    apiCache.invalidate(createCacheKey('/inventory/categories'));
    return result;
  }

  static async deleteCategory(id: number): Promise<void> {
    await InventoryService.deleteCategory(id);
    // Invalidate category caches
    apiCache.invalidate(createCacheKey('/inventory/categories'));
  }

  static async getProducts(forceRefresh = false): Promise<ProductSummary[]> {
    const key = createCacheKey('/inventory/products');
    return cachedFetch(
      key,
      () => InventoryService.getProducts(),
      { ttl: CACHE_TTL.INVENTORY, forceRefresh }
    );
  }

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
    const result = await InventoryService.createProduct(data);
    // Invalidate product caches
    apiCache.invalidate(createCacheKey('/inventory/products'));
    return result;
  }

  static async updateProduct(id: number, data: Partial<ProductSummary> & { image?: File }): Promise<ProductSummary> {
    const result = await InventoryService.updateProduct(id, data);
    // Invalidate product caches
    apiCache.invalidate(createCacheKey('/inventory/products'));
    return result;
  }

  static async deleteProduct(id: number): Promise<void> {
    await InventoryService.deleteProduct(id);
    // Invalidate product caches
    apiCache.invalidate(createCacheKey('/inventory/products'));
  }
}

/**
 * Cached Service Booking Service
 */
export class CachedServiceBookingService {
  static async getBookings(forceRefresh = false): Promise<ServiceBooking[]> {
    const key = createCacheKey('/bookings/all');
    return cachedFetch(
      key,
      () => ServiceBookingService.getBookings(),
      { ttl: CACHE_TTL.BOOKINGS, forceRefresh }
    );
  }

  static async getBookingById(id: number, forceRefresh = false): Promise<ServiceBooking> {
    const key = createCacheKey(`/bookings/${id}`);
    return cachedFetch(
      key,
      () => ServiceBookingService.getBookingById(id),
      { ttl: CACHE_TTL.BOOKINGS, forceRefresh }
    );
  }

  static async updateBookingStatus(id: number, status: string): Promise<ServiceBooking> {
    const result = await ServiceBookingService.updateBookingStatus(id, status);
    // Invalidate booking caches
    apiCache.invalidatePattern('/bookings/');
    return result;
  }
}

/**
 * Cached Notification Service
 */
export class CachedNotificationService {
  static async sendPushNotification(payload: any) {
    const result = await NotificationService.sendPushNotification(payload);
    // Invalidate notification history cache
    apiCache.invalidate(createCacheKey('/notifications/history'));
    return result;
  }

  static async getNotificationHistory(forceRefresh = false): Promise<NotificationHistoryItem[]> {
    const key = createCacheKey('/notifications/history');
    return cachedFetch(
      key,
      () => NotificationService.getNotificationHistory(),
      { ttl: CACHE_TTL.NOTIFICATIONS, forceRefresh }
    );
  }

  static async getPushTokens(forceRefresh = false) {
    const key = createCacheKey('/notifications/push-tokens');
    return cachedFetch(
      key,
      () => NotificationService.getPushTokens(),
      { ttl: CACHE_TTL.NOTIFICATIONS, forceRefresh }
    );
  }

  static async retryNotification(notificationId: number) {
    const result = await NotificationService.retryNotification(notificationId);
    // Invalidate notification history cache
    apiCache.invalidate(createCacheKey('/notifications/history'));
    return result;
  }

  static async getUserPreferences(userId: number, forceRefresh = false) {
    const key = createCacheKey(`/notifications/preferences/${userId}`);
    return cachedFetch(
      key,
      () => NotificationService.getUserPreferences(userId),
      { ttl: CACHE_TTL.NOTIFICATIONS, forceRefresh }
    );
  }
}

/**
 * Cached Referral Service
 */
export class CachedReferralService {
  static async getReferredUsers(forceRefresh = false): Promise<ReferredUser[]> {
    const key = createCacheKey('/referrals/users');
    return cachedFetch(
      key,
      () => ReferralService.getReferredUsers(),
      { ttl: CACHE_TTL.REFERRALS, forceRefresh }
    );
  }

  static async getReferralTransactions(forceRefresh = false): Promise<ReferralTransaction[]> {
    const key = createCacheKey('/referrals/transactions');
    return cachedFetch(
      key,
      () => ReferralService.getReferralTransactions(),
      { ttl: CACHE_TTL.REFERRALS, forceRefresh }
    );
  }

  static async redeemReferralBalance(orderId: number, amount: number) {
    const result = await ReferralService.redeemReferralBalance(orderId, amount);
    // Invalidate referral caches
    apiCache.invalidatePattern('/referrals/');
    return result;
  }

  static async getUserReferralDetails(userId: number, forceRefresh = false) {
    const key = createCacheKey(`/referrals/user/${userId}`);
    return cachedFetch(
      key,
      () => ReferralService.getUserReferralDetails(userId),
      { ttl: CACHE_TTL.REFERRALS, forceRefresh }
    );
  }
}

/**
 * Cached Audit Service
 */
export class CachedAuditService {
  static async getAuditLogs(filters?: AuditLogFilters, forceRefresh = false): Promise<AuditLog[]> {
    const key = createCacheKey('/audit-logs', filters);
    return cachedFetch(
      key,
      () => AuditService.getAuditLogs(filters),
      { ttl: CACHE_TTL.AUDIT_LOGS, forceRefresh }
    );
  }

  static async getAuditLogsByUser(userId: number, forceRefresh = false): Promise<AuditLog[]> {
    const key = createCacheKey(`/audit-logs/user/${userId}`);
    return cachedFetch(
      key,
      () => AuditService.getAuditLogsByUser(userId),
      { ttl: CACHE_TTL.AUDIT_LOGS, forceRefresh }
    );
  }
}

/**
 * Utility function to clear all caches
 */
export function clearAllCaches() {
  apiCache.clear();
}

/**
 * Utility function to get cache statistics
 */
export function getCacheStats() {
  return apiCache.getStats();
}
