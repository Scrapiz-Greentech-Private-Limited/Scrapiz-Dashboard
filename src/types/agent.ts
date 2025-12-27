/**
 * Agent Management System Types
 * 
 * TypeScript interfaces for the Agent Management System.
 * These types match the Django backend serializers in server/agents/serializers.py
 * 
 * Requirements: 9.1, 9.2
 */

// ============================================================================
// Enums and Status Types
// ============================================================================

/**
 * Agent operational status
 */
export type AgentStatus = 'onboarding' | 'active' | 'inactive' | 'suspended';

/**
 * KYC verification status
 */
export type KycStatus = 'pending' | 'verified' | 'rejected';

/**
 * Agent availability status
 */
export type AvailabilityStatus = 'available' | 'on_duty' | 'offline';

/**
 * Document types for KYC verification
 */
export type DocumentType = 'aadhaar' | 'pan' | 'driving_license';

/**
 * Document verification status
 */
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

/**
 * Audit log action types
 */
export type AuditAction = 
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'kyc_updated'
  | 'document_uploaded'
  | 'document_verified'
  | 'document_rejected'
  | 'service_area_updated';

// ============================================================================
// Service Area Types
// ============================================================================

/**
 * Agent's area-level assignment
 */
export interface AgentServiceArea {
  id: number;
  name: string;
  pincode_code: string;
  pincode_id: number;
  city_name: string;
  city_state: string;
  city_status: string;
  assignment_type: 'area';
}

/**
 * Agent's pincode-level assignment
 */
export interface AgentServicePincode {
  id: number;
  pincode: string;
  area_name: string;
  city_name: string;
  city_state: string;
  city_status: string;
  area_count: number;
  assignment_type: 'pincode';
}

/**
 * Combined assignment view
 */
export interface AgentAssignment {
  id: number;
  type: 'area' | 'pincode';
  name: string;
  pincode: string;
  pincode_id: number;
  city_name: string;
  city_state: string;
  area_count?: number;
}

/**
 * Legacy: Service area with pincode and city information (for backward compatibility)
 */
export interface ServiceArea {
  id: number;
  pincode: string;
  area_name: string;
  city_name: string;
  city_state: string;
  city_status: string;
}

// ============================================================================
// Document Types
// ============================================================================

/**
 * Agent document for KYC verification
 * Requirements: 9.2
 */
export interface AgentDocument {
  id: number;
  document_type: DocumentType;
  document_type_display: string;
  document_url: string;
  verification_status: VerificationStatus;
  verification_status_display: string;
  rejection_reason: string | null;
  uploaded_at: string;
  verified_at: string | null;
  verified_by: number | null;
  verified_by_email: string | null;
}

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Full Agent interface with all fields
 * Requirements: 9.1
 */
export interface Agent {
  // Core fields
  id: number;
  agent_code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  profile_image_url: string | null;
  
  // Status fields
  status: AgentStatus;
  status_display: string;
  kyc_status: KycStatus;
  kyc_status_display: string;
  availability: AvailabilityStatus;
  availability_display: string;
  
  // Vehicle details
  vehicle_number: string | null;
  vehicle_type: string | null;
  vehicle_registration_url: string | null;
  
  // Capacity management
  daily_capacity: number;
  current_day_orders: number;
  last_order_reset: string;
  
  // Performance metrics
  total_orders: number;
  completed_orders: number;
  total_weight_collected: string; // Decimal as string
  average_rating: string; // Decimal as string
  rating_count: number;
  
  // Computed fields
  today_orders: number;
  is_eligible: boolean;
  
  // Nested relationships - NEW structure
  service_areas: AgentServiceArea[];
  service_pincodes: AgentServicePincode[];
  all_assignments: AgentAssignment[];
  documents: AgentDocument[];
  
  // Coverage location
  coverage_location: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Lightweight agent for list views
 */
export interface AgentListItem {
  id: number;
  agent_code: string;
  name: string;
  phone: string;
  email: string;
  profile_image_url: string | null;
  status: AgentStatus;
  status_display: string;
  kyc_status: KycStatus;
  kyc_status_display: string;
  availability: AvailabilityStatus;
  vehicle_number: string | null;
  average_rating: string;
  total_orders: number;
  today_orders: number;
  is_eligible: boolean;
  service_area_count: number;
  service_pincode_count: number;
  total_coverage_count: number;
  coverage_location: string | null;
  created_at: string;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request payload for creating a new agent
 */
export interface CreateAgentRequest {
  name: string;
  phone: string;
  email: string;
  address: string;
  profile_image_url?: string | null;
  vehicle_number?: string | null;
  vehicle_type?: string | null;
  vehicle_registration_url?: string | null;
  daily_capacity?: number;
  coverage_location?: string | null;
  service_area_ids?: number[];  // Area-level assignments
  service_pincode_ids?: number[];  // Pincode-level assignments
}

/**
 * Request payload for updating an agent
 */
export interface UpdateAgentRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  profile_image_url?: string | null;
  status?: AgentStatus;
  availability?: AvailabilityStatus;
  vehicle_number?: string | null;
  vehicle_type?: string | null;
  vehicle_registration_url?: string | null;
  daily_capacity?: number;
  coverage_location?: string | null;
  service_area_ids?: number[];  // Area-level assignments
  service_pincode_ids?: number[];  // Pincode-level assignments
}

/**
 * Request payload for uploading a document
 */
export interface DocumentUploadRequest {
  document_type: DocumentType;
  document_url: string;
}

/**
 * Request payload for verifying/rejecting a document
 */
export interface VerifyDocumentRequest {
  action: 'verify' | 'reject';
  rejection_reason?: string;
}

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for listing agents
 */
export interface AgentQueryParams {
  status?: AgentStatus;
  kyc_status?: KycStatus;
  availability?: AvailabilityStatus;
  service_area?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * Query parameters for audit logs
 */
export interface AuditLogQueryParams {
  action?: AuditAction;
  start_date?: string;
  end_date?: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Paginated response for agent list
 */
export interface AgentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AgentListItem[];
}

/**
 * Agent statistics
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
export interface AgentStats {
  total: number;
  active: number;
  inactive: number;
  total_orders: number;
  average_rating: string; // Decimal as string
}

/**
 * Agent audit log entry
 */
export interface AgentAuditLog {
  id: number;
  agent: number;
  agent_code: string;
  action: AuditAction;
  action_display: string;
  actor: number | null;
  actor_email: string | null;
  actor_name: string | null;
  timestamp: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  details: string | null;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * API error codes for agent operations
 */
export type AgentErrorCode =
  | 'AGENT_NOT_FOUND'
  | 'DUPLICATE_PHONE'
  | 'DUPLICATE_EMAIL'
  | 'INVALID_DOCUMENT_TYPE'
  | 'INVALID_STATUS_TRANSITION'
  | 'SERVICE_AREA_REQUIRED'
  | 'DOCUMENT_ALREADY_EXISTS'
  | 'SESSION_EXPIRED';

/**
 * API error response
 */
export interface AgentApiError {
  code?: AgentErrorCode;
  error?: string;
  message?: string;
  detail?: string;
}
