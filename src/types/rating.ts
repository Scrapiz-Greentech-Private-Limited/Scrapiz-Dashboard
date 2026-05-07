/**
 * Rating Types for Admin Dashboard
 * 
 * Type definitions for order ratings and feedback system.
 */

export type RatingTag = 
  | 'POLITE'
  | 'ON_TIME'
  | 'ACCURATE_WEIGHT'
  | 'GOOD_PRICE'
  | 'PROFESSIONAL'
  | 'NEEDS_IMPROVEMENT';

export const RATING_TAG_LABELS: Record<RatingTag, string> = {
  POLITE: 'Agent was polite',
  ON_TIME: 'On time',
  ACCURATE_WEIGHT: 'Accurate weight',
  GOOD_PRICE: 'Good Price',
  PROFESSIONAL: 'Professional',
  NEEDS_IMPROVEMENT: 'Needs improvement',
};

export interface OrderRating {
  id: number;
  order_id: number;
  order_number: string;
  user_id: number;
  user_name: string;
  user_email: string;
  agent_id: number;
  agent_name: string;
  agent_code: string | null;
  rating: number;
  feedback: string | null;
  tags: RatingTag[];
  created_at: string;
}

export interface RatingStats {
  total_ratings: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  tag_frequency: Record<string, number>;
  recent_ratings_7d: number;
}

export interface RatingsResponse {
  success: boolean;
  ratings: OrderRating[];
  count: number;
  error?: string;
}

export interface RatingStatsResponse {
  success: boolean;
  stats: RatingStats;
  error?: string;
}

export interface RatingQueryParams {
  agent_id?: number;
  min_rating?: number;
  max_rating?: number;
}

export type VendorReviewDirection = 'vendor_to_customer' | 'customer_to_vendor';

export interface VendorReviewStats {
  average_rating: number;
  total_reviews: number;
  recommendation_rate: number;
  latest_review_at?: string | null;
  distribution: Record<string, number>;
}

export interface VendorReviewRecord {
  id: number;
  booking_id: string;
  order_id: number;
  order_number: string;
  vendor_id: number;
  vendor_name: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  reviewer_name: string;
  direction: VendorReviewDirection;
  status: string;
  overall_rating: number;
  recommendation: boolean;
  ease_of_access_rating?: number | null;
  punctuality_rating?: number | null;
  communication_rating?: number | null;
  material_readiness_rating?: number | null;
  overall_experience_rating?: number | null;
  review_text?: string | null;
  summary_title?: string | null;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface VendorReviewsResponse {
  success: boolean;
  data?: {
    reviews: VendorReviewRecord[];
    stats: VendorReviewStats;
    count: number;
  };
  error?: string;
}

export interface VendorReviewQueryParams {
  vendor_id?: number;
  direction?: VendorReviewDirection | 'all';
}
