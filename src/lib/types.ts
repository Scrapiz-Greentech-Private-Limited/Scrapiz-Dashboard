export type UserRole = 'seller' | 'buyer' | 'agent' | 'admin' | 'superadmin';
export type KycStatus = 'pending' | 'verified' | 'rejected';
export type OrderStatus = 'pending' | 'scheduled' | 'transit' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentType = 'sellerPayout' | 'agentPayout' | 'scrapPurchase';
export type NotificationType = 'push' | 'sms' | 'email';
export type NotificationStatus = 'sent' | 'failed' | 'scheduled' | 'draft';
export type AgentStatus = 'Available' | 'On Duty' | 'Offline';


export interface SavedAddress {
  id: string;
  title: 'Home' | 'Work' | 'Other';
  addressLine: string;
  landmark?: string;
  city: string;
  pincode: string;
  contactName: string;
  mobile: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  address: string;
  zone: string;
  kycStatus: KycStatus;
  documents?: {
    aadhaarURL?: string;
    panURL?: string;
    licenseURL?: string;
  };
  totalOrders: number;
  totalWeight: number;
  walletBalance: number;
  createdAt: string;
  avatarUrl: string;
  rating?: number;
  vehicleNumber?: string;
  referralCode?: string;  // User's referral code
  totalReferrals?: number;  // Number of successful referrals
  savedAddresses?: SavedAddress[];  // Saved addresses from mobile app
}

export interface AssignedAgent {
  id: number;
  agent_code: string;
  name: string;
  phone: string;
  availability: string;
}

export interface Order {
  id: string;  // order_number (e.g., "SCR-12345678")
  dbId?: number;  // Database ID for API calls
  sellerId: string;
  customerPhone?: string;  // Customer phone number for contact
  agentId?: string;
  assignedAgent?: AssignedAgent;  // Full agent details when assigned
  scrapCategory: string;
  estimatedWeight: number;
  finalWeight?: number;
  pricePerKg: number;
  totalAmount?: number;
  pickupAddress: string;
  pickupTime: string;
  status: OrderStatus;
  proofPhotoUrl?: string;
  invoiceUrl?: string;
  createdAt: string;
  notes?: string;
  photos?: string[];  // Multiple photos from mobile app
  type?: 'scrap' | 'service';  // Order type
  hasPushToken?: boolean;  // Whether user has active push token for notifications
}

export interface ScrapCategory {
  id: string;
  name: string;
  pricePerKg: number;
  unit: 'kg' | 'piece';
  updatedAt: string;
  priceHistory: { date: string; rate: number }[];
}

export interface Payment {
  id: string;
  userId: string;
  userName?: string;
  orderId: string;
  amount: number;
  type: PaymentType;
  paymentMode: 'UPI' | 'bank';
  status: PaymentStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  recipientCount: number;
  target: 'All Users' | 'Sellers' | 'Agents' | 'Buyers';
}

export interface ServiceArea {
  id: string;
  name: string;
  pincode: string;
  active: boolean;
  zone: string;
}

export interface ServiceOrder {
  id: string;
  service: string;
  customerId: string;
  customerName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  address: string;
  pincode: string;
  propertyType: 'Residential' | 'Commercial' | 'Industrial';
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  details: {
    area?: string;
    floors?: string;
    specialRequirements?: string;
    [key: string]: any;
  };
  estimatedPrice?: number;
  finalPrice?: number;
  agentId?: string;
  createdAt: string;
  notes?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerCode: string;
  refereeId: string;
  refereeName: string;
  refereeEmail: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Expired';
  bonusPaid: number;
  referrerBonus: number;
  refereeBonus: number;
  createdAt: string;
}
