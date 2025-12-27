'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Gift,
  MapPin,
  Truck,
  Package
} from "lucide-react";
import { orders, users, referrals, serviceOrders } from "@/lib/data";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  // Revenue calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const serviceRevenue = serviceOrders.reduce((sum, o) => sum + (o.finalPrice || o.estimatedPrice || 0), 0);
  const totalCombinedRevenue = totalRevenue + serviceRevenue;

  // Revenue by category
  const revenueByCategory = orders.reduce((acc: any, order) => {
    const category = order.scrapCategory;
    if (!acc[category]) acc[category] = 0;
    acc[category] += order.totalAmount || 0;
    return acc;
  }, {});

  const categoryData = Object.entries(revenueByCategory).map(([name, value]) => ({
    name,
    value: value as number
  }));

  // User growth
  const userGrowth = [
    { month: 'Jul', users: 2 },
    { month: 'Aug', users: 4 },
    { month: 'Sep', users: 5 },
    { month: 'Oct', users: 6 },
    { month: 'Nov', users: users.length }
  ];

  // Referral metrics
  const referralConversionRate = (referrals.filter(r => r.status === 'Completed').length / referrals.length * 100).toFixed(1);
  const referralROI = referrals.filter(r => r.status === 'Completed').length * 30; // ₹30 per referral

  // Agent performance
  const agentPerformance = users
    .filter(u => u.role === 'agent')
    .map(agent => ({
      name: agent.name,
      orders: agent.totalOrders,
      rating: agent.rating || 0
    }));

  const COLORS = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">Comprehensive business insights and metrics</p>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{totalCombinedRevenue.toLocaleString()}</div>
            <p className="text-xs text-purple-100 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +24.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <p className="text-xs text-green-100">Active platform users</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{orders.length + serviceOrders.length}</div>
            <p className="text-xs text-orange-100">Scrap + Service orders</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Referrals
            </CardTitle>
            <Gift className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{referrals.length}</div>
            <p className="text-xs text-pink-100">{referralConversionRate}% conversion</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">💰 Revenue</TabsTrigger>
          <TabsTrigger value="users">👥 Users</TabsTrigger>
          <TabsTrigger value="referrals">🎁 Referrals</TabsTrigger>
          <TabsTrigger value="agents">🚚 Agents</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{totalCombinedRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+24.5%</span> from last month
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Scrap Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">₹{totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-green-700">{orders.length} orders</p>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Service Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">₹{serviceRevenue.toLocaleString()}</div>
                <p className="text-xs text-green-700">{serviceOrders.length} bookings</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100">Revenue by Category</CardTitle>
                <CardDescription>Distribution of scrap revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100">Revenue Breakdown</CardTitle>
                <CardDescription>Top performing categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
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
                  {users.filter(u => u.role === 'seller').length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {users.filter(u => u.role === 'agent').length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Buyers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {users.filter(u => u.role === 'buyer').length}
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

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{referralConversionRate}%</div>
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
                  {(referrals.length / users.filter(u => u.totalReferrals && u.totalReferrals > 0).length).toFixed(1)}
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
                  {users.filter(u => u.totalReferrals && u.totalReferrals > 0).length}
                </div>
                <p className="text-xs text-green-700">Users with referrals</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agents Tab */}
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
