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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-green-900 dark:text-green-100">
            Referral Management
          </h2>
          <p className="text-sm text-muted-foreground hidden sm:block">Track and manage the referral program</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 sm:h-9 text-xs sm:text-sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 sm:gap-4">
        <Card
          className="transition-all hover:shadow-lg border-purple-200"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Total Referred</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats?.total_referred || 0}</div>
            <p className="text-[10px] sm:text-xs text-purple-100 hidden sm:block">Users joined via referral</p>
          </CardContent>
        </Card>

        <Card
          className="transition-all hover:shadow-lg border-green-200"
          style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Successful</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats?.successful_referrals || 0}</div>
            <p className="text-[10px] sm:text-xs text-green-100 hidden sm:block">Completed first order</p>
          </CardContent>
        </Card>

        <Card
          className="transition-all hover:shadow-lg border-orange-200"
          style={{ background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Conversion</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats?.conversion_rate || 0}%</div>
            <p className="text-[10px] sm:text-xs text-orange-100 hidden sm:block">Success rate</p>
          </CardContent>
        </Card>

        <Card
          className="transition-all hover:shadow-lg border-cyan-200"
          style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Bonus Paid</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white">₹{stats?.total_bonus_paid || 0}</div>
            <p className="text-[10px] sm:text-xs text-cyan-100 hidden sm:block">Lifetime</p>
          </CardContent>
        </Card>

        <Card
          className="transition-all hover:shadow-lg border-pink-200 col-span-2 sm:col-span-1"
          style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Pending Balance</CardTitle>
            <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white">₹{stats?.pending_balance || 0}</div>
            <p className="text-[10px] sm:text-xs text-pink-100 hidden sm:block">Unredeemed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border-green-100">
        <CardContent className="p-3 sm:p-4 sm:pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="referrals" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:grid sm:w-full sm:grid-cols-3">
            <TabsTrigger value="referrals" className="text-xs sm:text-sm px-3 sm:px-4">
              Referrals
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm px-3 sm:px-4">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm px-3 sm:px-4">
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <Card className="border-green-100">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-green-900 dark:text-green-100">
                Referred Users
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Users who joined via referral codes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[600px] sm:min-w-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Referred User</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Referred By</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Referral Code</TableHead>
                      <TableHead className="text-xs sm:text-sm">First Order</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Joined</TableHead>
                      <TableHead className="text-xs sm:text-sm w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                          No referrals found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReferrals.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="p-2 sm:p-4">
                            <div>
                              <div className="font-medium text-xs sm:text-sm">{user.name}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">{user.email}</div>
                              {/* Mobile: show referrer info */}
                              <div className="sm:hidden text-[10px] text-muted-foreground mt-1">
                                {user.referrer && <span>By: {user.referrer.name}</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell p-2 sm:p-4">
                            {user.referrer ? (
                              <div>
                                <div className="font-medium text-sm">{user.referrer.name}</div>
                                <div className="text-xs text-muted-foreground">{user.referrer.email}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell p-2 sm:p-4">
                            {user.referrer?.referral_code ? (
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">
                                  {user.referrer.referral_code}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
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
                          <TableCell className="p-2 sm:p-4">
                            <Badge variant={user.has_completed_first_order ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                              {user.has_completed_first_order ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell p-2 sm:p-4 text-xs sm:text-sm text-muted-foreground">
                            {new Date(user.date_joined).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="p-2 sm:p-4">
                            <Link href={`/dashboard/users?id=${user.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="border-green-100">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-green-900 dark:text-green-100">
                Referral Transactions
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Complete history of all referral transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[500px] sm:min-w-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">User</TableHead>
                      <TableHead className="text-xs sm:text-sm">Type</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Description</TableHead>
                      <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                            {new Date(txn.created_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {/* Mobile: show user info */}
                            <div className="sm:hidden text-[10px] text-muted-foreground mt-1">
                              {txn.user?.name || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell p-2 sm:p-4">
                            {txn.user ? (
                              <div>
                                <div className="font-medium text-sm">{txn.user.name}</div>
                                <div className="text-xs text-muted-foreground">{txn.user.email}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="p-2 sm:p-4">
                            <Badge className={`${getTransactionTypeColor(txn.transaction_type)} text-[10px] sm:text-xs`}>
                              {txn.transaction_type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell p-2 sm:p-4 max-w-xs truncate text-sm">
                            {txn.description}
                          </TableCell>
                          <TableCell className="p-2 sm:p-4">
                            <span
                              className={`font-semibold text-xs sm:text-sm ${
                                txn.transaction_type === 'redemption'
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {txn.transaction_type === 'redemption' ? '-' : '+'}₹
                              {parseFloat(txn.amount).toFixed(0)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell p-2 sm:p-4">
                            {txn.order_id ? (
                              <Badge variant="outline" className="text-xs">#{txn.order_id}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Top Referrers */}
            <Card className="border-green-100">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-green-900 dark:text-green-100">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Top Referrers
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Users with most successful referrals</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {topReferrers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">No referrers yet</p>
                  ) : (
                    topReferrers.map((referrer, index) => {
                      const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                      const bgColors = ['bg-yellow-100', 'bg-gray-100', 'bg-orange-100'];
                      const textColors = ['text-yellow-700', 'text-gray-700', 'text-orange-700'];

                      return (
                        <div
                          key={referrer.id}
                          className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 border border-green-100 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div
                            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                              index < 3 ? bgColors[index] : 'bg-green-100'
                            } ${index < 3 ? textColors[index] : 'text-green-700'} font-bold text-xs sm:text-sm`}
                            style={
                              index < 3 ? { boxShadow: `0 0 10px ${medalColors[index]}40` } : {}
                            }
                          >
                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{referrer.name}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">
                              {referrer.referral_code}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-green-600 text-xs sm:text-sm">
                              {referrer.referral_count} refs
                            </div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              ₹{parseFloat(referrer.balance).toFixed(0)}
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
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg text-green-900 dark:text-green-100">
                  Program Details
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Referral bonus structure</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200">
                    <div className="font-semibold text-green-900 dark:text-green-100 mb-1 sm:mb-2 text-sm">
                      Referrer Bonus
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">₹20</div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Per successful referral</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200">
                    <div className="font-semibold text-green-900 dark:text-green-100 mb-1 sm:mb-2 text-sm">
                      Referee Bonus
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">₹10</div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      Welcome bonus for new users
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200">
                    <div className="font-semibold text-green-900 dark:text-green-100 mb-1 sm:mb-2 text-sm">
                      Total Impact
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">₹30</div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Per successful referral</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Referrer Bonuses</CardTitle>
                <Gift className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-purple-700">
                  ₹{stats?.total_referrer_bonus || 0}
                </div>
                <p className="text-[10px] sm:text-xs text-purple-600">Total paid to referrers</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Referee Bonuses</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-blue-700">
                  ₹{stats?.total_referee_bonus || 0}
                </div>
                <p className="text-[10px] sm:text-xs text-blue-600">Total paid to new users</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Redeemed</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-green-700">
                  ₹{stats?.total_redeemed || 0}
                </div>
                <p className="text-[10px] sm:text-xs text-green-600">Used on orders</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
