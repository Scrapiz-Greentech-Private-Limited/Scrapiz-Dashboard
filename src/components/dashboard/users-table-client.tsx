'use client'

import * as React from "react"
import { MoreHorizontal, RefreshCw, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
import { UserProfile } from "@/components/backend/apiService"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import UserDetailsDialog from "./user-details-dialog"
import { TableSkeleton } from "./table-skeleton"
import { SortableTableHeader } from "./sortable-table-header"
import { SortConfig } from "@/hooks/useSearchAndFilter"
import { BulkOperationsToolbar } from "./bulk-operations-toolbar"
import { exportToCSV } from "@/lib/csv-export"
import { useToast } from "@/hooks/use-toast"

type UsersTableClientProps = {
    users: UserProfile[]
    onUserUpdated?: () => void
    loading?: boolean
    onRefresh?: () => void
    sortConfig?: SortConfig<UserProfile>
    onSort?: (column: keyof UserProfile) => void
}

const ITEMS_PER_PAGE = 50;

export default function UsersTableClient({ 
    users, 
    onUserUpdated, 
    loading = false, 
    onRefresh,
    sortConfig = { key: null, direction: null },
    onSort = () => {},
}: UsersTableClientProps) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
    const [selectedUsers, setSelectedUsers] = React.useState<Set<number>>(new Set());
    const { toast } = useToast();

    const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedUsers = users.slice(startIndex, endIndex);

    // Reset to page 1 when users change (e.g., after filtering)
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

    const handleUserUpdated = () => {
        setIsDetailsOpen(false);
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

    // Export selected users to CSV
    const handleExportSelected = () => {
        const selectedUsersList = users.filter(user => selectedUsers.has(user.id));
        
        if (selectedUsersList.length === 0) {
            toast({
                title: "No users selected",
                description: "Please select users to export.",
                variant: "destructive",
            });
            return;
        }

        const columns = [
            { key: 'id' as keyof UserProfile, label: 'User ID' },
            { key: 'name' as keyof UserProfile, label: 'Name' },
            { key: 'email' as keyof UserProfile, label: 'Email' },
            { key: 'phone_number' as keyof UserProfile, label: 'Phone' },
            { key: 'is_staff' as keyof UserProfile, label: 'Is Staff' },
            { key: 'is_superuser' as keyof UserProfile, label: 'Is Superuser' },
            { key: 'is_active' as keyof UserProfile, label: 'Is Active' },
            { key: 'date_joined' as keyof UserProfile, label: 'Date Joined' },
            { key: 'referral_code' as keyof UserProfile, label: 'Referral Code' },
            { key: 'referred_balance' as keyof UserProfile, label: 'Referral Balance' },
        ];

        const timestamp = new Date().toISOString().split('T')[0];
        exportToCSV(selectedUsersList, columns, `users-export-${timestamp}.csv`);

        toast({
            title: "Export Complete",
            description: `${selectedUsersList.length} users exported successfully.`,
        });
    };

    // Export all users to CSV
    const handleExportAll = () => {
        if (users.length === 0) {
            toast({
                title: "No users to export",
                description: "There are no users available to export.",
                variant: "destructive",
            });
            return;
        }

        const columns = [
            { key: 'id' as keyof UserProfile, label: 'User ID' },
            { key: 'name' as keyof UserProfile, label: 'Name' },
            { key: 'email' as keyof UserProfile, label: 'Email' },
            { key: 'phone_number' as keyof UserProfile, label: 'Phone' },
            { key: 'is_staff' as keyof UserProfile, label: 'Is Staff' },
            { key: 'is_superuser' as keyof UserProfile, label: 'Is Superuser' },
            { key: 'is_active' as keyof UserProfile, label: 'Is Active' },
            { key: 'date_joined' as keyof UserProfile, label: 'Date Joined' },
            { key: 'referral_code' as keyof UserProfile, label: 'Referral Code' },
            { key: 'referred_balance' as keyof UserProfile, label: 'Referral Balance' },
        ];

        const timestamp = new Date().toISOString().split('T')[0];
        exportToCSV(users, columns, `users-export-all-${timestamp}.csv`);

        toast({
            title: "Export Complete",
            description: `${users.length} users exported successfully.`,
        });
    };

    // Show loading skeleton
    if (loading && users.length === 0) {
        return <TableSkeleton rows={5} columns={7} showAvatar={true} />
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
        <BulkOperationsToolbar
            selectedCount={selectedUsers.size}
            onClearSelection={() => setSelectedUsers(new Set())}
            onExport={handleExportSelected}
        />
        
        <div className="flex justify-end p-4 border-b">
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

        <div className="overflow-x-auto">
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
                    <TableHead className="hidden w-[100px] sm:table-cell">
                        <span className="sr-only">Avatar</span>
                    </TableHead>
                    <SortableTableHeader
                        column="name"
                        label="Name"
                        sortConfig={sortConfig}
                        onSort={onSort}
                    />
                    <TableHead className="hidden sm:table-cell">Role</TableHead>
                    <SortableTableHeader
                        column="is_active"
                        label="Status"
                        sortConfig={sortConfig}
                        onSort={onSort}
                        className="hidden md:table-cell"
                    />
                    <SortableTableHeader
                        column="date_joined"
                        label="Joined Date"
                        sortConfig={sortConfig}
                        onSort={onSort}
                        className="hidden lg:table-cell"
                    />
                    <TableHead className="hidden sm:table-cell text-right">Orders</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
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
                        <TableCell className="hidden sm:table-cell">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatarUrl} alt="Avatar" />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                            {user.name}
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                            <div className="flex gap-2 mt-1 sm:hidden">
                                {user.is_staff && <Badge variant="outline" className="text-xs">Staff</Badge>}
                                {user.is_superuser && <Badge variant="outline" className="text-xs">Admin</Badge>}
                                {user.phone_number && <span className="text-xs">{user.phone_number}</span>}
                            </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            {user.is_superuser && <Badge variant="default">Superuser</Badge>}
                            {user.is_staff && !user.is_superuser && <Badge variant="secondary">Staff</Badge>}
                            {!user.is_staff && !user.is_superuser && <Badge variant="outline">User</Badge>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            {user.is_active ? (
                                <Badge variant="default" className="bg-green-600">Active</Badge>
                            ) : (
                                <Badge variant="destructive">Inactive</Badge>
                            )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                            {new Date(user.date_joined).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right">
                            {user.orders?.length || 0} orders
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
                                    <DropdownMenuItem onClick={() => handleViewDetails(user)}>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Edit User</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    );
                })}
            </TableBody>
        </Table>
        </div>
        {selectedUser && (
            <UserDetailsDialog 
                user={selectedUser}
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onUserUpdated={handleUserUpdated}
            />
        )}
        {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
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
        </>
    )
}
