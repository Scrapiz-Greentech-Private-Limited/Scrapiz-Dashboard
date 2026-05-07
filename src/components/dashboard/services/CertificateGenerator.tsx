'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Eye,
  Edit3,
  CheckCircle2,
  Award,
  Leaf,
} from 'lucide-react';
import { Organization, ServiceOrder, Certificate, CertificateType } from '@/types/services';
import ServiceManagementAPI from '@/services/services';

interface CertificateGeneratorProps {
  organizations: Organization[];
}

const FONT_FAMILIES = [
  { name: 'Cambria', value: 'Cambria', serif: true },
  { name: 'Georgia', value: 'Georgia', serif: true },
  { name: 'Times New Roman', value: '"Times New Roman"', serif: true },
  { name: 'Garamond', value: 'Garamond', serif: true },
  { name: 'Palatino', value: 'Palatino', serif: true },
  { name: 'Arial', value: 'Arial', serif: false },
  { name: 'Helvetica', value: 'Helvetica', serif: false },
  { name: 'Verdana', value: 'Verdana', serif: false },
  { name: 'Calibri', value: 'Calibri', serif: false },
];

const CERTIFICATE_TYPES: { type: CertificateType; label: string; icon: any; color: string }[] = [
  {
    type: 'completion',
    label: 'Service Completion Certificate',
    icon: CheckCircle2,
    color: 'bg-blue-100 text-blue-800',
  },
  {
    type: 'environmental_impact',
    label: 'Environmental Impact Certificate',
    icon: Leaf,
    color: 'bg-green-100 text-green-800',
  },
  {
    type: 'quantity_confirmation',
    label: 'Quantity Confirmation Certificate',
    icon: Award,
    color: 'bg-purple-100 text-purple-800',
  },
];

export default function CertificateGenerator({ organizations }: CertificateGeneratorProps) {
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [certificateType, setCertificateType] = useState<CertificateType>('completion');
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Font Configuration
  const [fontFamily, setFontFamily] = useState('Cambria');
  const [fontSizeHeading, setFontSizeHeading] = useState(28);
  const [fontSizeBody, setFontSizeBody] = useState(14);

  // Preview State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<Certificate | null>(null);

  useEffect(() => {
    if (selectedOrganization) {
      loadOrders();
    }
  }, [selectedOrganization]);

  const loadOrders = async () => {
    try {
      const data = await ServiceManagementAPI.getServiceOrders({
        organization_id: parseInt(selectedOrganization),
      });
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!selectedOrder) return;

    const order = orders.find((o) => o.order_id === selectedOrder);
    if (!order) return;

    const certificateData = {
      certificate_type: certificateType,
      order_id: order.order_id,
      organization_name: organizations.find((o) => o.id === order.organization_id)?.name,
      order_date: new Date(order.created_at).toLocaleDateString(),
      completed_date: order.completed_date ? new Date(order.completed_date).toLocaleDateString() : new Date().toLocaleDateString(),
      quantity: order.final_quantity || order.estimated_quantity,
      unit: order.quantity_unit,
      value: order.final_value || order.estimated_value,
      environmental_impact: order.environmental_impact,
      notes: order.notes,
    };

    try {
      const cert = await ServiceManagementAPI.generateCertificate(
        selectedOrder,
        certificateType,
        certificateData
      );

      const enhancedCert = {
        ...cert,
        font_family: fontFamily,
        font_size_heading: fontSizeHeading,
        font_size_body: fontSizeBody,
      };

      setCertificates([...certificates, enhancedCert]);
      setPreview(enhancedCert);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
  };

  const CertificatePreview = ({ certificate }: { certificate: Certificate }) => {
    const certType = CERTIFICATE_TYPES.find((t) => t.type === certificate.certificate_type);

    return (
      <div
        className="w-full aspect-[11/14] bg-white border-8 border-green-600 shadow-lg p-12 flex flex-col items-center justify-center relative"
        style={{
          fontFamily: certificate.font_family,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        {/* Decorative Border */}
        <div className="absolute inset-0 border-4 border-green-600 m-2 pointer-events-none" />

        {/* Logo Area */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-2">🌱</div>
          <p className="text-sm text-green-700 font-semibold">SCRAPIZ</p>
        </div>

        {/* Title */}
        <h1
          className="text-center font-bold mb-2 text-green-800"
          style={{ fontSize: `${certificate.font_size_heading}px` }}
        >
          {certType?.label}
        </h1>

        {/* Decorative Line */}
        <div className="w-24 h-1 bg-green-600 mb-8" />

        {/* Certificate Body */}
        <div className="text-center space-y-4 flex-1 flex flex-col justify-center">
          <p
            className="text-gray-700"
            style={{ fontSize: `${certificate.font_size_body}px` }}
          >
            This certifies that
          </p>

          <p
            className="font-bold text-green-700 border-b-2 border-green-600 pb-2"
            style={{ fontSize: `${certificate.font_size_heading - 4}px` }}
          >
            {certificate.certificate_data?.organization_name}
          </p>

          <p
            className="text-gray-700"
            style={{ fontSize: `${certificate.font_size_body}px` }}
          >
            has successfully completed service order{' '}
            <span className="font-semibold">{certificate.certificate_data?.order_id}</span>
          </p>

          {certificate.certificate_data?.quantity && (
            <p
              className="text-gray-700"
              style={{ fontSize: `${certificate.font_size_body}px` }}
            >
              Processing <span className="font-semibold">
                {certificate.certificate_data?.quantity} {certificate.certificate_data?.unit}
              </span> of recyclable materials
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-green-400">
            <p className="text-xs text-green-700 italic">Certificate ID: {certificate.certificate_id}</p>
            <p className="text-xs text-gray-600">Issued on: {certificate.certificate_data?.completed_date}</p>
          </div>
        </div>

        {/* Signature Area */}
        <div className="grid grid-cols-2 gap-8 mt-8 w-full text-center text-xs">
          <div>
            <div className="h-12 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-gray-700 font-semibold">Admin Signature</p>
          </div>
          <div>
            <p className="text-gray-600 mb-2">
              {new Date(certificate.generated_on).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Certificate Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Certificate</CardTitle>
          <CardDescription>Create professional certificates for completed service orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="order-selection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="order-selection">Order Selection</TabsTrigger>
              <TabsTrigger value="font-settings">Font Settings</TabsTrigger>
              <TabsTrigger value="certificate-type">Certificate Type</TabsTrigger>
            </TabsList>

            {/* Order Selection Tab */}
            <TabsContent value="order-selection" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Organization</label>
                <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.filter((o) => o.is_verified).map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrganization && (
                <div>
                  <label className="text-sm font-medium">Select Completed Order</label>
                  <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders
                        .filter((o) => o.order_status === 'completed')
                        .map((order) => (
                          <SelectItem key={order.id} value={order.order_id}>
                            {order.order_id} - {order.final_quantity || order.estimated_quantity}{' '}
                            {order.quantity_unit}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            {/* Font Settings Tab */}
            <TabsContent value="font-settings" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Font Family</label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">
                  {FONT_FAMILIES.find((f) => f.value === fontFamily)?.serif
                    ? '✓ Serif font (Traditional, professional)'
                    : '✓ Sans-serif font (Modern, clean)'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Heading Size</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="range"
                    min="20"
                    max="40"
                    value={fontSizeHeading}
                    onChange={(e) => setFontSizeHeading(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold w-12">{fontSizeHeading}px</span>
                </div>
                <p
                  className="mt-2 text-gray-700"
                  style={{ fontSize: `${fontSizeHeading}px`, fontFamily: fontFamily }}
                >
                  Preview Heading
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Body Size</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="range"
                    min="10"
                    max="20"
                    value={fontSizeBody}
                    onChange={(e) => setFontSizeBody(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold w-12">{fontSizeBody}px</span>
                </div>
                <p
                  className="mt-2 text-gray-700"
                  style={{ fontSize: `${fontSizeBody}px`, fontFamily: fontFamily }}
                >
                  Preview body text here for reference
                </p>
              </div>
            </TabsContent>

            {/* Certificate Type Tab */}
            <TabsContent value="certificate-type" className="space-y-4">
              <label className="text-sm font-medium">Certificate Type</label>
              <div className="grid grid-cols-1 gap-3">
                {CERTIFICATE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.type}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        certificateType === type.type
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => setCertificateType(type.type)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{type.label}</p>
                          <p className="text-xs text-gray-600">
                            {type.type === 'completion' && 'Confirm service completion and details'}
                            {type.type === 'environmental_impact' && 'Highlight environmental achievements'}
                            {type.type === 'quantity_confirmation' &&
                              'Verify final quantities and processing details'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={!selectedOrder}
                  onClick={() => {
                    if (selectedOrder) {
                      const order = orders.find((o) => o.order_id === selectedOrder);
                      if (order) {
                        const cert: Certificate = {
                          id: Date.now(),
                          certificate_id: `CERT-${Date.now()}`,
                          service_order_id: order.id,
                          certificate_type: certificateType,
                          generated_on: new Date().toISOString(),
                          certificate_data: {
                            organization_name: organizations.find((o) => o.id === order.organization_id)?.name,
                            order_id: order.order_id,
                            quantity: order.final_quantity || order.estimated_quantity,
                            unit: order.quantity_unit,
                            completed_date: new Date().toLocaleDateString(),
                          },
                          font_family: fontFamily,
                          font_size_heading: fontSizeHeading,
                          font_size_body: fontSizeBody,
                          is_approved: false,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        };
                        setPreview(cert);
                        setPreviewOpen(true);
                      }
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Certificate Preview</DialogTitle>
                </DialogHeader>
                {preview && <CertificatePreview certificate={preview} />}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleGenerateCertificate}>
                    <FileText className="h-4 w-4 mr-2" /> Generate Certificate
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" /> Export as PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button className="flex-1" disabled={!selectedOrder} onClick={handleGenerateCertificate}>
              <FileText className="h-4 w-4 mr-2" /> Generate Certificate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Certificates List */}
      {certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certificates.map((cert) => {
                const certType = CERTIFICATE_TYPES.find((t) => t.type === cert.certificate_type);
                return (
                  <div key={cert.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold">{cert.certificate_id}</p>
                        <p className="text-sm text-gray-600">{certType?.label}</p>
                        <p className="text-xs text-gray-500">
                          Generated: {new Date(cert.generated_on).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={cert.is_approved ? 'default' : 'secondary'}>
                        {cert.is_approved ? 'Approved' : 'Pending Approval'}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" /> Download PDF
                      </Button>
                      {!cert.is_approved && (
                        <Button size="sm" variant="outline" className="text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
