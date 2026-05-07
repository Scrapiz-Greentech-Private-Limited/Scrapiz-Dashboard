'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle2,
  Zap,
  Download,
  Edit3,
  MessageSquare,
  RefreshCw,
  Activity,
  Truck,
  Factory,
  TimerReset,
  Route,
  CalendarClock,
} from 'lucide-react';
import { ServiceOrder, Organization, OrderStatus, ServiceWorkflowEvent } from '@/types/services';
import ServiceManagementAPI from '@/services/services';
import { useAuth } from '@/contexts/AuthContext';

interface OrderWorkflowProps {
  organizations: Organization[];
}

const ORDER_STATUS_FLOW: { status: OrderStatus; label: string; icon: any; color: string }[] = [
  { status: 'pending_collection', label: 'Pending Collection', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { status: 'collection_scheduled', label: 'Accepted', icon: CheckCircle2, color: 'bg-blue-100 text-blue-800' },
  { status: 'in_progress', label: 'In Progress', icon: Zap, color: 'bg-orange-100 text-orange-800' },
  { status: 'material_processing', label: 'Processing', icon: Zap, color: 'bg-purple-100 text-purple-800' },
  { status: 'completed', label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
];

export default function OrderWorkflow({ organizations }: OrderWorkflowProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<ServiceWorkflowEvent[]>([]);
  const [liveConnection, setLiveConnection] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      await Promise.all([loadOrders(), loadTimeline()]);
      unsubscribe = ServiceManagementAPI.subscribeToServiceWorkflowEvents(
        (event) => {
          setLiveConnection('live');
          setTimelineEvents((currentEvents) => [event, ...currentEvents.filter((item) => item.id !== event.id)].slice(0, 20));
          setOrders((currentOrders) =>
            currentOrders.map((order) =>
              order.id === event.service_order_id ? { ...order, order_status: event.status, updated_at: event.timestamp } : order,
            ),
          );
        },
        getTimelineFilters(),
      );
      setLiveConnection('live');
    };

    initialize();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedOrganization, selectedStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ServiceManagementAPI.getServiceOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    try {
      const data = await ServiceManagementAPI.getServiceWorkflowTimeline(getTimelineFilters());
      setTimelineEvents(data);
    } catch (error) {
      console.error('Error loading workflow timeline:', error);
    }
  };

  const getTimelineFilters = () => {
    const filters: { organization_id?: number; organization_type?: string; status?: string; role?: string; limit?: number } = { limit: 20 };

    if (selectedOrganization !== 'all') {
      const selectedOrg = organizations.find((org) => org.id === parseInt(selectedOrganization, 10));
      filters.organization_id = selectedOrg?.id;
      filters.organization_type = selectedOrg?.organization_type;
    }

    if (selectedStatus !== 'all') {
      filters.status = selectedStatus;
    }

    filters.role = user?.role || 'admin';
    return filters;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesOrganization = selectedOrganization === 'all' || order.organization_id === parseInt(selectedOrganization, 10);
    const matchesStatus = selectedStatus === 'all' || order.order_status === selectedStatus;
    return matchesOrganization && matchesStatus;
  });

  const visibleEvents = timelineEvents.filter((event) => {
    const matchesOrganization = selectedOrganization === 'all' || event.organization_id === parseInt(selectedOrganization, 10);
    const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus;
    return matchesOrganization && matchesStatus;
  });

  const getStatusColor = (status: string) => ORDER_STATUS_FLOW.find((s) => s.status === status)?.color || 'bg-gray-100 text-gray-800';

  const getProgressForStatus = (status: OrderStatus) => {
    switch (status) {
      case 'pending_collection': return 0;
      case 'collection_scheduled': return 25;
      case 'in_progress': return 50;
      case 'material_processing': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const getOrderForEvent = (event: ServiceWorkflowEvent) =>
    orders.find((order) => order.id === event.service_order_id || order.order_id === event.order_id) || null;

  const openOrderAction = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      await ServiceManagementAPI.updateServiceOrderStatus(selectedOrder.order_id, newStatus, updateNotes);
      setOrders(orders.map((order) => (order.id === selectedOrder.id ? { ...order, order_status: newStatus as OrderStatus } : order)));
      setShowUpdateDialog(false);
      setNewStatus('');
      setUpdateNotes('');
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleUpdateQuantity = async () => {
    if (!selectedOrder || !newQuantity) return;
    try {
      await ServiceManagementAPI.updateServiceOrderQuantity(selectedOrder.order_id, parseFloat(newQuantity));
      setOrders(orders.map((order) => (order.id === selectedOrder.id ? { ...order, final_quantity: parseFloat(newQuantity) } : order)));
      setNewQuantity('');
    } catch (error) {
      console.error('Error updating order quantity:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-white">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-700" />
                Recycling Workflow Timeline
              </CardTitle>
              <CardDescription>
                Live progress reports for pending requests, accepted pickups, processing, and completion.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              {liveConnection === 'live' ? 'Live stream connected' : 'Loading live stream'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {ORDER_STATUS_FLOW.map((item) => {
              const count = filteredOrders.filter((order) => order.order_status === item.status).length;
              const Icon = item.icon;
              return (
                <div key={item.status} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-semibold">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress Filters</CardTitle>
          <CardDescription>Filter the live workflow timeline by organization or status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Organization</label>
              <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ORDER_STATUS_FLOW.map((item) => (
                    <SelectItem key={item.status} value={item.status}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Live Workflow Timeline</CardTitle>
            <CardDescription>A chronological feed of current collection requests and recycling progress reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {visibleEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No timeline events available for the current filters.</div>
            ) : (
              visibleEvents.map((event, index) => {
                const linkedOrder = getOrderForEvent(event);
                return (
                  <div key={event.id} className="relative pl-8">
                    <span className={`absolute left-3 top-3 h-3 w-3 rounded-full ${getStatusColor(event.status)}`} />
                    {index < visibleEvents.length - 1 && <span className="absolute left-[13px] top-6 h-full w-px bg-border" />}
                    <Card className="border-l-4 border-l-green-500/80 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-base">{event.title}</p>
                              <Badge className={getStatusColor(event.status)}>{event.status.replace(/_/g, ' ')}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1"><Factory className="h-3.5 w-3.5" />{event.organization_name}</span>
                              <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{event.service_type_name.replace(/_/g, ' ')}</span>
                              <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{new Date(event.timestamp).toLocaleString()}</span>
                              <span className="inline-flex items-center gap-1"><Route className="h-3.5 w-3.5" />{event.actor}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                            <TimerReset className="h-4 w-4 text-green-700" />{event.progress_percentage}% progress
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Workflow progress</span>
                            <span>{event.notes || 'Awaiting next backend update'}</span>
                          </div>
                          <Progress value={event.progress_percentage} className="h-2" />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Dialog open={showUpdateDialog && selectedOrder?.id === linkedOrder?.id} onOpenChange={setShowUpdateDialog}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => linkedOrder && openOrderAction(linkedOrder)}>
                                <Edit3 className="h-4 w-4 mr-1" /> Change Status
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Update Order Status</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">New Status</label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {ORDER_STATUS_FLOW.map((item) => <SelectItem key={item.status} value={item.status}>{item.label}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Notes (Optional)</label>
                                  <Input placeholder="Add notes about this status change..." value={updateNotes} onChange={(e) => setUpdateNotes(e.target.value)} />
                                </div>
                                <Button onClick={handleUpdateStatus} className="w-full">Update Status</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => linkedOrder && setSelectedOrder(linkedOrder)}>
                                <Edit3 className="h-4 w-4 mr-1" /> Update Quantity
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Update Quantity</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">New Quantity ({selectedOrder?.quantity_unit || 'kg'})</label>
                                  <Input type="number" placeholder={selectedOrder?.estimated_quantity?.toString()} value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} />
                                </div>
                                <Button onClick={handleUpdateQuantity} className="w-full">Save Quantity</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="outline"><MessageSquare className="h-4 w-4 mr-1" /> Notes</Button>
                          <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" /> Export</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress Reports</CardTitle>
              <CardDescription>Backend-ready summary for society tieup and corporate tieup operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredOrders.slice(0, 4).map((order) => {
                const status = ORDER_STATUS_FLOW.find((item) => item.status === order.order_status);
                return (
                  <div key={order.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{order.order_id}</p>
                        <p className="text-xs text-muted-foreground">{organizations.find((org) => org.id === order.organization_id)?.name}</p>
                      </div>
                      <Badge className={status?.color || 'bg-gray-100 text-gray-800'}>{status?.label || order.order_status}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Collection progress</span>
                        <span>{getProgressForStatus(order.order_status)}%</span>
                      </div>
                      <Progress value={getProgressForStatus(order.order_status)} className="h-2" />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{order.final_quantity || order.estimated_quantity || '-'} {order.quantity_unit} processed</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Notes</CardTitle>
              <CardDescription>Use this for server-sent event driven updates from the backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Pending requests are queued from society and corporate dashboards.</p>
              <p>• Accepted pickups move into the live timeline as the collection team confirms status.</p>
              <p>• Processing and completion events can be streamed from the backend with SSE.</p>
              <p>• The same structure can be reused for customer, agency, and organization-specific views.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
                                <Truck className="h-3.5 w-3.5" />
                                {event.service_type_name.replace(/_/g, ' ')}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CalendarClock className="h-3.5 w-3.5" />
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Route className="h-3.5 w-3.5" />
                                {event.actor}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                            <TimerReset className="h-4 w-4 text-green-700" />
                            {event.progress_percentage}% progress
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Workflow progress</span>
                            <span>{event.notes || 'Awaiting next backend update'}</span>
                          </div>
                          <Progress value={event.progress_percentage} className="h-2" />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Dialog open={showUpdateDialog && selectedOrder?.id === linkedOrder?.id} onOpenChange={setShowUpdateDialog}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (linkedOrder) {
                                    openOrderAction(linkedOrder);
                                  }
                                }}
                              >
                                <Edit3 className="h-4 w-4 mr-1" /> Change Status
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Order Status</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">New Status</label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ORDER_STATUS_FLOW.map((item) => (
                                        <SelectItem key={item.status} value={item.status}>
                                          {item.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Notes (Optional)</label>
                                  <Input
                                    placeholder="Add notes about this status change..."
                                    value={updateNotes}
                                    onChange={(e) => setUpdateNotes(e.target.value)}
                                  />
                                </div>

                                <Button onClick={handleUpdateStatus} className="w-full">
                                  Update Status
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => linkedOrder && setSelectedOrder(linkedOrder)}
                              >
                                <Edit3 className="h-4 w-4 mr-1" /> Update Quantity
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Quantity</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">
                                    New Quantity ({selectedOrder?.quantity_unit || 'kg'})
                                  </label>
                                  <Input
                                    type="number"
                                    placeholder={selectedOrder?.estimated_quantity?.toString()}
                                    value={newQuantity}
                                    onChange={(e) => setNewQuantity(e.target.value)}
                                  />
                                </div>

                                <Button onClick={handleUpdateQuantity} className="w-full">
                                  Save Quantity
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-1" /> Notes
                          </Button>

                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" /> Export
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress Reports</CardTitle>
              <CardDescription>Backend-ready summary for society tieup and corporate tieup operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredOrders.slice(0, 4).map((order) => {
                const status = ORDER_STATUS_FLOW.find((item) => item.status === order.order_status);

                return (
                  <div key={order.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{order.order_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {organizations.find((org) => org.id === order.organization_id)?.name}
                        </p>
                      </div>
                      <Badge className={status?.color || 'bg-gray-100 text-gray-800'}>{status?.label || order.order_status}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Collection progress</span>
                        <span>{getProgressForStatus(order.order_status)}%</span>
                      </div>
                      <Progress value={getProgressForStatus(order.order_status)} className="h-2" />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {order.final_quantity || order.estimated_quantity || '-'} {order.quantity_unit} processed
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Notes</CardTitle>
              <CardDescription>Use this for server-sent event driven updates from the backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Pending requests are queued from society and corporate dashboards.</p>
              <p>• Accepted pickups move into the live timeline as the collection team confirms status.</p>
              <p>• Processing and completion events can be streamed from the backend with SSE.</p>
              <p>• The same structure can be reused for customer, agency, and organization-specific views.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
