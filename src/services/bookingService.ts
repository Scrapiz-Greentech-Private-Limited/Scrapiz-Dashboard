/**
 * Demolition Booking Management Service
 * Admin Dashboard Service
 *
 * Handles service-specific booking management including:
 * - Fetching bookings with service details
 * - Displaying structure types and service-specific data
 * - Filtering bookings by service type
 * - Managing service-specific booking operations
 */

import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ServiceDetails {
  service_type?: string;
  structure_type?: string;
  price_range?: string;
  category?: string;
  [key: string]: any;
}

export interface ServiceBooking {
  id: number;
  service: string;
  name: string;
  phone: string;
  address: string;
  preferred_datetime: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  service_details?: ServiceDetails | null;
  meeting_link?: string;
  meeting_event_id?: string;
  created_at: string;
}

export interface DemolitionBooking extends ServiceBooking {
  service: 'demolition';
  service_details: {
    service_type: 'demolition';
    structure_type: 'full_building' | 'partial' | 'interior' | 'wall_breaking' | 'slab_roof';
    [key: string]: any;
  };
}

export interface BookingFilters {
  service?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  structureType?: string;
}

export interface BookingListResponse {
  data: ServiceBooking[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Demolition Structure Type Mapping
// ============================================================================

const DEMOLITION_STRUCTURE_TYPES: Record<string, string> = {
  full_building: 'Full Building Demolition',
  partial: 'Partial Demolition',
  interior: 'Interior Demolition',
  wall_breaking: 'Wall Breaking / Cutting',
  slab_roof: 'Slab / Roof Demolition',
};

// ============================================================================
// API Client Setup
// ============================================================================

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    ...API_CONFIG.HEADERS,
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string | undefined;
    if (frontendKey) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any)['x-auth-app'] = frontendKey;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================================================
// Booking Service Class
// ============================================================================

class BookingManagementService {
  /**
   * Fetch all bookings (admin endpoint)
   * Requires admin privileges
   */
  async getAllBookings(): Promise<ServiceBooking[]> {
    try {
      const response = await apiClient.get('/api/services/admin/bookings/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all bookings:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch bookings');
    }
  }

  /**
   * Fetch bookings for the authenticated user
   */
  async getUserBookings(): Promise<ServiceBooking[]> {
    try {
      const response = await apiClient.get('/api/services/bookings/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user bookings:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch your bookings');
    }
  }

  /**
   * Get a single booking by ID (admin endpoint)
   */
  async getBookingById(bookingId: number): Promise<ServiceBooking> {
    try {
      const response = await apiClient.get(`/api/services/admin/bookings/${bookingId}/`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching booking ${bookingId}:`, error);
      throw new Error(error.response?.data?.error || 'Failed to fetch booking');
    }
  }

  /**
   * Update booking status (admin endpoint)
   */
  async updateBookingStatus(
    bookingId: number,
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  ): Promise<ServiceBooking> {
    try {
      const response = await apiClient.patch(`/api/services/admin/bookings/${bookingId}/`, {
        status,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating booking ${bookingId} status:`, error);
      throw new Error(error.response?.data?.error || 'Failed to update booking status');
    }
  }

  /**
   * Filter bookings by criteria
   */
  async filterBookings(filters: BookingFilters): Promise<ServiceBooking[]> {
    try {
      const params = new URLSearchParams();

      if (filters.service) params.append('service', filters.service);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const response = await apiClient.get('/api/services/admin/bookings/', { params });
      
      // Filter by structure type if specified (client-side filtering)
      let bookings = response.data;
      if (filters.structureType) {
        bookings = bookings.filter(
          (b: ServiceBooking) =>
            b.service_details?.structure_type === filters.structureType,
        );
      }

      return bookings;
    } catch (error: any) {
      console.error('Error filtering bookings:', error);
      throw new Error(error.response?.data?.error || 'Failed to filter bookings');
    }
  }

  /**
   * Get demolition bookings only
   */
  async getDemolitionBookings(): Promise<DemolitionBooking[]> {
    try {
      const allBookings = await this.getAllBookings();
      return allBookings.filter(
        (b) => b.service === 'demolition' && b.service_details?.structure_type,
      ) as DemolitionBooking[];
    } catch (error) {
      console.error('Error fetching demolition bookings:', error);
      throw error;
    }
  }

  /**
   * Get demolition bookings by structure type
   */
  async getDemolitionBookingsByType(
    structureType: 'full_building' | 'partial' | 'interior' | 'wall_breaking' | 'slab_roof',
  ): Promise<DemolitionBooking[]> {
    try {
      const demolitionBookings = await this.getDemolitionBookings();
      return demolitionBookings.filter(
        (b) => b.service_details?.structure_type === structureType,
      );
    } catch (error) {
      console.error(`Error fetching ${structureType} demolition bookings:`, error);
      throw error;
    }
  }

  /**
   * Get statistics for demolition bookings
   */
  async getDemolitionStatistics() {
    try {
      const bookings = await this.getDemolitionBookings();

      const stats = {
        total: bookings.length,
        byType: {} as Record<string, number>,
        byStatus: { pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
        recent: bookings.slice(0, 5),
      };

      bookings.forEach((b) => {
        const type = b.service_details?.structure_type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
        stats.byStatus[b.status] = (stats.byStatus[b.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching demolition statistics:', error);
      throw error;
    }
  }

  /**
   * Get human-readable structure type name
   */
  getStructureTypeName(structureType: string): string {
    return DEMOLITION_STRUCTURE_TYPES[structureType] || structureType;
  }

  /**
   * Format booking for display
   */
  formatBookingForDisplay(booking: ServiceBooking) {
    return {
      ...booking,
      structureTypeName: booking.service_details?.structure_type
        ? this.getStructureTypeName(booking.service_details.structure_type)
        : 'Unknown',
      statusDisplay: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
      dateDisplay: new Date(booking.preferred_datetime).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      timeDisplay: new Date(booking.preferred_datetime).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  }

  /**
   * Validate service details structure
   */
  validateServiceDetails(serviceDetails: ServiceDetails): boolean {
    if (!serviceDetails) return false;
    if (serviceDetails.service_type !== 'demolition') return false;
    if (!Object.keys(DEMOLITION_STRUCTURE_TYPES).includes(serviceDetails.structure_type || ''))
      return false;
    return true;
  }

  /**
   * Transform booking response to ensure service_details is always a dict
   */
  sanitizeBooking(booking: ServiceBooking): ServiceBooking {
    return {
      ...booking,
      service_details: booking.service_details || {},
    };
  }
}

// ============================================================================
// Export
// ============================================================================

export const BookingService = new BookingManagementService();
export default BookingService;
