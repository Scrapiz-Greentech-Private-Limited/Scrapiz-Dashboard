'use client'

import * as React from "react"
import {
    MoreHorizontal,
    MapPin,
    Bot,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    Phone,
    Download,
    RefreshCw,
    Copy,
    Bell,
    UserPlus,
    UserMinus,
    Mail,
    Send
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Order } from "@/lib/types"
import { users } from "@/lib/data"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import OrderDetailsDialog from "./order-details-dialog"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

import { OrderService, type AvailableVendorSummary } from "@/components/backend/apiService"
import { AgentService, type AgentListItem } from "@/services/agent"
import { SortableTableHeader } from "./sortable-table-header"
import { SortConfig } from "@/hooks/useSearchAndFilter"
import { BulkOperationsToolbar } from "./bulk-operations-toolbar"
import { exportToCSV } from "@/lib/csv-export"
import { Alert, AlertDescription } from "@/components/ui/alert"

type OrdersTableClientProps = {
    orders: Order[]
    loading?: boolean
    onRefresh?: () => void
    sortConfig?: SortConfig<Order>
    onSort?: (column: keyof Order) => void
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    pending: "secondary",
    scheduled: "default",
    transit: "default",
    completed: "default",
    cancelled: "destructive",
}

const ITEMS_PER_PAGE = 50;

export default function OrdersTableClient({ 
    orders: initialOrders, 
    loading = false, 
    onRefresh,
    sortConfig = { key: null, direction: null },
    onSort = () => {},
}: OrdersTableClientProps) {
    const [orders, setOrders] = React.useState(initialOrders);
    const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [updatingStatus, setUpdatingStatus] = React.useState<string | null>(null);
    const [selectedOrders, setSelectedOrders] = React.useState<Set<string>>(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = React.useState(false);
    const [bulkProgress, setBulkProgress] = React.useState<{
        current: number;
        total: number;
        successful: number;
        failed: number;
    } | null>(null);
    const [contactDialogOpen, setContactDialogOpen] = React.useState(false);
    const [contactPhone, setContactPhone] = React.useState<string | null>(null);
    const [contactOrderId, setContactOrderId] = React.useState<string | null>(null);
    
    // Agent assignment state
    const [assignAgentDialogOpen, setAssignAgentDialogOpen] = React.useState(false);
    const [assignAgentOrder, setAssignAgentOrder] = React.useState<Order | null>(null);
    const [eligibleAgents, setEligibleAgents] = React.useState<AgentListItem[]>([]);
    const [selectedAgentId, setSelectedAgentId] = React.useState<string>("");
    const [loadingAgents, setLoadingAgents] = React.useState(false);
    const [assigningAgent, setAssigningAgent] = React.useState(false);

    // Vendor dispatch state
    const [assignVendorDialogOpen, setAssignVendorDialogOpen] = React.useState(false);
    const [assignVendorOrder, setAssignVendorOrder] = React.useState<Order | null>(null);
    const [availableVendors, setAvailableVendors] = React.useState<AvailableVendorSummary[]>([]);
    const [selectedVendorId, setSelectedVendorId] = React.useState<string>("");
    const [loadingVendors, setLoadingVendors] = React.useState(false);
    const [assigningVendor, setAssigningVendor] = React.useState(false);
    const [dispatchSuccessBanner, setDispatchSuccessBanner] = React.useState<{
        orderId: string;
        vendorName: string;
        leadId?: string;
    } | null>(null);
    
    // Send notification state
    const [notificationDialogOpen, setNotificationDialogOpen] = React.useState(false);
    const [notificationOrder, setNotificationOrder] = React.useState<Order | null>(null);
    const [notificationTitle, setNotificationTitle] = React.useState("Order Update");
    const [notificationMessage, setNotificationMessage] = React.useState("");
    const [sendingNotification, setSendingNotification] = React.useState(false);
    
    // Send email state
    const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
    const [emailOrder, setEmailOrder] = React.useState<Order | null>(null);
    const [emailTitle, setEmailTitle] = React.useState("Order Update");
    const [emailSubject, setEmailSubject] = React.useState("");
    const [emailBody, setEmailBody] = React.useState("");
    const [sendingEmail, setSendingEmail] = React.useState(false);
    
    const { toast } = useToast()
    
    const handleContactCustomer = (order: Order) => {
        if (order.customerPhone) {
            setContactPhone(order.customerPhone);
            setContactOrderId(order.id);
            setContactDialogOpen(true);
        } else {
            toast({
                variant: "destructive",
                title: "No Phone Number",
                description: "Customer phone number is not available for this order.",
            });
        }
    };

    const requireOrderDbId = (order: Order) => {
        if (typeof order.dbId === 'number' && Number.isFinite(order.dbId) && order.dbId > 0) {
            return order.dbId;
        }
        throw new Error(`Missing database order ID for ${order.id}. Refresh orders and retry.`);
    };
    
    const handleCopyPhone = () => {
        if (contactPhone) {
            navigator.clipboard.writeText(contactPhone);
            toast({
                title: "Copied!",
                description: "Phone number copied to clipboard.",
            });
        }
    };
    
    // Open assign agent dialog
    const handleOpenAssignAgent = async (order: Order) => {
        setAssignAgentOrder(order);
        setSelectedAgentId("");
        setAssignAgentDialogOpen(true);
        
        // Fetch eligible agents (including those without service areas)
        setLoadingAgents(true);
        try {
            const agents = await AgentService.getEligibleAgents(
                undefined, // no pincode filter
                true,      // include onboarding agents
                true       // include agents without service areas
            );
            setEligibleAgents(agents);
        } catch (error: any) {
            console.error('Failed to fetch eligible agents:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to load agents",
            });
        } finally {
            setLoadingAgents(false);
        }
    };
    
    // Assign agent to order
    const handleAssignAgent = async () => {
        if (!assignAgentOrder || !selectedAgentId) return;
        
        setAssigningAgent(true);
        try {
            const dbId = assignAgentOrder.dbId || parseInt(assignAgentOrder.id.replace(/\D/g, '')) || 0;
            await OrderService.assignAgent(dbId, parseInt(selectedAgentId));
            
            const selectedAgent = eligibleAgents.find(a => a.id.toString() === selectedAgentId);
            
            // Update local state
            setOrders(prevOrders => prevOrders.map(o => 
                o.id === assignAgentOrder.id 
                    ? { ...o, agentId: selectedAgent?.name || selectedAgentId, status: 'scheduled' as const }
                    : o
            ));
            
            toast({
                title: "✅ Agent Assigned",
                description: `${selectedAgent?.name || 'Agent'} has been assigned to order #${assignAgentOrder.id}`,
            });
            
            setAssignAgentDialogOpen(false);
            
            // Refresh data
            if (onRefresh) {
                setTimeout(() => onRefresh(), 500);
            }
        } catch (error: any) {
            console.error('Failed to assign agent:', error);
            toast({
                variant: "destructive",
                title: "❌ Assignment Failed",
                description: error.message || "Could not assign agent to order.",
            });
        } finally {
            setAssigningAgent(false);
        }
    };

    // Open send to vendor dialog
    const handleOpenAssignVendor = async (order: Order) => {
        setAssignVendorOrder(order);
        setSelectedVendorId("");
        setAssignVendorDialogOpen(true);

        setLoadingVendors(true);
        try {
            const dbId = requireOrderDbId(order);
            const vendors = await OrderService.getAvailableVendors(dbId);
            setAvailableVendors(vendors);
        } catch (error: any) {
            console.error('Failed to fetch available vendors:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to load available vendors",
            });
        } finally {
            setLoadingVendors(false);
        }
    };

    // Dispatch order to selected vendor
    const handleAssignVendor = async () => {
        if (!assignVendorOrder || !selectedVendorId) return;

        setAssigningVendor(true);
        try {
            const dbId = requireOrderDbId(assignVendorOrder);
            const response = await OrderService.assignVendor(dbId, parseInt(selectedVendorId));

            const selectedVendor = availableVendors.find(v => v.id.toString() === selectedVendorId);
            const vendorName = response?.vendor?.name || selectedVendor?.name || 'Vendor';
            const leadId = typeof response?.lead?.id === 'string' ? response.lead.id : undefined;

            setDispatchSuccessBanner({
                orderId: assignVendorOrder.id,
                vendorName,
                leadId,
            });

            toast({
                title: "✅ Sent To Vendor",
                description: `${vendorName} has been notified for order #${assignVendorOrder.id}`,
            });

            setAssignVendorDialogOpen(false);

            if (onRefresh) {
                setTimeout(() => onRefresh(), 500);
            }
        } catch (error: any) {
            console.error('Failed to assign vendor:', error);
            toast({
                variant: "destructive",
                title: "❌ Send Failed",
                description: error.message || "Could not send order to vendor.",
            });
        } finally {
            setAssigningVendor(false);
        }
    };
    
    // Unassign agent from order
    const handleUnassignAgent = async (order: Order) => {
        try {
            setUpdatingStatus(order.id);
            const dbId = order.dbId || parseInt(order.id.replace(/\D/g, '')) || 0;
            await OrderService.unassignAgent(dbId);
            
            // Update local state
            setOrders(prevOrders => prevOrders.map(o => 
                o.id === order.id 
                    ? { ...o, agentId: undefined, assignedAgent: undefined, status: 'pending' as const }
                    : o
            ));
            
            toast({
                title: "✅ Agent Unassigned",
                description: `Agent has been removed from order #${order.id}`,
            });
            
            // Refresh data
            if (onRefresh) {
                setTimeout(() => onRefresh(), 500);
            }
        } catch (error: any) {
            console.error('Failed to unassign agent:', error);
            toast({
                variant: "destructive",
                title: "❌ Unassignment Failed",
                description: error.message || "Could not unassign agent from order.",
            });
        } finally {
            setUpdatingStatus(null);
        }
    };
    
    // Open send notification dialog
    const handleOpenSendNotification = (order: Order) => {
        setNotificationOrder(order);
        setNotificationTitle("Order Update");
        setNotificationMessage("");
        setNotificationDialogOpen(true);
    };
    
    // Send notification to order's user
    const handleSendNotification = async () => {
        if (!notificationOrder || !notificationMessage.trim()) return;
        
        setSendingNotification(true);
        try {
            const dbId = notificationOrder.dbId || parseInt(notificationOrder.id.replace(/\D/g, '')) || 0;
            await OrderService.sendOrderNotification(dbId, notificationTitle, notificationMessage);
            
            toast({
                title: "✅ Notification Sent",
                description: `Notification sent to customer for order #${notificationOrder.id}`,
            });
            
            setNotificationDialogOpen(false);
        } catch (error: any) {
            console.error('Failed to send notification:', error);
            toast({
                variant: "destructive",
                title: "❌ Notification Failed",
                description: error.message || "Could not send notification.",
            });
        } finally {
            setSendingNotification(false);
        }
    };
    
    // Open send email dialog
    const handleOpenSendEmail = (order: Order) => {
        setEmailOrder(order);
        setEmailTitle("Order Update");
        setEmailSubject(`Update for Order #${order.id}`);
        setEmailBody("");
        setEmailDialogOpen(true);
    };
    
    // Send email to order's user
    const handleSendEmail = async () => {
        if (!emailOrder || !emailSubject.trim() || !emailBody.trim()) return;
        
        setSendingEmail(true);
        try {
            const dbId = emailOrder.dbId || parseInt(emailOrder.id.replace(/\D/g, '')) || 0;
            await OrderService.sendOrderEmail(dbId, emailTitle, emailSubject, emailBody);
            
            toast({
                title: "✅ Email Sent",
                description: `Email sent to customer for order #${emailOrder.id}`,
            });
            
            setEmailDialogOpen(false);
            setEmailTitle("Order Update");
            setEmailSubject("");
            setEmailBody("");
        } catch (error: any) {
            console.error('Failed to send email:', error);
            toast({
                variant: "destructive",
                title: "❌ Email Failed",
                description: error.message || "Could not send email.",
            });
        } finally {
            setSendingEmail(false);
        }
    };
    
    // Update local orders when prop changes
    React.useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    // Reset to page 1 when orders change (e.g., after filtering)
    React.useEffect(() => {
        setCurrentPage(1);
    }, [orders.length]);

    // Clear selection when orders change
    React.useEffect(() => {
        setSelectedOrders(new Set());
    }, [orders.length]);

    React.useEffect(() => {
        if (!dispatchSuccessBanner) {
            return;
        }

        const timer = setTimeout(() => {
            setDispatchSuccessBanner(null);
        }, 12000);

        return () => clearTimeout(timer);
    }, [dispatchSuccessBanner]);

    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            setUpdatingStatus(orderId);
            
            // Find the order to get its database ID
            const order = orders.find(o => o.id === orderId);
            const dbId = order?.dbId || parseInt(orderId.replace(/\D/g, '')) || 0;
            
            // Try to update via backend API using status name
            await OrderService.updateOrderStatus(dbId, newStatus);
            
            // Update local state optimistically
            setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o));
            
            toast({
                title: "✅ Status Updated",
                description: `Order #${orderId} has been updated to "${newStatus.replace(/_/g, ' ')}".`,
            });
            
            // Refresh data from backend to get latest state
            if (onRefresh) {
                setTimeout(() => onRefresh(), 500);
            }
        } catch (error: any) {
            console.error('Failed to update order status:', error);
            toast({
                variant: "destructive",
                title: "❌ Update Failed",
                description: error.message || "Could not update order status.",
            });
            // Refresh to restore correct state
            if (onRefresh) {
                onRefresh();
            }
        } finally {
            setUpdatingStatus(null);
        }
    }
    
    const handleCancelOrder = async (orderId: string) => {
        try {
            setUpdatingStatus(orderId);
            
            // Cancel via backend API
            await OrderService.cancelOrder({ order_number: orderId });
            
            // Update local state
            setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? {...o, status: 'cancelled'} : o));
            
            toast({
                title: "✅ Order Cancelled",
                description: `Order #${orderId} has been cancelled.`,
            });
            
            // Refresh data from backend
            if (onRefresh) {
                onRefresh();
            }
        } catch (error: any) {
            console.error('Failed to cancel order:', error);
            toast({
                variant: "destructive",
                title: "❌ Cancellation Failed",
                description: error.message || "Could not cancel order.",
            });
        } finally {
            setUpdatingStatus(null);
        }
    }

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    }

    // Bulk selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allOrderIds = new Set(paginatedOrders.map(o => o.id));
            setSelectedOrders(allOrderIds);
        } else {
            setSelectedOrders(new Set());
        }
    };

    const handleSelectOrder = (orderId: string, checked: boolean) => {
        const newSelection = new Set(selectedOrders);
        if (checked) {
            newSelection.add(orderId);
        } else {
            newSelection.delete(orderId);
        }
        setSelectedOrders(newSelection);
    };

    const isAllSelected = paginatedOrders.length > 0 && 
        paginatedOrders.every(order => selectedOrders.has(order.id));
    const isSomeSelected = paginatedOrders.some(order => selectedOrders.has(order.id)) && !isAllSelected;

    // Bulk status update
    const handleBulkStatusUpdate = async (newStatus: string) => {
        const selectedOrdersList = Array.from(selectedOrders);
        if (selectedOrdersList.length === 0) return;

        setIsBulkProcessing(true);
        setBulkProgress({
            current: 0,
            total: selectedOrdersList.length,
            successful: 0,
            failed: 0,
        });

        let successful = 0;
        let failed = 0;

        for (let i = 0; i < selectedOrdersList.length; i++) {
            const orderId = selectedOrdersList[i];
            try {
                // Find the order to get its database ID
                const order = orders.find(o => o.id === orderId);
                const dbId = order?.dbId || parseInt(orderId.replace(/\D/g, '')) || 0;
                
                await OrderService.updateOrderStatus(dbId, newStatus);
                
                // Update local state
                setOrders(prevOrders => 
                    prevOrders.map(o => o.id === orderId ? {...o, status: newStatus as Order['status']} : o)
                );
                
                successful++;
            } catch (error) {
                console.error(`Failed to update order ${orderId}:`, error);
                failed++;
            }

            setBulkProgress({
                current: i + 1,
                total: selectedOrdersList.length,
                successful,
                failed,
            });
        }

        setIsBulkProcessing(false);
        
        // Show summary toast
        toast({
            title: "Bulk Update Complete",
            description: `${successful} orders updated successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
            variant: failed > 0 ? "destructive" : "default",
        });

        // Clear selection and progress
        setTimeout(() => {
            setSelectedOrders(new Set());
            setBulkProgress(null);
            if (onRefresh) {
                onRefresh();
            }
        }, 2000);
    };

    // Export selected orders to CSV
    const handleExportSelected = () => {
        const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id));
        
        if (selectedOrdersList.length === 0) {
            toast({
                title: "No orders selected",
                description: "Please select orders to export.",
                variant: "destructive",
            });
            return;
        }

        const columns = [
            { key: 'id' as keyof Order, label: 'Order ID' },
            { key: 'sellerId' as keyof Order, label: 'Customer' },
            { key: 'agentId' as keyof Order, label: 'Agent' },
            { key: 'scrapCategory' as keyof Order, label: 'Category' },
            { key: 'status' as keyof Order, label: 'Status' },
            { key: 'pickupTime' as keyof Order, label: 'Pickup Time' },
            { key: 'totalAmount' as keyof Order, label: 'Amount' },
            { key: 'pickupAddress' as keyof Order, label: 'Address' },
            { key: 'estimatedWeight' as keyof Order, label: 'Estimated Weight' },
            { key: 'finalWeight' as keyof Order, label: 'Final Weight' },
        ];

        const timestamp = new Date().toISOString().split('T')[0];
        exportToCSV(selectedOrdersList, columns, `orders-export-${timestamp}.csv`);

        toast({
            title: "Export Complete",
            description: `${selectedOrdersList.length} orders exported successfully.`,
        });
    };

    // Export all orders to CSV
    const handleExportAll = () => {
        if (orders.length === 0) {
            toast({
                title: "No orders to export",
                description: "There are no orders available to export.",
                variant: "destructive",
            });
            return;
        }

        const columns = [
            { key: 'id' as keyof Order, label: 'Order ID' },
            { key: 'sellerId' as keyof Order, label: 'Customer' },
            { key: 'agentId' as keyof Order, label: 'Agent' },
            { key: 'scrapCategory' as keyof Order, label: 'Category' },
            { key: 'status' as keyof Order, label: 'Status' },
            { key: 'pickupTime' as keyof Order, label: 'Pickup Time' },
            { key: 'totalAmount' as keyof Order, label: 'Amount' },
            { key: 'pickupAddress' as keyof Order, label: 'Address' },
            { key: 'estimatedWeight' as keyof Order, label: 'Estimated Weight' },
            { key: 'finalWeight' as keyof Order, label: 'Final Weight' },
        ];

        const timestamp = new Date().toISOString().split('T')[0];
        exportToCSV(orders, columns, `orders-export-all-${timestamp}.csv`);

        toast({
            title: "Export Complete",
            description: `${orders.length} orders exported successfully.`,
        });
    };

    const statusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'transit', label: 'In Transit' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    if (loading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading orders...</span>
            </div>
        );
    }

    if (!loading && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">No orders found</p>
                {onRefresh && (
                    <Button variant="outline" size="sm" onClick={onRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                )}
            </div>
        );
    }

    return (
        <>
        <BulkOperationsToolbar
            selectedCount={selectedOrders.size}
            onClearSelection={() => setSelectedOrders(new Set())}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onExport={handleExportSelected}
            statusOptions={statusOptions}
            isProcessing={isBulkProcessing}
            progress={bulkProgress || undefined}
        />
        
        <div className="flex justify-end p-3 sm:p-4 border-b">
            <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
                disabled={orders.length === 0 || isBulkProcessing}
                className="text-xs sm:text-sm"
            >
                <Download className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export All Orders</span>
                <span className="sm:hidden">Export</span>
            </Button>
        </div>

        {dispatchSuccessBanner && (
            <div className="px-3 sm:px-4 pt-3">
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
                    <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            Order #{dispatchSuccessBanner.orderId} dispatched to {dispatchSuccessBanner.vendorName}
                            {dispatchSuccessBanner.leadId ? ` (Lead ID: ${dispatchSuccessBanner.leadId})` : ''}.
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDispatchSuccessBanner(null)}
                            className="h-7 px-2 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-900"
                        >
                            Dismiss
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )}

        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <Table className="min-w-[600px] sm:min-w-0">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[40px] sm:w-[50px]">
                        <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all orders"
                            disabled={isBulkProcessing}
                            className={isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""}
                        />
                    </TableHead>
                    <SortableTableHeader
                        column="id"
                        label="Order ID"
                        sortConfig={sortConfig}
                        onSort={onSort}
                        className="w-[80px] sm:w-[100px]"
                    />
                    <SortableTableHeader
                        column="sellerId"
                        label="Customer"
                        sortConfig={sortConfig}
                        onSort={onSort}
                    />
                    <TableHead className="hidden md:table-cell">Agent</TableHead>
                    <SortableTableHeader
                        column="scrapCategory"
                        label="Category"
                        sortConfig={sortConfig}
                        onSort={onSort}
                        className="hidden lg:table-cell"
                    />
                    <SortableTableHeader
                        column="status"
                        label="Status"
                        sortConfig={sortConfig}
                        onSort={onSort}
                    />
                    <SortableTableHeader
                        column="pickupTime"
                        label="Pickup Date"
                        sortConfig={sortConfig}
                        onSort={onSort}
                        className="hidden xl:table-cell"
                    />
                    <SortableTableHeader
                        column="totalAmount"
                        label="Amount"
                        sortConfig={sortConfig}
                        onSort={onSort}
                        className="hidden sm:table-cell"
                        align="right"
                    />
                     <TableHead className="hidden 2xl:table-cell">
                        Address
                    </TableHead>
                    <TableHead className="w-[50px]">
                        <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedOrders.map((order) => {
                    const isUpdating = updatingStatus === order.id;
                    const isSelected = selectedOrders.has(order.id);
                    return (
                        <TableRow 
                            key={order.id} 
                            className={`${isUpdating ? 'opacity-50' : ''} ${isSelected ? 'bg-muted/50' : ''}`}
                        >
                            <TableCell className="p-2 sm:p-4">
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                                    aria-label={`Select order ${order.id}`}
                                    disabled={isBulkProcessing}
                                />
                            </TableCell>
                            <TableCell className="p-2 sm:p-4 font-medium text-xs sm:text-sm">{order.id}</TableCell>
                            <TableCell className="p-2 sm:p-4">
                                <div className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{order.sellerId}</div>
                                {order.customerPhone && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        <span className="truncate">{order.customerPhone}</span>
                                    </div>
                                )}
                                {/* Mobile-only: show extra info */}
                                <div className="text-xs text-muted-foreground md:hidden mt-1">
                                    {order.agentId && <span className="block">Agent: {order.agentId}</span>}
                                    <span className="sm:hidden">₹{typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(0) : 'N/A'}</span>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell p-2 sm:p-4 text-sm">{order.agentId || "Unassigned"}</TableCell>
                            <TableCell className="hidden lg:table-cell p-2 sm:p-4 text-sm">{order.scrapCategory}</TableCell>
                            <TableCell className="p-2 sm:p-4">
                                <Badge variant={statusVariant[order.status] || 'secondary'} className="capitalize text-[10px] sm:text-xs whitespace-nowrap">
                                    {order.status.replace(/_/g, ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell p-2 sm:p-4 text-sm">
                                {format(new Date(order.pickupTime), "PPp")}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell p-2 sm:p-4 text-right text-sm">₹{typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : 'N/A'}</TableCell>
                             <TableCell className="hidden 2xl:table-cell p-2 sm:p-4">
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.pickupAddress)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-sm">
                                    <MapPin className="w-4 h-4" />
                                    View Map
                                </a>
                            </TableCell>
                            <TableCell className="p-2 sm:p-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            aria-haspopup="true"
                                            size="icon"
                                            variant="ghost"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleViewDetails(order)} disabled={isUpdating}>
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => handleContactCustomer(order)}
                                            disabled={!order.customerPhone}
                                        >
                                            <Phone className="mr-2 h-4 w-4" />
                                            Contact Customer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => handleOpenSendEmail(order)} 
                                            disabled={isUpdating}
                                        >
                                            <Mail className="mr-2 h-4 w-4"/>
                                            Send Email
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => handleOpenAssignAgent(order)} 
                                            disabled={isUpdating}
                                        >
                                            <UserPlus className="mr-2 h-4 w-4"/>
                                            {order.agentId ? 'Reassign Agent' : 'Assign Agent'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleOpenAssignVendor(order)}
                                            disabled={isUpdating}
                                        >
                                            <Send className="mr-2 h-4 w-4"/>
                                            Send To Vendor
                                        </DropdownMenuItem>
                                        {order.agentId && (
                                            <DropdownMenuItem 
                                                onClick={() => handleUnassignAgent(order)} 
                                                disabled={isUpdating}
                                            >
                                                <UserMinus className="mr-2 h-4 w-4"/>
                                                Unassign Agent
                                            </DropdownMenuItem>
                                        )}
                                        {order.hasPushToken && (
                                            <DropdownMenuItem 
                                                onClick={() => handleOpenSendNotification(order)}
                                                disabled={isUpdating}
                                            >
                                                <Bell className="mr-2 h-4 w-4"/>
                                                Send Notification
                                            </DropdownMenuItem>
                                        )}
                                         <DropdownMenuSub>
                                            <DropdownMenuSubTrigger disabled={isUpdating}>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Change Status
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem 
                                                    onClick={() => handleUpdateStatus(order.id, 'pending')}
                                                    disabled={order.status === 'pending' || isUpdating}
                                                >
                                                    <Clock className="mr-2 h-4 w-4 text-yellow-500"/> Pending
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleUpdateStatus(order.id, 'scheduled')}
                                                    disabled={order.status === 'scheduled' || isUpdating}
                                                >
                                                    <Bot className="mr-2 h-4 w-4 text-blue-500"/> Scheduled
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleUpdateStatus(order.id, 'transit')}
                                                    disabled={order.status === 'transit' || isUpdating}
                                                >
                                                    <Truck className="mr-2 h-4 w-4 text-purple-500"/> In Transit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                                                    disabled={order.status === 'completed' || isUpdating}
                                                >
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500"/> Completed
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            className="text-destructive" 
                                            onClick={() => handleCancelOrder(order.id)}
                                            disabled={order.status === 'cancelled' || order.status === 'completed' || isUpdating}
                                        >
                                            <XCircle className="mr-2 h-4 w-4"/> Cancel Order
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                         <DropdownMenuItem disabled={!order.totalAmount}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download Invoice
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
        </div>
        {totalPages > 1 && (
            <div className="mt-4 px-3 sm:px-0 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                    Page {currentPage} of {totalPages}
                </div>
                <Pagination className="order-1 sm:order-2">
                    <PaginationContent className="gap-1">
                        <PaginationItem>
                            <PaginationPrevious 
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(p => Math.max(1, p - 1));
                                }}
                                className={`h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                            />
                        </PaginationItem>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                                page = i + 1;
                            } else if (currentPage <= 3) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                page = totalPages - 4 + i;
                            } else {
                                page = currentPage - 2 + i;
                            }
                            return (
                                <PaginationItem key={page} className="hidden sm:inline-flex">
                                    <PaginationLink
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage(page);
                                        }}
                                        isActive={currentPage === page}
                                        className="cursor-pointer h-8 sm:h-9 w-8 sm:w-9 text-xs sm:text-sm"
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}
                        <PaginationItem>
                            <PaginationNext 
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(p => Math.min(totalPages, p + 1));
                                }}
                                className={`h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        )}
        {selectedOrder && (
             <OrderDetailsDialog 
                order={selectedOrder}
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onAssignmentExpired={() => {
                    if (onRefresh) {
                        onRefresh();
                    }
                }}
             />
        )}
        
        {/* Contact Customer Dialog */}
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-green-600" />
                        Contact Customer
                    </DialogTitle>
                    <DialogDescription>
                        {contactOrderId && `Order #${contactOrderId}`}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Call this number:</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                            {contactPhone}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCopyPhone}
                            className="gap-2"
                        >
                            <Copy className="h-4 w-4" />
                            Copy Number
                        </Button>
                        <Button
                            onClick={() => {
                                if (contactPhone) {
                                    window.open(`tel:${contactPhone}`, '_self');
                                }
                            }}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                            <Phone className="h-4 w-4" />
                            Call Now
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        
        {/* Assign Agent Dialog */}
        <Dialog open={assignAgentDialogOpen} onOpenChange={setAssignAgentDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        {assignAgentOrder?.agentId ? 'Reassign Agent' : 'Assign Agent'}
                    </DialogTitle>
                    <DialogDescription>
                        {assignAgentOrder && `Order #${assignAgentOrder.id}`}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {loadingAgents ? (
                        <div className="flex items-center justify-center py-4">
                            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Loading agents...</span>
                        </div>
                    ) : eligibleAgents.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                            No eligible agents available
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="agent-select">Select Agent</Label>
                                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                    <SelectTrigger id="agent-select">
                                        <SelectValue placeholder="Choose an agent..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eligibleAgents.map((agent) => (
                                            <SelectItem key={agent.id} value={agent.id.toString()}>
                                                <div className="flex flex-col">
                                                    <span>{agent.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {agent.agent_code} • {agent.availability}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {assignAgentOrder?.agentId && (
                                <div className="text-sm text-muted-foreground">
                                    Currently assigned: <span className="font-medium">{assignAgentOrder.agentId}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setAssignAgentDialogOpen(false)}
                        disabled={assigningAgent}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssignAgent}
                        disabled={!selectedAgentId || assigningAgent || loadingAgents}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {assigningAgent ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            <>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign Agent
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Send To Vendor Dialog */}
        <Dialog open={assignVendorDialogOpen} onOpenChange={setAssignVendorDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-emerald-600" />
                        Send To Vendor
                    </DialogTitle>
                    <DialogDescription>
                        {assignVendorOrder && `Order #${assignVendorOrder.id}`}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {loadingVendors ? (
                        <div className="flex items-center justify-center py-4">
                            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Loading vendors...</span>
                        </div>
                    ) : availableVendors.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                            No online eligible vendors available for this order
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="vendor-select">Select Vendor</Label>
                                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                                    <SelectTrigger id="vendor-select">
                                        <SelectValue placeholder="Choose an online vendor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableVendors.map((vendor) => (
                                            <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                                <div className="flex flex-col">
                                                    <span>{vendor.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {vendor.phone || 'No phone'} • {vendor.service_city || 'Unknown city'}
                                                        {typeof vendor.distance_km === 'number' ? ` • ${vendor.distance_km.toFixed(1)} km` : ''}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Alert>
                                <AlertDescription>
                                    The selected vendor receives an immediate push notification and a live lead card in the vendor app.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setAssignVendorDialogOpen(false)}
                        disabled={assigningVendor}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssignVendor}
                        disabled={!selectedVendorId || assigningVendor || loadingVendors}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {assigningVendor ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send To Vendor
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Send Notification Dialog */}
        <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-orange-600" />
                        Send Notification
                    </DialogTitle>
                    <DialogDescription>
                        {notificationOrder && `Send push notification to customer for order #${notificationOrder.id}`}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="notification-title">Title</Label>
                        <Input
                            id="notification-title"
                            value={notificationTitle}
                            onChange={(e) => setNotificationTitle(e.target.value)}
                            placeholder="Notification title"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notification-message">Message</Label>
                        <Textarea
                            id="notification-message"
                            value={notificationMessage}
                            onChange={(e) => setNotificationMessage(e.target.value)}
                            placeholder="Enter your message to the customer..."
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setNotificationDialogOpen(false)}
                        disabled={sendingNotification}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSendNotification}
                        disabled={!notificationMessage.trim() || sendingNotification}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {sendingNotification ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Bell className="mr-2 h-4 w-4" />
                                Send Notification
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Send Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-600" />
                        Send Email
                    </DialogTitle>
                    <DialogDescription>
                        {emailOrder && `Send email to customer for order #${emailOrder.id}`}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email-title">Title</Label>
                        <Input
                            id="email-title"
                            value={emailTitle}
                            onChange={(e) => setEmailTitle(e.target.value)}
                            placeholder="Email title (internal reference)"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email-subject">Subject</Label>
                        <Input
                            id="email-subject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Email subject line"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email-body">Body</Label>
                        <Textarea
                            id="email-body"
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            placeholder="Enter your email message to the customer..."
                            rows={6}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setEmailDialogOpen(false)}
                        disabled={sendingEmail}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSendEmail}
                        disabled={!emailSubject.trim() || !emailBody.trim() || sendingEmail}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {sendingEmail ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
