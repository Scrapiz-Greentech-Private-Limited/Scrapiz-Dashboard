/**
 * Service Areas Management System Types
 * 
 * TypeScript interfaces for the Service Areas Management System.
 * These types match the Django backend serializers in server/serviceability/serializers.py
 * 
 * Requirements: 15.4
 */

// ============================================================================
// Enums and Status Types
// ============================================================================

/**
 * City operational status
 * - 'available': Active service in this city
 * - 'coming_soon': Planned expansion
 */
export type CityStatus = 'available' | 'coming_soon';

// ============================================================================
// Serviceable City Types
// ============================================================================

/**
 * Serviceable City interface
 * Represents a city where Scrapiz provides scrap pickup services
 * 
 * Requirements: 1.1, 1.2
 */
export interface ServiceableCity {
  id: number;
  name: string;
  state: string;
  latitude: string; // Decimal as string from API
  longitude: string; // Decimal as string from API
  radius_km: string; // Decimal as string from API
  status: CityStatus;
  pincode_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Serviceable Pincode Types
// ============================================================================

/**
 * Serviceable Pincode interface
 * Represents a 6-digit Indian postal code within a serviceable city
 */
export interface ServiceablePincode {
  id: number;
  pincode: string;
  city: number;
  city_name: string;
  city_state: string;
  city_status: CityStatus;
  area_name: string; // Legacy field
  area_count: number;
  areas: ServiceArea[];
  agent_count?: number;
  created_at: string;
}

// ============================================================================
// Service Area Types (NEW)
// ============================================================================

/**
 * Service Area interface
 * Represents a specific area/locality within a pincode
 */
export interface ServiceArea {
  id: number;
  pincode: number;
  pincode_code: string;
  name: string;
  latitude?: string | null;
  longitude?: string | null;
  is_active: boolean;
  city_name: string;
  city_state: string;
  city_status: CityStatus;
  agent_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Assignment type for agents
 */
export type AssignmentType = 'area' | 'pincode';

/**
 * Combined assignment view for agents
 */
export interface AgentAssignment {
  id: number;
  type: AssignmentType;
  name: string;
  pincode: string;
  pincode_id: number;
  city_name: string;
  city_state: string;
  area_count?: number; // Only for pincode-level assignments
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request payload for creating a new city
 * 
 * Requirements: 2.1, 2.2
 */
export interface CreateCityRequest {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  status?: CityStatus;
}

/**
 * Request payload for updating a city
 * 
 * Requirements: 3.1, 3.2
 */
export interface UpdateCityRequest {
  name?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  status?: CityStatus;
}

/**
 * Request payload for creating a new pincode
 * 
 * Requirements: 6.1, 6.2
 */
export interface CreatePincodeRequest {
  pincode: string;
  city: number;
  area_name?: string;
}

/**
 * Request payload for updating a pincode
 */
export interface UpdatePincodeRequest {
  city?: number;
  area_name?: string;
}

/**
 * Request payload for creating a new service area
 */
export interface CreateAreaRequest {
  pincode: number;
  name: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

/**
 * Request payload for updating a service area
 */
export interface UpdateAreaRequest {
  name?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for listing cities
 * 
 * Requirements: 1.3, 1.4
 */
export interface CityQueryParams {
  status?: CityStatus;
  search?: string;
}

/**
 * Query parameters for listing pincodes
 */
export interface PincodeQueryParams {
  city?: number;
  search?: string;
}

/**
 * Query parameters for listing areas
 */
export interface AreaQueryParams {
  pincode?: number;
  pincode_code?: string;
  city?: number;
  search?: string;
  is_active?: boolean;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Paginated response for city list
 * 
 * Requirements: 1.1
 */
export interface CityListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ServiceableCity[];
}

/**
 * Paginated response for pincode list
 */
export interface PincodeListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ServiceablePincode[];
}

/**
 * Paginated response for area list
 */
export interface AreaListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ServiceArea[];
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Service area statistics
 * 
 * Requirements: 12.1, 12.2
 */
export interface ServiceAreaStats {
  totalCities: number;
  activeCities: number;
  totalPincodes: number;
  totalAgents: number;
  avgAgentsPerArea: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * API error codes for serviceability operations
 */
export type ServiceabilityErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'DUPLICATE_PINCODE'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

/**
 * API error response
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
export interface ServiceabilityApiError {
  code?: ServiceabilityErrorCode;
  error?: string;
  message?: string;
  detail?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Loading state for different operations
 */
export interface LoadingState {
  cities: boolean;
  pincodes: boolean;
  agents: boolean;
  submit: boolean;
}

/**
 * Error state for different operations
 */
export interface ErrorState {
  cities: string | null;
  pincodes: string | null;
  agents: string | null;
  submit: string | null;
}

/**
 * City form dialog state
 */
export interface CityFormDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  data?: ServiceableCity;
}

/**
 * Pincode form dialog state
 */
export interface PincodeFormDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  data?: ServiceablePincode;
}

/**
 * Area form dialog state
 */
export interface AreaFormDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  data?: ServiceArea;
  pincodeId?: number;
}

/**
 * Assign agent dialog state
 */
export interface AssignAgentDialogState {
  open: boolean;
  pincodeId?: number;
  areaId?: number;
  assignmentType?: AssignmentType;
}

/**
 * Confirmation dialog types
 */
export type ConfirmDialogType = 'delete-city' | 'delete-pincode' | 'delete-area' | 'remove-agent';

/**
 * Confirmation dialog state
 */
export interface ConfirmDialogState {
  open: boolean;
  type: ConfirmDialogType;
  data?: ServiceableCity | ServiceablePincode | ServiceArea | { agentId: number; agentName: string };
}
