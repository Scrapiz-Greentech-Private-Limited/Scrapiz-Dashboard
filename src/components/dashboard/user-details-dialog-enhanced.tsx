'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserProfile, 
  AddressSummary, 
  UserService,
} from "@/components/backend/apiService";
import { useToast } from "@/hooks/use-toast";
import { 
  User as UserIcon, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Gift, 
  Package,
  Edit,
  Loader2,
  UserCheck,
  UserX,
  Shield,
  CreditCard,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface UserDetailsDialogEnhancedProps {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUserUpdated?: () => void;
  onEditUser?: () => void;
}

export default function UserDetailsDialogEnhanced({ 
  user, 
  isOpen, 
  onOpenChange, 
  onUserUpdated,
  onEditUser 
}: UserDetailsDialogEnhancedProps) {
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
    }
  }, [isOpen, user.id]);

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const data = await UserService.getUserAddresses(user.id);
      setAddresses(data);
    } catch (error: any) {
      // Silently fail - addresses are optional
      console.warn('Failed to load addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleStatusChange = async (action: 'activate' | 'deactivate') => {
    try {
      setStatusLoading(true);
      await UserService.changeUserStatus(user.id, action);
      toast({
        title: "Status Changed",
        description: `User has been ${action}d successfully.`,
      });
      if (onUserUpdated) onUserUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change user status",
        variant: "destructive"
      });
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profile_image || undefined} alt={user.name} />
              <AvatarFallback className="text-xl">{user.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-2xl">{user.name}</DialogTitle>
                {onEditUser && (
                  <Button size="sm" variant="ghost" onClick={onEditUser}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <DialogDescription className="mt-1">
                {user.email}
                {user.phone_number && ` • ${user.phone_number}`}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {user.is_superuser && <Badge variant="default" className="bg-purple-600">Superuser</Badge>}
                {user.is_staff && !user.is_superuser && <Badge variant="secondary">Staff</Badge>}
                {!user.is_staff && !user.is_superuser && <Badge variant="outline">User</Badge>}
                {user.is_active ? (
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                ) : (
                  <Badge variant="destructive">Inactive</Badge>
                )}
                {user.gender && (
                  <Badge variant="outline" className="capitalize">
                    {user.gender.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-3">
                {user.is_active ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleStatusChange('deactivate')}
                    disabled={statusLoading}
                  >
                    {statusLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserX className="h-4 w-4 mr-2" />}
                    Deactivate
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleStatusChange('activate')}
                    disabled={statusLoading}
                  >
                    {statusLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                    Activate
                  </Button>
                )}
                {onEditUser && (
                  <Button size="sm" variant="default" onClick={onEditUser}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="addresses">Addresses ({addresses.length})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({user.orders?.length || 0})</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Personal Info Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="text-sm font-medium">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="text-sm font-medium">{user.phone_number || 'Not provided'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Joined</div>
                    <div className="text-sm font-medium">
                      {user.date_joined 
                        ? new Date(user.date_joined).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Unknown'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Gender</div>
                    <div className="text-sm font-medium capitalize">
                      {user.gender?.replace('_', ' ') || 'Not specified'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Account Status</div>
                  <div className="mt-1">
                    {user.is_active ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Role</div>
                  <div className="mt-1">
                    {user.is_superuser && <Badge variant="default" className="bg-purple-600">Superuser</Badge>}
                    {user.is_staff && !user.is_superuser && <Badge variant="secondary">Staff</Badge>}
                    {!user.is_staff && !user.is_superuser && <Badge variant="outline">Regular User</Badge>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">User ID</div>
                  <div className="text-sm font-medium font-mono">{user.id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">First Order</div>
                  <div className="mt-1">
                    <Badge variant={user.has_completed_first_order ? "default" : "secondary"}>
                      {user.has_completed_first_order ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Info Card */}
            {user.referral_code && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary" />
                    Referral Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Referral Code</div>
                    <code className="mt-1 inline-block bg-muted px-2 py-1 rounded font-mono text-sm">
                      {user.referral_code}
                    </code>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Referral Balance</div>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      ₹{user.referred_balance || '0.00'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="addresses" className="mt-4">
            {loadingAddresses ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No addresses found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <Card key={addr.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold">{addr.name}</div>
                          <div className="text-sm text-muted-foreground">{addr.phone_number}</div>
                          <div className="text-sm mt-2">
                            {addr.room_number && `${addr.room_number}, `}
                            {addr.street && `${addr.street}, `}
                            {addr.area}
                          </div>
                          <div className="text-sm">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </div>
                          {addr.delivery_suggestion && (
                            <div className="text-xs text-muted-foreground mt-2 italic">
                              Note: {addr.delivery_suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            {!user.orders || user.orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {user.orders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-semibold">Order #{order.order_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-sm mt-2">
                              Items: {order.orders?.length || 0}
                            </div>
                            {order.estimated_order_value && (
                              <div className="text-sm font-semibold text-green-600 mt-1">
                                ₹{order.estimated_order_value}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {order.status?.name || 'Unknown'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="referrals" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  Referral Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.referral_code ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground">Referral Code</div>
                        <code className="text-lg font-mono font-bold">{user.referral_code}</code>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-xs text-muted-foreground">Total Earnings</div>
                        <div className="text-2xl font-bold text-green-600">
                          ₹{user.referred_balance || '0.00'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-sm">First Order Status</span>
                      <Badge variant={user.has_completed_first_order ? "default" : "secondary"}>
                        {user.has_completed_first_order ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No referral code assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
