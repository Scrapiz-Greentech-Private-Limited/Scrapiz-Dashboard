'use client'

import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  Download,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { orders, users } from '@/lib/data';
import SalesChart from '@/components/dashboard/reports/sales-chart';
import RevenueByCategoryChart from '@/components/dashboard/reports/revenue-by-category-chart';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function ReportsPage() {
  const totalRevenue = orders.reduce(
    (acc, order) => acc + (order.totalAmount || 0),
    0
  );
  const newCustomers = users.filter(u => new Date(u.createdAt) > subDays(new Date(), 30)).length;
  const averageOrderValue = totalRevenue / orders.filter(o => o.status === 'completed').length;
    
  const topAgents = users
    .filter(u => u.role === 'agent')
    .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
    .slice(0, 5);

  const handleFilterByDate = () => {
    alert('Date filter dialog would open here');
    // TODO: Implement date filter
  };

  const handleExport = () => {
    alert('Export report functionality would trigger here');
    // TODO: Implement export to PDF/CSV
  };
    
  const recentCustomers = users
    .filter(u => u.role === 'seller')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);


  return (
    <Tabs defaultValue="overview">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleFilterByDate}>
                <Calendar className="mr-2 h-4 w-4" />
                Filter by Date
            </Button>
          <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{newCustomers}</div>
              <p className="text-xs text-muted-foreground">
                +15% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{averageOrderValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                +5.2% from last month
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <SalesChart />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
              <CardDescription>
                Breakdown of revenue from different scrap categories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueByCategoryChart />
            </CardContent>
          </Card>
        </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
             <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Top Performing Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Completed Orders</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topAgents.map(agent => (
                        <TableRow key={agent.id}>
                            <TableCell>{agent.name}</TableCell>
                            <TableCell>{agent.totalOrders}</TableCell>
                            <TableCell className="text-right">{agent.rating}/5</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Customer Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    {recentCustomers.map(customer => (
                        <div key={customer.id} className="flex items-center">
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{customer.name}</p>
                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                            </div>
                            <div className="ml-auto font-medium text-sm">{format(new Date(customer.createdAt), 'PP')}</div>
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
         </div>
      </TabsContent>
    </Tabs>
  );
}
