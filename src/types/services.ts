/**
 * Service Management Types
 * For Society Tieup, Corporate Tieup, Debris Removal, Demolition Services
 */

export type OrganizationType = 'society' | 'corporate' | 'institution' | 'mall';
export type OrganizationStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type ServiceTypeName = 'society_tieup' | 'corporate_tieup' | 'debris_removal' | 'demolition_removal';
export type OrderStatus = 
  | 'pending_collection' 
  | 'collection_scheduled' 
  | 'in_progress' 
  | 'material_processing' 
  | 'completed' 
  | 'cancelled';

export type CertificateType = 'completion' | 'environmental_impact' | 'quantity_confirmation';

export interface Organization {
  id: number;
  organization_id: string;
  name: string;
  organization_type: OrganizationType;
  
  // Contact
  contact_person_name: string;
  contact_person_phone: string;
  contact_person_email: string;
  
  // Address
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  
  // Details
  total_members: number;
  gstin?: string;
  pan?: string;
  registration_certificate?: string;
  
  // Status
  status: OrganizationStatus;
  verified_by?: number;
  verified_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: number;
  
  // Computed
  is_verified: boolean;
}

export interface ServiceType {
  id: number;
  service_code: string;
  service_name: ServiceTypeName;
  description: string;
  image_url?: string;
  icon_url?: string;
  base_price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimated_value?: number;
}

export interface EnvironmentalImpact {
  trees_saved?: number;
  co2_reduced?: number;
  water_saved?: number;
  energy_saved?: number;
  [key: string]: number | undefined;
}

export interface ServiceOrder {
  id: number;
  order_id: string;
  organization_id: number;
  service_type_id: number;
  
  // Status
  order_status: OrderStatus;
  requested_by: string;
  assigned_to?: number;
  
  // Scheduling
  requested_date: string;
  scheduled_date?: string;
  completed_date?: string;
  
  // Items & Quantities
  items: ServiceOrderItem[];
  estimated_quantity?: number;
  final_quantity?: number;
  quantity_unit?: string;
  
  // Pricing
  estimated_value?: number;
  final_value?: number;
  
  // Additional Info
  notes?: string;
  special_instructions?: string;
  environmental_impact?: EnvironmentalImpact;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface ServiceOrderAudit {
  id: number;
  service_order_id: number;
  action: string;
  status_changed_to?: string;
  details?: Record<string, any>;
  notes?: string;
  performed_by?: number;
  created_at: string;
}

export interface Certificate {
  id: number;
  certificate_id: string;
  service_order_id: number;
  certificate_type: CertificateType;
  
  // Generated Info
  generated_on: string;
  generated_by?: number;
  
  // Content
  certificate_data: Record<string, any>;
  certificate_html?: string;
  certificate_pdf_url?: string;
  
  // Font & Styling
  font_family: string;
  font_size_heading: number;
  font_size_body: number;
  
  // Approval
  is_approved: boolean;
  approved_by?: number;
  approved_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface OrganizationDashboard {
  id: number;
  organization_id: number;
  
  // Order Metrics
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  in_progress_orders: number;
  
  // Processing Metrics
  total_quantity_processed: number;
  total_value_processed: number;
  
  // Environmental
  total_trees_saved: number;
  total_co2_reduced: number;
  
  // Certificates
  total_certificates_generated: number;
  total_certificates_approved: number;
  
  // Timeline
  created_at: string;
  updated_at: string;
  last_calculated_at: string;
}

export interface ServicePageStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  totalQuantityProcessed: number;
  totalValueProcessed: number;
  totalCertificatesGenerated: number;
  totalEnvironmentalImpact: EnvironmentalImpact;
}

export interface OrderWorkflowState {
  id: string;
  status: OrderStatus;
  timestamp: string;
  changedBy?: string;
  notes?: string;
}

export type WorkflowAudience = 'admin' | 'organization' | 'agency' | 'customer';

export interface ServiceWorkflowFilters {
  organization_id?: number;
  organization_type?: OrganizationType;
  status?: OrderStatus;
  role?: WorkflowAudience;
  limit?: number;
}

export interface ServiceWorkflowEvent {
  id: number;
  order_id: string;
  service_order_id: number;
  organization_id: number;
  organization_name: string;
  organization_type: OrganizationType;
  service_type_name: ServiceTypeName;
  status: OrderStatus;
  title: string;
  description: string;
  progress_percentage: number;
  timestamp: string;
  actor: string;
  notes?: string;
  audience: WorkflowAudience[];
}

export interface AuditReport {
  id: number;
  organization_id?: number;
  service_order_id?: number;
  audit_type: string;
  description: string;
  details?: Record<string, any>;
  performed_by?: number;
  created_at: string;
}
