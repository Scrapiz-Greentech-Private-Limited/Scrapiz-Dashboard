'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Search, 
  RefreshCw, 
  X,
  Download,
  UserPlus,
  TrendingUp
} from "lucide-react"
import { UserService, UserProfile, UserStatsResponse } from "@/components/backend/apiService"
import { useToast } from "@/hooks/use-toast"
import { showApiError, showSuccess } from "@/lib/toast-helpers"
import { CardSkeleton } from "@/components/dashboard/card-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import UsersTableEnhanced from "@/components/dashboard/users-table-enhanced"

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<UserStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const { toast } = useToast()

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await UserService.getAllUsers()
      setUsers(data)
    } catch (error: any) {
      showApiError(error, "Failed to Load Users")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await UserService.getUserStats()
      setStats(statsData)
    } catch (error: any) {
      // Stats are optional, don't show error
      console.warn('Failed to fetch user stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [fetchUsers, fetchStats])

  const handleRefresh = () => {
    fetchUsers()
    fetchStats()
  }

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone_number?.toLowerCase().includes(query) ||
        user.referral_code?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter === 'active' && !user.is_active) return false
    if (statusFilter === 'inactive' && user.is_active) return false

    // Role filter
    if (roleFilter === 'admin' && !user.is_superuser) return false
    if (roleFilter === 'staff' && (!user.is_staff || user.is_superuser)) return false
    if (roleFilter === 'user' && (user.is_staff || user.is_superuser)) return false

    // Gender filter
    if (genderFilter !== 'all' && user.gender !== genderFilter) return false

    return true
  })

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setRoleFilter('all')
    setGenderFilter('all')
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || roleFilter !== 'all' || genderFilter !== 'all'

  // Calculate stats from local data if API stats not available
  const displayStats = stats || {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    staff: users.filter(u => u.is_staff || u.is_superuser).length,
    superusers: users.filter(u => u.is_superuser).length,
    regular_users: users.filter(u => !u.is_staff && !u.is_superuser).length,
    with_orders: users.filter(u => u.orders && u.orders.length > 0).length,
    with_referrals: users.filter(u => u.referral_code).length,
    gender: {
      male: users.filter(u => u.gender === 'male').length,
      female: users.filter(u => u.gender === 'female').length,
      other: users.filter(u => u.gender !== 'male' && u.gender !== 'female').length
    },
    recent_signups: 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage all registered users, their accounts, and permissions
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading && users.length === 0 ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                roleFilter === 'all' && statusFilter === 'all' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-transparent hover:border-primary/50'
              }`}
              onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All registered accounts
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                statusFilter === 'active' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                  : 'border-transparent hover:border-green-500/50'
              }`}
              onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{displayStats.active}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active accounts
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                statusFilter === 'inactive' 
                  ? 'border-red-500 bg-red-50 dark:bg-red-950' 
                  : 'border-transparent hover:border-red-500/50'
              }`}
              onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{displayStats.inactive}</div>
                <p className="text-xs text-muted-foreground">
                  Deactivated accounts
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                roleFilter === 'staff' || roleFilter === 'admin'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' 
                  : 'border-transparent hover:border-purple-500/50'
              }`}
              onClick={() => setRoleFilter(roleFilter === 'staff' ? 'all' : 'staff')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff & Admins</CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{displayStats.staff}</div>
                <p className="text-xs text-muted-foreground">
                  {displayStats.superusers} superusers
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading && users.length === 0 ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users with Orders</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{displayStats.with_orders}</div>
                <p className="text-xs text-muted-foreground">
                  Have placed at least one order
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                <UserPlus className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600">{displayStats.regular_users}</div>
                <p className="text-xs text-muted-foreground">
                  App users (non-staff)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Referral Codes</CardTitle>
                <Users className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{displayStats.with_referrals}</div>
                <p className="text-xs text-muted-foreground">
                  Have referral codes assigned
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find users by name, email, phone, or referral code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Superusers</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="user">Regular Users</SelectItem>
                </SelectContent>
              </Select>

              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                  </Badge>
                )}
                {roleFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Role: {roleFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setRoleFilter('all')} />
                  </Badge>
                )}
                {genderFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Gender: {genderFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setGenderFilter('all')} />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Showing {filteredUsers.length} of {users.length} users
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UsersTableEnhanced 
            users={filteredUsers} 
            onUserUpdated={handleRefresh}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>
    </div>
  )
}
