import type { User, Order, ScrapCategory, Payment, ServiceArea, Notification } from '@/lib/types';

// Use a fixed date to prevent hydration errors.
const now = new Date('2024-07-29T12:00:00.000Z');

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Anika Sharma',
    phone: '+91 9876543210',
    email: 'anika.sharma@example.com',
    role: 'seller',
    address: '123, Rose Villa, Mumbai',
    zone: 'West',
    kycStatus: 'verified',
    totalOrders: 12,
    totalWeight: 250.5,
    walletBalance: 1500.75,
    createdAt: '2024-07-24T12:00:00.000Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=anika.sharma@example.com',
    referralCode: 'SCRAP-USER001',
    totalReferrals: 3,
    savedAddresses: [
      {
        id: 'addr-1',
        title: 'Home',
        addressLine: '123, Rose Villa, Andheri West',
        landmark: 'Near Metro Station',
        city: 'Mumbai',
        pincode: '400058',
        contactName: 'Anika Sharma',
        mobile: '+91 9876543210'
      }
    ]
  },
  {
    id: 'user-2',
    name: 'Rohan Gupta',
    phone: '+91 8765432109',
    email: 'rohan.gupta@example.com',
    role: 'agent',
    address: '456, Lily Apartments, Delhi',
    zone: 'North',
    kycStatus: 'verified',
    totalOrders: 58,
    totalWeight: 1200,
    walletBalance: 3200.0,
    createdAt: '2024-07-19T12:00:00.000Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=rohan.gupta@example.com',
    rating: 4.8,
    vehicleNumber: 'DL 01 AB 1234',
    documents: {
        licenseURL: '#',
        aadhaarURL: '#',
        panURL: '#'
    }
  },
  {
    id: 'user-3',
    name: 'Priya Singh',
    phone: '+91 7654321098',
    email: 'priya.singh@example.com',
    role: 'seller',
    address: '789, Orchid Heights, Bangalore',
    zone: 'South',
    kycStatus: 'pending',
    totalOrders: 3,
    totalWeight: 45.2,
    walletBalance: 350.5,
    createdAt: '2024-07-27T12:00:00.000Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=priya.singh@example.com',
    referralCode: 'SCRAP-USER003',
    totalReferrals: 1,
  },
  {
    id: 'user-4',
    name: 'Amit Patel',
    phone: '+91 6543210987',
    email: 'amit.patel@example.com',
    role: 'agent',
    address: '101, Sunstone Park, Ahmedabad',
    zone: 'West',
    kycStatus: 'verified',
    totalOrders: 75,
    totalWeight: 1800,
    walletBalance: 4500.0,
    createdAt: '2024-07-04T12:00:00.000Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=amit.patel@example.com',
    rating: 4.9,
    vehicleNumber: 'GJ 01 CD 5678',
    documents: {
        licenseURL: '#',
        aadhaarURL: '#',
        panURL: '#'
    }
  },
  {
    id: 'user-5',
    name: 'Sonia Reddy',
    phone: '+91 5432109876',
    email: 'sonia.reddy@example.com',
    role: 'buyer',
    address: '202, Silicon Towers, Hyderabad',
    zone: 'South',
    kycStatus: 'verified',
    totalOrders: 200,
    totalWeight: 5000,
    walletBalance: 0,
    createdAt: '2024-06-19T12:00:00.000Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=sonia.reddy@example.com',
  },
  {
    id: 'user-6',
    name: 'Vikram Bose',
    phone: '+91 4321098765',
    email: 'vikram.bose@example.com',
    role: 'admin',
    address: 'Admin HQ, Kolkata',
    zone: 'East',
    kycStatus: 'verified',
    totalOrders: 0,
    totalWeight: 0,
    walletBalance: 0,
    createdAt: '2024-04-20T12:00:00.000Z',
    avatarUrl: 'https://i.pravatar.cc/150?u=vikram.bose@example.com',
  },
];

export const scrapCategories: ScrapCategory[] = [
  { id: 'cat-1', name: 'Steel', pricePerKg: 25, unit: 'kg', updatedAt: '2024-07-28T12:00:00.000Z', priceHistory: [{date: '2024-07-19T12:00:00.000Z', rate: 23}, {date: '2024-07-24T12:00:00.000Z', rate: 24}] },
  { id: 'cat-2', name: 'Aluminum', pricePerKg: 120, unit: 'kg', updatedAt: '2024-07-29T12:00:00.000Z', priceHistory: [{date: '2024-07-19T12:00:00.000Z', rate: 115}, {date: '2024-07-26T12:00:00.000Z', rate: 118}] },
  { id: 'cat-3', name: 'Copper', pricePerKg: 450, unit: 'kg', updatedAt: '2024-07-28T12:00:00.000Z', priceHistory: [{date: '2024-07-14T12:00:00.000Z', rate: 440}, {date: '2024-07-22T12:00:00.000Z', rate: 445}] },
  { id: 'cat-4', name: 'Plastic', pricePerKg: 15, unit: 'kg', updatedAt: '2024-07-27T12:00:00.000Z', priceHistory: [{date: '2024-07-21T12:00:00.000Z', rate: 14}] },
  { id: 'cat-5', name: 'Paper', pricePerKg: 10, unit: 'kg', updatedAt: '2024-07-29T12:00:00.000Z', priceHistory: [{date: '2024-07-09T12:00:00.000Z', rate: 9}] },
];

export const orders: Order[] = [
  {
    id: 'order-101',
    sellerId: 'user-1',
    agentId: 'user-2',
    scrapCategory: 'Steel',
    estimatedWeight: 20,
    finalWeight: 22.5,
    pricePerKg: 25,
    totalAmount: 562.5,
    pickupAddress: '123, Rose Villa, Mumbai',
    pickupTime: '2024-07-29T10:00:00.000Z',
    status: 'completed',
    createdAt: '2024-07-29T08:00:00.000Z',
    proofPhotoUrl: 'https://picsum.photos/seed/101/600/400',
    notes: 'Customer requested contactless pickup.',
    type: 'scrap',
    photos: [
      'https://picsum.photos/seed/101a/400/400',
      'https://picsum.photos/seed/101b/400/400',
      'https://picsum.photos/seed/101c/400/400'
    ]
  },
  {
    id: 'order-102',
    sellerId: 'user-3',
    agentId: 'user-4',
    scrapCategory: 'Plastic',
    estimatedWeight: 15,
    pickupAddress: '789, Orchid Heights, Bangalore',
    pickupTime: '2024-07-30T14:00:00.000Z',
    status: 'scheduled',
    pricePerKg: 15,
    createdAt: '2024-07-28T12:00:00.000Z',
    notes: 'Third floor, no elevator. Bring help.',
    type: 'scrap',
    photos: [
      'https://picsum.photos/seed/102a/400/400',
      'https://picsum.photos/seed/102b/400/400'
    ]
  },
  {
    id: 'order-103',
    sellerId: 'user-1',
    scrapCategory: 'Aluminum',
    estimatedWeight: 5,
    pricePerKg: 120,
    pickupAddress: '123, Rose Villa, Mumbai',
    pickupTime: '2024-07-31T11:00:00.000Z',
    status: 'pending',
    createdAt: '2024-07-28T12:00:00.000Z',
  },
  {
    id: 'order-104',
    sellerId: 'user-1',
    agentId: 'user-2',
    scrapCategory: 'Copper',
    estimatedWeight: 2,
    finalWeight: 1.8,
    pricePerKg: 450,
    totalAmount: 810,
    pickupAddress: '123, Rose Villa, Mumbai',
    pickupTime: '2024-07-26T12:00:00.000Z',
    status: 'completed',
    createdAt: '2024-07-26T12:00:00.000Z',
    proofPhotoUrl: 'https://picsum.photos/seed/104/600/400',
  },
  {
    id: 'order-105',
    sellerId: 'user-3',
    agentId: 'user-4',
    scrapCategory: 'Paper',
    estimatedWeight: 30,
    pickupAddress: '789, Orchid Heights, Bangalore',
    pickupTime: '2024-07-29T07:00:00.000Z',
    status: 'transit',
    pricePerKg: 10,
    createdAt: '2024-07-29T06:00:00.000Z',
  },
  {
    id: 'order-106',
    sellerId: 'user-5',
    scrapCategory: 'Steel',
    estimatedWeight: 500,
    pricePerKg: 25,
    pickupAddress: '202, Silicon Towers, Hyderabad',
    pickupTime: '2024-07-25T12:00:00.000Z',
    status: 'cancelled',
    createdAt: '2024-07-25T12:00:00.000Z',
    notes: 'Order cancelled by customer. No longer needed.'
  },
];

export const payments: Payment[] = [
    { id: 'pay-1', userId: 'user-1', orderId: 'order-101', amount: 562.5, type: 'sellerPayout', paymentMode: 'UPI', status: 'completed', createdAt: '2024-07-29T11:00:00.000Z' },
    { id: 'pay-2', userId: 'user-2', orderId: 'order-101', amount: 50, type: 'agentPayout', paymentMode: 'bank', status: 'completed', createdAt: '2024-07-29T11:00:00.000Z' },
    { id: 'pay-3', userId: 'user-1', orderId: 'order-104', amount: 810, type: 'sellerPayout', paymentMode: 'UPI', status: 'completed', createdAt: '2024-07-27T12:00:00.000Z' },
    { id: 'pay-4', userId: 'user-4', orderId: 'order-102', amount: 30, type: 'agentPayout', paymentMode: 'bank', status: 'pending', createdAt: '2024-07-28T12:00:00.000Z' }
];

export const serviceAreas: ServiceArea[] = [
    { id: 'area-1', name: 'Andheri West', pincode: '400058', active: true, zone: 'West' },
    { id: 'area-2', name: 'Bandra', pincode: '400050', active: true, zone: 'West' },
    { id: 'area-3', name: 'Dadar', pincode: '400014', active: false, zone: 'West' },
    { id: 'area-4', name: 'Koramangala', pincode: '560034', active: true, zone: 'South' },
    { id: 'area-5', name: 'Indiranagar', pincode: '560038', active: true, zone: 'South' },
    { id: 'area-6', name: 'Connaught Place', pincode: '110001', active: true, zone: 'North' },
];

export const notifications: Notification[] = [
    {
      id: 'notif-1',
      type: 'push',
      title: 'Scrap Rates Updated!',
      message: 'Great news! We have increased the rates for Copper and Aluminum. Check the app now.',
      status: 'sent',
      createdAt: '2024-07-29T12:10:00.000Z',
      recipientCount: 1500,
      target: 'All Users',
    },
    {
      id: 'notif-2',
      type: 'sms',
      message: 'Your pickup (ID: order-102) is scheduled. Our agent will arrive shortly. - Scrapiz',
      status: 'sent',
      createdAt: '2024-07-28T12:05:00.000Z',
      recipientCount: 1,
      target: 'Sellers',
    },
    {
      id: 'notif-3',
      type: 'email',
      title: 'Welcome to Scrapiz for Agents!',
      message: 'Hi Amit, your agent account is now active. Complete your profile to start receiving pickup requests.',
      status: 'sent',
      createdAt: '2024-07-04T12:30:00.000Z',
      recipientCount: 1,
      target: 'Agents',
    },
     {
      id: 'notif-4',
      type: 'push',
      title: 'Monsoon Pickup Delays',
      message: 'Due to heavy rains in the West zone, pickups may be delayed. We appreciate your patience.',
      status: 'sent',
      createdAt: '2024-07-26T09:00:00.000Z',
      recipientCount: 350,
      target: 'Sellers',
    },
];

export function getSellerById(id: string) {
    return users.find(u => u.id === id && u.role === 'seller');
}

export function getAgentById(id: string) {
    return users.find(u => u.id === id && u.role === 'agent');
}


// Service Orders Data
export const serviceOrders: any[] = [
  {
    id: 'SRV-001',
    service: 'Demolition Service',
    customerId: 'user-1',
    customerName: 'Anika Sharma',
    phone: '+91 9876543210',
    email: 'anika.sharma@example.com',
    date: '2024-11-15',
    time: '9:00 AM - 11:00 AM',
    address: '123, Rose Villa, Andheri West, Mumbai',
    pincode: '400058',
    propertyType: 'Residential' as const,
    status: 'Pending' as const,
    details: {
      area: '2000 sq ft',
      floors: '2',
      specialRequirements: 'Need to preserve some walls for renovation'
    },
    estimatedPrice: 25000,
    createdAt: '2024-11-10T12:00:00.000Z',
    notes: 'Please call before arriving'
  },
  {
    id: 'SRV-002',
    service: 'Paper Shredding',
    customerId: 'user-5',
    customerName: 'Sonia Reddy',
    phone: '+91 5432109876',
    email: 'sonia.reddy@example.com',
    date: '2024-11-14',
    time: '11:00 AM - 1:00 PM',
    address: '202, Silicon Towers, Hyderabad',
    pincode: '500001',
    propertyType: 'Commercial' as const,
    status: 'Confirmed' as const,
    details: {
      documentType: 'Confidential office documents',
      estimatedWeight: '500 kg',
      certificateRequired: 'Yes'
    },
    estimatedPrice: 15000,
    agentId: 'user-2',
    createdAt: '2024-11-08T12:00:00.000Z'
  },
  {
    id: 'SRV-003',
    service: 'Junk Removal',
    customerId: 'user-3',
    customerName: 'Priya Singh',
    phone: '+91 7654321098',
    email: 'priya.singh@example.com',
    date: '2024-11-16',
    time: '3:00 PM - 5:00 PM',
    address: '789, Orchid Heights, Bangalore',
    pincode: '560034',
    propertyType: 'Residential' as const,
    status: 'Completed' as const,
    details: {
      items: 'Old furniture, broken appliances',
      truckSize: 'Medium',
      floors: '3'
    },
    estimatedPrice: 8000,
    finalPrice: 7500,
    agentId: 'user-4',
    createdAt: '2024-11-05T12:00:00.000Z'
  }
];

// Referrals Data
export const referrals: any[] = [
  {
    id: 'REF-001',
    referrerId: 'user-1',
    referrerName: 'Anika Sharma',
    referrerCode: 'SCRAP-USER001',
    refereeId: 'user-3',
    refereeName: 'Priya Singh',
    refereeEmail: 'priya.singh@example.com',
    date: '2024-11-10',
    status: 'Completed' as const,
    bonusPaid: 30,
    referrerBonus: 20,
    refereeBonus: 10,
    createdAt: '2024-11-10T12:00:00.000Z'
  },
  {
    id: 'REF-002',
    referrerId: 'user-1',
    referrerName: 'Anika Sharma',
    referrerCode: 'SCRAP-USER001',
    refereeId: 'user-7',
    refereeName: 'Rahul Kumar',
    refereeEmail: 'rahul.kumar@example.com',
    date: '2024-11-08',
    status: 'Completed' as const,
    bonusPaid: 30,
    referrerBonus: 20,
    refereeBonus: 10,
    createdAt: '2024-11-08T12:00:00.000Z'
  },
  {
    id: 'REF-003',
    referrerId: 'user-3',
    referrerName: 'Priya Singh',
    referrerCode: 'SCRAP-USER003',
    refereeId: 'user-8',
    refereeName: 'Neha Patel',
    refereeEmail: 'neha.patel@example.com',
    date: '2024-11-12',
    status: 'Pending' as const,
    bonusPaid: 0,
    referrerBonus: 20,
    refereeBonus: 10,
    createdAt: '2024-11-12T12:00:00.000Z'
  },
  {
    id: 'REF-004',
    referrerId: 'user-1',
    referrerName: 'Anika Sharma',
    referrerCode: 'SCRAP-USER001',
    refereeId: 'user-9',
    refereeName: 'Amit Verma',
    refereeEmail: 'amit.verma@example.com',
    date: '2024-11-05',
    status: 'Completed' as const,
    bonusPaid: 30,
    referrerBonus: 20,
    refereeBonus: 10,
    createdAt: '2024-11-05T12:00:00.000Z'
  }
];
