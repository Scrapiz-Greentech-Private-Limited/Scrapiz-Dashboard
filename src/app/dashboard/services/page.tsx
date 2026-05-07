'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Building2,
  Factory,
  Trash2,
  Hammer,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  Leaf,
} from 'lucide-react';
import ServiceManagementAPI from '@/services/services';
import { ServicePageStats, ServiceType, Organization } from '@/types/services';
import ServiceCard from '@/components/dashboard/services/ServiceCard';
import AuditDashboard from '@/components/dashboard/services/AuditDashboard';
import OrderWorkflow from '@/components/dashboard/services/OrderWorkflow';
import CertificateGenerator from '@/components/dashboard/services/CertificateGenerator';
import OrganizationDetail from '@/components/dashboard/services/OrganizationDetail';

export default function ServicesPage() {
  const [stats, setStats] = useState<ServicePageStats | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeService, setActiveService] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, serviceTypesData, organizationsData] = await Promise.all([
        ServiceManagementAPI.getServicePageStats(),
        ServiceManagementAPI.getServiceTypes(),
        ServiceManagementAPI.getOrganizations(),
      ]);

      setStats(statsData);
      setServiceTypes(serviceTypesData);
      setOrganizations(organizationsData);
    } catch (error) {
      console.error('Error loading services data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const societyTieup = serviceTypes.find((s) => s.service_name === 'society_tieup');
  const corporateTieup = serviceTypes.find((s) => s.service_name === 'corporate_tieup');
  const debrisRemoval = serviceTypes.find((s) => s.service_name === 'debris_removal');
  const demolitionRemoval = serviceTypes.find((s) => s.service_name === 'demolition_removal');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Services Management</h1>
        <p className="text-gray-600">
          Manage society tieups, corporate partnerships, and waste removal services
        </p>
      </div>

      {/* Key Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
              <p className="text-xs text-gray-500">
                {stats.activeOrganizations} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-gray-500">
                {stats.completedOrders} completed • {stats.pendingOrders} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value Processed</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.totalValueProcessed / 100000).toFixed(1)}L</div>
              <p className="text-xs text-gray-500">
                {stats.totalQuantityProcessed.toFixed(0)} kg processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Environmental Impact</CardTitle>
              <Leaf className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEnvironmentalImpact.trees_saved?.toFixed(0)}</div>
              <p className="text-xs text-gray-500">
                trees saved • {stats.totalEnvironmentalImpact.co2_reduced?.toFixed(0)} kg CO₂ reduced
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="orders">Orders & Workflows</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {societyTieup && <ServiceCard service={societyTieup} organizations={organizations.filter(o => o.organization_type === 'society')} />}
            {corporateTieup && <ServiceCard service={corporateTieup} organizations={organizations.filter(o => o.organization_type === 'corporate')} />}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {debrisRemoval && <ServiceCard service={debrisRemoval} organizations={organizations} />}
            {demolitionRemoval && <ServiceCard service={demolitionRemoval} organizations={organizations} />}
          </div>
        </TabsContent>

        {/* ORGANIZATIONS TAB */}
        <TabsContent value="organizations" className="space-y-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Organizations</TabsTrigger>
              <TabsTrigger value="society">Societies</TabsTrigger>
              <TabsTrigger value="corporate">Corporate</TabsTrigger>
              <TabsTrigger value="pending">Pending Verification</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {organizations.map((org) => (
                  <Card
                    key={org.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedOrganization(org)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          {org.organization_type === 'society' ? (
                            <Building2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <Factory className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                          <CardDescription>{org.city}, {org.state}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={org.is_verified ? 'default' : 'secondary'}>
                        {org.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Contact Person</p>
                          <p className="font-semibold">{org.contact_person_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Phone</p>
                          <p className="font-semibold">{org.contact_person_phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Members</p>
                          <p className="font-semibold">{org.total_members}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Registered</p>
                          <p className="font-semibold">{new Date(org.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="society" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {organizations.filter(o => o.organization_type === 'society').map((org) => (
                  <Card key={org.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedOrganization(org)}>
                    <CardHeader>
                      <CardTitle>{org.name}</CardTitle>
                      <CardDescription>{org.city}, {org.state} • {org.total_members} Members</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="corporate" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {organizations.filter(o => o.organization_type === 'corporate').map((org) => (
                  <Card key={org.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedOrganization(org)}>
                    <CardHeader>
                      <CardTitle>{org.name}</CardTitle>
                      <CardDescription>{org.city}, {org.state} • GSTIN: {org.gstin}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {organizations.filter(o => !o.is_verified).map((org) => (
                  <Card key={org.id} className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <CardTitle>{org.name}</CardTitle>
                      <CardDescription>Awaiting verification</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm">Review & Verify</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {selectedOrganization && (
            <OrganizationDetail organization={selectedOrganization} onClose={() => setSelectedOrganization(null)} />
          )}
        </TabsContent>

        {/* ORDERS & WORKFLOWS TAB */}
        <TabsContent value="orders" className="space-y-6">
          <OrderWorkflow organizations={organizations} />
        </TabsContent>

        {/* CERTIFICATES TAB */}
        <TabsContent value="certificates" className="space-y-6">
          <CertificateGenerator organizations={organizations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
