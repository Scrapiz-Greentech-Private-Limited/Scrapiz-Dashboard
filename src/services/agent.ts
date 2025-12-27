/**
 * Agent Management Service
 * 
 * Service class for agent-related API calls to the Django backend.
 * Provides methods for CRUD operations, document management, and statistics.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';
import type {
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
  AgentApiError,
} from '@/types/agent';

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
      // Add Bearer prefix for admin auth
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
 * Map API error to user-friendly message
 * Requirements: 11.5
 */
function getErrorMessage(error: any): string {
  const data = error.response?.data as AgentApiError | undefined;
  
  // Check for specific error codes
  if (data?.code) {
    switch (data.code) {
      case 'AGENT_NOT_FOUND':
        return 'Agent not found. It may have been deleted.';
      case 'DUPLICATE_PHONE':
        return 'This phone number is already registered to another agent.';
      case 'DUPLICATE_EMAIL':
        return 'This email is already registered to another agent.';
      case 'INVALID_DOCUMENT_TYPE':
        return 'Invalid document type. Please select a valid document type.';
      case 'INVALID_STATUS_TRANSITION':
        return 'This status change is not allowed.';
      case 'SERVICE_AREA_REQUIRED':
        return 'Active agents must have at least one service area assigned.';
      case 'DOCUMENT_ALREADY_EXISTS':
        return 'A document of this type has already been uploaded.';
      case 'SESSION_EXPIRED':
        return 'Your session has expired. Please log in again.';
      default:
        return data.error || data.message || 'An unexpected error occurred.';
    }
  }
  
  // Check for validation errors
  if (data?.error) {
    return data.error;
  }
  
  if (data?.message) {
    return data.message;
  }
  
  if (data?.detail) {
    return data.detail;
  }
  
  // Network errors
  if (error.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Agent Management Service
 * 
 * Provides all agent-related API operations for the admin dashboard.
 */
export class AgentService {
  private static readonly BASE_PATH = '/agents';

  /**
   * Get list of agents with optional filtering and pagination
   * Requirements: 11.1
   */
  static async getAgents(params?: AgentQueryParams): Promise<AgentListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.status) queryParams.append('status', params.status);
      if (params?.kyc_status) queryParams.append('kyc_status', params.kyc_status);
      if (params?.availability) queryParams.append('availability', params.availability);
      if (params?.service_area) queryParams.append('service_area', params.service_area.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

      const queryString = queryParams.toString();
      const url = `${this.BASE_PATH}/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response.data as AgentListResponse;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get a single agent by ID
   * Requirements: 11.1
   */
  static async getAgent(id: number): Promise<Agent> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/${id}/`);
      return response.data as Agent;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Create a new agent
   * Requirements: 11.2
   */
  static async createAgent(data: CreateAgentRequest): Promise<Agent> {
    try {
      const response = await apiClient.post(`${this.BASE_PATH}/`, data);
      return response.data as Agent;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update an existing agent
   * Requirements: 11.3
   */
  static async updateAgent(id: number, data: UpdateAgentRequest): Promise<Agent> {
    try {
      const response = await apiClient.patch(`${this.BASE_PATH}/${id}/`, data);
      return response.data as Agent;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Delete an agent
   * Requirements: 11.4
   */
  static async deleteAgent(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_PATH}/${id}/`);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get agent statistics
   * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
   */
  static async getStats(): Promise<AgentStats> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/stats/`);
      return response.data as AgentStats;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get eligible agents for order dispatch or service area assignment
   * Optionally filter by pincode and include onboarding agents
   */
  static async getEligibleAgents(pincode?: string, includeOnboarding?: boolean): Promise<AgentListItem[]> {
    try {
      const queryParams = new URLSearchParams();
      if (pincode) queryParams.append('pincode', pincode);
      if (includeOnboarding) queryParams.append('include_onboarding', 'true');
      
      const queryString = queryParams.toString();
      const url = `${this.BASE_PATH}/eligible/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      // Backend returns { count, results } format
      const data = response.data;
      if (Array.isArray(data)) {
        return data as AgentListItem[];
      }
      return (data.results || []) as AgentListItem[];
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get documents for an agent
   * Requirements: 2.1
   */
  static async getDocuments(agentId: number): Promise<{ count: number; results: AgentDocument[] }> {
    try {
      const response = await apiClient.get(
        `${this.BASE_PATH}/${agentId}/documents/`
      );
      return response.data as { count: number; results: AgentDocument[] };
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Upload a document for an agent
   * Requirements: 2.1
   */
  static async uploadDocument(
    agentId: number,
    data: DocumentUploadRequest
  ): Promise<AgentDocument> {
    try {
      const response = await apiClient.post(
        `${this.BASE_PATH}/${agentId}/documents/upload/`,
        data
      );
      return response.data as AgentDocument;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Verify or reject a document
   * Requirements: 2.2
   */
  static async verifyDocument(
    agentId: number,
    documentId: number,
    data: VerifyDocumentRequest
  ): Promise<AgentDocument> {
    try {
      const response = await apiClient.patch(
        `${this.BASE_PATH}/${agentId}/documents/${documentId}/verify/`,
        data
      );
      return response.data as AgentDocument;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get audit logs for an agent
   * Requirements: 7.4, 7.5
   */
  static async getAuditLogs(
    agentId: number,
    params?: AuditLogQueryParams
  ): Promise<AgentAuditLog[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.action) queryParams.append('action', params.action);
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);

      const queryString = queryParams.toString();
      const url = `${this.BASE_PATH}/${agentId}/audit-logs/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response.data as AgentAuditLog[];
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update agent status (convenience method)
   */
  static async updateStatus(
    id: number,
    status: 'onboarding' | 'active' | 'inactive' | 'suspended'
  ): Promise<Agent> {
    return this.updateAgent(id, { status });
  }

  /**
   * Update agent availability (convenience method)
   */
  static async updateAvailability(
    id: number,
    availability: 'available' | 'on_duty' | 'offline'
  ): Promise<Agent> {
    return this.updateAgent(id, { availability });
  }

  /**
   * Assign service areas to an agent (convenience method)
   */
  static async assignServiceAreas(
    id: number,
    serviceAreaIds: number[]
  ): Promise<Agent> {
    return this.updateAgent(id, { service_area_ids: serviceAreaIds });
  }

  /**
   * Add a new rating to an agent
   * This updates the agent's average rating using the formula:
   * new_avg = ((old_avg * count) + new_rating) / (count + 1)
   */
  static async addRating(
    id: number,
    rating: number
  ): Promise<{ average_rating: string; rating_count: number }> {
    try {
      const response = await apiClient.post(`${this.BASE_PATH}/${id}/rating/`, { rating });
      return response.data as { average_rating: string; rating_count: number };
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }
}

// Export types for convenience
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
} from '@/types/agent';
