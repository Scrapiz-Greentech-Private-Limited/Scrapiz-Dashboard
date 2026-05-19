import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';

export interface AppConfig {
  enforce_sell_screen_gate: boolean;
  sell_screen_gate_mode: 'none' | 'pincode' | 'city';
  pincode_gate_enabled?: boolean;
  city_gate_enabled?: boolean;
  maintenance_mode: boolean;
  min_app_version: string;
  enable_location_skip: boolean;
  force_update_url_android: string;
  force_update_url_ios: string;
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add x-auth-app header
    const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string | undefined;
    if (frontendKey) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any)['x-auth-app'] = frontendKey;
    }

    // Add admin auth token for authenticated requests
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null;
    
    // Debug logging
    console.log('🔍 AppConfig Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    });
    
    if (token) {
      if (!config.headers) config.headers = {} as any;
      // Token is stored without "Bearer " prefix, so add it
      (config.headers as any).Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No admin auth token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ AppConfig Response:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const errorData = error?.response?.data;
    
    console.error('❌ AppConfig Error:', {
      status,
      url: error.config?.url,
      error: errorData,
      errorDetail: errorData?.detail || errorData?.error,
      message: error.message,
      fullResponse: error.response,
    });
    
    // Handle 401/403 - authentication errors
    if (status === 401 || status === 403) {
      console.error('🔒 Authentication error - token may be invalid or expired');
      console.error('📋 Error details:', errorData);
      
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('adminAuthToken');
        const user = localStorage.getItem('adminUser');
        console.log('Current token exists:', !!token);
        console.log('Current user:', user ? JSON.parse(user) : null);
        
        // Don't clear tokens automatically - let user know they need to re-login
        // localStorage.removeItem('adminAuthToken');
        // localStorage.removeItem('adminUser');
        // localStorage.removeItem('adminPermissions');
      }
    }
    
    return Promise.reject(error);
  }
);

export const appConfigService = {
  async getConfig(): Promise<AppConfig> {
    try {
      console.log('📡 Fetching app config from:', `${API_CONFIG.BASE_URL}/content/app-config/`);
      const response = await apiClient.get('/content/app-config/');
      console.log('✅ Config fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch config:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  async updateConfig(config: Partial<AppConfig>): Promise<AppConfig> {
    try {
      console.log('📡 Updating app config:', config);
      console.log('📡 Endpoint:', `${API_CONFIG.BASE_URL}/content/app-config/update/`);
      const response = await apiClient.patch('/content/app-config/update/', config);
      console.log('✅ Config updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update config:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  async toggleSellScreenEnforcement(enforce: boolean): Promise<AppConfig> {
    console.log('🔄 Toggling sell screen enforcement to:', enforce);
    return this.updateConfig({ enforce_sell_screen_gate: enforce });
  },

  async setSellScreenGateMode(mode: AppConfig['sell_screen_gate_mode']): Promise<AppConfig> {
    console.log('🔄 Setting sell screen gate mode to:', mode);
    return this.updateConfig({ sell_screen_gate_mode: mode });
  },
};
