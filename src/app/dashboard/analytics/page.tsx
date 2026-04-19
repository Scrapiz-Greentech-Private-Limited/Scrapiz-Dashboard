'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { orders, referrals, serviceOrders, users } from "@/lib/data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function AnalyticsPage() {
  const userGrowth = [
    { month: 'Jul', users: 2 },
    { month: 'Aug', users: 4 },
    { month: 'Sep', users: 5 },
    { month: 'Oct', users: 6 },
    { month: 'Nov', users: users.length },
  ];

  const referralConversionRate = referrals.length
    ? (referrals.filter((referral) => referral.status === 'Completed').length / referrals.length) * 100
    : 0;
  const referralROI = referrals.filter((referral) => referral.status === 'Completed').length * 30;

  const agentPerformance = users
    .filter((user) => user.role === 'agent')
    .map((agent) => ({
      name: agent.name,
      orders: agent.totalOrders,
      rating: agent.rating || 0,
    }));

  const quickStats = [
    {
      title: 'Total Users',
      value: users.length,
      description: 'Active platform users',
      icon: Users,
      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    },
    {
      title: 'Total Orders',
      value: orders.length + serviceOrders.length,
      description: 'Scrap and service jobs',
      icon: ShoppingCart,
      background: 'linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)',
    },
    {
      title: 'Referrals',
      value: referrals.length,
      description: `${referralConversionRate.toFixed(1)}% conversion`,
      icon: Gift,
      background: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',
    },
    {
      title: 'Active Agents',
      value: users.filter((user) => user.role === 'agent').length,
      description: 'Pickup workforce tracked here',
      icon: Truck,
      background: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Operational Analytics</h2>
          <p className="text-muted-foreground">
            Mock revenue has been removed. This page now focuses on user, referral, and agent operations.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.title} className="border-0 text-white" style={{ background: stat.background }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-white/75">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{users.length}</div>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Sellers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {users.filter((user) => user.role === 'seller').length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {users.filter((user) => user.role === 'agent').length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Buyers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {users.filter((user) => user.role === 'buyer').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">User Growth Trend</CardTitle>
              <CardDescription>Monthly user acquisition</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{referralConversionRate.toFixed(1)}%</div>
                <p className="text-xs text-green-700">Referrals completed</p>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Total ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{referralROI}</div>
                <p className="text-xs text-green-700">Bonus investment</p>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Avg per User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {(
                    referrals.length /
                    Math.max(1, users.filter((user) => user.totalReferrals && user.totalReferrals > 0).length)
                  ).toFixed(1)}
                </div>
                <p className="text-xs text-green-700">Referrals per active user</p>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Active Referrers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {users.filter((user) => user.totalReferrals && user.totalReferrals > 0).length}
                </div>
                <p className="text-xs text-green-700">Users with referrals</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">Agent Performance</CardTitle>
              <CardDescription>Orders completed and ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#22c55e" name="Orders" />
                  <Bar yAxisId="right" dataKey="rating" fill="#4ade80" name="Rating" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
