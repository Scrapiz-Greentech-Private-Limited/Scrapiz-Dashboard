'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react'
import VendorDetailsDialog from '@/components/dashboard/vendor-details-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { showError } from '@/lib/toast-helpers'
import { VendorService } from '@/services/vendor'
import type { Vendor, VendorStatus } from '@/types/vendor'

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

const statsCardStyles = [
  'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
  'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #166534 0%, #22c55e 100%)',
]

const formatDate = (value: string) => format(new Date(value), 'dd MMM yyyy')

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | VendorStatus>('all')
  const [cityFilter, setCityFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreatingVendor, setIsCreatingVendor] = useState(false)
  const [createVendorForm, setCreateVendorForm] = useState({
    phone_number: '',
    email: '',
    full_name: '',
    service_city: '',
    service_area: '',
    vehicle_type: 'thela',
    vehicle_number: '',
    vehicle_name: '',
    vehicle_model_name: '',
    weighing_scale_type: 'none',
  })
  const isFetching = useRef(false)

  const fetchVendors = useCallback(async () => {
    if (isFetching.current) return
    isFetching.current = true
    setIsLoading(true)
    try {
      const response = await VendorService.getVendors({
        status: statusFilter,
        city: cityFilter.trim() || undefined,
      })
      setVendors(response.results)
    } catch (error: any) {
      showError(error.message || 'Failed to load vendors')
    } finally {
      setIsLoading(false)
      isFetching.current = false
    }
  }, [cityFilter, statusFilter])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return vendors

    return vendors.filter((vendor) =>
      [
        vendor.full_name,
        vendor.service_city,
        vendor.service_area,
        vendor.vehicle?.vehicle_number,
        vendor.vehicle?.vehicle_type_display,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [search, vendors])

  const stats = useMemo(() => {
    const total = vendors.length
    const onboarding = vendors.filter((vendor) => vendor.status === 'draft').length
    const pending = vendors.filter((vendor) => vendor.status === 'pending_verification').length
    const verified = vendors.filter((vendor) => vendor.status === 'approved').length
    const entitled = vendors.filter((vendor) => vendor.is_entitled_for_leads).length
    const held = vendors.filter((vendor) => vendor.status === 'rejected' || vendor.status === 'suspended').length
    return { total, onboarding, pending, verified, entitled, held }
  }, [vendors])

  const openVendorDetails = (vendorId: number) => {
    setSelectedVendorId(vendorId)
    setIsDetailsOpen(true)
  }

  const handleCreateVendor = async () => {
    setIsCreatingVendor(true)
    try {
      await VendorService.createVendor({
        ...createVendorForm,
        phone_number: createVendorForm.phone_number.startsWith('+91')
          ? createVendorForm.phone_number
          : `+91${createVendorForm.phone_number}`,
      })
      setIsCreateOpen(false)
      setCreateVendorForm({
        phone_number: '',
        email: '',
        full_name: '',
        service_city: '',
        service_area: '',
        vehicle_type: 'thela',
        vehicle_number: '',
        vehicle_name: '',
        vehicle_model_name: '',
        weighing_scale_type: 'none',
      })
      fetchVendors()
    } catch (error: any) {
      showError(error.message || 'Failed to create vendor')
    } finally {
      setIsCreatingVendor(false)
    }
  }

  const renderLoading = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="grid gap-4 rounded-2xl border p-4 md:grid-cols-[1.2fr_0.9fr_0.7fr_0.7fr_140px]">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
          <p className="mt-1 text-muted-foreground">
            Review onboarding quality, documents, and pending-verification access from one operational surface.
          </p>
        </div>
        <Button variant="outline" onClick={fetchVendors} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={() => setIsCreateOpen(true)}>Create Vendor</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Total Vendors', value: stats.total, helper: 'All vendor profiles', icon: Store },
          { title: 'Onboarding', value: stats.onboarding, helper: 'Draft profiles still in setup', icon: UserRound },
          { title: 'Pending Verification', value: stats.pending, helper: 'Awaiting admin review', icon: ShieldCheck },
          { title: 'Entitled', value: stats.entitled, helper: 'Can receive and accept leads now', icon: CheckCircle2 },
        ].map((card, index) => (
          <Card key={card.title} className="border-0 text-white" style={{ background: statsCardStyles[index] }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{card.value}</div>
              <p className="mt-1 text-xs text-white/70">{card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Vendor Queue</CardTitle>
          <CardDescription>
            Filter by onboarding state, search by city or vehicle number, and drill into KYC review details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_220px_220px_120px]">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search vendors, city, area, vehicle"
                className="pl-9"
              />
            </div>
            <Input
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              placeholder="Filter by city"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | VendorStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Onboarding</SelectItem>
                <SelectItem value="pending_verification">Pending verification</SelectItem>
                <SelectItem value="approved">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchVendors} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply
            </Button>
          </div>

          {isLoading ? (
            renderLoading()
          ) : filteredVendors.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground">
              No vendors matched the current filters.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_0.8fr_120px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 md:grid">
                <div>Vendor</div>
                <div>Location</div>
                <div>Vehicle</div>
                <div>Status</div>
                <div className="text-right">Review</div>
              </div>
              <div className="divide-y">
                {filteredVendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    type="button"
                    onClick={() => openVendorDetails(vendor.id)}
                    className="grid w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50 md:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_120px]"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{vendor.full_name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Joined {formatDate(vendor.created_at)}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {vendor.documents.length} document{vendor.documents.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-slate-900">{vendor.service_city}</div>
                      <div className="mt-1 text-muted-foreground">{vendor.service_area}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-slate-900">{vendor.vehicle?.vehicle_type_display || 'Vehicle pending'}</div>
                      <div className="mt-1 text-muted-foreground">{vendor.vehicle?.vehicle_number || 'Number pending'}</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <Badge className={statusStyles[vendor.status]}>{statusLabels[vendor.status]}</Badge>
                      <Badge className={vendor.is_entitled_for_leads ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}>
                        {vendor.is_entitled_for_leads ? 'Lead Entitled' : 'Entitlement Inactive'}
                      </Badge>
                      {vendor.status === 'pending_verification' ? (
                        <div className="text-xs text-muted-foreground">
                          {vendor.allow_app_access_while_pending ? 'Pending access open' : 'Pending access held'}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {vendor.is_active_vendor ? 'Operationally enabled' : 'Not live yet'}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Live: {vendor.is_online ? 'Online' : 'Offline'} • Wallet: ₹{Number(vendor.wallet_balance || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-slate-700">
                        Open
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Held vendors: {stats.held}. Pending vendors can be kept on the app or moved to the review hold screen using the per-vendor access switch.
          </div>
        </CardContent>
      </Card>

      <VendorDetailsDialog
        vendorId={selectedVendorId}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onVendorUpdated={fetchVendors}
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Vendor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="vendor-phone">Phone Number</Label>
              <Input id="vendor-phone" value={createVendorForm.phone_number} onChange={(event) => setCreateVendorForm((prev) => ({ ...prev, phone_number: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-email">Email</Label>
              <Input id="vendor-email" value={createVendorForm.email} onChange={(event) => setCreateVendorForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-name">Full Name</Label>
              <Input id="vendor-name" value={createVendorForm.full_name} onChange={(event) => setCreateVendorForm((prev) => ({ ...prev, full_name: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-city">Service City</Label>
              <Input id="vendor-city" value={createVendorForm.service_city} onChange={(event) => setCreateVendorForm((prev) => ({ ...prev, service_city: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-area">Service Area</Label>
              <Input id="vendor-area" value={createVendorForm.service_area} onChange={(event) => setCreateVendorForm((prev) => ({ ...prev, service_area: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-vehicle-type">Vehicle Type</Label>
              <Input id="vendor-vehicle-type" value={createVendorForm.vehicle_type} onChange={(event) => setCreateVendorForm((prev) => ({ ...prev, vehicle_type: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-vehicle-number">Vehicle Number</Label>
              <Input id="vendor-vehicle-number" value={createVendorForm.vehicle_number} onChange={(event) => setCreateVendorForm((prev) => ({ ...prev, vehicle_number: event.target.value }))} />
            </div>
            {['bike', 'car', 'mini_truck'].includes(createVendorForm.vehicle_type) ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="vendor-vehicle-name">Vehicle Name</Label>
                  <Input id="vendor-vehicle-name" value={createVendorForm.vehicle_name} onChange={(event) => setCreateVendorForm((prev) => ({ ...prev, vehicle_name: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vendor-vehicle-model">Vehicle Model Name</Label>
                  <Input id="vendor-vehicle-model" value={createVendorForm.vehicle_model_name} onChange={(event) => setCreateVendorForm((prev) => ({ ...prev, vehicle_model_name: event.target.value }))} />
                </div>
              </>
            ) : null}
            <Button onClick={handleCreateVendor} disabled={isCreatingVendor}>
              {isCreatingVendor ? 'Creating...' : 'Create Vendor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
