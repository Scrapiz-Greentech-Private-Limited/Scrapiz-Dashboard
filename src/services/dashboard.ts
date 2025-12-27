/**
 * Dashboard Statistics Service
 * 
 * Service class for fetching aggregated dashboard metrics from the backend.
 * Provides real-time statistics for the admin dashboard home page.
 */

import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string | undefined;
    if (frontendKey) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any)['x-auth-app'] = frontendKey;
    }

    // Use adminAuthToken for admin dashboard authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null;
    if (token) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any).Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    
    if (status === 401 || status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminPermissions');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Service booking stats by type
 */
export interface ServiceStat {
  service: string;
  count: number;
}

/**
 * Category performance data
 */
export interface CategoryPerformance {
  category: string;
  category_id: number;
  orders: number;
  quantity: string;
  revenue: string;
}

/**
 * Top agent data
 */
export interface TopAgent {
  id: number;
  name: string;
  agent_code: string;
  total_orders: number;
  average_rating: string;
  availability: string;
}

/**
 * Dashboard statistics response
 */
export interface DashboardStats {
  // Main KPIs
  total_revenue: string;
  service_revenue: string;
  combined_revenue: string;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_weight: string;
  avg_order_value: string;
  
  // User metrics
  total_customers: number;
  total_referrals: number;
  completed_referrals: number;
  
  // Agent metrics
  active_agents: number;
  total_agents: number;
  
  // Service metrics
  total_service_bookings: number;
  service_stats: ServiceStat[];
  
  // Performance data
  category_performance: CategoryPerformance[];
  top_agents: TopAgent[];
}

/**
 * Map API error to user-friendly message
 */
function getErrorMessage(error: any): string {
  const data = error.response?.data;
  
  if (data?.error) {
    return data.error;
  }
  
  if (data?.message) {
    return data.message;
  }
  
  if (data?.detail) {
    return data.detail;
  }
  
  if (error.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Dashboard Statistics Service
 * 
 * Provides methods to fetch aggregated dashboard metrics.
 */
export class DashboardService {
  private static readonly BASE_PATH = '/dashboard';

  /**
   * Get aggregated dashboard statistics
   * 
   * Returns comprehensive metrics including:
   * - Revenue (from completed orders only)
   * - Order counts (total, completed, pending)
   * - Total weight collected
   * - Active agents count
   * - Average order value
   * - Total customers
   * - Total referrals
   * - Category performance breakdown
   * - Service bookings by type
   * - Top performing agents
   */
  static async getStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/stats/`);
      return response.data as DashboardStats;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export default DashboardService;
