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
import type { Vendor, VendorAuditLog, VendorDocument, VendorPaymentSummary, VendorStatus } from '@/types/vendor'

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
  const [trialDaysInput, setTrialDaysInput] = useState('15')

  const loadVendor = async () => {
    if (!vendorId) return
    setIsLoading(true)
    setIsLoadingSummary(true)
    try {
      const [detail, summary] = await Promise.all([
        VendorService.getVendor(vendorId),
        VendorService.getPaymentSummary(vendorId),
      ])
      setVendor(detail)
      setPaymentSummary(summary)
      if (detail.trial_duration_days !== undefined && detail.trial_duration_days !== null) {
        setTrialDaysInput(String(detail.trial_duration_days))
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load vendor details')
    } finally {
      setIsLoading(false)
      setIsLoadingSummary(false)
    }
  }

  useEffect(() => {
    if (isOpen && vendorId) {
      loadVendor()
    }
  }, [isOpen, vendorId])

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

  return (
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
                        <div><span className="text-slate-500">Profile image:</span> {vendor.profile_image ? 'Uploaded' : 'Pending'}</div>
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
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="documents" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="activity">Operational Snapshot</TabsTrigger>
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
                          <div className="space-y-1">
                            <div>{vendor.biometric.is_verified ? 'Face verification ready' : 'Face verification pending'}</div>
                            <div>Model {vendor.biometric.model_version}</div>
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
  )
}
