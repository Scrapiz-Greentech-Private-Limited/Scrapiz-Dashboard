'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PlusCircle, Users, TrendingUp, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AgentService } from "@/services/agent"
import type { AgentListItem, AgentStats } from "@/types/agent"
import { showError, showSuccess } from "@/lib/toast-helpers"
import AgentsTableClient from "@/components/dashboard/agents-table-client"
import AddAgentDialog from "@/components/dashboard/add-agent-dialog"

export default function AgentsPage() {
  // State for agents data
  const [agents, setAgents] = useState<AgentListItem[]>([])
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  
  // Loading and error states
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [agentsError, setAgentsError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  
  // Add agent dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // Refs to prevent duplicate calls
  const hasFetchedInitially = useRef(false)
  const isFetchingAgents = useRef(false)
  const isFetchingStats = useRef(false)

  // Fetch all agents from API (no pagination)
  const fetchAgents = useCallback(async () => {
    if (isFetchingAgents.current) return
    
    isFetchingAgents.current = true
    setIsLoadingAgents(true)
    setAgentsError(null)
    try {
      const response = await AgentService.getAgents({})
      setAgents(response.results)
      setTotalCount(response.count)
    } catch (error: any) {
      setAgentsError(error.message || 'Failed to load agents')
      showError(error.message || 'Failed to load agents')
    } finally {
      setIsLoadingAgents(false)
      isFetchingAgents.current = false
    }
  }, [])

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    if (isFetchingStats.current) return
    
    isFetchingStats.current = true
    setIsLoadingStats(true)
    setStatsError(null)
    try {
      const statsData = await AgentService.getStats()
      setStats(statsData)
    } catch (error: any) {
      setStatsError(error.message || 'Failed to load statistics')
    } finally {
      setIsLoadingStats(false)
      isFetchingStats.current = false
    }
  }, [])

  // Initial data fetch - only runs once
  useEffect(() => {
    if (hasFetchedInitially.current) return
    hasFetchedInitially.current = true
    
    fetchAgents()
    fetchStats()
  }, [fetchAgents, fetchStats])

  // Handle agent created
  const handleAgentCreated = useCallback(() => {
    setIsAddDialogOpen(false)
    showSuccess('Agent created successfully')
    fetchAgents()
    fetchStats()
  }, [fetchAgents, fetchStats])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchAgents()
    fetchStats()
  }, [fetchAgents, fetchStats])

  // Render statistics skeleton
  const renderStatsSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Render statistics cards
  const renderStatsCards = () => {
    if (isLoadingStats) return renderStatsSkeleton()
    
    if (statsError || !stats) {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load statistics</span>
            <Button variant="ghost" size="sm" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </Card>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-purple-100">All registered agents</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Agents</CardTitle>
            <CheckCircle className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.active}</div>
            <p className="text-xs text-green-100">Currently working</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Inactive</CardTitle>
            <Clock className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.inactive}</div>
            <p className="text-xs text-orange-100">Not available</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total_orders}</div>
            <p className="text-xs text-cyan-100">Completed & assigned</p>
          </CardContent>
        </Card>

        <Card 
          className="transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Avg Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {parseFloat(stats.average_rating).toFixed(1)} ⭐
            </div>
            <p className="text-xs text-pink-100">Overall performance</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render agents table skeleton
  const renderTableSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )

  // Render agents error state
  const renderAgentsError = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">{agentsError}</p>
      <Button variant="outline" onClick={fetchAgents}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Management</h2>
          <p className="text-muted-foreground">View, manage, and track your pickup agents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoadingAgents || isLoadingStats}>
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingAgents || isLoadingStats) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {renderStatsCards()}

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
          <CardDescription>
            {isLoadingAgents ? 'Loading agents...' : `Showing ${totalCount} pickup agents`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAgents ? (
            renderTableSkeleton()
          ) : agentsError ? (
            renderAgentsError()
          ) : (
            <AgentsTableClient 
              agents={agents}
              onRefresh={fetchAgents}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Agent Dialog */}
      <AddAgentDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAgentCreated}
      />
    </div>
  )
}
