"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Send, TimerOff } from "lucide-react";
import {
  AvailableVendorSummary,
  BookingTransferAudit,
  BookingTransferAuditService,
  OrderService,
} from "@/components/backend/apiService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function BookingAuditsPage() {
  const { toast } = useToast();
  const [audits, setAudits] = useState<BookingTransferAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<AvailableVendorSummary[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<BookingTransferAudit | null>(null);
  const [assigningVendorId, setAssigningVendorId] = useState<number | null>(null);

  const loadAudits = async () => {
    setLoading(true);
    try {
      const response = await BookingTransferAuditService.getAudits();
      setAudits(response.audits);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Unable to load audits", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAudits();
  }, []);

  const openAssignDialog = async (audit: BookingTransferAudit) => {
    setSelectedAudit(audit);
    setVendors([]);
    try {
      const available = await OrderService.getAvailableVendors(audit.order_id);
      setVendors(available);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Unable to load vendors", description: error.message });
    }
  };

  const assignVendor = async (vendorId: number) => {
    if (!selectedAudit) return;
    setAssigningVendorId(vendorId);
    try {
      await OrderService.assignVendor(selectedAudit.order_id, vendorId);
      await BookingTransferAuditService.action(selectedAudit.id, { action: "mark_reassigned", vendor_id: vendorId });
      toast({ title: "Booking dispatched", description: "The selected vendor has received this booking." });
      setSelectedAudit(null);
      await loadAudits();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Dispatch failed", description: error.message });
    } finally {
      setAssigningVendorId(null);
    }
  };

  const expireVendorAssignment = async (audit: BookingTransferAudit) => {
    try {
      await BookingTransferAuditService.action(audit.id, { action: "expire" });
      toast({ title: "Vendor assignment expired", description: "The booking remains available for reassignment." });
      await loadAudits();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Unable to expire assignment", description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Booking Transfer Audits</h1>
          <p className="text-sm text-muted-foreground">Review expired vendor assignments and reassign bookings that are still in process.</p>
        </div>
        <Button variant="outline" onClick={loadAudits} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Transfer Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Expired Vendor</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium">{audit.order_number}</TableCell>
                  <TableCell>
                    {audit.from_vendor?.name || "Unknown"}
                    <div className="text-xs text-muted-foreground">Rating {audit.from_vendor?.rating?.toFixed(1) ?? "5.0"}</div>
                  </TableCell>
                  <TableCell className="max-w-md text-sm text-muted-foreground">{audit.reason}</TableCell>
                  <TableCell><Badge variant={audit.status === "open" ? "destructive" : "secondary"}>{audit.status}</Badge></TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => expireVendorAssignment(audit)}>
                      <TimerOff className="mr-1 h-3.5 w-3.5" />
                      Expired
                    </Button>
                    <Button size="sm" onClick={() => openAssignDialog(audit)}>
                      <Send className="mr-1 h-3.5 w-3.5" />
                      Give to Vendor
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!audits.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {loading ? "Loading audits..." : "No booking transfer audits found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedAudit)} onOpenChange={(open) => !open && setSelectedAudit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {selectedAudit?.order_number} to another vendor</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {vendors.map((vendor) => (
              <button
                key={vendor.id}
                className="flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-muted"
                onClick={() => assignVendor(vendor.id)}
                disabled={assigningVendorId === vendor.id}
              >
                <span>
                  <span className="block font-medium">{vendor.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {vendor.service_area || vendor.service_city || "Service area unavailable"}
                    {vendor.distance_km != null ? ` • ${vendor.distance_km} km` : ""}
                  </span>
                </span>
                <Badge variant={vendor.is_online ? "secondary" : "outline"}>{vendor.is_online ? "Online" : "Offline"}</Badge>
              </button>
            ))}
            {!vendors.length && <p className="text-sm text-muted-foreground">No available vendors found for this order.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAudit(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
