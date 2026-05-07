'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, MapPin, Phone, Mail, Users, TrendingUp, Leaf, Award, Calendar } from 'lucide-react';
import { Organization, OrganizationDashboard, ServiceOrder } from '@/types/services';
import ServiceManagementAPI from '@/services/services';

interface OrganizationDetailProps {
  organization: Organization;
  onClose: () => void;
}

export default function OrganizationDetail({ organization, onClose }: OrganizationDetailProps) {
  const [dashboard, setDashboard] = useState<OrganizationDashboard | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [organization.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardData, ordersData] = await Promise.all([
        ServiceManagementAPI.getOrganizationDashboard(organization.id),
        ServiceManagementAPI.getServiceOrders({ organization_id: organization.id }),
      ]);

      setDashboard(dashboardData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-2xl">{organization.name}</DialogTitle>
            <DialogDescription className="mt-2">
              {organization.organization_type.charAt(0).toUpperCase() + organization.organization_type.slice(1)} • {organization.city}, {organization.state}
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Organization Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-semibold">{organization.contact_person_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone
                  </p>
                  <p className="font-semibold">{organization.contact_person_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </p>
                  <p className="font-semibold">{organization.contact_person_email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Address
                  </p>
                  <p className="font-semibold text-sm">{organization.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className="mt-1" variant={organization.is_verified ? 'default' : 'secondary'}>
                    {organization.status}
                  </Badge>
                </div>
                {organization.gstin && (
                  <div>
                    <p className="text-sm text-gray-600">GSTIN</p>
                    <p className="font-semibold">{organization.gstin}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Metrics */}
          {dashboard && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="metrics" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="environmental">Environmental</TabsTrigger>
                    <TabsTrigger value="certificates">Certificates</TabsTrigger>
                    <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                  </TabsList>

                  <TabsContent value="metrics" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-blue-600" />
                          <p className="text-sm font-medium">Total Orders</p>
                        </div>
                        <p className="text-2xl font-bold">{dashboard.total_orders}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {dashboard.completed_orders} completed
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium">Quantity Processed</p>
                        </div>
                        <p className="text-2xl font-bold">{dashboard.total_quantity_processed.toFixed(0)}</p>
                        <p className="text-xs text-gray-600 mt-1">kg</p>
                      </div>

                      <div className="p-4 bg-amber-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-medium">Value Processed</p>
                        </div>
                        <p className="text-2xl font-bold">₹{(dashboard.total_value_processed / 1000).toFixed(0)}K</p>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <p className="text-sm font-medium">Members</p>
                        </div>
                        <p className="text-2xl font-bold">{organization.total_members}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="p-3 bg-gray-50 rounded border text-sm">
                        <p className="text-gray-600">Pending Orders</p>
                        <p className="text-2xl font-bold text-orange-600">{dashboard.pending_orders}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border text-sm">
                        <p className="text-gray-600">In Progress</p>
                        <p className="text-2xl font-bold text-blue-600">{dashboard.in_progress_orders}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border text-sm">
                        <p className="text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {dashboard.total_orders > 0 ? ((dashboard.completed_orders / dashboard.total_orders) * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="environmental" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Leaf className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium">Trees Saved</p>
                        </div>
                        <p className="text-3xl font-bold text-green-700">{dashboard.total_trees_saved.toFixed(0)}</p>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">💨</span>
                          <p className="text-sm font-medium">CO₂ Reduced</p>
                        </div>
                        <p className="text-3xl font-bold text-blue-700">{dashboard.total_co2_reduced.toFixed(0)}</p>
                        <p className="text-xs text-gray-600">kg</p>
                      </div>

                      <div className="p-4 bg-sky-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">💧</span>
                          <p className="text-sm font-medium">Water Saved</p>
                        </div>
                        <p className="text-3xl font-bold text-sky-700">{(dashboard.total_quantity_processed * 1.5).toFixed(0)}</p>
                        <p className="text-xs text-gray-600">liters</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <p className="font-semibold text-green-900 mb-2">Environmental Achievement</p>
                      <p className="text-sm text-gray-700">
                        This organization's recycling efforts have saved {dashboard.total_trees_saved.toFixed(0)} trees, 
                        reduced {dashboard.total_co2_reduced.toFixed(0)} kg of CO₂, and diverted {dashboard.total_quantity_processed.toFixed(0)} kg of waste from landfills.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="certificates" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-purple-50 rounded-lg border">
                        <p className="text-sm text-gray-600">Generated</p>
                        <p className="text-2xl font-bold">{dashboard.total_certificates_generated}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border">
                        <p className="text-sm text-gray-600">Approved</p>
                        <p className="text-2xl font-bold">{dashboard.total_certificates_approved}</p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full">Generate New Certificate</Button>
                  </TabsContent>

                  <TabsContent value="audit" className="space-y-4 mt-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="font-semibold mb-2">Recent Changes</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">Status updated to: <span className="font-semibold">{organization.status}</span></p>
                        <p className="text-gray-600">Last verified: {new Date(organization.verified_at || '').toLocaleDateString()}</p>
                        <p className="text-gray-600">Member count: {organization.total_members}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          {orders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="p-3 bg-gray-50 rounded border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{order.order_id}</p>
                          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={order.order_status === 'completed' ? 'default' : 'secondary'}>
                          {order.order_status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full mt-4" variant="outline">View All Orders</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
