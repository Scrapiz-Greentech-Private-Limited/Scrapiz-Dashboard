/**
 * Admin Dashboard Authentication Service
 * 
 * Handles admin user authentication with role-based access control.
 * Supports admin and staff roles with page-level permissions.
 */

import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';

// Types
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  is_admin: boolean;
  is_active: boolean;
  is_email_verified?: boolean;
  last_login?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface PagePermission {
  page_key: string;
  display_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface AdminPermissions {
  [pageKey: string]: {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  };
}

export interface AdminLoginResponse {
  jwt: string;
  user: AdminUser;
  permissions: AdminPermissions;
}

export interface AdminAuditLog {
  id: number;
  user: string;
  user_email: string | null;
  action: string;
  action_display: string;
  target_user: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  status: 'success' | 'failed';
  timestamp: string;
}

export interface AdminStats {
  total_admins: number;
  active_admins: number;
  inactive_admins: number;
  admin_role_count: number;
  staff_role_count: number;
  recent_logins_24h: number;
  failed_logins_24h: number;
}

export interface AllPermissionsResponse {
  roles: string[];
  pages: Array<{
    page_key: string;
    display_name: string;
    icon: string | null;
    route: string;
  }>;
  permissions: {
    [role: string]: PagePermission[];
  };
}

// Create axios instance for admin auth
const adminApiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor
adminApiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminPermissions');
      }
    }
    return Promise.reject(error);
  }
);

export class AdminAuthService {
  /**
   * Login admin user
   */
  static async login(email: string, password: string): Promise<AdminLoginResponse> {
    try {
      const response = await adminApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_LOGIN, {
        email,
        password,
      });

      const data = response.data as AdminLoginResponse;

      // Store auth data
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminAuthToken', data.jwt);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        localStorage.setItem('adminPermissions', JSON.stringify(data.permissions));
      }

      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  /**
   * Logout admin user
   */
  static async logout(): Promise<void> {
    try {
      await adminApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminPermissions');
      }
    }
  }

  /**
   * Verify email with OTP
   */
  static async verifyEmail(email: string, otp: string): Promise<{ message: string }> {
    try {
      const response = await adminApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_VERIFY_EMAIL, {
        email,
        otp,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Verification failed');
    }
  }

  /**
   * Resend OTP
   */
  static async resendOTP(email: string): Promise<{ message: string }> {
    try {
      const response = await adminApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_RESEND_OTP, {
        email,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to resend OTP');
    }
  }

  /**
   * Get current admin user profile
   */
  static async getCurrentUser(): Promise<AdminUser & { permissions: AdminPermissions }> {
    try {
      const response = await adminApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_ME);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user');
    }
  }

  /**
   * Create new admin user (admin only)
   */
  static async createUser(data: {
    email: string;
    name: string;
    password: string;
    role: 'admin' | 'staff';
  }): Promise<{ message: string; user: AdminUser }> {
    try {
      const response = await adminApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_USERS, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create user');
    }
  }

  /**
   * Get all admin users
   */
  static async getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{ users: AdminUser[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.status) queryParams.append('status', params.status);

      const url = queryParams.toString()
        ? `${API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_USERS_LIST}?${queryParams.toString()}`
        : API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_USERS_LIST;

      const response = await adminApiClient.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch users');
    }
  }

  /**
   * Get admin user by ID
   */
  static async getUserById(userId: number): Promise<AdminUser> {
    try {
      const response = await adminApiClient.get(
        `${API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_USERS}${userId}/`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user');
    }
  }

  /**
   * Update admin user (admin only)
   */
  static async updateUser(
    userId: number,
    data: Partial<{ name: string; role: 'admin' | 'staff'; is_active: boolean }>
  ): Promise<{ message: string; user: AdminUser }> {
    try {
      const response = await adminApiClient.patch(
        `${API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_USERS}${userId}/`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update user');
    }
  }

  /**
   * Delete admin user (admin only)
   */
  static async deleteUser(userId: number): Promise<{ message: string }> {
    try {
      const response = await adminApiClient.delete(
        `${API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_USERS}${userId}/`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete user');
    }
  }

  /**
   * Get all pages/modules
   */
  static async getPages(): Promise<{ pages: Array<{ id: number; page_key: string; display_name: string; route: string }> }> {
    try {
      const response = await adminApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_PAGES);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch pages');
    }
  }

  /**
   * Get all roles permissions
   */
  static async getAllPermissions(): Promise<AllPermissionsResponse> {
    try {
      const response = await adminApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_PERMISSIONS);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch permissions');
    }
  }

  /**
   * Get permissions for a specific role
   */
  static async getRolePermissions(role: string): Promise<{ role: string; permissions: PagePermission[] }> {
    try {
      const response = await adminApiClient.get(
        `${API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_PERMISSIONS}${role}/`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch role permissions');
    }
  }

  /**
   * Update role permissions (admin only)
   */
  static async updateRolePermissions(
    role: string,
    permissions: PagePermission[]
  ): Promise<{ message: string }> {
    try {
      const response = await adminApiClient.put(
        `${API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_PERMISSIONS}${role}/update/`,
        { permissions }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update permissions');
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(params?: {
    action?: string;
    user_id?: number;
  }): Promise<{ logs: AdminAuditLog[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.action) queryParams.append('action', params.action);
      if (params?.user_id) queryParams.append('user_id', String(params.user_id));

      const url = queryParams.toString()
        ? `${API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_AUDIT_LOGS}?${queryParams.toString()}`
        : API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_AUDIT_LOGS;

      const response = await adminApiClient.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch audit logs');
    }
  }

  /**
   * Get admin stats
   */
  static async getStats(): Promise<AdminStats> {
    try {
      const response = await adminApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_STATS);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch stats');
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('adminAuthToken');
  }

  /**
   * Get stored user
   */
  static getStoredUser(): AdminUser | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Get stored permissions
   */
  static getStoredPermissions(): AdminPermissions | null {
    if (typeof window === 'undefined') return null;
    const permissions = localStorage.getItem('adminPermissions');
    return permissions ? JSON.parse(permissions) : null;
  }

  /**
   * Check if user has permission for a page
   */
  static hasPermission(pageKey: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean {
    const permissions = this.getStoredPermissions();
    if (!permissions) return false;

    const pagePermission = permissions[pageKey];
    if (!pagePermission) return false;

    switch (action) {
      case 'view':
        return pagePermission.can_view;
      case 'create':
        return pagePermission.can_create;
      case 'edit':
        return pagePermission.can_edit;
      case 'delete':
        return pagePermission.can_delete;
      default:
        return false;
    }
  }

  /**
   * Check if current user is admin
   */
  static isAdmin(): boolean {
    const user = this.getStoredUser();
    return user?.is_admin ?? false;
  }
}
