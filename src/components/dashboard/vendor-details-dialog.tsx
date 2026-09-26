'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  AlertCircle,
  Clock3,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  History,
  Loader2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Truck,
  UserRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { showError, showSuccess } from '@/lib/toast-helpers'
import { VendorService } from '@/services/vendor'
import type {
  Vendor,
  VendorAssignedOrderItem,
  VendorAssignedOrdersResponse,
  VendorAuditLog,
  VendorDocument,
  VendorPaymentSummary,
  VendorStatus,
} from '@/types/vendor'

interface VendorDetailsDialogProps {
  vendorId: number | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onVendorUpdated?: () => void
}

const statusStyles: Record<VendorStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending_verification: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  suspended: 'bg-red-100 text-red-700 border-red-200',
}

const statusLabels: Record<VendorStatus, string> = {
  draft: 'Onboarding',
  pending_verification: 'Pending Verification',
  approved: 'Verified',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

const documentStatusStyles: Record<VendorDocument['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  resubmission_required: 'bg-orange-100 text-orange-800 border-orange-200',
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available'
  return format(new Date(value), 'dd MMM yyyy, hh:mm a')
}

const formatDocumentType = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

const formatAuditValue = (value?: Record<string, unknown> | null) => {
  if (!value) return null
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

const formatStatusLabel = (value?: string | null) =>
  (value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

const formatStateAge = (value?: number | null) => {
  if (typeof value !== 'number' || value < 0) return 'Not available'
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const getCountdownLabel = (deadline?: string | null, nowMs?: number) => {
  if (!deadline) return 'No deadline'
  const remainingMs = new Date(deadline).getTime() - (nowMs || Date.now())
  if (remainingMs <= 0) return 'Due now'
  const totalMinutes = Math.ceil(remainingMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`
}

export default function VendorDetailsDialog({
  vendorId,
  isOpen,
  onOpenChange,
  onVendorUpdated,
}: VendorDetailsDialogProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [documentReasons, setDocumentReasons] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingGate, setIsUpdatingGate] = useState(false)
  const [paymentSummary, setPaymentSummary] = useState<VendorPaymentSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [isUpdatingTrial, setIsUpdatingTrial] = useState(false)
  const [faceReuploadMessage, setFaceReuploadMessage] = useState('')
  const [isRequestingFaceReupload, setIsRequestingFaceReupload] = useState(false)
  const [isDeletingVendor, setIsDeletingVendor] = useState(false)
  const [trialDaysInput, setTrialDaysInput] = useState('15')
  const [assignmentData, setAssignmentData] = useState<VendorAssignedOrdersResponse | null>(null)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<VendorAssignedOrderItem | null>(null)
  const [isCountdownDialogOpen, setIsCountdownDialogOpen] = useState(false)
  const [countdownMinutesInput, setCountdownMinutesInput] = useState('20')
  const [countdownResolution, setCountdownResolution] = useState<'expire' | 'transfer'>('expire')
  const [countdownNote, setCountdownNote] = useState('')
  const [isAssignmentActionPending, setIsAssignmentActionPending] = useState(false)
  const [nowTick, setNowTick] = useState(() => Date.now())

  const loadVendor = async () => {
    if (!vendorId) return
    setIsLoading(true)
    setIsLoadingSummary(true)
    setIsLoadingAssignments(true)
    try {
      const [detail, summary, assignments] = await Promise.all([
        VendorService.getVendor(vendorId),
        VendorService.getPaymentSummary(vendorId),
        VendorService.getAssignedOrders(vendorId),
      ])
      setVendor(detail)
      setPaymentSummary(summary)
      setAssignmentData(assignments)
      if (detail.trial_duration_days !== undefined && detail.trial_duration_days !== null) {
        setTrialDaysInput(String(detail.trial_duration_days))
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load vendor details')
    } finally {
      setIsLoading(false)
      setIsLoadingSummary(false)
      setIsLoadingAssignments(false)
    }
  }

  useEffect(() => {
    if (isOpen && vendorId) {
      loadVendor()
    }
  }, [isOpen, vendorId])

  useEffect(() => {
    if (!isOpen) return
    const intervalId = window.setInterval(() => setNowTick(Date.now()), 30000)
    return () => window.clearInterval(intervalId)
  }, [isOpen])

  const documentSummary = useMemo(() => {
    const documents = vendor?.documents || []
    return {
      total: documents.length,
      approved: documents.filter((doc) => doc.status === 'approved').length,
      pending: documents.filter((doc) => doc.status === 'pending').length,
    }
  }, [vendor])

  const vendorAuditLogs = vendor?.audit_logs || []
  const biometricMetrics = vendor?.biometric_metrics
  const verificationReplay = biometricMetrics?.verification_replay || []
  const effectiveProfileImage = vendor?.effective_profile_image || vendor?.profile_image || vendor?.biometric?.source_image_url || null

  const handleVendorAction = async (action: 'approve' | 'reject' | 'suspend' | 'reinstate') => {
    if (!vendorId) return
    if ((action === 'reject' || action === 'suspend') && !reason.trim()) {
      showError('Please add a reason before continuing.')
      return
    }

    setIsSubmitting(true)
    try {
      if (action === 'approve') {
        await VendorService.approveVendor(vendorId)
      } else if (action === 'reject') {
        await VendorService.rejectVendor(vendorId, reason.trim())
      } else if (action === 'suspend') {
        await VendorService.suspendVendor(vendorId, reason.trim())
      } else {
        await VendorService.reinstateVendor(vendorId)
      }

      showSuccess(`Vendor ${action === 'approve' ? 'approved' : action === 'reinstate' ? 'reinstated' : action + 'd'} successfully`)
      setReason('')
      await loadVendor()
      onVendorUpdated?.()
    } catch (error: any) {
      showError(error.message || 'Failed to update vendor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGateToggle = async (checked: boolean) => {
    if (!vendorId) return
    setIsUpdatingGate(true)
    try {
      await VendorService.updatePendingAccess(vendorId, checked)
      showSuccess(`Pending-access gate ${checked ? 'enabled' : 'disabled'}`)
      await loadVendor()
      onVendorUpdated?.()
    } catch (error: any) {
      showError(error.message || 'Failed to update pending-access gate')
    } finally {
      setIsUpdatingGate(false)
    }
  }

  const handleVerifyDocument = async (documentId: number) => {
    if (!vendorId) return
    setIsSubmitting(true)
    try {
      await VendorService.verifyDocument(vendorId, documentId)
      showSuccess('Document verified successfully')
      await loadVendor()
      onVendorUpdated?.()
    } catch (error: any) {
      showError(error.message || 'Failed to verify document')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetTrialDays = async (days: number) => {
    if (!vendorId) return
    setIsUpdatingTrial(true)
    try {
      await VendorService.updateTrialPeriod(vendorId, days)
      showSuccess(`Trial period updated to ${days} day(s)`)
      await loadVendor()
      onVendorUpdated?.()
    } catch (error: any) {
      showError(error.message || 'Failed to update trial period')
    } finally {
      setIsUpdatingTrial(false)
    }
  }

  const handleRejectDocument = async (documentId: number) => {
    if (!vendorId) return
    const reasonText = documentReasons[documentId]?.trim()
    if (!reasonText) {
      showError('Please add a document review note before rejecting.')
      return
    }

    setIsSubmitting(true)
    try {
      await VendorService.rejectDocument(vendorId, documentId, reasonText)
      showSuccess('Document rejected')
      setDocumentReasons((current) => ({ ...current, [documentId]: '' }))
      await loadVendor()
      onVendorUpdated?.()
    } catch (error: any) {
      showError(error.message || 'Failed to reject document')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestFaceReupload = async () => {
    if (!vendorId) return

    setIsRequestingFaceReupload(true)
    try {
      await VendorService.requestFaceReupload(vendorId, faceReuploadMessage)
      showSuccess('Face re-upload request sent to vendor')
      setFaceReuploadMessage('')
      await loadVendor()
      onVendorUpdated?.()
    } catch (error: any) {
      showError(error.message || 'Failed to send face re-upload request')
    } finally {
      setIsRequestingFaceReupload(false)
    }
  }

  const handleDeleteVendor = async () => {
    if (!vendorId || !vendor) return

    const shouldDelete = window.confirm(
      `Delete vendor "${vendor.full_name}"? This will remove the vendor profile and related vendor records.`,
    )
    if (!shouldDelete) return

    setIsDeletingVendor(true)
    try {
      await VendorService.deleteVendor(vendorId)
      showSuccess('Vendor deleted successfully')
      onOpenChange(false)
      onVendorUpdated?.()
    } catch (error: any) {
      showError(error.message || 'Failed to delete vendor')
    } finally {
      setIsDeletingVendor(false)
    }
  }

  const openCountdownDialog = (assignment: VendorAssignedOrderItem) => {
    setSelectedAssignment(assignment)
    setCountdownMinutesInput(String(assignment.active_countdown?.countdown_minutes || 20))
    setCountdownResolution(
      assignment.active_countdown?.resolution_action === 'transfer' ? 'transfer' : 'expire',
    )
    setCountdownNote('')
    setIsCountdownDialogOpen(true)
  }

  const handleExpireAssignedOrder = async (assignment: VendorAssignedOrderItem) => {
    if (!vendorId) return
    const shouldExpire = window.confirm(
      `Expire assignment for order ${assignment.order_number}? This will return the order to the operations queue.`,
    )
    if (!shouldExpire) return

    setIsAssignmentActionPending(true)
    try {
      await VendorService.expireAssignedOrder(vendorId, assignment.order_id, reason || undefined)
      showSuccess(`Assignment for ${assignment.order_number} expired successfully`)
      await loadVendor()
      onVendorUpdated?.()
    } catch (error: any) {
      showError(error.message || 'Failed to expire assignment')
    } finally {
      setIsAssignmentActionPending(false)
    }
  }

  const handleArmCountdown = async () => {
    if (!vendorId || !selectedAssignment) return

    const countdownMinutes = Number(countdownMinutesInput)
    if (!Number.isFinite(countdownMinutes) || countdownMinutes <= 0) {
      showError('Please enter a valid countdown in minutes.')
      return
    }

    setIsAssignmentActionPending(true)
    try {
      await VendorService.scheduleAssignedOrderCountdown(vendorId, selectedAssignment.order_id, {
        countdown_minutes: countdownMinutes,
        resolution_action: countdownResolution,
        note: countdownNote,
      })
      showSuccess(`Countdown armed for ${selectedAssignment.order_number}`)
      setIsCountdownDialogOpen(false)
      setSelectedAssignment(null)
      setCountdownNote('')
      await loadVendor()
    } catch (error: any) {
      showError(error.message || 'Failed to arm countdown')
    } finally {
      setIsAssignmentActionPending(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b bg-slate-50 px-6 py-5">
          <DialogTitle className="text-2xl">
            {vendor?.full_name || 'Vendor details'}
          </DialogTitle>
          <DialogDescription>
            Review onboarding state, KYC documents, vehicle details, and app access controls.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[84vh]">
          {isLoading || !vendor ? (
            <div className="flex items-center justify-center px-6 py-20 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading vendor profile...
            </div>
          ) : (
            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <Card className="border-slate-200">
                  <CardHeader className="pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">{vendor.full_name}</CardTitle>
                        <CardDescription className="mt-1">
                          Vendor ID #{vendor.id} • Joined {formatDate(vendor.created_at)}
                        </CardDescription>
                      </div>
                      <Badge className={statusStyles[vendor.status]}>{statusLabels[vendor.status]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                        <UserRound className="h-4 w-4" />
                        Identity
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-slate-500">Full name:</span> {vendor.full_name}</div>
                        <div><span className="text-slate-500">Age:</span> {vendor.age ?? 'Not shared'}</div>
                        <div><span className="text-slate-500">Status:</span> {statusLabels[vendor.status]}</div>
                        <div><span className="text-slate-500">Can go online:</span> {vendor.can_go_online ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                        <MapPin className="h-4 w-4" />
                        Service Area
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-slate-500">City:</span> {vendor.service_city}</div>
                        <div><span className="text-slate-500">Area:</span> {vendor.service_area}</div>
                        <div><span className="text-slate-500">Live status:</span> {vendor.is_online ? 'Online' : 'Offline'}</div>
                        <div><span className="text-slate-500">Profile image:</span> {effectiveProfileImage ? 'Available' : 'Pending'}</div>
                        {vendor.requires_profile_image_upload ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                            Current vendor photo is required for pending or approved access.
                          </div>
                        ) : null}
                        {effectiveProfileImage ? (
                          <a href={effectiveProfileImage} target="_blank" rel="noreferrer" className="block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={effectiveProfileImage}
                              alt={`${vendor.full_name} profile`}
                              className="mt-2 h-28 w-28 rounded-xl border object-cover"
                            />
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Truck className="h-4 w-4" />
                        Vehicle
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-slate-500">Type:</span> {vendor.vehicle?.vehicle_type_display || 'Not added'}</div>
                        <div><span className="text-slate-500">Number:</span> {vendor.vehicle?.vehicle_number || 'Not added'}</div>
                        <div><span className="text-slate-500">Scale:</span> {vendor.vehicle?.weighing_scale_type_display || 'Not added'}</div>
                        <div><span className="text-slate-500">Vehicle UID:</span> {vendor.vehicle?.vehicle_uid || 'Not generated'}</div>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                        <ShieldCheck className="h-4 w-4" />
                        Verification
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-slate-500">Documents:</span> {documentSummary.approved}/{documentSummary.total} approved</div>
                        <div><span className="text-slate-500">Biometric:</span> {vendor.biometric?.is_verified ? 'Verified' : 'Pending'}</div>
                        <div><span className="text-slate-500">Pending docs:</span> {documentSummary.pending}</div>
                        <div><span className="text-slate-500">Review note:</span> {vendor.rejection_reason || 'No admin note'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-slate-950 text-white">
                  <CardHeader>
                    <CardTitle className="text-xl">Verification Controls</CardTitle>
                    <CardDescription className="text-slate-300">
                      Review outcome, vendor access, and the operational unlock for this vendor profile.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white">Approval behaviour</div>
                      <div className="mt-2 text-sm text-slate-200">
                        There is no separate vehicle-approval step right now. Approving the vendor profile is the action that operationally unlocks the account and allows the vendor to go online.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <Label htmlFor="pending-gate" className="text-sm font-medium text-white">
                        Allow app access while review is pending
                      </Label>
                      <p className="mt-1 text-sm text-slate-300">
                        When disabled, the vendor sees the hold screen until the profile is approved or manually reopened.
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-sm text-slate-200">
                          {vendor.allow_app_access_while_pending ? 'Access allowed during review' : 'Review hold screen enforced'}
                        </div>
                        <Switch
                          id="pending-gate"
                          checked={vendor.allow_app_access_while_pending}
                          disabled={vendor.status !== 'pending_verification' || isUpdatingGate}
                          onCheckedChange={handleGateToggle}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white">Lead Entitlement</div>
                      <div className="mt-2 text-sm text-slate-200">
                        {vendor.is_entitled_for_leads
                          ? 'Vendor can receive and accept leads.'
                          : 'Vendor cannot receive leads until trial or subscription is active.'}
                      </div>
                      <div className="mt-2 text-xs text-slate-300">
                        Trial: {vendor.has_active_trial ? 'Active' : 'Inactive'}
                        {' • '}
                        Subscription: {vendor.has_active_subscription ? 'Active' : 'Inactive'}
                        {' • '}
                        Live: {vendor.is_online ? 'Online' : 'Offline'}
                      </div>
                      <div className="mt-2 text-xs text-slate-300">
                        Trial window: {vendor.trial_started_at ? formatDate(vendor.trial_started_at) : 'Not set'} to {vendor.trial_ends_at ? formatDate(vendor.trial_ends_at) : 'Not set'}
                      </div>
                      <div className="mt-1 text-xs text-slate-300">
                        Subscription: {vendor.subscription_plan_name || 'None'} ({vendor.subscription_status || 'inactive'})
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white">Trial Controls</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[15, 30].map((days) => (
                          <Button
                            key={days}
                            size="sm"
                            variant="outline"
                            className="border-white/30 bg-white/5 text-white hover:bg-white/10"
                            disabled={isUpdatingTrial}
                            onClick={() => handleSetTrialDays(days)}
                          >
                            Set {days} days
                          </Button>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Input
                          value={trialDaysInput}
                          onChange={(event) => setTrialDaysInput(event.target.value)}
                          className="border-white/20 bg-white/5 text-white"
                          placeholder="Custom days"
                        />
                        <Button
                          size="sm"
                          disabled={isUpdatingTrial}
                          onClick={() => {
                            const days = Number(trialDaysInput)
                            if (!Number.isInteger(days) || days < 0) {
                              showError('Enter a valid non-negative trial duration')
                              return
                            }
                            handleSetTrialDays(days)
                          }}
                        >
                          Apply
                        </Button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-sm font-semibold text-white">Face Photo Refresh</div>
                        <p className="mt-2 text-sm text-slate-300">
                          Send a real-time apology and request to the vendor app asking for a fresh face image. The next upload will continue through the existing embedding pipeline.
                        </p>
                        <Textarea
                          value={faceReuploadMessage}
                          onChange={(event) => setFaceReuploadMessage(event.target.value)}
                          placeholder="Optional custom message for the vendor"
                          className="mt-3 min-h-24 border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                        />
                        <Button
                          disabled={isRequestingFaceReupload}
                          className="mt-3 bg-white text-slate-950 hover:bg-slate-100"
                          onClick={handleRequestFaceReupload}
                        >
                          {isRequestingFaceReupload ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
                          Request new face image
                        </Button>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-sm font-semibold text-white">Wallet and Subscription Mapping</div>
                      {isLoadingSummary || !paymentSummary ? (
                        <div className="mt-3 text-sm text-slate-300">Loading payment summary...</div>
                      ) : (
                        <div className="mt-3 space-y-2 text-xs text-slate-200">
                          <div>Wallet balance: ₹{Number(paymentSummary.wallet_balance || 0).toLocaleString('en-IN')}</div>
                          <div>Recharge total: ₹{Number(paymentSummary.totals.recharged_amount || 0).toLocaleString('en-IN')}</div>
                          <div>Subscription paid: ₹{Number(paymentSummary.totals.subscription_paid || 0).toLocaleString('en-IN')}</div>
                          <div>Platform charges: ₹{Number(paymentSummary.totals.platform_charges || 0).toLocaleString('en-IN')}</div>
                          <div>Customer payouts: ₹{Number(paymentSummary.totals.customer_payouts || 0).toLocaleString('en-IN')}</div>
                          <div>Lead credits: {Number(paymentSummary.entitlement.lead_credits_balance || 0).toLocaleString('en-IN')}</div>
                          <div>Recent transactions: {paymentSummary.transactions.length}</div>
                          {paymentSummary.transactions.slice(0, 5).map((txn) => {
                            const signed = Number(txn.signed_amount ?? txn.amount ?? 0);
                            const isCredit = txn.direction ? txn.direction === 'credit' : signed >= 0;
                            return (
                              <div key={txn.id} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span>{txn.type.replace(/_/g, ' ')}</span>
                                  <span className={isCredit ? 'text-emerald-300' : 'text-rose-300'}>
                                    {isCredit ? '+' : '-'}₹{Math.abs(signed).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-300">{new Date(txn.created_at).toLocaleString('en-IN')} • {txn.status}</div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="vendor-reason" className="text-slate-200">Admin note</Label>
                      <Textarea
                        id="vendor-reason"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Add a review note for rejection or suspension."
                        className="mt-2 min-h-28 border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                      />
                    </div>

                    <div className="grid gap-3">
                      {vendor.status === 'pending_verification' && (
                        <div className="grid grid-cols-2 gap-3">
                          <Button disabled={isSubmitting} onClick={() => handleVendorAction('approve')} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Approve vendor and enable ops
                          </Button>
                          <Button disabled={isSubmitting} variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50" onClick={() => handleVendorAction('reject')}>
                            Reject vendor
                          </Button>
                        </div>
                      )}

                      {vendor.status === 'approved' && (
                        <Button disabled={isSubmitting} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => handleVendorAction('suspend')}>
                          Suspend vendor
                        </Button>
                      )}

                      {vendor.status === 'suspended' && (
                        <Button disabled={isSubmitting} onClick={() => handleVendorAction('reinstate')}>
                          Reinstate vendor
                        </Button>
                      )}

                      <Button
                        disabled={isDeletingVendor}
                        variant="outline"
                        className="border-rose-300 text-rose-600 hover:bg-rose-50"
                        onClick={handleDeleteVendor}
                      >
                        {isDeletingVendor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete vendor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="documents" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="activity">Operational Snapshot</TabsTrigger>
                  <TabsTrigger value="assignments">Assigned Orders</TabsTrigger>
                  <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                </TabsList>

                <TabsContent value="documents">
                  <div className="grid gap-4">
                    {vendor.documents.length === 0 ? (
                      <Card>
                        <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
                          <AlertCircle className="h-5 w-5" />
                          No KYC documents uploaded yet.
                        </CardContent>
                      </Card>
                    ) : (
                      vendor.documents.map((document) => (
                        <Card key={document.id} className="border-slate-200">
                          <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <CardTitle className="text-lg">{formatDocumentType(document.document_type)}</CardTitle>
                                <CardDescription>
                                  Uploaded {formatDate(document.uploaded_at)} • Number {document.document_number}
                                </CardDescription>
                              </div>
                              <Badge className={documentStatusStyles[document.status]}>{document.status_display}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="grid gap-4 lg:grid-cols-[1fr_280px]">
                            <div className="space-y-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border p-3 text-sm">
                                  <div className="font-medium text-slate-900">Front image</div>
                                  <a href={document.document_front_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-emerald-700 underline">
                                    Open document
                                  </a>
                                </div>
                                <div className="rounded-xl border p-3 text-sm">
                                  <div className="font-medium text-slate-900">Back image</div>
                                  {document.document_back_url ? (
                                    <a href={document.document_back_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-emerald-700 underline">
                                      Open document
                                    </a>
                                  ) : (
                                    <div className="mt-2 text-muted-foreground">Not required</div>
                                  )}
                                </div>
                              </div>
                              <div className="rounded-xl border bg-slate-50 p-3 text-sm">
                                <div className="font-medium text-slate-900">Review note</div>
                                <div className="mt-1 text-muted-foreground">{document.rejection_reason || 'No review note added yet.'}</div>
                              </div>
                            </div>

                            <div className="space-y-3 rounded-2xl border bg-slate-50 p-4">
                              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <FileCheck2 className="h-4 w-4" />
                                Document review
                              </div>
                              <Input
                                value={documentReasons[document.id] || ''}
                                onChange={(event) =>
                                  setDocumentReasons((current) => ({ ...current, [document.id]: event.target.value }))
                                }
                                placeholder="Add rejection note if needed"
                              />
                              <div className="grid gap-2">
                                <Button disabled={isSubmitting} onClick={() => handleVerifyDocument(document.id)} className="bg-emerald-600 hover:bg-emerald-700">
                                  Verify document
                                </Button>
                                <Button disabled={isSubmitting} variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50" onClick={() => handleRejectDocument(document.id)}>
                                  Reject document
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Location</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {vendor.location ? (
                          <div className="space-y-1">
                            <div>{vendor.location.latitude}, {vendor.location.longitude}</div>
                            <div>Updated {formatDate(vendor.location.last_updated)}</div>
                          </div>
                        ) : (
                          'Live location not available yet.'
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Biometric review</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {vendor.biometric ? (
                          <div className="space-y-3">
                            <div>{vendor.biometric.is_verified ? 'Face verification ready' : 'Face verification pending'}</div>
                            <div>Model {vendor.biometric.model_version}</div>
                            {vendor.biometric.source_image_url ? (
                              <a href={vendor.biometric.source_image_url} target="_blank" rel="noreferrer" className="block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={vendor.biometric.source_image_url}
                                  alt="Vendor biometric source"
                                  className="h-28 w-28 rounded-xl border object-cover"
                                />
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          'Face data not uploaded yet.'
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Operational state</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <div>{vendor.is_active_vendor ? 'Operationally enabled' : 'Not enabled for live operations'}</div>
                          <div>{vendor.is_online ? 'Vendor is currently online' : 'Vendor is currently offline'}</div>
                          <div>Last updated {formatDate(vendor.updated_at)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white/80">Tracked bookings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-semibold">
                          {assignmentData?.summary.total_bookings ?? 0}
                        </div>
                        <div className="mt-1 text-xs text-white/65">Recent and active vendor-owned bookings</div>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-200 bg-emerald-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-emerald-900">Active now</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-semibold text-emerald-950">
                          {assignmentData?.summary.active_bookings ?? 0}
                        </div>
                        <div className="mt-1 text-xs text-emerald-700">Confirmed, en route, arrived, and live jobs</div>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-200 bg-amber-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-amber-900">Countdowns armed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-semibold text-amber-950">
                          {assignmentData?.summary.countdowns_armed ?? 0}
                        </div>
                        <div className="mt-1 text-xs text-amber-700">Orders with a pending escalation timer</div>
                      </CardContent>
                    </Card>
                    <Card className="border-rose-200 bg-rose-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-rose-900">Needs follow-up</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-semibold text-rose-950">
                          {assignmentData?.summary.flagged_for_followup ?? 0}
                        </div>
                        <div className="mt-1 text-xs text-rose-700">Stuck in pre-pickup flow for 15+ minutes</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Assigned Orders Command Desk</CardTitle>
                      <CardDescription>
                        Review live assignment health, trace transfer audits, expire a stale booking immediately, or arm a timed escalation with either expiry or transfer preparation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isLoadingAssignments ? (
                        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading assignment activity...
                        </div>
                      ) : !assignmentData || assignmentData.items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground">
                          This vendor does not have any tracked bookings yet.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {assignmentData.items.map((assignment) => (
                            <div key={assignment.booking_id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                              <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,#f8fafc,white_55%,#eef2ff)] px-5 py-4">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-lg font-semibold text-slate-950">{assignment.order_number}</div>
                                      <Badge className="border-slate-200 bg-slate-100 text-slate-800">
                                        {formatStatusLabel(assignment.booking_status)}
                                      </Badge>
                                      {assignment.lead_status ? (
                                        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                                          Lead {formatStatusLabel(assignment.lead_status)}
                                        </Badge>
                                      ) : null}
                                      {assignment.active_countdown ? (
                                        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                                          Countdown: {getCountdownLabel(assignment.active_countdown.deadline_at, nowTick)}
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      {assignment.customer_name} • {assignment.customer_phone || 'Phone unavailable'}
                                    </div>
                                    <div className="max-w-3xl text-sm text-slate-500">
                                      {assignment.customer_address}
                                    </div>
                                  </div>

                                  <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[320px]">
                                    <Button
                                      disabled={!assignment.can_expire_now || isAssignmentActionPending}
                                      className="bg-rose-600 hover:bg-rose-700"
                                      onClick={() => handleExpireAssignedOrder(assignment)}
                                    >
                                      {isAssignmentActionPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                      Expire Lead
                                    </Button>
                                    <Button
                                      disabled={!assignment.can_schedule_countdown || isAssignmentActionPending}
                                      variant="outline"
                                      className="border-slate-300 bg-white hover:bg-slate-50"
                                      onClick={() => openCountdownDialog(assignment)}
                                    >
                                      Arm Countdown
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.1fr_0.9fr]">
                                <div className="grid gap-4 md:grid-cols-3">
                                  <div className="rounded-2xl border bg-slate-50 p-4">
                                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Time in current stage</div>
                                    <div className="mt-2 text-xl font-semibold text-slate-950">
                                      {formatStateAge(assignment.state_age_seconds)}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                      Last progress {formatDate(assignment.updated_at)}
                                    </div>
                                  </div>
                                  <div className="rounded-2xl border bg-slate-50 p-4">
                                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Lead window</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-950">
                                      {formatDate(assignment.lead_expires_at)}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                      Accepted {formatDate(assignment.lead_accepted_at)}
                                    </div>
                                  </div>
                                  <div className="rounded-2xl border bg-slate-50 p-4">
                                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Distance snapshot</div>
                                    <div className="mt-2 text-xl font-semibold text-slate-950">
                                      {typeof assignment.distance_km === 'number' ? `${assignment.distance_km.toFixed(1)} km` : 'Unavailable'}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                      Warning sent {formatDate(assignment.inactivity_warning_sent_at)}
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold text-slate-950">Transfer and escalation audit</div>
                                      <div className="text-xs text-slate-500">Latest automation and admin actions for this booking</div>
                                    </div>
                                    {assignment.latest_audit ? (
                                      <Badge className="border-slate-200 bg-white text-slate-700">
                                        {formatStatusLabel(assignment.latest_audit.status)}
                                      </Badge>
                                    ) : null}
                                  </div>

                                  {!assignment.latest_audit ? (
                                    <div className="mt-4 text-sm text-slate-500">No transfer audit has been recorded for this order yet.</div>
                                  ) : (
                                    <div className="mt-4 space-y-3">
                                      <div className="rounded-2xl bg-white p-4">
                                        <div className="text-sm font-medium text-slate-900">{assignment.latest_audit.reason}</div>
                                        <div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                                          <div>Created {formatDate(assignment.latest_audit.created_at)}</div>
                                          <div>Outcome {formatStatusLabel(assignment.latest_audit.outcome || assignment.latest_audit.status)}</div>
                                          <div>Resolution {formatStatusLabel(assignment.latest_audit.resolution_action || 'manual')}</div>
                                          <div>Dispatch {formatStatusLabel(assignment.latest_audit.dispatch_status || 'not set')}</div>
                                        </div>
                                      </div>
                                      {assignment.recent_audits.length > 1 ? (
                                        <div className="space-y-2">
                                          {assignment.recent_audits.slice(1).map((audit) => (
                                            <div key={audit.id} className="rounded-2xl border border-white bg-white/80 px-4 py-3 text-sm text-slate-600">
                                              <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium text-slate-900">{formatStatusLabel(audit.status)}</span>
                                                <span className="text-xs text-slate-500">{formatDate(audit.created_at)}</span>
                                              </div>
                                              <div className="mt-1">{audit.reason}</div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <Card className="border-slate-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Fingerprint className="h-4 w-4" />
                          Biometric Replay
                        </CardTitle>
                        <CardDescription>
                          Verification state, embedding status, and the replay of face-review events.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border bg-slate-50 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Pipeline status</div>
                            <div className="mt-2 text-lg font-semibold text-slate-900">{biometricMetrics?.status || vendor.biometric?.status || 'Not started'}</div>
                            <div className="mt-1 text-sm text-slate-500">
                              {biometricMetrics?.is_verified || vendor.biometric?.is_verified ? 'Face verified and ready for live ops.' : 'Verification still in progress or pending review.'}
                            </div>
                          </div>
                          <div className="rounded-2xl border bg-slate-50 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Vector reference</div>
                            <div className="mt-2 break-all text-sm font-medium text-slate-900">{biometricMetrics?.vector_id || vendor.biometric?.vector_id || 'Pending'}</div>
                            <div className="mt-1 text-sm text-slate-500">Model {biometricMetrics?.model_version || vendor.biometric?.model_version || 'Unavailable'}</div>
                          </div>
                          <div className="rounded-2xl border bg-slate-50 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Arrival checks</div>
                            <div className="mt-2 text-lg font-semibold text-slate-900">{biometricMetrics?.arrival_verified_count ?? 0}/{biometricMetrics?.arrival_verification_count ?? 0}</div>
                            <div className="mt-1 text-sm text-slate-500">
                              Flagged {biometricMetrics?.arrival_flagged_count ?? 0}
                              {typeof biometricMetrics?.latest_similarity_score === 'number' ? ` • Latest score ${biometricMetrics.latest_similarity_score.toFixed(3)}` : ''}
                            </div>
                          </div>
                          <div className="rounded-2xl border bg-slate-50 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Source</div>
                            <div className="mt-2 text-sm font-medium text-slate-900">{biometricMetrics?.source_document_type || vendor.biometric?.source_document_type || 'Face capture'}</div>
                            <div className="mt-1 text-sm text-slate-500">Updated {formatDate(biometricMetrics?.updated_at || vendor.biometric?.updated_at)}</div>
                          </div>
                        </div>

                        {biometricMetrics?.rejection_reason ? (
                          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            <div className="flex items-center gap-2 font-medium">
                              <ShieldAlert className="h-4 w-4" />
                              Latest rejection reason
                            </div>
                            <div className="mt-2">{biometricMetrics.rejection_reason}</div>
                          </div>
                        ) : null}

                        <div className="space-y-3">
                          {verificationReplay.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                              No biometric replay events recorded yet.
                            </div>
                          ) : (
                            verificationReplay.map((log) => (
                              <div key={log.id} className="flex gap-3 rounded-2xl border p-4">
                                <div className="mt-0.5 rounded-full bg-emerald-50 p-2 text-emerald-700">
                                  <Clock3 className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="font-medium text-slate-900">{log.action_display}</div>
                                    <div className="text-xs text-slate-500">{formatDate(log.timestamp)}</div>
                                  </div>
                                  {log.details ? <div className="mt-1 text-sm text-slate-600">{log.details}</div> : null}
                                  {formatAuditValue(log.new_value) ? (
                                    <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                                      {formatAuditValue(log.new_value)}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <History className="h-4 w-4" />
                          Complete Vendor Audit Log
                        </CardTitle>
                        <CardDescription>
                          Immutable vendor lifecycle history including onboarding, document reviews, biometric events, and access decisions.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {vendorAuditLogs.length === 0 ? (
                          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                            No vendor audit history available yet.
                          </div>
                        ) : (
                          vendorAuditLogs.map((log: VendorAuditLog) => (
                            <div key={log.id} className="rounded-2xl border p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="font-medium text-slate-900">{log.action_display}</div>
                                <div className="text-xs text-slate-500">{formatDate(log.timestamp)}</div>
                              </div>
                              {log.actor_name ? (
                                <div className="mt-1 text-sm text-slate-500">
                                  By {log.actor_name}{log.actor_email ? ` (${log.actor_email})` : ''}
                                </div>
                              ) : (
                                <div className="mt-1 text-sm text-slate-500">By system automation</div>
                              )}
                              {log.details ? <div className="mt-2 text-sm text-slate-700">{log.details}</div> : null}
                              {formatAuditValue(log.previous_value) || formatAuditValue(log.new_value) ? (
                                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                                  {formatAuditValue(log.previous_value) ? <div>From: {formatAuditValue(log.previous_value)}</div> : null}
                                  {formatAuditValue(log.new_value) ? <div className="mt-1">To: {formatAuditValue(log.new_value)}</div> : null}
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isCountdownDialogOpen} onOpenChange={setIsCountdownDialogOpen}>
        <DialogContent className="max-w-2xl border-slate-200 p-0">
          <DialogHeader className="border-b bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-6 py-5 text-white">
            <DialogTitle className="text-2xl">
              {selectedAssignment ? `Countdown for ${selectedAssignment.order_number}` : 'Assignment countdown'}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              If the booking does not move forward from this stage, choose whether the system should expire it or move it into transfer preparation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 px-6 py-6">
            {selectedAssignment ? (
              <div className="rounded-3xl border bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-slate-200 bg-white text-slate-700">
                    {formatStatusLabel(selectedAssignment.booking_status)}
                  </Badge>
                  {selectedAssignment.lead_status ? (
                    <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                      Lead {formatStatusLabel(selectedAssignment.lead_status)}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3 text-sm text-slate-700">
                  {selectedAssignment.customer_name} • {selectedAssignment.customer_phone || 'Phone unavailable'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Current stage age: {formatStateAge(selectedAssignment.state_age_seconds)}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setCountdownResolution('expire')}
                className={`rounded-3xl border p-5 text-left transition ${countdownResolution === 'expire' ? 'border-rose-300 bg-rose-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="text-sm font-semibold text-slate-950">Expire if still stuck</div>
                <div className="mt-2 text-sm text-slate-500">
                  The assignment is invalidated and the order returns to the queue with a clean audit trail.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCountdownResolution('transfer')}
                className={`rounded-3xl border p-5 text-left transition ${countdownResolution === 'transfer' ? 'border-amber-300 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="text-sm font-semibold text-slate-950">Prepare transfer to another vendor</div>
                <div className="mt-2 text-sm text-slate-500">
                  The current assignment is invalidated and the audit records the next replacement candidate for operations follow-up.
                </div>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <div className="space-y-2">
                <Label htmlFor="countdown-minutes">Countdown minutes</Label>
                <Input
                  id="countdown-minutes"
                  value={countdownMinutesInput}
                  onChange={(event) => setCountdownMinutesInput(event.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countdown-note">Admin note</Label>
                <Textarea
                  id="countdown-note"
                  value={countdownNote}
                  onChange={(event) => setCountdownNote(event.target.value)}
                  placeholder="Explain what operations should watch for before the escalation runs."
                  className="min-h-24"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCountdownDialogOpen(false)}
                disabled={isAssignmentActionPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleArmCountdown}
                disabled={isAssignmentActionPending}
                className="bg-slate-950 hover:bg-slate-800"
              >
                {isAssignmentActionPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Start countdown
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
