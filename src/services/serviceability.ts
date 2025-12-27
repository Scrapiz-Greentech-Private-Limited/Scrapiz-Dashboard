/**
 * Serviceability Management Service
 * 
 * Service class for serviceability-related API calls to the Django backend.
 * Provides methods for CRUD operations on cities, pincodes, and agent-area assignments.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4
 */

import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';
import type {
  ServiceableCity,
  ServiceablePincode,
  ServiceArea,
  CityListResponse,
  PincodeListResponse,
  AreaListResponse,
  CreateCityRequest,
  UpdateCityRequest,
  CreatePincodeRequest,
  UpdatePincodeRequest,
  CreateAreaRequest,
  UpdateAreaRequest,
  CityQueryParams,
  PincodeQueryParams,
  AreaQueryParams,
  ServiceabilityApiError,
} from '@/types/serviceability';
import type { AgentListItem } from '@/types/agent';

// ============================================================================
// Axios Instance Configuration
// ============================================================================

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token
// Requirements: 15.2
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
    
    // Handle 401 - redirect to login
    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminPermissions');
        // Redirect will be handled by the component layer
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Map API error to user-friendly message
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 15.3
 */
function getErrorMessage(error: any): string {
  // Network errors
  if (error.message === 'Network Error' || !error.response) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  const status = error.response?.status;
  const data = error.response?.data as ServiceabilityApiError | undefined;

  // Map HTTP status codes to user-friendly messages
  switch (status) {
    case 400:
      // Validation errors - return specific message if available
      if (data?.error) return data.error;
      if (data?.message) return data.message;
      if (data?.detail) return data.detail;
      // Check for field-specific errors
      if (typeof data === 'object' && data !== null) {
        const fieldErrors = Object.entries(data)
          .filter(([key]) => !['code', 'error', 'message', 'detail'].includes(key))
          .map(([key, value]) => {
            const errorMsg = Array.isArray(value) ? value[0] : value;
            return `${key}: ${errorMsg}`;
          });
        if (fieldErrors.length > 0) {
          return fieldErrors.join(', ');
        }
      }
      return 'Invalid request. Please check your input.';

    case 401:
      return 'Your session has expired. Please log in again.';

    case 403:
      return 'You do not have permission to perform this action.';

    case 404:
      return 'The requested resource was not found.';

    case 409:
      // Duplicate/conflict errors
      if (data?.code === 'DUPLICATE_PINCODE') {
        return 'This pincode already exists.';
      }
      if (data?.error) return data.error;
      return 'A conflict occurred. The resource may already exist.';

    case 500:
    case 502:
    case 503:
    case 504:
      return 'An unexpected server error occurred. Please try again later.';

    default:
      if (data?.error) return data.error;
      if (data?.message) return data.message;
      if (data?.detail) return data.detail;
      return 'An unexpected error occurred. Please try again.';
  }
}

// ============================================================================
// ServiceabilityService Class
// ============================================================================

/**
 * Serviceability Management Service
 * 
 * Provides all serviceability-related API operations for the admin dashboard.
 * Requirements: 15.1
 */
export class ServiceabilityService {
  private static readonly CITIES_PATH = '/serviceability/cities';
  private static readonly PINCODES_PATH = '/serviceability/pincodes';
  private static readonly AREAS_PATH = '/serviceability/areas';

  // ==========================================================================
  // City Operations
  // ==========================================================================

  /**
   * Get list of cities with optional filtering
   * Requirements: 1.1, 1.3, 1.4
   */
  static async getCities(params?: CityQueryParams): Promise<CityListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const url = `${this.CITIES_PATH}/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response.data as CityListResponse;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get a single city by ID
   * Requirements: 1.1
   */
  static async getCity(id: number): Promise<ServiceableCity> {
    try {
      const response = await apiClient.get(`${this.CITIES_PATH}/${id}/`);
      return response.data as ServiceableCity;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Create a new city
   * Requirements: 2.2
   */
  static async createCity(data: CreateCityRequest): Promise<ServiceableCity> {
    try {
      const response = await apiClient.post(`${this.CITIES_PATH}/`, data);
      return response.data as ServiceableCity;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update an existing city
   * Requirements: 3.2
   */
  static async updateCity(id: number, data: UpdateCityRequest): Promise<ServiceableCity> {
    try {
      const response = await apiClient.patch(`${this.CITIES_PATH}/${id}/`, data);
      return response.data as ServiceableCity;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Delete a city
   * Requirements: 4.3
   */
  static async deleteCity(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.CITIES_PATH}/${id}/`);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  // ==========================================================================
  // Pincode Operations
  // ==========================================================================

  /**
   * Get list of pincodes with optional filtering
   * Requirements: 5.1, 5.3
   */
  static async getPincodes(params?: PincodeQueryParams): Promise<PincodeListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.city) queryParams.append('city', params.city.toString());
      if (params?.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const url = `${this.PINCODES_PATH}/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response.data as PincodeListResponse;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get a single pincode by ID
   * Requirements: 5.1
   */
  static async getPincode(id: number): Promise<ServiceablePincode> {
    try {
      const response = await apiClient.get(`${this.PINCODES_PATH}/${id}/`);
      return response.data as ServiceablePincode;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Create a new pincode
   * Requirements: 6.2
   */
  static async createPincode(data: CreatePincodeRequest): Promise<ServiceablePincode> {
    try {
      const response = await apiClient.post(`${this.PINCODES_PATH}/`, data);
      return response.data as ServiceablePincode;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update an existing pincode
   * Requirements: 7.2
   */
  static async updatePincode(id: number, data: UpdatePincodeRequest): Promise<ServiceablePincode> {
    try {
      const response = await apiClient.patch(`${this.PINCODES_PATH}/${id}/`, data);
      return response.data as ServiceablePincode;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Delete a pincode
   */
  static async deletePincode(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.PINCODES_PATH}/${id}/`);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  // ==========================================================================
  // Area Operations (NEW)
  // ==========================================================================

  /**
   * Get list of areas with optional filtering
   */
  static async getAreas(params?: AreaQueryParams): Promise<AreaListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.pincode) queryParams.append('pincode', params.pincode.toString());
      if (params?.pincode_code) queryParams.append('pincode_code', params.pincode_code);
      if (params?.city) queryParams.append('city', params.city.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

      const queryString = queryParams.toString();
      const url = `${this.AREAS_PATH}/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response.data as AreaListResponse;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get a single area by ID
   */
  static async getArea(id: number): Promise<ServiceArea> {
    try {
      const response = await apiClient.get(`${this.AREAS_PATH}/${id}/`);
      return response.data as ServiceArea;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Create a new area
   */
  static async createArea(data: CreateAreaRequest): Promise<ServiceArea> {
    try {
      const response = await apiClient.post(`${this.AREAS_PATH}/`, data);
      return response.data as ServiceArea;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update an existing area
   */
  static async updateArea(id: number, data: UpdateAreaRequest): Promise<ServiceArea> {
    try {
      const response = await apiClient.patch(`${this.AREAS_PATH}/${id}/`, data);
      return response.data as ServiceArea;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Delete an area
   */
  static async deleteArea(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.AREAS_PATH}/${id}/`);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get agents assigned to a specific area
   */
  static async getAgentsForArea(areaId: number): Promise<AgentListItem[]> {
    try {
      const response = await apiClient.get(`${this.AREAS_PATH}/${areaId}/agents/`);
      return response.data as AgentListItem[];
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  // ==========================================================================
  // Agent-ServiceArea Operations
  // ==========================================================================

  /**
   * Get agents assigned to a pincode (both pincode-level and area-level)
   */
  static async getAgentsForPincode(pincodeId: number): Promise<AgentListItem[]> {
    try {
      const response = await apiClient.get(`${this.PINCODES_PATH}/${pincodeId}/agents/`);
      return response.data as AgentListItem[];
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get the ServiceArea ID associated with a pincode
   * This is used when assigning agents to a ServiceArea via pincode context
   */
  static async getServiceAreaIdForPincode(pincodeId: number): Promise<number> {
    try {
      const pincode = await this.getPincode(pincodeId);
      return pincode.id;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }
}

// ============================================================================
// Export Types for Convenience
// ============================================================================

export type {
  ServiceableCity,
  ServiceablePincode,
  ServiceArea,
  CityListResponse,
  PincodeListResponse,
  AreaListResponse,
  CreateCityRequest,
  UpdateCityRequest,
  CreatePincodeRequest,
  UpdatePincodeRequest,
  CreateAreaRequest,
  UpdateAreaRequest,
  CityQueryParams,
  PincodeQueryParams,
  AreaQueryParams,
  CityStatus,
  ServiceAreaStats,
  ServiceabilityApiError,
  ServiceabilityErrorCode,
  LoadingState,
  ErrorState,
  CityFormDialogState,
  PincodeFormDialogState,
  AreaFormDialogState,
  AssignAgentDialogState,
  ConfirmDialogType,
  ConfirmDialogState,
  AssignmentType,
  AgentAssignment,
} from '@/types/serviceability';
