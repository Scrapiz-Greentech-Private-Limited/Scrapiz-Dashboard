/**
 * Rating Service
 * 
 * Service class for rating-related API calls to the Django backend.
 * Provides methods for fetching ratings and statistics for admin dashboard.
 */

import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';
import type {
  OrderRating,
  RatingStats,
  RatingsResponse,
  RatingStatsResponse,
  RatingQueryParams,
  RatingTag,
  VendorReviewDirection,
  VendorReviewQueryParams,
  VendorReviewRecord,
  VendorReviewsResponse,
  VendorReviewStats,
} from '@/types/rating';

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
 * Get error message from API response
 */
function getErrorMessage(error: any): string {
  const data = error.response?.data;
  
  if (data?.error) {
    return data.error;
  }
  
  if (data?.message) {
    return data.message;
  }
  
  if (error.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Rating Service
 * 
 * Provides all rating-related API operations for the admin dashboard.
 */
export class RatingService {
  private static readonly BASE_PATH = '/feedback';

  /**
   * Get all ratings with optional filtering
   */
  static async getAllRatings(params?: RatingQueryParams): Promise<{ ratings: OrderRating[]; count: number }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.agent_id) queryParams.append('agent_id', params.agent_id.toString());
      if (params?.min_rating) queryParams.append('min_rating', params.min_rating.toString());
      if (params?.max_rating) queryParams.append('max_rating', params.max_rating.toString());

      const queryString = queryParams.toString();
      const url = `${this.BASE_PATH}/ratings/all/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<RatingsResponse>(url);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch ratings');
      }
      
      return {
        ratings: response.data.ratings,
        count: response.data.count,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get rating statistics
   */
  static async getStats(): Promise<RatingStats> {
    try {
      const response = await apiClient.get<RatingStatsResponse>(`${this.BASE_PATH}/ratings/stats/`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch statistics');
      }
      
      return response.data.stats;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async getVendorReviews(params?: VendorReviewQueryParams): Promise<{
    reviews: VendorReviewRecord[];
    count: number;
    stats: VendorReviewStats;
  }> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.vendor_id) queryParams.append('vendor_id', params.vendor_id.toString());
      if (params?.direction && params.direction !== 'all') queryParams.append('direction', params.direction);

      const queryString = queryParams.toString();
      const url = `${this.BASE_PATH}/vendor-reviews/admin/${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<VendorReviewsResponse>(url);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch vendor reviews');
      }

      return {
        reviews: response.data.data.reviews,
        count: response.data.data.count,
        stats: response.data.data.stats,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }
}

// Export types for convenience
export type {
  OrderRating,
  RatingStats,
  RatingsResponse,
  RatingStatsResponse,
  RatingQueryParams,
  VendorReviewDirection,
  VendorReviewQueryParams,
  VendorReviewRecord,
  VendorReviewsResponse,
  VendorReviewStats,
  RatingTag,
} from '@/types/rating';

export { RATING_TAG_LABELS } from '@/types/rating';
