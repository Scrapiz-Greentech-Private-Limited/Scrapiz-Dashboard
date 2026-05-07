/**
 * Service API Layer
 * Handles all service-related API calls with mock data for frontend development
 */

import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';
import {
  Organization,
  ServiceType,
  ServiceOrder,
  ServiceOrderAudit,
  Certificate,
  OrganizationDashboard,
  ServicePageStats,
  ServiceWorkflowFilters,
  ServiceWorkflowEvent,
  WorkflowAudience,
} from '@/types/services';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
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
});

// ==================== MOCK DATA ====================

const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 1,
    organization_id: 'SOC-001',
    name: 'Green Valley Society',
    organization_type: 'society',
    contact_person_name: 'Rajesh Kumar',
    contact_person_phone: '+91-9876543210',
    contact_person_email: 'rajesh@greenvalley.com',
    address: '123 Green Street, Sector 5',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400001',
    latitude: 19.0760,
    longitude: 72.8777,
    total_members: 500,
    gstin: '27AABCT1234A1Z0',
    status: 'active',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    is_verified: true,
  },
  {
    id: 2,
    organization_id: 'CORP-001',
    name: 'TechCorp Industries',
    organization_type: 'corporate',
    contact_person_name: 'Priya Sharma',
    contact_person_phone: '+91-9876543211',
    contact_person_email: 'priya@techcorp.com',
    address: '456 Business Park, Downtown',
    city: 'Bangalore',
    state: 'Karnataka',
    postal_code: '560001',
    latitude: 12.9716,
    longitude: 77.5946,
    total_members: 2000,
    gstin: '29AABCT5678B2Z5',
    pan: 'AAACT1234A',
    status: 'active',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    is_verified: true,
  },
];

const MOCK_SERVICE_TYPES: ServiceType[] = [
  {
    id: 1,
    service_code: 'SOC_TIEUP_001',
    service_name: 'society_tieup',
    description: 'Comprehensive waste management and recycling service for residential societies',
    image_url: '/services/societyTieup.webp',
    icon_url: '🏢',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    service_code: 'CORP_TIEUP_001',
    service_name: 'corporate_tieup',
    description: 'Enterprise-level waste management and sustainability solutions for corporations',
    image_url: '/services/corporateTieup.webp',
    icon_url: '🏭',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    service_code: 'DEBRIS_001',
    service_name: 'debris_removal',
    description: 'Professional debris and construction waste removal services',
    image_url: '/services/debris_removal.webp',
    icon_url: '🚚',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    service_code: 'DEMO_001',
    service_name: 'demolition_removal',
    description: 'Complete demolition and removal services with environmental compliance',
    image_url: '/services/debris_removal.webp',
    icon_url: '🏗️',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_ORDERS: ServiceOrder[] = [
  {
    id: 1,
    order_id: 'ORD-2024-001',
    organization_id: 1,
    service_type_id: 1,
    order_status: 'pending_collection',
    requested_by: 'Rajesh Kumar',
    requested_date: new Date().toISOString(),
    items: [{ id: '1', name: 'Plastic Waste', quantity: 50, unit: 'kg' }],
    estimated_quantity: 50,
    quantity_unit: 'kg',
    estimated_value: 2500,
    notes: 'Weekly collection',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    order_id: 'ORD-2024-002',
    organization_id: 1,
    service_type_id: 1,
    order_status: 'completed',
    requested_by: 'Rajesh Kumar',
    requested_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    scheduled_date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: '1', name: 'Paper', quantity: 100, unit: 'kg' },
      { id: '2', name: 'Cardboard', quantity: 80, unit: 'kg' },
    ],
    estimated_quantity: 180,
    final_quantity: 185,
    quantity_unit: 'kg',
    estimated_value: 9000,
    final_value: 9250,
    environmental_impact: {
      trees_saved: 25,
      co2_reduced: 150,
      water_saved: 500,
    },
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_DASHBOARD: OrganizationDashboard[] = [
  {
    id: 1,
    organization_id: 1,
    total_orders: 48,
    completed_orders: 45,
    pending_orders: 2,
    in_progress_orders: 1,
    total_quantity_processed: 8500,
    total_value_processed: 425000,
    total_trees_saved: 425,
    total_co2_reduced: 2100,
    total_certificates_generated: 45,
    total_certificates_approved: 45,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_calculated_at: new Date().toISOString(),
  },
];

const WORKFLOW_PROGRESS: Record<string, number> = {
  pending_collection: 0,
  collection_scheduled: 25,
  in_progress: 50,
  material_processing: 75,
  completed: 100,
  cancelled: 0,
};

const buildWorkflowEvent = (
  order: ServiceOrder,
  eventId: number,
  title: string,
  description: string,
  actor: string,
  audience: WorkflowAudience[],
  notes?: string,
): ServiceWorkflowEvent => {
  const organization = MOCK_ORGANIZATIONS.find((org) => org.id === order.organization_id)!;
  const serviceType = MOCK_SERVICE_TYPES.find((service) => service.id === order.service_type_id)!;

  return {
    id: eventId,
    order_id: order.order_id,
    service_order_id: order.id,
    organization_id: organization.id,
    organization_name: organization.name,
    organization_type: organization.organization_type,
    service_type_name: serviceType.service_name,
    status: order.order_status,
    title,
    description,
    progress_percentage: WORKFLOW_PROGRESS[order.order_status] ?? 0,
    timestamp: order.updated_at || order.created_at,
    actor,
    notes,
    audience,
  };
};

const MOCK_WORKFLOW_EVENTS: ServiceWorkflowEvent[] = [
  buildWorkflowEvent(
    MOCK_ORDERS[1],
    1001,
    'Collection completed',
    'Final material weight confirmed and recycling workflow closed for the current cycle.',
    'Trace Resource Operations',
    ['admin', 'organization', 'agency', 'customer'],
    'Completed with certificate readiness and environmental impact captured.',
  ),
  buildWorkflowEvent(
    MOCK_ORDERS[0],
    1000,
    'Pending request received',
    'New society tieup request received from the organization dashboard.',
    'Society Coordination Desk',
    ['admin', 'organization', 'agency'],
    'Queued for collection scheduling.',
  ),
];

// ==================== SERVICE METHODS ====================

export class ServiceManagementAPI {
  // Organizations
  static async getOrganizations(filters?: { type?: string; status?: string }) {
    try {
      // For now, return mock data
      // In production: return api.get('/organizations/', { params: filters });
      return MOCK_ORGANIZATIONS;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  static async getOrganization(id: number | string) {
    try {
      return MOCK_ORGANIZATIONS.find((org) => org.id === id || org.organization_id === id);
    } catch (error) {
      console.error('Error fetching organization:', error);
      throw error;
    }
  }

  static async createOrganization(data: Partial<Organization>) {
    try {
      // return api.post('/organizations/', data);
      const newOrg: Organization = {
        ...data,
        id: MOCK_ORGANIZATIONS.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_verified: false,
      } as Organization;
      MOCK_ORGANIZATIONS.push(newOrg);
      return newOrg;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  static async updateOrganization(id: number, data: Partial<Organization>) {
    try {
      // return api.put(`/organizations/${id}/`, data);
      const org = MOCK_ORGANIZATIONS.find((o) => o.id === id);
      if (org) {
        Object.assign(org, data, { updated_at: new Date().toISOString() });
      }
      return org;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  // Service Types
  static async getServiceTypes() {
    try {
      return MOCK_SERVICE_TYPES;
    } catch (error) {
      console.error('Error fetching service types:', error);
      throw error;
    }
  }

  static async getServiceType(id: number) {
    try {
      return MOCK_SERVICE_TYPES.find((st) => st.id === id);
    } catch (error) {
      console.error('Error fetching service type:', error);
      throw error;
    }
  }

  // Service Orders
  static async getServiceOrders(filters?: { organization_id?: number; status?: string }) {
    try {
      let orders = [...MOCK_ORDERS];
      if (filters?.organization_id) {
        orders = orders.filter((o) => o.organization_id === filters.organization_id);
      }
      if (filters?.status) {
        orders = orders.filter((o) => o.order_status === filters.status);
      }
      return orders;
    } catch (error) {
      console.error('Error fetching service orders:', error);
      throw error;
    }
  }

  static async getServiceWorkflowTimeline(filters?: {
    organization_id?: number;
    organization_type?: string;
    status?: string;
    role?: WorkflowAudience;
    limit?: number;
  }) {
    try {
      const response = await api.get('/services/workflow/timeline/', { params: filters });
      const payload = response.data;

      if (Array.isArray(payload)) {
        return payload as ServiceWorkflowEvent[];
      }

      if (payload?.timeline) {
        return payload.timeline as ServiceWorkflowEvent[];
      }

      return [];
    } catch (error) {
      console.warn('Falling back to mock workflow timeline:', error);

      let events = [...MOCK_WORKFLOW_EVENTS];

      if (filters?.organization_id) {
        events = events.filter((event) => event.organization_id === filters.organization_id);
      }

      if (filters?.organization_type) {
        events = events.filter((event) => event.organization_type === filters.organization_type);
      }

      if (filters?.status) {
        events = events.filter((event) => event.status === filters.status);
      }

      if (filters?.role && filters.role !== 'admin') {
        events = events.filter((event) => event.audience.includes(filters.role!));
      }

      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return filters?.limit ? events.slice(0, filters.limit) : events;
    }
  }

  static subscribeToServiceWorkflowEvents(
    onEvent: (event: ServiceWorkflowEvent) => void,
    filters?: ServiceWorkflowFilters,
  ) {
    if (typeof window !== 'undefined') {
      const query = new URLSearchParams();

      if (filters?.organization_id) {
        query.set('organization_id', String(filters.organization_id));
      }

      if (filters?.organization_type) {
        query.set('organization_type', filters.organization_type);
      }

      if (filters?.status) {
        query.set('status', filters.status);
      }

      if (filters?.role) {
        query.set('role', filters.role);
      }

      if (filters?.limit) {
        query.set('limit', String(filters.limit));
      }

      const streamUrl = `${API_BASE}/services/workflow/stream/${query.toString() ? `?${query.toString()}` : ''}`;

      const headers: Record<string, string> = { ...API_CONFIG.HEADERS } as Record<string, string>;
      const token = localStorage.getItem('adminAuthToken');
      if (token) {
        headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }

      const controller = new AbortController();
      let pollTimer: number | null = null;

      const startPollingFallback = () => {
        if (pollTimer !== null) return;

        pollTimer = window.setInterval(async () => {
          try {
            const events = await ServiceManagementAPI.getServiceWorkflowTimeline({
              ...filters,
              limit: 1,
            });

            if (events[0]) {
              onEvent(events[0]);
            }
          } catch (error) {
            console.warn('Workflow polling fallback failed:', error);
          }
        }, 15000);
      };

      void (async () => {
        try {
          const response = await fetch(streamUrl, {
            method: 'GET',
            headers,
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error(`Workflow stream unavailable (${response.status})`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split('\n\n');
            buffer = chunks.pop() || '';

            for (const chunk of chunks) {
              const dataLine = chunk
                .split('\n')
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.replace(/^data:\s?/, ''))
                .join('');

              if (!dataLine) continue;

              try {
                const payload = JSON.parse(dataLine) as ServiceWorkflowEvent | { timeline?: ServiceWorkflowEvent[] };
                if (payload && 'timeline' in payload && Array.isArray(payload.timeline)) {
                  payload.timeline.forEach(onEvent);
                } else {
                  onEvent(payload as ServiceWorkflowEvent);
                }
              } catch (error) {
                console.warn('Ignoring malformed workflow stream payload', error);
              }
            }
          }
        } catch (error) {
          console.warn('Workflow stream unavailable, using polling fallback:', error);
          startPollingFallback();
        }
      })();

      return () => {
        controller.abort();
        if (pollTimer !== null) {
          window.clearInterval(pollTimer);
        }
      };
    }

    return () => undefined;
  }

  static async getServiceOrder(id: string) {
    try {
      return MOCK_ORDERS.find((o) => o.order_id === id);
    } catch (error) {
      console.error('Error fetching service order:', error);
      throw error;
    }
  }

  static async createServiceOrder(data: Partial<ServiceOrder>) {
    try {
      // return api.post('/service-orders/', data);
      const newOrder: ServiceOrder = {
        ...data,
        id: MOCK_ORDERS.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: data.items || [],
      } as ServiceOrder;
      MOCK_ORDERS.push(newOrder);
      return newOrder;
    } catch (error) {
      console.error('Error creating service order:', error);
      throw error;
    }
  }

  static async updateServiceOrderStatus(orderId: string, newStatus: string, notes?: string) {
    try {
      // return api.patch(`/service-orders/${orderId}/update-status/`, { status: newStatus, notes });
      const order = MOCK_ORDERS.find((o) => o.order_id === orderId);
      if (order) {
        order.order_status = newStatus as any;
        order.updated_at = new Date().toISOString();
      }
      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  static async updateServiceOrderQuantity(orderId: string, newQuantity: number, reason?: string) {
    try {
      // return api.patch(`/service-orders/${orderId}/update-quantity/`, { quantity: newQuantity, reason });
      const order = MOCK_ORDERS.find((o) => o.order_id === orderId);
      if (order) {
        order.final_quantity = newQuantity;
        order.updated_at = new Date().toISOString();
      }
      return order;
    } catch (error) {
      console.error('Error updating order quantity:', error);
      throw error;
    }
  }

  // Audit Logs
  static async getOrderAuditLogs(orderId: string) {
    try {
      // return api.get(`/service-orders/${orderId}/audit-logs/`);
      return [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  // Certificates
  static async generateCertificate(orderId: string, certificateType: string, certificateData: any) {
    try {
      // return api.post('/certificates/', { service_order_id: orderId, certificate_type: certificateType, certificate_data: certificateData });
      const newCert: Certificate = {
        id: 1,
        certificate_id: `CERT-${Date.now()}`,
        service_order_id: parseInt(orderId),
        certificate_type: certificateType as any,
        generated_on: new Date().toISOString(),
        certificate_data: certificateData,
        certificate_html: '',
        font_family: 'Cambria',
        font_size_heading: 28,
        font_size_body: 14,
        is_approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newCert;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }

  static async getCertificate(certificateId: string) {
    try {
      // return api.get(`/certificates/${certificateId}/`);
      return null;
    } catch (error) {
      console.error('Error fetching certificate:', error);
      throw error;
    }
  }

  static async approveCertificate(certificateId: string) {
    try {
      // return api.patch(`/certificates/${certificateId}/approve/`);
      return null;
    } catch (error) {
      console.error('Error approving certificate:', error);
      throw error;
    }
  }

  // Dashboard
  static async getOrganizationDashboard(organizationId: number) {
    try {
      return MOCK_DASHBOARD.find((d) => d.organization_id === organizationId);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  }

  static async getServicePageStats(): Promise<ServicePageStats> {
    try {
      return {
        totalOrganizations: MOCK_ORGANIZATIONS.length,
        activeOrganizations: MOCK_ORGANIZATIONS.filter((o) => o.status === 'active').length,
        totalOrders: MOCK_ORDERS.length,
        completedOrders: MOCK_ORDERS.filter((o) => o.order_status === 'completed').length,
        pendingOrders: MOCK_ORDERS.filter((o) => o.order_status === 'pending_collection').length,
        inProgressOrders: MOCK_ORDERS.filter((o) => o.order_status === 'in_progress').length,
        totalQuantityProcessed: 8500,
        totalValueProcessed: 425000,
        totalCertificatesGenerated: 45,
        totalEnvironmentalImpact: {
          trees_saved: 425,
          co2_reduced: 2100,
          water_saved: 12500,
        },
      };
    } catch (error) {
      console.error('Error fetching service page stats:', error);
      throw error;
    }
  }
}

export default ServiceManagementAPI;
