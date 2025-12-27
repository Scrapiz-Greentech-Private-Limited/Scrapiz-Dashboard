'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AuditService, AuditLog, AuditLogFilters } from "@/components/backend/apiService"
import { useToast } from "@/hooks/use-toast"
import { Shield, Search, Loader2, FileText, Calendar, Filter, X } from "lucide-react"
import AuditLogsTableClient from "@/components/dashboard/audit-logs-table-client"

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadAuditLogs()
  }, [])

  const loadAuditLogs = async (filters?: AuditLogFilters) => {
    try {
      setLoading(true)
      const data = await AuditService.getAuditLogs(filters)
      setAuditLogs(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load audit logs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    const filters: AuditLogFilters = {}
    
    if (actionFilter !== 'all') {
      filters.action = actionFilter
    }
    
    if (startDate) {
      filters.start_date = startDate
    }
    
    if (endDate) {
      filters.end_date = endDate
    }
    
    loadAuditLogs(filters)
  }

  const handleClearFilters = () => {
    setActionFilter('all')
    setStartDate('')
    setEndDate('')
    setSearchQuery('')
    loadAuditLogs()
  }

  // Filter logs based on search query (client-side)
  const filteredLogs = auditLogs.filter(log => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      log.user?.email?.toLowerCase().includes(query) ||
      log.user?.name?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query) ||
      log.ip_address?.toLowerCase().includes(query)
    )
  })

  const stats = {
    total: auditLogs.length,
    login: auditLogs.filter(l => l.action?.toLowerCase() === 'login').length,
    logout: auditLogs.filter(l => l.action?.toLowerCase() === 'logout').length,
    passwordReset: auditLogs.filter(l => l.action?.toLowerCase() === 'password_reset').length,
    accountDeleted: auditLogs.filter(l => l.action?.toLowerCase() === 'account_deleted').length,
    oauthLogin: auditLogs.filter(l => l.action?.toLowerCase() === 'oauth_login' || l.action?.toLowerCase() === 'apple_oauth_login').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">Track administrative actions and security events</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats.total}</div>
            <p className="text-xs text-purple-600">All audit entries</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logins</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.login}</div>
            <p className="text-xs text-green-600">Login events</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OAuth Logins</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.oauthLogin}</div>
            <p className="text-xs text-blue-600">Google OAuth</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Password Resets</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.passwordReset}</div>
            <p className="text-xs text-orange-600">Reset events</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deletions</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.accountDeleted}</div>
            <p className="text-xs text-red-600">Account deletions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by action type and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="oauth_login">Google OAuth Login</SelectItem>
                  <SelectItem value="apple_oauth_login">Apple OAuth Login</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="account_deleted">Account Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex items-end gap-2">
              <Button onClick={handleApplyFilters} className="flex-1 bg-green-600 hover:bg-green-700">
                <Filter className="h-4 w-4 mr-2" />
                Apply
              </Button>
              <Button onClick={handleClearFilters} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Audit Logs</CardTitle>
          <CardDescription>Search by user email, name, action, or IP address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {auditLogs.length} audit logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogsTableClient auditLogs={filteredLogs} />
        </CardContent>
      </Card>
    </div>
  )
}
