import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';
import type {
  CreateVendorRequest,
  Vendor,
  VendorDocument,
  VendorListResponse,
  VendorPaymentSummary,
  VendorQueryParams,
} from '@/types/vendor';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
});

apiClient.interceptors.request.use(
  (config) => {
    const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string | undefined;
    if (frontendKey) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any)['x-auth-app'] = frontendKey;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null;
    if (token) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any).Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

const unwrapEnvelope = <T,>(response: { data?: { success?: boolean; data?: T; error?: string } }): T => {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  throw new Error(response?.data?.error || 'Unexpected vendor response');
};

const getErrorMessage = (error: any): string => {
  const payload = error?.response?.data;
  if (payload?.details?.message) return payload.details.message;
  if (payload?.error) return payload.error;
  if (payload?.message) return payload.message;
  if (error?.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your network and try again.';
  }
  return error?.message || 'Something went wrong while loading vendors.';
};

export class VendorService {
  static async getVendors(params?: VendorQueryParams): Promise<VendorListResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'all') query.append('status', params.status);
      if (params?.city) query.append('city', params.city);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const response = await apiClient.get(`/vendor/admin/list/${suffix}`);
      return unwrapEnvelope<VendorListResponse>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async createVendor(payload: CreateVendorRequest): Promise<Vendor> {
    try {
      const response = await apiClient.post(`/vendor/admin/list/`, payload);
      return unwrapEnvelope<Vendor>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async importAgents(agentIds: number[]) {
    try {
      const response = await apiClient.post(`/vendor/admin/import-agents/`, {
        agent_ids: agentIds,
      });
      return unwrapEnvelope<{ imported: Array<{ agent_id: number; vendor_id: number }>; skipped: Array<{ agent_id: number; reason: string }> }>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async getVendor(vendorId: number): Promise<Vendor> {
    try {
      const response = await apiClient.get(`/vendor/admin/${vendorId}/`);
      return unwrapEnvelope<Vendor>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async approveVendor(vendorId: number) {
    try {
      const response = await apiClient.post(`/vendor/admin/${vendorId}/approve/`);
      return unwrapEnvelope<{ status: string; is_active_vendor: boolean }>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async rejectVendor(vendorId: number, reason: string) {
    try {
      const response = await apiClient.post(`/vendor/admin/${vendorId}/reject/`, { reason });
      return unwrapEnvelope<{ status: string }>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async suspendVendor(vendorId: number, reason: string) {
    try {
      const response = await apiClient.post(`/vendor/admin/${vendorId}/suspend/`, { reason });
      return unwrapEnvelope<{ status: string }>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async reinstateVendor(vendorId: number) {
    try {
      const response = await apiClient.post(`/vendor/admin/${vendorId}/reinstate/`);
      return unwrapEnvelope<{ status: string; is_active_vendor: boolean }>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async updatePendingAccess(vendorId: number, allow: boolean) {
    try {
      const response = await apiClient.post(`/vendor/admin/${vendorId}/pending-access/`, {
        allow_app_access_while_pending: allow,
      });
      return unwrapEnvelope<{ allow_app_access_while_pending: boolean; status: string }>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async updateTrialPeriod(vendorId: number, trialDays: number) {
    try {
      const response = await apiClient.post(`/vendor/admin/${vendorId}/trial/`, {
        trial_days: trialDays,
      });
      return unwrapEnvelope<{
        trial_started_at: string | null;
        trial_ends_at: string | null;
        trial_duration_days: number;
        has_active_trial: boolean;
        is_entitled_for_leads: boolean;
      }>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async getPaymentSummary(vendorId: number): Promise<VendorPaymentSummary> {
    try {
      const response = await apiClient.get(`/vendor/admin/${vendorId}/payment-summary/`);
      return unwrapEnvelope<VendorPaymentSummary>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async verifyDocument(vendorId: number, documentId: number): Promise<VendorDocument> {
    try {
      const response = await apiClient.post(`/vendor/admin/${vendorId}/documents/${documentId}/verify/`);
      return unwrapEnvelope<VendorDocument>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  static async rejectDocument(vendorId: number, documentId: number, reason: string): Promise<VendorDocument> {
    try {
      const response = await apiClient.post(`/vendor/admin/${vendorId}/documents/${documentId}/reject/`, { reason });
      return unwrapEnvelope<VendorDocument>(response);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }
}
