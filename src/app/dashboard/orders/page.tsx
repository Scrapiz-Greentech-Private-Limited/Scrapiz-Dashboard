
'use client';
import {
  File,
  ListFilter,
  Search,
  RefreshCw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
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

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-background hover:shadow-md transition-shadow cursor-pointer col-span-2 sm:col-span-1" onClick={() => setActiveTab('completed')}>
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
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
