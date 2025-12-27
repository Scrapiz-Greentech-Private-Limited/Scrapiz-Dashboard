"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  DollarSign,
  Users,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Weight,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Wrench,
  Gift,
  BarChart3,
  PieChart,
  Calendar,
  Loader2,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import OrdersChart from "@/components/dashboard/orders-chart"
import ScrapVolumeChart from "@/components/dashboard/scrap-volume-chart"
import RevenueChart from "@/components/dashboard/revenue-chart"
import CategoryPerformanceChart from "@/components/dashboard/category-performance-chart"
import AgentPerformanceChart from "@/components/dashboard/agent-performance-chart"
import ServiceStatsChart from "@/components/dashboard/service-stats-chart"
import { DashboardService, type DashboardStats } from "@/services/dashboard"

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await DashboardService.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard stats");
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Derived values from stats
  const totalRevenue = stats ? parseFloat(stats.total_revenue) : 0;
  const serviceRevenue = stats ? parseFloat(stats.service_revenue) : 0;
  const combinedRevenue = stats ? parseFloat(stats.combined_revenue) : 0;
  const totalOrders = stats?.total_orders ?? 0;
  const completedOrders = stats?.completed_orders ?? 0;
  const pendingOrders = stats?.pending_orders ?? 0;
  const totalWeight = stats ? parseFloat(stats.total_weight) : 0;
  const activeAgents = stats?.active_agents ?? 0;
  const avgOrderValue = stats ? parseFloat(stats.avg_order_value) : 0;
  const totalCustomers = stats?.total_customers ?? 0;
  const totalReferrals = stats?.total_referrals ?? 0;
  const completedReferrals = stats?.completed_referrals ?? 0;
  const totalServiceBookings = stats?.total_service_bookings ?? 0;

  // Transform data for charts
  const categoryChartData = stats?.category_performance?.map(cat => ({
    category: cat.category,
    orders: cat.orders,
    revenue: parseFloat(cat.revenue),
  })) ?? [];

  const agentChartData = stats?.top_agents?.map(agent => ({
    name: agent.name,
    orders: agent.total_orders,
    rating: parseFloat(agent.average_rating),
  })) ?? [];

  const serviceChartData = stats?.service_stats?.map((svc, index) => ({
    name: svc.service,
    value: svc.count,
    color: ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"][index % 5],
  })) ?? [];

  if (loading) {
    return (
      <div className="flex w-full h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div>
            <h3 className="font-semibold text-lg">Failed to load dashboard</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-green-900 dark:text-green-100">Dashboard Overview</h2>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your scrap collection business.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="hover:bg-green-50 hover:text-green-700 hover:border-green-300">
              <Link href="/dashboard/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
              <Link href="/dashboard/orders">
                <Package className="mr-2 h-4 w-4" />
                New Order
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards - Enhanced */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Total Revenue
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">₹{combinedRevenue.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">From completed orders</span>
              </p>
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                Scrap: ₹{totalRevenue.toLocaleString()} • Services: ₹{serviceRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Total Orders
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalOrders + totalServiceBookings}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <CheckCircle className="h-3 w-3 text-blue-600" />
                <span className="text-blue-600 font-medium">{completedOrders}</span> completed
              </p>
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                Scrap: {totalOrders} • Services: {totalServiceBookings}
              </div>
            </CardContent>
          </Card>
          
           <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending Orders</CardTitle>
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <AlertCircle className="h-3 w-3 text-orange-600" />
                <span className="text-orange-600 font-medium">Needs attention</span>
              </p>
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                Pending + Assigned orders
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Total Weight
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Weight className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{totalWeight.toFixed(0)} kg</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-purple-600" />
                <span className="text-purple-600 font-medium">From completed orders</span>
              </p>
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                Avg per order: {completedOrders > 0 ? (totalWeight / completedOrders).toFixed(1) : '0.0'} kg
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Stats Row - Enhanced */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-green-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Active Agents</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Truck className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{activeAgents}</div>
              <p className="text-xs text-muted-foreground mt-1">Verified & active</p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Avg Order Value</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">₹{avgOrderValue.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Per completed order</p>
            </CardContent>
          </Card>
          
          <Card className="border-purple-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Customers</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered users</p>
            </CardContent>
          </Card>

          <Card className="border-pink-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-900 dark:text-pink-100">Referrals</CardTitle>
              <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                <Gift className="h-4 w-4 text-pink-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">{totalReferrals}</div>
              <p className="text-xs text-muted-foreground mt-1">{completedReferrals} completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Performance Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow border-green-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Monthly revenue over the past 7 months</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Category Performance
              </CardTitle>
              <CardDescription>Orders and revenue by scrap category</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryPerformanceChart data={categoryChartData.length > 0 ? categoryChartData : undefined} />
            </CardContent>
          </Card>
        </div>

        {/* Agent & Service Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow border-green-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                Top Performing Agents
              </CardTitle>
              <CardDescription>Agents ranked by completed orders</CardDescription>
            </CardHeader>
            <CardContent>
              <AgentPerformanceChart data={agentChartData.length > 0 ? agentChartData : undefined} />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-purple-600" />
                Service Bookings
              </CardTitle>
              <CardDescription>Distribution of service orders by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceStatsChart data={serviceChartData.length > 0 ? serviceChartData : undefined} />
            </CardContent>
          </Card>
        </div>

        {/* Scrap Volume & Orders Chart */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2 hover:shadow-lg transition-all duration-200 border-green-200 bg-gradient-to-br from-green-50/30 to-white dark:from-green-950/20 dark:to-background">
            <CardHeader className="flex flex-row items-center border-b pb-4">
              <div className="grid gap-1">
                <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                  <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  Order Statistics
                </CardTitle>
                <CardDescription className="text-sm">
                  Overview of all orders • <span className="font-semibold text-green-600">{totalOrders}</span> total orders
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1 bg-green-600 hover:bg-green-700">
                <Link href="/dashboard/orders">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalOrders}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{completedOrders}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{pendingOrders}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">₹{avgOrderValue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-200 border-purple-200 bg-gradient-to-br from-purple-50/30 to-white dark:from-purple-950/20 dark:to-background">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <PieChart className="h-4 w-4 text-purple-600" />
                </div>
                Scrap Volume
              </CardTitle>
              <CardDescription>Distribution by category</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ScrapVolumeChart />
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Weight</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">{totalWeight.toFixed(0)} kg</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">{totalOrders}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg per Order</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">{completedOrders > 0 ? (totalWeight / completedOrders).toFixed(1) : '0.0'} kg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Full Width Chart */}
        <Card className="hover:shadow-lg transition-all duration-200 border-blue-200 bg-gradient-to-br from-blue-50/30 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                Daily Orders Trend
              </CardTitle>
              <CardDescription className="mt-1">Order volume and patterns over the past week</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300">
                <Calendar className="h-4 w-4 mr-1" />
                Last 7 Days
              </Button>
              <Button variant="outline" size="sm" asChild className="hover:bg-green-50 hover:text-green-700 hover:border-green-300">
                <Link href="/dashboard/analytics">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Full Report
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <OrdersChart />
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{completedOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{pendingOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{totalOrders > 0 ? (totalOrders / 7).toFixed(1) : '0.0'}</p>
                <p className="text-xs text-muted-foreground mt-1">Daily Avg</p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
