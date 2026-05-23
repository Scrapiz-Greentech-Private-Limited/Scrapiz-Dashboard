
'use client';
import {
  File,
  ListFilter,
  Search,
  RefreshCw,
  User,
  Package,
  Calendar,
  MapPin,
  Phone,
  MoreVertical,
  Eye,
  UserPlus,
  XCircle,
  CheckCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { Badge } from "@/components/ui/badge"
import OrdersTableClient from "@/components/dashboard/orders-table-client"
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Order, OrderStatus } from "@/lib/types";
import NewOrderDialog from "@/components/dashboard/new-order-dialog";
import { Button } from "@/components/ui/button";
import { OrderService, type OrderSummary } from "@/components/backend/apiService";
import { useToast } from "@/hooks/use-toast";
import { useSearchAndFilter } from "@/hooks/useSearchAndFilter";
import { AdvancedFilters, FilterGroup } from "@/components/dashboard/advanced-filters";
import { X } from "lucide-react";

// Safe number formatter for currency display
const formatCurrency = (value: number | string | undefined | null, decimals = 2): string => {
  if (value === undefined || value === null) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';
  return num.toFixed(decimals);
};

// Format address from address_details object
const formatAddress = (orderSummary: OrderSummary): string => {
  const addr = orderSummary.address_details;
  if (!addr) {
    return orderSummary.address ? `Address ID: ${orderSummary.address}` : 'No address';
  }
  
  const parts = [
    addr.name,
    addr.room_number,
    addr.street,
    addr.area,
    addr.city,
    addr.state,
    addr.pincode ? `- ${addr.pincode}` : ''
  ].filter(Boolean);
  
  return parts.join(', ');
};

// Get all product names from order items
const getProductNames = (orderSummary: OrderSummary): string => {
  if (!orderSummary.orders || orderSummary.orders.length === 0) {
    return 'No items';
  }
  return orderSummary.orders.map(item => item.product?.name || 'Unknown').join(', ');
};

// Calculate total estimated value from products
const calculateTotalValue = (orderSummary: OrderSummary): number => {
  if (orderSummary.estimated_order_value) {
    // Django DecimalField returns string, parse to number
    const value = typeof orderSummary.estimated_order_value === 'string' 
      ? parseFloat(orderSummary.estimated_order_value) 
      : orderSummary.estimated_order_value;
    if (!isNaN(value)) return value;
  }
  // Fallback: calculate from items
  return orderSummary.orders?.reduce((sum, item) => {
    const qty = parseFloat(String(item.quantity)) || 0;
    const rate = item.product?.max_rate || 0;
    return sum + (qty * rate);
  }, 0) || 0;
};

// Map backend OrderSummary to frontend Order type
const mapOrderSummaryToOrder = (orderSummary: OrderSummary & { 
  assigned_agent_details?: { id: number; agent_code: string; name: string; phone: string; availability: string } | null;
  has_push_token?: boolean;
}): Order => {
  const totalValue = calculateTotalValue(orderSummary);
  const booking = orderSummary.booking;
  const bookingVendor = booking?.vendor;
  const arrivalAttempt = booking?.arrival_attempt;
  const lead = orderSummary.lead;
  
  return {
    id: orderSummary.order_number,
    dbId: orderSummary.id, // Store database ID for API calls
    sellerId: orderSummary.user_email || orderSummary.user || 'Unknown',
    customerPhone: orderSummary.user_phone || orderSummary.address_details?.phone_number || undefined,
    agentId: orderSummary.assigned_agent_details?.name || undefined,
    assignedAgent: orderSummary.assigned_agent_details || undefined,
    scrapCategory: getProductNames(orderSummary),
    estimatedWeight: orderSummary.orders?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0,
    finalWeight: undefined,
    pricePerKg: orderSummary.orders?.[0]?.product?.max_rate || 0,
    totalAmount: totalValue,
    pickupAddress: formatAddress(orderSummary),
    pickupTime: orderSummary.created_at,
    status: mapBackendStatus(orderSummary.status?.name || 'pending'),
    createdAt: orderSummary.created_at,
    notes: orderSummary.address_details?.delivery_suggestion || undefined,
    photos: orderSummary.images || undefined,
    type: 'scrap',
    hasPushToken: orderSummary.has_push_token || false,
    assignedVendor: bookingVendor
      ? {
          id: bookingVendor.id,
          name: bookingVendor.full_name,
          phone: bookingVendor.phone,
          profileImage:
            bookingVendor.effective_profile_image ||
            bookingVendor.profile_image ||
            bookingVendor.biometric_source_image_url ||
            null,
          status: bookingVendor.status,
          isOnline: bookingVendor.is_online,
          serviceCity: bookingVendor.service_city,
          serviceArea: bookingVendor.service_area,
        }
      : undefined,
    arrivalVerification: booking
      ? {
          bookingId: booking.id,
          bookingStatus: booking.status,
          faceVerified: booking.face_verified,
          faceScore: booking.face_score,
          contactUnlockedAt: booking.contact_unlocked_at,
          status: arrivalAttempt?.status,
          faceOutcome: arrivalAttempt?.face_outcome,
          selfieUrl: arrivalAttempt?.selfie_url,
          vendorDistanceMeters: arrivalAttempt?.vendor_distance_meters,
          otpSentAt: arrivalAttempt?.otp_sent_at,
          otpVerifiedAt: arrivalAttempt?.otp_verified_at,
          lastError: arrivalAttempt?.last_error,
        }
      : undefined,
    assignmentLifecycle: {
      leadStatus: lead?.status || undefined,
      leadCreatedAt: lead?.created_at || undefined,
      leadAcceptedAt: lead?.accepted_at || undefined,
      bookingStatus: booking?.status || undefined,
      bookingUpdatedAt: booking?.updated_at || undefined,
      bookingInvalidatedAt: booking?.invalidated_at || undefined,
      bookingInvalidationReason: booking?.invalidation_reason || undefined,
      stateAgeSeconds: orderSummary.state_age_seconds ?? undefined,
      canExpireAssignment: Boolean(
        booking?.status === 'confirmed' &&
        lead?.status &&
        ['accepted', 'pending'].includes(lead.status)
      ),
    },
  };
};

// Map backend status to frontend OrderStatus
const mapBackendStatus = (backendStatus: string): OrderStatus => {
  const statusMap: Record<string, OrderStatus> = {
    'pending': 'pending',
    'scheduled': 'scheduled',
    'assigned': 'scheduled', // Map assigned to scheduled for compatibility
    'accepted': 'scheduled',
    'transit': 'transit',
    'on_the_way': 'transit', // Map on_the_way to transit
    'on the way': 'transit',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'confirmed': 'scheduled',
    'picked up': 'transit',
    'processing': 'scheduled',
  };
  return statusMap[backendStatus.toLowerCase()] || 'pending';
};

// Status badge styling
const getStatusBadge = (status: OrderStatus) => {
  const styles: Record<OrderStatus, { className: string; label: string }> = {
    pending: { className: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Pending' },
    scheduled: { className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Scheduled' },
    transit: { className: 'bg-purple-100 text-purple-700 border-purple-200', label: 'In Transit' },
    completed: { className: 'bg-green-100 text-green-700 border-green-200', label: 'Completed' },
    cancelled: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' },
  };
  return styles[status] || styles.pending;
};

// Mobile Order Card Component
function MobileOrderCard({ order, onViewDetails }: { order: Order; onViewDetails?: (order: Order) => void }) {
  const statusBadge = getStatusBadge(order.status);
  const formattedDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) + ' • ' + new Date(order.createdAt).toLocaleTimeString('en-IN', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    : 'N/A';

  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header: Order ID + Status + Menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Order ID</p>
            <p className="font-semibold text-sm">{order.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${statusBadge.className}`}>
              {statusBadge.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewDetails?.(order)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {order.status === 'pending' && (
                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Agent
                  </DropdownMenuItem>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <DropdownMenuItem>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {order.status !== 'cancelled' && order.status !== 'completed' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-2 mb-2">
          <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{order.sellerId}</p>
            {order.customerPhone && (
              <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-sm truncate">{order.scrapCategory}</p>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>

        {/* Footer: View Map + Price */}
        <div className="flex items-center justify-between pt-3 border-t">
          <button className="flex items-center gap-1 text-green-600 text-sm font-medium">
            <MapPin className="h-3.5 w-3.5" />
            View Map
          </button>
          <p className="text-lg font-bold text-green-700">₹{formatCurrency(order.totalAmount, 2)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Mobile Orders List Component
function MobileOrdersList({ orders, loading, onViewDetails }: { orders: Order[]; loading: boolean; onViewDetails?: (order: Order) => void }) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="flex justify-between pt-2 border-t">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {orders.map((order) => (
        <MobileOrderCard key={order.id} order={order} onViewDetails={onViewDetails} />
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const orderSummaries = await OrderService.getAllOrders();
      const mappedOrders = orderSummaries.map(mapOrderSummaryToOrder);
      setOrders(mappedOrders);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load orders",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Get unique categories and agents from orders
  const categories = Array.from(new Set(orders.map(o => o.scrapCategory)));
  const agents = Array.from(new Set(orders.map(o => o.agentId).filter(Boolean))) as string[];

  // Define filter groups for advanced filtering
  const filterGroups: FilterGroup[] = [
    {
      key: 'scrapCategory',
      label: 'Category',
      type: 'checkbox',
      options: categories.map(cat => ({ label: cat, value: cat })),
    },
    {
      key: 'agentId',
      label: 'Agent',
      type: 'checkbox',
      options: agents.map(agent => ({ label: agent, value: agent })),
    },
  ];

  // Use search and filter hook
  const {
    filteredData: searchFilteredOrders,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    resetFilters,
    sortConfig,
    toggleSort,
    totalCount,
    filteredCount,
  } = useSearchAndFilter<Order>({
    data: orders,
    searchFields: ['id', 'sellerId', 'pickupAddress'],
    initialFilters: {},
  });

  // Apply status filter (tab) on top of search/filter results
  const filteredOrders = searchFilteredOrders.filter(order => {
    if (activeTab !== 'all' && order.status !== activeTab) {
      return false;
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    scheduled: orders.filter(o => o.status === 'scheduled').length,
    transit: orders.filter(o => o.status === 'transit').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    weight: orders.reduce((sum, o) => sum + (o.finalWeight || 0), 0)
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">Scrap Orders</h2>
          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">Manage all scrap pickup orders and assignments</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards - Horizontal scroll on mobile */}
      <div className="sm:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Card className="min-w-[120px] flex-shrink-0 border-green-200 bg-gradient-to-br from-green-50 to-white cursor-pointer" onClick={() => setActiveTab('all')}>
            <CardContent className="p-3">
              <p className="text-[10px] text-green-700 font-medium">Total Orders</p>
              <p className="text-xl font-bold text-green-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="min-w-[120px] flex-shrink-0 border-orange-200 bg-gradient-to-br from-orange-50 to-white cursor-pointer" onClick={() => setActiveTab('pending')}>
            <CardContent className="p-3">
              <p className="text-[10px] text-orange-700 font-medium">Pending</p>
              <p className="text-xl font-bold text-orange-900">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="min-w-[120px] flex-shrink-0 border-blue-200 bg-gradient-to-br from-blue-50 to-white cursor-pointer" onClick={() => setActiveTab('scheduled')}>
            <CardContent className="p-3">
              <p className="text-[10px] text-blue-700 font-medium">Scheduled</p>
              <p className="text-xl font-bold text-blue-900">{stats.scheduled}</p>
            </CardContent>
          </Card>
          <Card className="min-w-[120px] flex-shrink-0 border-purple-200 bg-gradient-to-br from-purple-50 to-white cursor-pointer" onClick={() => setActiveTab('transit')}>
            <CardContent className="p-3">
              <p className="text-[10px] text-purple-700 font-medium">In Transit</p>
              <p className="text-xl font-bold text-purple-900">{stats.transit}</p>
            </CardContent>
          </Card>
          <Card className="min-w-[120px] flex-shrink-0 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white cursor-pointer" onClick={() => setActiveTab('completed')}>
            <CardContent className="p-3">
              <p className="text-[10px] text-emerald-700 font-medium">Completed</p>
              <p className="text-xl font-bold text-emerald-900">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Cards - Grid on tablet/desktop */}
      <div className="hidden sm:grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('all')}>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">All time</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('pending')}>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">Pending</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Needs assignment</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('scheduled')}>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Scheduled</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Agent assigned</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('transit')}>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">In Transit</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.transit}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">On the way</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('completed')}>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300">Completed</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Successfully done</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderStatus | 'all')}>
        <div className="flex flex-col gap-3">
          {/* Tabs - horizontally scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max sm:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">All</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 sm:px-3">Pending</TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs sm:text-sm px-2 sm:px-3">Scheduled</TabsTrigger>
              <TabsTrigger value="transit" className="text-xs sm:text-sm px-2 sm:px-3">Transit</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm px-2 sm:px-3">Done</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs sm:text-sm px-2 sm:px-3">Cancelled</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Search and filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-secondary pl-8 sm:max-w-[280px] lg:max-w-[320px]"
              />
            </div>
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <AdvancedFilters
                filterGroups={filterGroups}
                filters={filters}
                onFilterChange={setFilter}
                onResetFilters={resetFilters}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="h-9 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-9 gap-1 hidden sm:flex">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export
                </span>
              </Button>
            </div>
          </div>
        </div>
      <TabsContent value="all">
        {/* Mobile View */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
            <p className="text-sm font-medium">All Orders</p>
            <p className="text-xs text-muted-foreground">{filteredOrders.length} orders</p>
          </div>
          <MobileOrdersList orders={filteredOrders} loading={loading} />
        </div>
        {/* Desktop View */}
        <Card className="hidden sm:block">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">All Orders</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Showing {filteredOrders.length} of {totalCount} orders
                </CardDescription>
            </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <OrdersTableClient 
              orders={filteredOrders} 
              loading={loading} 
              onRefresh={fetchOrders}
              sortConfig={sortConfig}
              onSort={toggleSort}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="pending">
        {/* Mobile View */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
            <p className="text-sm font-medium">Pending Orders</p>
            <p className="text-xs text-muted-foreground">{filteredOrders.length} orders</p>
          </div>
          <MobileOrdersList orders={filteredOrders} loading={loading} />
        </div>
        {/* Desktop View */}
        <Card className="hidden sm:block">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Pending Orders</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    {filteredOrders.length} orders awaiting assignment
                </CardDescription>
            </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <OrdersTableClient 
              orders={filteredOrders} 
              loading={loading} 
              onRefresh={fetchOrders}
              sortConfig={sortConfig}
              onSort={toggleSort}
            />
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="scheduled">
        {/* Mobile View */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
            <p className="text-sm font-medium">Scheduled Orders</p>
            <p className="text-xs text-muted-foreground">{filteredOrders.length} orders</p>
          </div>
          <MobileOrdersList orders={filteredOrders} loading={loading} />
        </div>
        {/* Desktop View */}
        <Card className="hidden sm:block">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Scheduled Orders</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    {filteredOrders.length} orders with agent assigned
                </CardDescription>
            </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <OrdersTableClient 
              orders={filteredOrders} 
              loading={loading} 
              onRefresh={fetchOrders}
              sortConfig={sortConfig}
              onSort={toggleSort}
            />
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="transit">
        {/* Mobile View */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
            <p className="text-sm font-medium">In Transit Orders</p>
            <p className="text-xs text-muted-foreground">{filteredOrders.length} orders</p>
          </div>
          <MobileOrdersList orders={filteredOrders} loading={loading} />
        </div>
        {/* Desktop View */}
        <Card className="hidden sm:block">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">In Transit Orders</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    {filteredOrders.length} orders being picked up
                </CardDescription>
            </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <OrdersTableClient 
              orders={filteredOrders} 
              loading={loading} 
              onRefresh={fetchOrders}
              sortConfig={sortConfig}
              onSort={toggleSort}
            />
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="completed">
        {/* Mobile View */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
            <p className="text-sm font-medium">Completed Orders</p>
            <p className="text-xs text-muted-foreground">{filteredOrders.length} orders</p>
          </div>
          <MobileOrdersList orders={filteredOrders} loading={loading} />
        </div>
        {/* Desktop View */}
        <Card className="hidden sm:block">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Completed Orders</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    {filteredOrders.length} orders completed
                </CardDescription>
            </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <OrdersTableClient 
              orders={filteredOrders} 
              loading={loading} 
              onRefresh={fetchOrders}
              sortConfig={sortConfig}
              onSort={toggleSort}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="cancelled">
        {/* Mobile View */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
            <p className="text-sm font-medium">Cancelled Orders</p>
            <p className="text-xs text-muted-foreground">{filteredOrders.length} orders</p>
          </div>
          <MobileOrdersList orders={filteredOrders} loading={loading} />
        </div>
        {/* Desktop View */}
        <Card className="hidden sm:block">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Cancelled Orders</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    {filteredOrders.length} cancelled orders
                </CardDescription>
            </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <OrdersTableClient 
              orders={filteredOrders} 
              loading={loading} 
              onRefresh={fetchOrders}
              sortConfig={sortConfig}
              onSort={toggleSort}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
  )
}
