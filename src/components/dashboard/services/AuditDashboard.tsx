'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Shield,
  Activity,
  Calendar,
} from 'lucide-react';

interface AuditDashboardProps {}

export default function AuditDashboard({}: AuditDashboardProps) {
  // Sample audit data
  const auditData = [
    { date: 'Jan 1', completedOrders: 5, pendingOrders: 2, inProgress: 3 },
    { date: 'Jan 8', completedOrders: 8, pendingOrders: 1, inProgress: 2 },
    { date: 'Jan 15', completedOrders: 12, pendingOrders: 3, inProgress: 4 },
    { date: 'Jan 22', completedOrders: 15, pendingOrders: 2, inProgress: 3 },
    { date: 'Jan 29', completedOrders: 18, pendingOrders: 1, inProgress: 2 },
    { date: 'Feb 5', completedOrders: 20, pendingOrders: 2, inProgress: 3 },
  ];

  const certificationData = [
    { name: 'Approved', value: 45, fill: '#10b981' },
    { name: 'Pending', value: 12, fill: '#f59e0b' },
    { name: 'Rejected', value: 3, fill: '#ef4444' },
  ];

  const auditLogData = [
    {
      id: 1,
      type: 'Organization Verified',
      organization: 'Green Valley Society',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      actor: 'Admin User',
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    {
      id: 2,
      type: 'Order Status Changed',
      organization: 'TechCorp Industries',
      details: 'pending_collection → in_progress',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      actor: 'System',
      icon: Activity,
      color: 'text-blue-600',
    },
    {
      id: 3,
      type: 'Certificate Generated',
      organization: 'Green Valley Society',
      details: 'CERT-20240115-001',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      actor: 'Admin User',
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      id: 4,
      type: 'Quantity Updated',
      organization: 'TechCorp Industries',
      details: '150 kg → 165 kg',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      actor: 'Collection Agent',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
    {
      id: 5,
      type: 'Compliance Check',
      organization: 'Green Valley Society',
      details: 'Monthly environmental audit',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      actor: 'System',
      icon: Shield,
      color: 'text-green-600',
    },
  ];

  const complianceMetrics = [
    { metric: 'On-Time Completions', value: '94%', status: 'good', icon: CheckCircle2 },
    { metric: 'Quantity Accuracy', value: '98.5%', status: 'excellent', icon: TrendingUp },
    { metric: 'Certificate Approval Rate', value: '96%', status: 'good', icon: FileText },
    { metric: 'Data Integrity', value: '99.8%', status: 'excellent', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Compliance Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {complianceMetrics.map((metric) => {
          const Icon = metric.icon;
          const statusColor = metric.status === 'excellent' ? 'text-green-600' : 'text-blue-600';

          return (
            <Card key={metric.metric}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
                <Icon className={`h-4 w-4 ${statusColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {metric.status === 'excellent' ? '✓ Excellent' : '✓ Good'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Audit Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Order Audits</TabsTrigger>
          <TabsTrigger value="certificates">Certificate Audit</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Order Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Order Processing Trends</CardTitle>
              <CardDescription>Weekly order completion and status tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={auditData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completedOrders" stackId="a" fill="#10b981" name="Completed" />
                  <Bar dataKey="pendingOrders" stackId="a" fill="#f59e0b" name="Pending" />
                  <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" name="In Progress" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Audit Log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>Latest changes and operations in the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {auditLogData.slice(0, 5).map((log) => {
                const Icon = log.icon;
                return (
                  <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className={`flex-shrink-0 mt-1`}>
                      <Icon className={`h-5 w-5 ${log.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{log.type}</p>
                      <p className="text-sm text-gray-600">{log.organization}</p>
                      {log.details && <p className="text-xs text-gray-500 mt-1">{log.details}</p>}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500">
                        {log.timestamp.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs font-medium text-gray-700">{log.actor}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ORDER AUDITS TAB */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Processing Audit</CardTitle>
              <CardDescription>Complete audit trail of all orders and status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="by-organization" className="w-full">
                <TabsList>
                  <TabsTrigger value="by-organization">By Organization</TabsTrigger>
                  <TabsTrigger value="by-status">By Status</TabsTrigger>
                  <TabsTrigger value="by-period">By Period</TabsTrigger>
                </TabsList>

                <TabsContent value="by-organization" className="space-y-4 mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Organization</th>
                          <th className="px-4 py-2 text-right font-semibold">Total Orders</th>
                          <th className="px-4 py-2 text-right font-semibold">Completed</th>
                          <th className="px-4 py-2 text-right font-semibold">Pending</th>
                          <th className="px-4 py-2 text-right font-semibold">Completion %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { org: 'Green Valley Society', total: 48, completed: 45, pending: 2 },
                          { org: 'TechCorp Industries', total: 32, completed: 28, pending: 3 },
                        ].map((row) => (
                          <tr key={row.org} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{row.org}</td>
                            <td className="px-4 py-3 text-right">{row.total}</td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant="outline" className="bg-green-50">{row.completed}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant="outline" className="bg-orange-50">{row.pending}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {((row.completed / row.total) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="by-status" className="mt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={auditData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="completedOrders" stroke="#10b981" />
                      <Line type="monotone" dataKey="pendingOrders" stroke="#f59e0b" />
                      <Line type="monotone" dataKey="inProgress" stroke="#3b82f6" />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="by-period" className="mt-4">
                  <div className="text-center py-8 text-gray-600">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a period to view detailed audit report</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CERTIFICATE AUDIT TAB */}
        <TabsContent value="certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Audit Trail</CardTitle>
              <CardDescription>All certificate generation, approval, and modification history</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="status" className="w-full">
                <TabsList>
                  <TabsTrigger value="status">By Status</TabsTrigger>
                  <TabsTrigger value="type">By Type</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="status" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={certificationData} cx="50%" cy="50%" labelLine={false} label={{ position: 'insideBottomRight', offset: -5 }} outerRadius={80} fill="#8884d8" dataKey="value">
                            {certificationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      {certificationData.map((item) => (
                        <div key={item.name} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: item.fill }} />
                              <p className="font-medium">{item.name}</p>
                            </div>
                            <p className="text-2xl font-bold">{item.value}</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            {item.name === 'Approved' && 'Ready for download and distribution'}
                            {item.name === 'Pending' && 'Awaiting admin review and approval'}
                            {item.name === 'Rejected' && 'Issues identified, resubmission required'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="type" className="mt-4">
                  <div className="space-y-3">
                    {[
                      { type: 'Service Completion', count: 35 },
                      { type: 'Environmental Impact', count: 7 },
                      { type: 'Quantity Confirmation', count: 18 },
                    ].map((item) => (
                      <div key={item.type} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">{item.type}</p>
                          <Badge>{item.count} certificates</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(item.count / 60) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <div className="space-y-4">
                    {auditLogData
                      .filter((log) => log.type === 'Certificate Generated')
                      .map((log) => (
                        <div key={log.id} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold">{log.details}</p>
                            <Badge variant="outline">{log.organization}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Generated on{' '}
                            {log.timestamp.toLocaleDateString('en-IN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPLIANCE TAB */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Compliance Report</CardTitle>
              <CardDescription>Regulatory and operational compliance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Environmental Compliance</p>
                    <Badge className="bg-green-100 text-green-800">100%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: '100%' }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">All materials properly categorized and processed</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Data Integrity</p>
                    <Badge className="bg-green-100 text-green-800">99.8%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: '99.8%' }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Complete audit trails for all transactions</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Certificate Accuracy</p>
                    <Badge className="bg-blue-100 text-blue-800">98.5%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: '98.5%' }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">All certificates verified and approved</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Delivery Timeliness</p>
                    <Badge className="bg-green-100 text-green-800">94.2%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: '94.2%' }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Orders completed on or before scheduled date</p>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-green-900">Compliance Status: EXCELLENT</p>
                    <p className="text-sm text-green-800 mt-1">
                      All systems are operating within regulatory requirements. No compliance issues detected in the last 30 days.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
