'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  MapPin, User as UserIcon, Phone, Truck, Star, FileText, 
  BarChart2, IndianRupee, Mail, Calendar, CheckCircle, XCircle,
  Clock, AlertCircle, History, Loader2, ExternalLink, Upload,
  Eye, Plus, Settings, StarIcon
} from "lucide-react"
import { format } from "date-fns"
import { AgentService } from "@/services/agent"
import type { Agent, AgentDocument, AgentAuditLog, AgentStatus, KycStatus, VerificationStatus, DocumentType, AvailabilityStatus } from "@/types/agent"
import { showError, showSuccess } from "@/lib/toast-helpers"
import DocumentUploadDialog from "./document-upload-dialog"
import DocumentViewerDialog from "./document-viewer-dialog"

interface AgentDetailsDialogProps {
  agentId: number
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onAgentUpdated?: () => void
  defaultTab?: string
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

const verificationStatusVariant: Record<VerificationStatus, "default" | "secondary" | "destructive"> = {
  'verified': "default",
  'pending': "secondary",
  'rejected': "destructive",
}

// Status options for dropdown
const statusOptions: { value: AgentStatus; label: string; description: string }[] = [
  { value: 'onboarding', label: 'Onboarding', description: 'New agent, completing setup' },
  { value: 'active', label: 'Active', description: 'Fully operational, can receive orders' },
  { value: 'inactive', label: 'Inactive', description: 'Temporarily not available' },
  { value: 'suspended', label: 'Suspended', description: 'Account suspended, cannot operate' },
]

// Availability options for dropdown
const availabilityOptions: { value: AvailabilityStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'on_duty', label: 'On Duty' },
  { value: 'offline', label: 'Offline' },
]

export default function AgentDetailsDialog({ 
  agentId, 
  isOpen, 
  onOpenChange,
  onAgentUpdated,
  defaultTab = 'overview'
}: AgentDetailsDialogProps) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifyingDocId, setVerifyingDocId] = useState<number | null>(null)
  
  // Document dialogs
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<AgentDocument | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  
  // Rejection reason dialog
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  
  // Status and rating management
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false)
  const [isAddingRating, setIsAddingRating] = useState(false)
  const [newRating, setNewRating] = useState<string>('')
  
  // Coverage location management
  const [isUpdatingCoverageLocation, setIsUpdatingCoverageLocation] = useState(false)
  const [coverageLocationInput, setCoverageLocationInput] = useState<string>('')

  // Fetch agent details
  useEffect(() => {
    if (isOpen && agentId) {
      fetchAgentDetails()
    }
  }, [isOpen, agentId])

  const fetchAgentDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const agentData = await AgentService.getAgent(agentId)
      setAgent(agentData)
    } catch (err: any) {
      setError(err.message || 'Failed to load agent details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    if (auditLogs.length > 0) return // Already loaded
    setIsLoadingAudit(true)
    try {
      const response = await AgentService.getAuditLogs(agentId)
      // Handle both array and paginated response formats
      const logs = Array.isArray(response) ? response : (response as any)?.results || []
      setAuditLogs(logs)
    } catch (err: any) {
      showError('Failed to load audit history')
      setAuditLogs([]) // Ensure it's always an array
    } finally {
      setIsLoadingAudit(false)
    }
  }

  const handleVerifyDocument = async (docId: number) => {
    setVerifyingDocId(docId)
    try {
      await AgentService.verifyDocument(agentId, docId, { action: 'verify' })
      showSuccess('Document verified successfully')
      fetchAgentDetails()
      onAgentUpdated?.()
    } catch (err: any) {
      showError(err.message || 'Failed to verify document')
    } finally {
      setVerifyingDocId(null)
    }
  }

  const handleRejectDocument = async (docId: number) => {
    if (!rejectionReason.trim()) {
      showError('Please provide a rejection reason')
      return
    }
    
    setVerifyingDocId(docId)
    try {
      await AgentService.verifyDocument(agentId, docId, { 
        action: 'reject',
        rejection_reason: rejectionReason 
      })
      showSuccess('Document rejected')
      setRejectingDocId(null)
      setRejectionReason('')
      fetchAgentDetails()
      onAgentUpdated?.()
    } catch (err: any) {
      showError(err.message || 'Failed to reject document')
    } finally {
      setVerifyingDocId(null)
    }
  }

  const handleViewDocument = (doc: AgentDocument) => {
    setViewingDocument(doc)
    setIsViewerOpen(true)
  }

  const handleDocumentUploaded = () => {
    fetchAgentDetails()
    onAgentUpdated?.()
  }

  // Handle status change
  const handleStatusChange = async (newStatus: AgentStatus) => {
    if (!agent || agent.status === newStatus) return
    
    setIsUpdatingStatus(true)
    try {
      await AgentService.updateStatus(agentId, newStatus)
      showSuccess(`Agent status updated to ${newStatus}`)
      fetchAgentDetails()
      // Reset audit logs so they reload with new data
      setAuditLogs([])
      onAgentUpdated?.()
    } catch (err: any) {
      showError(err.message || 'Failed to update status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle availability change
  const handleAvailabilityChange = async (newAvailability: AvailabilityStatus) => {
    if (!agent || agent.availability === newAvailability) return
    
    setIsUpdatingAvailability(true)
    try {
      await AgentService.updateAvailability(agentId, newAvailability)
      showSuccess(`Agent availability updated to ${newAvailability}`)
      fetchAgentDetails()
      setAuditLogs([])
      onAgentUpdated?.()
    } catch (err: any) {
      showError(err.message || 'Failed to update availability')
    } finally {
      setIsUpdatingAvailability(false)
    }
  }

  // Handle adding a new rating
  const handleAddRating = async () => {
    const rating = parseFloat(newRating)
    if (isNaN(rating) || rating < 0 || rating > 5) {
      showError('Please enter a valid rating between 0 and 5')
      return
    }
    
    setIsAddingRating(true)
    try {
      const result = await AgentService.addRating(agentId, rating)
      showSuccess(`Rating added! New average: ${parseFloat(result.average_rating).toFixed(1)}`)
      setNewRating('')
      fetchAgentDetails()
      setAuditLogs([])
      onAgentUpdated?.()
    } catch (err: any) {
      showError(err.message || 'Failed to add rating')
    } finally {
      setIsAddingRating(false)
    }
  }

  // Handle coverage location update
  const handleUpdateCoverageLocation = async () => {
    if (!agent) return
    
    setIsUpdatingCoverageLocation(true)
    try {
      await AgentService.updateAgent(agentId, { coverage_location: coverageLocationInput || null })
      showSuccess('Coverage location updated successfully')
      fetchAgentDetails()
      setAuditLogs([])
      onAgentUpdated?.()
    } catch (err: any) {
      showError(err.message || 'Failed to update coverage location')
    } finally {
      setIsUpdatingCoverageLocation(false)
    }
  }

  // Initialize coverage location input when agent loads
  useEffect(() => {
    if (agent) {
      setCoverageLocationInput(agent.coverage_location || '')
    }
  }, [agent])

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get existing document types
  const existingDocTypes: DocumentType[] = agent?.documents.map(d => d.document_type) || []

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48 md:col-span-2" />
      </div>
    </div>
  )

  // Render error state
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">{error}</p>
      <Button variant="outline" onClick={fetchAgentDetails}>
        Try Again
      </Button>
    </div>
  )

  if (!isOpen) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={isLoading || error || !agent ? 'sr-only' : 'text-2xl'}>
              {agent ? agent.name : 'Agent Details'}
            </DialogTitle>
            {agent && (
              <DialogDescription className="flex items-center gap-2">
                <span>{agent.email}</span>
                <span>|</span>
                <span>{agent.phone}</span>
              </DialogDescription>
            )}
          </DialogHeader>
          {isLoading ? (
            renderSkeleton()
          ) : error ? (
            renderError()
          ) : agent ? (
            <>
              <div className="flex items-center gap-4 -mt-2">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={agent.profile_image_url || undefined} alt={agent.name} />
                  <AvatarFallback className="text-lg">{getInitials(agent.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-2xl font-semibold">{agent.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={statusVariant[agent.status]} className="capitalize">
                      {agent.status_display}
                    </Badge>
                    <Badge variant={kycStatusVariant[agent.kyc_status]} className="capitalize">
                      KYC: {agent.kyc_status_display}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium">
                        {parseFloat(agent.average_rating).toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue={defaultTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="manage">Manage</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="service-areas">Service Areas</TabsTrigger>
                  <TabsTrigger value="audit" onClick={fetchAuditLogs}>Audit History</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Personal Info */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <UserIcon className="w-4 h-4" /> Personal Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{agent.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{agent.phone}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span>{agent.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Joined {format(new Date(agent.created_at), "PP")}</span>
                        </div>
                        <div className="flex items-start gap-2 pt-2 border-t">
                          <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                          <div>
                            <span className="font-medium">Coverage Location:</span>
                            <p className="text-muted-foreground">{agent.coverage_location || 'Not set'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Vehicle Details */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Truck className="w-4 h-4" /> Vehicle Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <p><strong>Vehicle No:</strong> {agent.vehicle_number || 'N/A'}</p>
                        <p><strong>Vehicle Type:</strong> {agent.vehicle_type || 'N/A'}</p>
                        <p><strong>Daily Capacity:</strong> {agent.daily_capacity} orders</p>
                        <p><strong>Today's Orders:</strong> {agent.current_day_orders}/{agent.daily_capacity}</p>
                      </CardContent>
                    </Card>

                    {/* Performance Metrics */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart2 className="w-4 h-4" /> Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold">{agent.today_orders}</p>
                            <p className="text-xs text-muted-foreground">Today</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{agent.total_orders}</p>
                            <p className="text-xs text-muted-foreground">Total Orders</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{agent.completed_orders}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{agent.rating_count}</p>
                            <p className="text-xs text-muted-foreground">Ratings</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Weight Collected */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" /> Collection Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold">{parseFloat(agent.total_weight_collected).toFixed(1)} kg</p>
                          <p className="text-xs text-muted-foreground">Total Weight Collected</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{agent.is_eligible ? 'Yes' : 'No'}</p>
                          <p className="text-xs text-muted-foreground">Eligible for Orders</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold capitalize">{agent.availability_display}</p>
                          <p className="text-xs text-muted-foreground">Availability</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Manage Tab - Status and Rating Management */}
                <TabsContent value="manage" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status Management */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Settings className="w-4 h-4" /> Status Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="agent-status">Agent Status</Label>
                          <Select
                            value={agent.status}
                            onValueChange={(value) => handleStatusChange(value as AgentStatus)}
                            disabled={isUpdatingStatus}
                          >
                            <SelectTrigger id="agent-status" className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex flex-col">
                                    <span>{option.label}</span>
                                    <span className="text-xs text-muted-foreground">{option.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isUpdatingStatus && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating status...
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="agent-availability">Availability</Label>
                          <Select
                            value={agent.availability}
                            onValueChange={(value) => handleAvailabilityChange(value as AvailabilityStatus)}
                            disabled={isUpdatingAvailability}
                          >
                            <SelectTrigger id="agent-availability" className="w-full">
                              <SelectValue placeholder="Select availability" />
                            </SelectTrigger>
                            <SelectContent>
                              {availabilityOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isUpdatingAvailability && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating availability...
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            <strong>Current Status:</strong> {agent.status_display}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>KYC Status:</strong> {agent.kyc_status_display}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Note: KYC status is automatically updated based on document verification.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rating Management */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Star className="w-4 h-4" /> Rating Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                            <span className="text-3xl font-bold">
                              {parseFloat(agent.average_rating).toFixed(1)}
                            </span>
                            <span className="text-xl text-muted-foreground">/5</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Based on {agent.rating_count} rating{agent.rating_count !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-rating">Add New Rating</Label>
                          <div className="flex gap-2">
                            <Input
                              id="new-rating"
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              placeholder="Enter rating (0-5)"
                              value={newRating}
                              onChange={(e) => setNewRating(e.target.value)}
                              disabled={isAddingRating}
                              className="flex-1"
                            />
                            <Button
                              onClick={handleAddRating}
                              disabled={isAddingRating || !newRating}
                            >
                              {isAddingRating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This will add a new rating and recalculate the average.
                          </p>
                        </div>

                        {/* Quick rating buttons */}
                        <div className="space-y-2">
                          <Label>Quick Rating</Label>
                          <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <Button
                                key={rating}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setNewRating(rating.toString())
                                }}
                                disabled={isAddingRating}
                                className="flex items-center gap-1"
                              >
                                {rating}
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Coverage Location Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Coverage Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="coverage-location">Coverage Location / Area</Label>
                        <div className="flex gap-2">
                          <Input
                            id="coverage-location"
                            placeholder="Enter coverage location (e.g., North Delhi, Sector 15)"
                            value={coverageLocationInput}
                            onChange={(e) => setCoverageLocationInput(e.target.value)}
                            disabled={isUpdatingCoverageLocation}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleUpdateCoverageLocation}
                            disabled={isUpdatingCoverageLocation || coverageLocationInput === (agent.coverage_location || '')}
                          >
                            {isUpdatingCoverageLocation ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Update'
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Current: {agent.coverage_location || 'Not set'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Agent Info Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Agent Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold">{agent.total_orders}</p>
                          <p className="text-xs text-muted-foreground">Total Orders</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold">{agent.completed_orders}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold">{agent.service_areas.length}</p>
                          <p className="text-xs text-muted-foreground">Service Areas</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold">{agent.is_eligible ? 'Yes' : 'No'}</p>
                          <p className="text-xs text-muted-foreground">Eligible</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4" /> KYC Documents
                        </CardTitle>
                        <Button 
                          size="sm" 
                          onClick={() => setIsUploadDialogOpen(true)}
                          disabled={existingDocTypes.length >= 3}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Upload Document
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Document Status Summary */}
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span>Documents Uploaded: {agent.documents.length}/3</span>
                          <span>
                            Verified: {agent.documents.filter(d => d.verification_status === 'verified').length}/3
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {['aadhaar', 'pan', 'driving_license'].map((type) => {
                            const doc = agent.documents.find(d => d.document_type === type)
                            return (
                              <Badge 
                                key={type}
                                variant={
                                  doc?.verification_status === 'verified' ? 'default' :
                                  doc?.verification_status === 'pending' ? 'secondary' :
                                  doc?.verification_status === 'rejected' ? 'destructive' :
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {type === 'aadhaar' ? 'Aadhaar' : 
                                 type === 'pan' ? 'PAN' : 'DL'}
                                {doc ? (doc.verification_status === 'verified' ? ' ✓' : 
                                        doc.verification_status === 'rejected' ? ' ✗' : ' ⏳') : ' -'}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>

                      {agent.documents.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground mb-4">
                            No documents uploaded yet
                          </p>
                          <Button onClick={() => setIsUploadDialogOpen(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload First Document
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {agent.documents.map((doc) => (
                            <div 
                              key={doc.id} 
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div 
                                  className="p-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  <FileText className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{doc.document_type_display}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Uploaded {format(new Date(doc.uploaded_at), "PPp")}
                                  </p>
                                  {doc.verified_at && (
                                    <p className="text-xs text-muted-foreground">
                                      {doc.verification_status === 'verified' ? 'Verified' : 'Reviewed'}{' '}
                                      {format(new Date(doc.verified_at), "PPp")}
                                      {doc.verified_by_email && ` by ${doc.verified_by_email}`}
                                    </p>
                                  )}
                                  {doc.rejection_reason && (
                                    <p className="text-xs text-destructive mt-1">
                                      Reason: {doc.rejection_reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={verificationStatusVariant[doc.verification_status]}>
                                  {doc.verification_status_display}
                                </Badge>
                                
                                {/* View Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDocument(doc)}
                                  title="View Document"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                
                                {/* Open in new tab */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  title="Open in new tab"
                                >
                                  <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                                
                                {/* Verification Actions */}
                                {doc.verification_status === 'pending' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleVerifyDocument(doc.id)}
                                      disabled={verifyingDocId === doc.id}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      title="Verify Document"
                                    >
                                      {verifyingDocId === doc.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4" />
                                      )}
                                    </Button>
                                    
                                    {rejectingDocId === doc.id ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          placeholder="Rejection reason..."
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          className="w-48 h-8 text-sm"
                                        />
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleRejectDocument(doc.id)}
                                          disabled={verifyingDocId === doc.id}
                                        >
                                          {verifyingDocId === doc.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            'Reject'
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setRejectingDocId(null)
                                            setRejectionReason('')
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setRejectingDocId(doc.id)}
                                        disabled={verifyingDocId === doc.id}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        title="Reject Document"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Service Areas Tab */}
                <TabsContent value="service-areas" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Assigned Service Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {agent.service_areas.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          No service areas assigned
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {agent.service_areas.map((area) => (
                            <div 
                              key={area.id} 
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{area.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {area.city_name}, {area.city_state}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Pincode: {area.pincode_code}
                                </p>
                              </div>
                              <Badge variant={area.city_status === 'available' ? 'default' : 'secondary'}>
                                {area.city_status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Audit History Tab */}
                <TabsContent value="audit" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <History className="w-4 h-4" /> Audit History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingAudit ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-4">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : auditLogs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          No audit history available
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {auditLogs.map((log) => (
                            <div 
                              key={log.id} 
                              className="flex items-start gap-4 p-4 border rounded-lg"
                            >
                              <div className="p-2 bg-muted rounded-full">
                                <Clock className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">{log.action_display}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(log.timestamp), "PPp")}
                                  </span>
                                </div>
                                {log.actor_name && (
                                  <p className="text-sm text-muted-foreground">
                                    By: {log.actor_name} ({log.actor_email})
                                  </p>
                                )}
                                {log.details && (
                                  <p className="text-sm mt-1">{log.details}</p>
                                )}
                                {log.previous_value && log.new_value && (
                                  <div className="mt-2 text-xs bg-muted p-2 rounded">
                                    <p><strong>Changed:</strong></p>
                                    <p className="text-muted-foreground">
                                      From: {JSON.stringify(log.previous_value)}
                                    </p>
                                    <p className="text-muted-foreground">
                                      To: {JSON.stringify(log.new_value)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      {agent && (
        <DocumentUploadDialog
          agentId={agentId}
          agentName={agent.name}
          existingDocTypes={existingDocTypes}
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onSuccess={handleDocumentUploaded}
        />
      )}

      {/* Document Viewer Dialog */}
      <DocumentViewerDialog
        document={viewingDocument}
        isOpen={isViewerOpen}
        onOpenChange={setIsViewerOpen}
      />
    </>
  )
}
