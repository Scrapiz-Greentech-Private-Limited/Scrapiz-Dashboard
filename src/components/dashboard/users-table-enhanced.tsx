'use client'

import * as React from "react"
import { MoreHorizontal, RefreshCw, Download, Edit, Trash2, UserCheck, UserX, Shield, ShieldOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { UserProfile, UserService } from "@/components/backend/apiService"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import UserDetailsDialogEnhanced from "./user-details-dialog-enhanced"
import UserEditDialog from "./user-edit-dialog"
import { TableSkeleton } from "./table-skeleton"
import { BulkOperationsToolbar } from "./bulk-operations-toolbar"
import { useToast } from "@/hooks/use-toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type UsersTableEnhancedProps = {
    users: UserProfile[]
    onUserUpdated?: () => void
    loading?: boolean
    onRefresh?: () => void
}

const ITEMS_PER_PAGE = 25;

export default function UsersTableEnhanced({ 
    users, 
    onUserUpdated, 
    loading = false, 
    onRefresh,
}: UsersTableEnhancedProps) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
    const [isEditOpen, setIsEditOpen] = React.useState(false);
    const [selectedUsers, setSelectedUsers] = React.useState<Set<number>>(new Set());
    const [deleteConfirmUser, setDeleteConfirmUser] = React.useState<UserProfile | null>(null);
    const [statusChangeUser, setStatusChangeUser] = React.useState<{ user: UserProfile; action: 'activate' | 'deactivate' | 'restrict' } | null>(null);
    const [bulkAction, setBulkAction] = React.useState<{ action: 'activate' | 'deactivate' | 'delete'; count: number } | null>(null);
    const [actionLoading, setActionLoading] = React.useState(false);
    const { toast } = useToast();

    const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedUsers = users.slice(startIndex, endIndex);

    // Reset to page 1 when users change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [users.length]);

    // Clear selection when users change
    React.useEffect(() => {
        setSelectedUsers(new Set());
    }, [users.length]);

    const handleViewDetails = (user: UserProfile) => {
        setSelectedUser(user);
        setIsDetailsOpen(true);
    };

    const handleEditUser = (user: UserProfile) => {
        setSelectedUser(user);
        setIsEditOpen(true);
    };

    const handleUserUpdated = () => {
        setIsDetailsOpen(false);
        setIsEditOpen(false);
        if (onUserUpdated) {
            onUserUpdated();
        }
    };

    // Bulk selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allUserIds = new Set(paginatedUsers.map(u => u.id));
            setSelectedUsers(allUserIds);
        } else {
            setSelectedUsers(new Set());
        }
    };

    const handleSelectUser = (userId: number, checked: boolean) => {
        const newSelection = new Set(selectedUsers);
        if (checked) {
            newSelection.add(userId);
        } else {
            newSelection.delete(userId);
        }
        setSelectedUsers(newSelection);
    };

    const isAllSelected = paginatedUsers.length > 0 && 
        paginatedUsers.every(user => selectedUsers.has(user.id));
    const isSomeSelected = paginatedUsers.some(user => selectedUsers.has(user.id)) && !isAllSelected;

    // Delete user
    const handleDeleteUser = async () => {
        if (!deleteConfirmUser) return;
        
        try {
            setActionLoading(true);
            await UserService.deleteUser(deleteConfirmUser.id);
            toast({
                title: "User Deleted",
                description: `${deleteConfirmUser.name} has been deleted successfully.`,
            });
            setDeleteConfirmUser(null);
            if (onUserUpdated) onUserUpdated();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete user",
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Change user status
    const handleStatusChange = async () => {
        if (!statusChangeUser) return;
        
        try {
            setActionLoading(true);
            await UserService.changeUserStatus(statusChangeUser.user.id, statusChangeUser.action);
            
            const actionText = statusChangeUser.action === 'activate' ? 'activated' 
                : statusChangeUser.action === 'deactivate' ? 'deactivated' 
                : 'restricted';
            
            toast({
                title: "Status Changed",
                description: `${statusChangeUser.user.name} has been ${actionText}.`,
            });
            setStatusChangeUser(null);
            if (onUserUpdated) onUserUpdated();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to change user status",
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Bulk actions
    const handleBulkAction = async () => {
        if (!bulkAction) return;
        
        try {
            setActionLoading(true);
            const userIds = Array.from(selectedUsers);
            const result = await UserService.bulkAction(bulkAction.action, userIds);
            
            toast({
                title: "Bulk Action Complete",
                description: result.message,
            });
            setBulkAction(null);
            setSelectedUsers(new Set());
            if (onUserUpdated) onUserUpdated();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to perform bulk action",
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Export selected users
    const handleExportSelected = async () => {
        try {
            const userIds = Array.from(selectedUsers);
            const blob = await UserService.exportUsers(userIds);
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast({
                title: "Export Complete",
                description: `${userIds.length} users exported successfully.`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to export users",
                variant: "destructive",
            });
        }
    };

    // Export all users
    const handleExportAll = async () => {
        try {
            const blob = await UserService.exportUsers();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users-export-all-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast({
                title: "Export Complete",
                description: `All users exported successfully.`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to export users",
                variant: "destructive",
            });
        }
    };

    // Show loading skeleton
    if (loading && users.length === 0) {
        return <TableSkeleton rows={5} columns={8} showAvatar={true} />
    }

    // Show empty state
    if (!loading && users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">No users found</p>
                {onRefresh && (
                    <Button variant="outline" size="sm" onClick={onRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                )}
            </div>
        )
    }

    return (
        <>
        {/* Bulk Operations Toolbar */}
        {selectedUsers.size > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between flex-wrap gap-4">
                <span className="text-sm font-medium">
                    {selectedUsers.size} user(s) selected
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkAction({ action: 'activate', count: selectedUsers.size })}
                    >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkAction({ action: 'deactivate', count: selectedUsers.size })}
                    >
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportSelected}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBulkAction({ action: 'delete', count: selectedUsers.size })}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUsers(new Set())}
                    >
                        Clear Selection
                    </Button>
                </div>
            </div>
        )}
        
        {/* Export All Button */}
        <div className="flex justify-end mb-4">
            <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
                disabled={users.length === 0}
            >
                <Download className="h-4 w-4 mr-2" />
                Export All Users
            </Button>
        </div>

        <div className="overflow-x-auto rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">
                        <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all users"
                            className={isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""}
                        />
                    </TableHead>
                    <TableHead className="w-[60px]">Avatar</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Joined</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Orders</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedUsers.map((user) => {
                    const isSelected = selectedUsers.has(user.id);
                    return (
                    <TableRow key={user.id} className={isSelected ? 'bg-muted/50' : ''}>
                        <TableCell>
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                                aria-label={`Select user ${user.name}`}
                            />
                        </TableCell>
                        <TableCell>
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.profile_image || undefined} alt={user.name} />
                                <AvatarFallback>{user.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                            {user.referral_code && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    Ref: <code className="bg-muted px-1 rounded">{user.referral_code}</code>
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            {user.phone_number || '-'}
                        </TableCell>
                        <TableCell>
                            {user.is_superuser && (
                                <Badge variant="default" className="bg-purple-600">Superuser</Badge>
                            )}
                            {user.is_staff && !user.is_superuser && (
                                <Badge variant="secondary">Staff</Badge>
                            )}
                            {!user.is_staff && !user.is_superuser && (
                                <Badge variant="outline">User</Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            {user.is_active ? (
                                <Badge variant="default" className="bg-green-600">Active</Badge>
                            ) : (
                                <Badge variant="destructive">Inactive</Badge>
                            )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                            {user.date_joined 
                                ? new Date(user.date_joined).toLocaleDateString()
                                : '-'
                            }
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right">
                            {user.orders?.length || 0}
                        </TableCell>
                        <TableCell>
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
                                    <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit User
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {user.is_active ? (
                                        <DropdownMenuItem 
                                            onClick={() => setStatusChangeUser({ user, action: 'deactivate' })}
                                        >
                                            <UserX className="h-4 w-4 mr-2" />
                                            Deactivate
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem 
                                            onClick={() => setStatusChangeUser({ user, action: 'activate' })}
                                        >
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Activate
                                        </DropdownMenuItem>
                                    )}
                                    {user.is_staff && !user.is_superuser && (
                                        <DropdownMenuItem 
                                            onClick={() => setStatusChangeUser({ user, action: 'restrict' })}
                                        >
                                            <ShieldOff className="h-4 w-4 mr-2" />
                                            Remove Staff Access
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        onClick={() => setDeleteConfirmUser(user)}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    );
                })}
            </TableBody>
        </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, users.length)} of {users.length} users
                </div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(p => Math.max(1, p - 1));
                                }}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                                        className="cursor-pointer"
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
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        )}

        {/* User Details Dialog */}
        {selectedUser && (
            <UserDetailsDialogEnhanced 
                user={selectedUser}
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onUserUpdated={handleUserUpdated}
                onEditUser={() => {
                    setIsDetailsOpen(false);
                    setIsEditOpen(true);
                }}
            />
        )}

        {/* User Edit Dialog */}
        {selectedUser && (
            <UserEditDialog
                user={selectedUser}
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                onUserUpdated={handleUserUpdated}
            />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>{deleteConfirmUser?.name}</strong>? 
                        This action will deactivate the account and cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteUser}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={actionLoading}
                    >
                        {actionLoading ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Status Change Confirmation Dialog */}
        <AlertDialog open={!!statusChangeUser} onOpenChange={(open) => !open && setStatusChangeUser(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {statusChangeUser?.action === 'activate' && 'Activate User'}
                        {statusChangeUser?.action === 'deactivate' && 'Deactivate User'}
                        {statusChangeUser?.action === 'restrict' && 'Restrict User'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {statusChangeUser?.action === 'activate' && (
                            <>Are you sure you want to activate <strong>{statusChangeUser?.user.name}</strong>? They will be able to log in again.</>
                        )}
                        {statusChangeUser?.action === 'deactivate' && (
                            <>Are you sure you want to deactivate <strong>{statusChangeUser?.user.name}</strong>? They will not be able to log in.</>
                        )}
                        {statusChangeUser?.action === 'restrict' && (
                            <>Are you sure you want to remove staff access from <strong>{statusChangeUser?.user.name}</strong>? They will lose admin privileges.</>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleStatusChange}
                        disabled={actionLoading}
                    >
                        {actionLoading ? 'Processing...' : 'Confirm'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Action Confirmation Dialog */}
        <AlertDialog open={!!bulkAction} onOpenChange={(open) => !open && setBulkAction(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {bulkAction?.action === 'activate' && 'Activate Users'}
                        {bulkAction?.action === 'deactivate' && 'Deactivate Users'}
                        {bulkAction?.action === 'delete' && 'Delete Users'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {bulkAction?.action === 'activate' && (
                            <>Are you sure you want to activate {bulkAction?.count} user(s)?</>
                        )}
                        {bulkAction?.action === 'deactivate' && (
                            <>Are you sure you want to deactivate {bulkAction?.count} user(s)?</>
                        )}
                        {bulkAction?.action === 'delete' && (
                            <>Are you sure you want to delete {bulkAction?.count} user(s)? This action cannot be undone.</>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleBulkAction}
                        className={bulkAction?.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
                        disabled={actionLoading}
                    >
                        {actionLoading ? 'Processing...' : 'Confirm'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}
