'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wrench, Calendar, MapPin, User, Phone, Mail, Building, FileText, DollarSign, Search, Filter, Clock, CheckCircle2, XCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceBookingService, ServiceBooking } from "@/components/backend/apiService";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  'pending': 'secondary',
  'confirmed': 'default',
  'completed': 'default',
  'cancelled': 'destructive'
} as const;

const statusIcons = {
  'pending': Clock,
  'confirmed': CheckCircle2,
  'completed': CheckCircle2,
  'cancelled': XCircle
} as const;

const statusLabels = {
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
} as const;

export default function ServiceOrdersPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ServiceBooking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Load bookings on mount
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await ServiceBookingService.getBookings();
      setBookings(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load service bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: ServiceBooking) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async (bookingId: number, newStatus: string) => {
    try {
      setUpdatingStatus(bookingId);
      await ServiceBookingService.updateBookingStatus(bookingId, newStatus);
      
      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
      
      // Update selected order if it's open
      if (selectedOrder?.id === bookingId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      toast({
        title: "Success",
        description: `Booking status updated to ${statusLabels[newStatus as keyof typeof statusLabels]}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleConfirmOrder = (bookingId: number) => {
    handleUpdateStatus(bookingId, 'confirmed');
  };

  const handleMarkComplete = (bookingId: number) => {
    if (confirm('Mark this booking as completed?')) {
      handleUpdateStatus(bookingId, 'completed');
    }
  };

  const handleCancelOrder = (bookingId: number) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      handleUpdateStatus(bookingId, 'cancelled');
    }
  };

  // Get unique services
  const uniqueServices = useMemo(() => {
    return Array.from(new Set(bookings.map(o => o.service)));
  }, [bookings]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return bookings.filter(order => {
      const matchesSearch = 
        order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toString().includes(searchQuery) ||
        order.phone.includes(searchQuery) ||
        order.service.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesService = serviceFilter === 'all' || order.service === serviceFilter;
      const matchesTab = activeTab === 'all' || order.status === activeTab;
      
      return matchesSearch && matchesStatus && matchesService && matchesTab;
    });
  }, [bookings, searchQuery, statusFilter, serviceFilter, activeTab]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      pending: bookings.filter(o => o.status === 'pending').length,
      confirmed: bookings.filter(o => o.status === 'confirmed').length,
      completed: bookings.filter(o => o.status === 'completed').length,
      cancelled: bookings.filter(o => o.status === 'cancelled').length,
    };
  }, [bookings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-green-900 dark:text-green-100">Service Bookings</h2>
          <p className="text-muted-foreground mt-1">Manage professional service bookings and appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {filteredOrders.length} of {bookings.length} Bookings
          </Badge>
          <Button onClick={loadBookings} variant="outline" size="sm">
            <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('pending')}>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-1.5 sm:gap-2">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">
              {stats.pending}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Awaiting confirmation</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('confirmed')}>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">
              {stats.confirmed}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Ready to start</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('completed')}>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-100">
              {stats.completed}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Successfully done</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('cancelled')}>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-1.5 sm:gap-2">
              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-red-900 dark:text-red-100">
              {stats.cancelled}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Cancelled bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-green-100">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full sm:w-[180px] text-sm">
                  <Filter className="h-4 w-4 mr-2 hidden sm:inline" />
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {uniqueServices.map(service => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || statusFilter !== 'all' || serviceFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setServiceFilter('all');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:grid sm:w-full sm:grid-cols-5 min-w-full">
            <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-4">
              <span className="hidden sm:inline">All ({bookings.length})</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 sm:px-4">
              <span className="hidden sm:inline">Pending ({stats.pending})</span>
              <span className="sm:hidden">{stats.pending}</span>
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs sm:text-sm px-2 sm:px-4">
              <span className="hidden sm:inline">Confirmed ({stats.confirmed})</span>
              <span className="sm:hidden">{stats.confirmed}</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm px-2 sm:px-4">
              <span className="hidden sm:inline">Completed ({stats.completed})</span>
              <span className="sm:hidden">{stats.completed}</span>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs sm:text-sm px-2 sm:px-4">
              <span className="hidden sm:inline">Cancelled ({stats.cancelled})</span>
              <span className="sm:hidden">{stats.cancelled}</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Service Bookings List */}
      {filteredOrders.length === 0 ? (
        <Card className="border-green-100">
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No service bookings found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || serviceFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Service bookings will appear here once customers book services'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map(order => {
            const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
            const formattedDate = new Date(order.preferred_datetime).toLocaleDateString();
            const formattedTime = new Date(order.preferred_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <Card key={order.id} className="hover:shadow-xl transition-all duration-300 border-2 border-green-100 hover:border-green-400 bg-gradient-to-br from-white to-green-50/30 dark:from-background dark:to-green-950/10">
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                          <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg font-bold text-green-900 dark:text-green-100 truncate">
                            {order.service}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 text-xs sm:text-sm">
                            <span className="font-medium">#{order.id}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className="hidden sm:inline">{formattedDate} • {formattedTime}</span>
                              <span className="sm:hidden">{formattedDate}</span>
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={statusColors[order.status as keyof typeof statusColors]}
                      className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 self-start"
                    >
                      <StatusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-6">
                  <div className="grid gap-3 sm:gap-6 mb-4 sm:mb-5">
                    {/* Customer Info */}
                    <div className="space-y-2 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                      <h4 className="text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide flex items-center gap-1 sm:gap-1.5">
                        <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Customer
                      </h4>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm truncate block">{order.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            {order.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location Info */}
                    <div className="space-y-2 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900">
                      <h4 className="text-[10px] sm:text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide flex items-center gap-1 sm:gap-1.5">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Location
                      </h4>
                      <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 text-purple-600" />
                        <span className="line-clamp-2 leading-relaxed">{order.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Google Meet Link */}
                  {order.meeting_link && (
                    <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">Google Meet:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(order.meeting_link!, '_blank')}
                          className="hover:bg-blue-100 text-xs sm:text-sm h-8"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Join Meeting
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900">
                      <h4 className="text-[10px] sm:text-xs font-bold text-yellow-700 dark:text-yellow-300 uppercase tracking-wide mb-1.5 sm:mb-2">Notes</h4>
                      <p className="text-xs sm:text-sm text-yellow-900 dark:text-yellow-100 line-clamp-2">{order.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 sm:pt-4 border-t-2 border-green-100">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewDetails(order)}
                      className="hover:bg-green-50 hover:text-green-700 hover:border-green-400 transition-all text-xs sm:text-sm h-8 sm:h-9"
                    >
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">Details</span>
                    </Button>
                    {order.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 shadow-sm hover:shadow-md transition-all text-xs sm:text-sm h-8 sm:h-9" 
                          onClick={() => handleConfirmOrder(order.id)}
                          disabled={updatingStatus === order.id}
                        >
                          {updatingStatus === order.id ? (
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                          )}
                          Confirm
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={updatingStatus === order.id}
                          className="text-xs sm:text-sm h-8 sm:h-9"
                        >
                          <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all text-xs sm:text-sm h-8 sm:h-9" 
                        onClick={() => handleMarkComplete(order.id)}
                        disabled={updatingStatus === order.id}
                      >
                        {updatingStatus === order.id ? (
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                        )}
                        <span className="hidden sm:inline">Mark Complete</span>
                        <span className="sm:hidden">Complete</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Service Booking Details Dialog */}
      {selectedOrder && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    <span className="truncate">{selectedOrder.service}</span>
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs sm:text-sm">Booking #{selectedOrder.id}</DialogDescription>
                </div>
                <Badge 
                  variant={statusColors[selectedOrder.status as keyof typeof statusColors]}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 self-start sm:self-auto"
                >
                  {statusLabels[selectedOrder.status as keyof typeof statusLabels]}
                </Badge>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Customer & Service Info */}
              <div className="grid gap-4 sm:gap-6">
                <Card className="border-green-100">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm truncate">{selectedOrder.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Customer</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{selectedOrder.phone}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-100">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Service Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Preferred Date</span>
                      <span className="font-medium">{new Date(selectedOrder.preferred_datetime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Preferred Time</span>
                      <span className="font-medium">{new Date(selectedOrder.preferred_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Address */}
              <Card className="border-green-100">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Service Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <p className="text-xs sm:text-sm">{selectedOrder.address}</p>
                </CardContent>
              </Card>

              {/* Google Meet Link */}
              {selectedOrder.meeting_link && (
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Meeting Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">Google Meet</p>
                      <Button
                        size="sm"
                        onClick={() => window.open(selectedOrder.meeting_link!, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-8"
                      >
                        <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Join Meeting
                      </Button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 break-all">{selectedOrder.meeting_link}</p>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-semibold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Additional Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <p className="text-xs sm:text-sm text-yellow-900 dark:text-yellow-100">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t">
                {selectedOrder.status === 'pending' && (
                  <>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-9 sm:h-10" 
                      onClick={() => {
                        handleConfirmOrder(selectedOrder.id);
                        setIsDetailsOpen(false);
                      }}
                      disabled={updatingStatus === selectedOrder.id}
                    >
                      {updatingStatus === selectedOrder.id ? (
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      )}
                      Confirm Booking
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-xs sm:text-sm h-9 sm:h-10" 
                      onClick={() => {
                        handleCancelOrder(selectedOrder.id);
                        setIsDetailsOpen(false);
                      }}
                      disabled={updatingStatus === selectedOrder.id}
                    >
                      <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Cancel Booking
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm h-9 sm:h-10" 
                    onClick={() => {
                      handleMarkComplete(selectedOrder.id);
                      setIsDetailsOpen(false);
                    }}
                    disabled={updatingStatus === selectedOrder.id}
                  >
                    {updatingStatus === selectedOrder.id ? (
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    )}
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
