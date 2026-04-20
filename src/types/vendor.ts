export type VendorStatus =
  | 'draft'
  | 'pending_verification'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type VendorDocumentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'resubmission_required';

export interface VendorVehicle {
  id: number;
  vehicle_type: string;
  vehicle_type_display: string;
  vehicle_number: string;
  vehicle_name?: string | null;
  vehicle_model_name?: string | null;
  vehicle_uid: string;
  weighing_scale_type: string;
  weighing_scale_type_display: string;
  is_active: boolean;
  created_at: string;
}

export interface VendorLocation {
  latitude: number;
  longitude: number;
  last_updated: string;
}

export interface VendorBiometric {
  model_version: string;
  source_document_type?: string | null;
  source_image_url?: string | null;
  status?: 'pending' | 'processing' | 'verified' | 'rejected';
  rejection_reason?: string;
  vector_id?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorAuditLog {
  id: number;
  action: string;
  action_display: string;
  actor_name?: string | null;
  actor_email?: string | null;
  timestamp: string;
  previous_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  details?: string | null;
}

export interface VendorBiometricMetrics {
  status?: 'pending' | 'processing' | 'verified' | 'rejected' | null;
  is_verified: boolean;
  rejection_reason?: string | null;
  vector_id?: string | null;
  model_version?: string | null;
  source_document_type?: string | null;
  source_image_url?: string | null;
  updated_at?: string | null;
  arrival_verification_count: number;
  arrival_verified_count: number;
  arrival_flagged_count: number;
  latest_similarity_score?: number | null;
  verification_replay: VendorAuditLog[];
}

export interface VendorDocument {
  id: number;
  document_type: string;
  document_number: string;
  document_front_url: string;
  document_back_url: string | null;
  status: VendorDocumentStatus;
  status_display: string;
  rejection_reason: string | null;
  uploaded_at: string;
  verified_at: string | null;
}

export interface Vendor {
  id: number;
  full_name: string;
  user_phone: string;
  age: number | null;
  profile_image: string | null;
  effective_profile_image?: string | null;
  service_city: string;
  service_area: string;
  status: VendorStatus;
  status_display: string;
  is_verified: boolean;
  can_go_online: boolean;
  has_active_trial: boolean;
  has_active_subscription: boolean;
  is_entitled_for_leads: boolean;
  is_active_vendor: boolean;
  is_online: boolean;
  allow_app_access_while_pending: boolean;
  rejection_reason: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  trial_duration_days?: number;
  subscription_status?: 'inactive' | 'active' | 'expired' | 'cancelled';
  subscription_plan_code?: string | null;
  subscription_plan_name?: string | null;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  last_subscription_payment_at?: string | null;
  wallet_balance?: string;
  imported_from_agent_id?: number | null;
  missing_fields: string[];
  profile_image_missing?: boolean;
  requires_profile_image_upload?: boolean;
  created_at: string;
  updated_at: string;
  vehicle: VendorVehicle | null;
  location: VendorLocation | null;
  biometric: VendorBiometric | null;
  documents: VendorDocument[];
  audit_logs?: VendorAuditLog[];
  biometric_metrics?: VendorBiometricMetrics | null;
}

export interface VendorListResponse {
  count: number;
  results: Vendor[];
}

export interface VendorQueryParams {
  status?: VendorStatus | 'all';
  city?: string;
}

export interface CreateVendorRequest {
  phone_number: string;
  email?: string;
  full_name: string;
  age?: number | null;
  service_city: string;
  service_area: string;
  profile_image?: string | null;
  vehicle_type: string;
  vehicle_number: string;
  vehicle_name?: string;
  vehicle_model_name?: string;
  weighing_scale_type?: string;
}

export interface VendorPaymentSummary {
  wallet_balance: string;
  totals: {
    recharged_amount: string;
    subscription_paid: string;
    platform_charges: string;
    customer_payouts: string;
    refunds: string;
  };
  entitlement: {
    has_active_trial: boolean;
    has_active_subscription: boolean;
    is_entitled_for_leads: boolean;
    lead_credits_balance?: number;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    trial_duration_days?: number;
    subscription_status?: string | null;
    subscription_plan_code?: string | null;
    subscription_plan_name?: string | null;
    subscription_started_at?: string | null;
    subscription_expires_at?: string | null;
  };
  transactions: Array<{
    id: number;
    type: 'credit' | 'subscription_payment' | 'platform_charge' | 'vendor_payout' | 'refund';
    direction?: 'credit' | 'debit';
    signed_amount?: string;
    amount: string;
    status: 'pending' | 'success' | 'failed';
    created_at: string;
    reference_id?: string | null;
    razorpay_order_id?: string | null;
    razorpay_payment_id?: string | null;
    metadata?: Record<string, unknown>;
  }>;
}
