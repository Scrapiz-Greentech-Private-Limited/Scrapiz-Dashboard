'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, Users, FileText, Search, UserPlus, Key, Clock,
  CheckCircle2, XCircle, AlertCircle, Eye, Trash2, Edit,
  Lock, Unlock, Loader2, RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGate } from "@/components/PermissionDenied";
import { usePermission } from "@/hooks/usePermission";
import {
  AdminAuthService,
  AdminUser,
  AdminAuditLog,
  AdminStats,
  PagePermission,
  AllPermissionsResponse,
} from "@/services/adminAuth";


export default function AuthenticationPage() {
  const { toast } = useToast();
  const { user: currentUser, isAdmin } = useAuth();
  const permission = usePermission('authentication');
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allPermissions, setAllPermissions] = useState<AllPermissionsResponse | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRole, setSelectedRole] = useState('staff');
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'staff' as 'admin' | 'staff',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, logsRes, statsRes, permsRes] = await Promise.all([
        AdminAuthService.getUsers({
          search: searchQuery || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        AdminAuthService.getAuditLogs(),
        AdminAuthService.getStats(),
        AdminAuthService.getAllPermissions(),
      ]);
      
      setAdminUsers(usersRes.users);
      setAuditLogs(logsRes.logs);
      setStats(statsRes);
      setAllPermissions(permsRes);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleCreateUser = async () => {
    if (!formData.email || !formData.name || !formData.password) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await AdminAuthService.createUser(formData);
      toast({ title: "Success", description: "User created. Verification email sent." });
      setShowCreateDialog(false);
      setFormData({ email: '', name: '', password: '', role: 'staff' });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await AdminAuthService.updateUser(selectedUser.id, {
        name: formData.name,
        role: formData.role,
      });
      toast({ title: "Success", description: "User updated successfully" });
      setShowEditDialog(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await AdminAuthService.deleteUser(selectedUser.id);
      toast({ title: "Success", description: "User deleted successfully" });
      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      await AdminAuthService.updateUser(user.id, { is_active: !user.is_active });
      toast({ title: "Success", description: `User ${user.is_active ? 'deactivated' : 'activated'}` });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSavePermissions = async () => {
    if (!allPermissions) return;
    
    const rolePerms = allPermissions.permissions[selectedRole];
    if (!rolePerms) return;
    
    setIsSubmitting(true);
    try {
      await AdminAuthService.updateRolePermissions(selectedRole, rolePerms);
      toast({ title: "Success", description: "Permissions saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (pageKey: string, field: keyof PagePermission) => {
    if (!allPermissions) return;
    
    setAllPermissions(prev => {
      if (!prev) return prev;
      const newPerms = { ...prev };
      const rolePerms = [...newPerms.permissions[selectedRole]];
      const pageIndex = rolePerms.findIndex(p => p.page_key === pageKey);
      if (pageIndex >= 0) {
        rolePerms[pageIndex] = {
          ...rolePerms[pageIndex],
          [field]: !rolePerms[pageIndex][field as keyof PagePermission],
        };
        newPerms.permissions[selectedRole] = rolePerms;
      }
      return newPerms;
    });
  };

  const openEditDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({ email: user.email, name: user.name, password: '', role: user.role });
    setShowEditDialog(true);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <PermissionGate hasPermission={permission.hasPermission} isLoading={permission.isLoading}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">Authentication & Access</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage admin users, roles, permissions, and audit logs</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={loadData} disabled={isLoading} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {isAdmin && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Admin User</span>
                <span className="sm:hidden">Add User</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-1 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Total Admins</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">{stats?.total_admins ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.active_admins ?? 0} active</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1 sm:gap-2">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Roles</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">2</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="hidden sm:inline">{stats?.admin_role_count ?? 0} Admin, {stats?.staff_role_count ?? 0} Staff</span>
                <span className="sm:hidden">{stats?.admin_role_count ?? 0}A / {stats?.staff_role_count ?? 0}S</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background">
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1 sm:gap-2">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Recent Logins</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">{stats?.recent_logins_24h ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-background">
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-1 sm:gap-2">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Failed Logins</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100">{stats?.failed_logins_24h ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="users" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Admin Users</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-1 sm:gap-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Audit Logs</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-1 sm:gap-2">
              <Key className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Permissions</span>
              <span className="sm:hidden">Perms</span>
            </TabsTrigger>
          </TabsList>

          {/* Admin Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Admin Users Management
                </CardTitle>
                <CardDescription>Manage admin users and their access levels</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {/* Filters */}
                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="flex-1 sm:w-[150px] sm:flex-none">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="flex-1 sm:w-[150px] sm:flex-none">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">User</TableHead>
                        <TableHead className="hidden sm:table-cell">Role</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                        {isAdmin && <TableHead className="text-right min-w-[100px]">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : adminUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No admin users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        adminUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2 sm:gap-3">
                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                  <AvatarFallback className="text-xs sm:text-sm">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm sm:text-base truncate">{user.name}</p>
                                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                                  {/* Mobile: Show role & status inline */}
                                  <div className="flex gap-1 mt-1 sm:hidden">
                                    <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="text-xs px-1.5 py-0">
                                      {user.role === 'admin' ? 'Admin' : 'Staff'}
                                    </Badge>
                                    <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">
                                      {user.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                                {user.role === 'admin' ? 'Admin' : 'Staff'}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                {user.is_active ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(user.last_login)}
                              </div>
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1 sm:gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openEditDialog(user)} className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleToggleStatus(user)} className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                                    {user.is_active ? <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Unlock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                                  </Button>
                                  {user.id !== currentUser?.id && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-9 sm:w-9"
                                      onClick={() => { setSelectedUser(user); setShowDeleteDialog(true); }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card className="border-purple-100">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  Audit Logs
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Track all admin activities and changes</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">User</TableHead>
                        <TableHead className="min-w-[100px]">Action</TableHead>
                        <TableHead className="hidden md:table-cell">Target</TableHead>
                        <TableHead className="hidden sm:table-cell min-w-[140px]">Timestamp</TableHead>
                        <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{log.user}</p>
                                {/* Mobile: Show timestamp below user */}
                                <p className="text-xs text-muted-foreground sm:hidden mt-0.5">
                                  {formatDate(log.timestamp)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">{log.action_display}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{log.target_user || '-'}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{formatDate(log.timestamp)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{log.ip_address || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                                {log.status === 'success' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                <span className="hidden sm:inline">{log.status}</span>
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card className="border-blue-100">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Key className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Role Permissions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Configure access permissions for different roles</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                    <span className="text-sm font-medium">Select Role:</span>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Module</TableHead>
                          <TableHead className="text-center w-[50px] sm:w-[70px]">
                            <span className="hidden sm:inline">View</span>
                            <Eye className="h-4 w-4 mx-auto sm:hidden" />
                          </TableHead>
                          <TableHead className="text-center w-[50px] sm:w-[70px]">
                            <span className="hidden sm:inline">Create</span>
                            <span className="sm:hidden text-xs">+</span>
                          </TableHead>
                          <TableHead className="text-center w-[50px] sm:w-[70px]">
                            <span className="hidden sm:inline">Edit</span>
                            <Edit className="h-4 w-4 mx-auto sm:hidden" />
                          </TableHead>
                          <TableHead className="text-center w-[50px] sm:w-[70px]">
                            <span className="hidden sm:inline">Delete</span>
                            <Trash2 className="h-4 w-4 mx-auto sm:hidden" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allPermissions?.permissions[selectedRole]?.map((perm) => (
                          <TableRow key={perm.page_key}>
                            <TableCell className="font-medium text-xs sm:text-sm">{perm.display_name}</TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm.can_view}
                                onCheckedChange={() => togglePermission(perm.page_key, 'can_view')}
                                disabled={!isAdmin || selectedRole === 'admin'}
                                className="h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm.can_create}
                                onCheckedChange={() => togglePermission(perm.page_key, 'can_create')}
                                disabled={!isAdmin || selectedRole === 'admin'}
                                className="h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm.can_edit}
                                onCheckedChange={() => togglePermission(perm.page_key, 'can_edit')}
                                disabled={!isAdmin || selectedRole === 'admin'}
                                className="h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm.can_delete}
                                onCheckedChange={() => togglePermission(perm.page_key, 'can_delete')}
                                disabled={!isAdmin || selectedRole === 'admin'}
                                className="h-4 w-4"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {isAdmin && selectedRole !== 'admin' && (
                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={loadData} className="w-full sm:w-auto">Reset</Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        onClick={handleSavePermissions}
                        disabled={isSubmitting}
                      >
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Permissions
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Create Admin User</DialogTitle>
              <DialogDescription className="text-sm">Add a new admin or staff user. They will receive a verification email.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password (min 8 characters)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as 'admin' | 'staff' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleCreateUser} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Admin User</DialogTitle>
              <DialogDescription className="text-sm">Update user details and role.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" value={formData.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as 'admin' | 'staff' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleUpdateUser} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg">Delete Admin User</DialogTitle>
              <DialogDescription className="text-sm">
                Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
