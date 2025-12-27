'use client'

import * as React from "react"
import { MoreHorizontal, Star, Search, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { AgentListItem, AgentStatus, KycStatus } from "@/types/agent"
import AgentDetailsDialog from "./agent-details-dialog"

interface AgentsTableClientProps {
  agents: AgentListItem[]
  onRefresh: () => void
}

// Status badge variants
const statusVariant: Record<AgentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  'active': "default",
  'onboarding': "secondary",
  'inactive': "outline",
  'suspended': "destructive",
}

const kycStatusVariant: Record<KycStatus, "default" | "secondary" | "destructive"> = {
  'verified': "default",
  'pending': "secondary",
  'rejected': "destructive",
}

export default function AgentsTableClient({ agents, onRefresh }: AgentsTableClientProps) {
  const [selectedAgent, setSelectedAgent] = React.useState<AgentListItem | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [kycFilter, setKycFilter] = React.useState<string>('all')
  const [defaultTab, setDefaultTab] = React.useState<string>('overview')

  // Filter agents locally (no API calls)
  const filteredAgents = React.useMemo(() => {
    return agents.filter(agent => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase()
        const matchesSearch = 
          agent.name.toLowerCase().includes(search) ||
          agent.phone.toLowerCase().includes(search) ||
          agent.email.toLowerCase().includes(search) ||
          agent.agent_code.toLowerCase().includes(search)
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (statusFilter !== 'all' && agent.status !== statusFilter) {
        return false
      }
      
      // KYC filter
      if (kycFilter !== 'all' && agent.kyc_status !== kycFilter) {
        return false
      }
      
      return true
    })
  }, [agents, searchValue, statusFilter, kycFilter])

  const handleViewDetails = (agent: AgentListItem) => {
    setSelectedAgent(agent)
    setDefaultTab('overview')
    setIsDetailsOpen(true)
  }

  const handleManageDocuments = (agent: AgentListItem) => {
    setSelectedAgent(agent)
    setDefaultTab('documents')
    setIsDetailsOpen(true)
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Status" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={kycFilter} onValueChange={setKycFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="KYC Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All KYC</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead>Vehicle No.</TableHead>
              <TableHead>Coverage Location</TableHead>
              <TableHead className="hidden md:table-cell">Today's Orders</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No agents found
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={agent.profile_image_url || undefined} alt={agent.name} />
                        <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[agent.status]} className="capitalize">
                      {agent.status_display}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={kycStatusVariant[agent.kyc_status]} className="capitalize">
                      {agent.kyc_status_display}
                    </Badge>
                  </TableCell>
                  <TableCell>{agent.vehicle_number || 'N/A'}</TableCell>
                  <TableCell>
                    <span className="text-sm">{agent.coverage_location || 'Not set'}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    {agent.today_orders}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span>{parseFloat(agent.average_rating).toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(agent)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageDocuments(agent)}>
                          Manage Documents
                        </DropdownMenuItem>
                        <DropdownMenuItem>Track Location</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Show count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredAgents.length} of {agents.length} agents
      </p>

      {/* Agent Details Dialog */}
      {selectedAgent && (
        <AgentDetailsDialog
          agentId={selectedAgent.id}
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onAgentUpdated={onRefresh}
          defaultTab={defaultTab}
        />
      )}
    </div>
  )
}
