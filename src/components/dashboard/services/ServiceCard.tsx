'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Award, Zap, FileText, BarChart3 } from 'lucide-react';
import { ServiceType, Organization } from '@/types/services';
import ServiceManagementAPI from '@/services/services';

interface ServiceCardProps {
  service: ServiceType;
  organizations: Organization[];
}

export default function ServiceCard({ service, organizations }: ServiceCardProps) {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const getServiceIcon = (serviceName: string) => {
    const icons: Record<string, string> = {
      society_tieup: '🏢',
      corporate_tieup: '🏭',
      debris_removal: '🚚',
      demolition_removal: '🏗️',
    };
    return icons[serviceName] || '📦';
  };

  const getServiceColor = (serviceName: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      society_tieup: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      corporate_tieup: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      debris_removal: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      demolition_removal: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };
    return colors[serviceName] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  };

  const color = getServiceColor(service.service_name);

  return (
    <Card className={`${color.bg} border ${color.border} overflow-hidden hover:shadow-xl transition-shadow`}>
      {/* Image Section */}
      <div className="relative h-48 w-full bg-gradient-to-b from-gray-200 to-gray-100 overflow-hidden">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.description}
            fill
            className="object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl">
            {getServiceIcon(service.service_name)}
          </div>
        )}
        <div className="absolute top-0 right-0 m-4">
          <Badge className={color.text + ' bg-white'}>{service.is_active ? 'Active' : 'Inactive'}</Badge>
        </div>
      </div>

      <CardHeader>
        <CardTitle className={color.text}>{service.description}</CardTitle>
        <CardDescription>Service Code: {service.service_code}</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audits</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
            <TabsTrigger value="impact" className="text-xs">Impact</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-gray-600">Registered</p>
                </div>
                <p className="text-2xl font-bold">{organizations.length}</p>
              </div>

              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-gray-600">Active</p>
                </div>
                <p className="text-2xl font-bold">{organizations.filter(o => o.is_verified).length}</p>
              </div>
            </div>
          </TabsContent>

          {/* AUDIT TAB */}
          <TabsContent value="audit" className="space-y-4">
            <div className="space-y-2">
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <p className="font-semibold">Complete Audits</p>
                </div>
                <p className="text-sm text-gray-600">Comprehensive audit reports for all organizations using this service</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="p-2 bg-white rounded border text-sm">
                  <p className="font-medium">Compliance Audit</p>
                  <p className="text-xs text-gray-500">Regulatory & environmental compliance</p>
                </div>
                <div className="p-2 bg-white rounded border text-sm">
                  <p className="font-medium">Financial Audit</p>
                  <p className="text-xs text-gray-500">Revenue & transaction tracking</p>
                </div>
                <div className="p-2 bg-white rounded border text-sm">
                  <p className="font-medium">Operational Audit</p>
                  <p className="text-xs text-gray-500">Service quality & efficiency metrics</p>
                </div>
                <div className="p-2 bg-white rounded border text-sm">
                  <p className="font-medium">Environmental Audit</p>
                  <p className="text-xs text-gray-500">Impact assessment & sustainability</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="space-y-3">
            <div className="space-y-2">
              {organizations.slice(0, 3).map((org) => (
                <div key={org.id} className="p-2 bg-white rounded border text-sm">
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-gray-500">Total Members: {org.total_members}</p>
                </div>
              ))}
            </div>
            <Button size="sm" className="w-full" variant="outline">
              View All Orders
            </Button>
          </TabsContent>

          {/* IMPACT TAB */}
          <TabsContent value="impact" className="space-y-3">
            <div className="space-y-2">
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium">Environmental Impact</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">Tracked through recycled materials and waste diversion metrics</p>
              </div>

              <div className="grid grid-cols-1 gap-2 mt-3">
                <div className="p-2 bg-green-50 rounded border text-sm">
                  <p className="font-semibold text-green-700">🌳 Trees Saved</p>
                  <p className="text-xs text-gray-600">Through paper & cardboard recycling</p>
                </div>
                <div className="p-2 bg-blue-50 rounded border text-sm">
                  <p className="font-semibold text-blue-700">💨 CO₂ Reduced</p>
                  <p className="text-xs text-gray-600">Through waste diversion from landfills</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
