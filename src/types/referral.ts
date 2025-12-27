export interface ReferredUser {
  id: number;
  name: string;
  email: string;
  date_joined: string;
  has_completed_first_order: boolean;
  referrer?: {
    id: number;
    name: string;
    email: string;
    referral_code: string;
  } | null;
}

export interface ReferralTransaction {
  id: number;
  transaction_type: 'referrer_bonus' | 'referee_bonus' | 'redemption';
  amount: string;
  created_at: string;
  order_id?: number;
  description: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  related_user?: {
    id: number;
    name: string;
  } | null;
}

export interface ReferralStats {
  total_users_with_codes: number;
  total_referred: number;
  successful_referrals: number;
  conversion_rate: number;
  total_bonus_paid: number;
  total_referrer_bonus: number;
  total_referee_bonus: number;
  total_redeemed: number;
  pending_balance: number;
}

export interface TopReferrer {
  id: number;
  name: string;
  email: string;
  referral_code: string;
  referral_count: number;
  balance: string;
}
