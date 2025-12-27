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
