'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gift,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  Search,
  ArrowUpRight,
  Copy,
  Check,
  Download,
  RefreshCw,
} from "lucide-react";
import { ReferralService } from '@/components/backend/apiService';
import type { ReferredUser, ReferralTransaction, ReferralStats, TopReferrer } from '@/types/referral';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ReferralsPage() {
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [transactions, setTransactions] = useState<ReferralTransaction[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [referralsData, transactionsData, statsData] = await Promise.all([
        ReferralService.getReferredUsers(),
        ReferralService.getReferralTransactions(),
        ReferralService.getReferralStats(),
      ]);
      setReferredUsers(referralsData);
      setTransactions(transactionsData);
      setStats(statsData.stats);
      setTopReferrers(statsData.top_referrers);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load referral data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Search filtering
  const filteredReferrals = referredUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.referrer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.referrer?.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(txn =>
    txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.transaction_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: 'Copied!',
      description: 'Referral code copied to clipboard',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'referrer_bonus':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'referee_bonus':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'redemption':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-green-900 dark:text-green-100">
            Referral Management
          </h2>
          <p className="text-muted-foreground">Track and manage the referral program</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card
          className="transition-all hover:shadow-lg border-purple-200"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Referred</CardTitle>
            <Users className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.total_referred || 0}</div>
            <p className="text-xs text-purple-100">Users joined via referral</p>
          </CardContent>
        </Card>

        <Card
          className="transition-all hover:shadow-lg border-green-200"
          style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.successful_referrals || 0}</div>
            <p className="text-xs text-green-100">Completed first order</p>
          </CardContent>
        </Card>

        <Card
          className="transition-all hover:shadow-lg border-orange-200"
          style={{ background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.conversion_rate || 0}%</div>
            <p className="text-xs text-orange-100">Success rate</p>
          </CardContent>
        </Card>

        <Card
          className="transition-all hover:shadow-lg border-cyan-200"
          style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Bonus Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{stats?.total_bonus_paid || 0}</div>
            <p className="text-xs text-cyan-100">Lifetime</p>
          </CardContent>
        </Card>

        <Card
          className="transition-all hover:shadow-lg border-pink-200"
          style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pending Balance</CardTitle>
            <Gift className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{stats?.pending_balance || 0}</div>
            <p className="text-xs text-pink-100">Unredeemed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or referral code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="referrals">
            <span>Referrals</span>
          </TabsTrigger>

          <TabsTrigger value="transactions">
            <span>Transactions</span>
          </TabsTrigger>

          <TabsTrigger value="analytics">
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">
                Referred Users
              </CardTitle>
              <CardDescription>
                Users who joined via referral codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referred User</TableHead>
                    <TableHead>Referred By</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>First Order</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No referrals found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReferrals.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.referrer ? (
                            <div>
                              <div className="font-medium">{user.referrer.name}</div>
                              <div className="text-xs text-muted-foreground">{user.referrer.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.referrer?.referral_code ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {user.referrer.referral_code}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(user.referrer!.referral_code)}
                              >
                                {copiedCode === user.referrer.referral_code ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.has_completed_first_order ? 'default' : 'secondary'}>
                            {user.has_completed_first_order ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/users?id=${user.id}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">
                Referral Transactions
              </CardTitle>
              <CardDescription>
                Complete history of all referral transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="text-sm">
                          {new Date(txn.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          {txn.user ? (
                            <div>
                              <div className="font-medium">{txn.user.name}</div>
                              <div className="text-xs text-muted-foreground">{txn.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTransactionTypeColor(txn.transaction_type)}>
                            {txn.transaction_type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {txn.description}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              txn.transaction_type === 'redemption'
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {txn.transaction_type === 'redemption' ? '-' : '+'}₹
                            {parseFloat(txn.amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {txn.order_id ? (
                            <Badge variant="outline">#{txn.order_id}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Referrers */}
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Referrers
                </CardTitle>
                <CardDescription>Users with most successful referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topReferrers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No referrers yet</p>
                  ) : (
                    topReferrers.map((referrer, index) => {
                      const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                      const bgColors = ['bg-yellow-100', 'bg-gray-100', 'bg-orange-100'];
                      const textColors = ['text-yellow-700', 'text-gray-700', 'text-orange-700'];

                      return (
                        <div
                          key={referrer.id}
                          className="flex items-center gap-4 p-3 border border-green-100 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full ${
                              index < 3 ? bgColors[index] : 'bg-green-100'
                            } ${index < 3 ? textColors[index] : 'text-green-700'} font-bold text-sm`}
                            style={
                              index < 3 ? { boxShadow: `0 0 10px ${medalColors[index]}40` } : {}
                            }
                          >
                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{referrer.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {referrer.referral_code}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {referrer.referral_count} referrals
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ₹{parseFloat(referrer.balance).toFixed(2)} balance
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Referral Program Info */}
            <Card className="border-green-100 bg-green-50/50 dark:bg-green-900/10">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100">
                  Program Details
                </CardTitle>
                <CardDescription>Referral bonus structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200">
                    <div className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      Referrer Bonus
                    </div>
                    <div className="text-2xl font-bold text-green-600">₹20</div>
                    <p className="text-xs text-muted-foreground mt-1">Per successful referral</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200">
                    <div className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      Referee Bonus
                    </div>
                    <div className="text-2xl font-bold text-green-600">₹10</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Welcome bonus for new users
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200">
                    <div className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      Total Impact
                    </div>
                    <div className="text-2xl font-bold text-green-600">₹30</div>
                    <p className="text-xs text-muted-foreground mt-1">Per successful referral</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referrer Bonuses</CardTitle>
                <Gift className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">
                  ₹{stats?.total_referrer_bonus || 0}
                </div>
                <p className="text-xs text-purple-600">Total paid to referrers</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referee Bonuses</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">
                  ₹{stats?.total_referee_bonus || 0}
                </div>
                <p className="text-xs text-blue-600">Total paid to new users</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  ₹{stats?.total_redeemed || 0}
                </div>
                <p className="text-xs text-green-600">Used on orders</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
