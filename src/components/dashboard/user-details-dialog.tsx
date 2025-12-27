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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserProfile, 
  AddressSummary, 
  UserService,
  CreateAddressRequest,
  UpdateAddressRequest
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
  Trash2,
  Plus,
  Loader2,
  Save,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserDetailsDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUserUpdated?: () => void;
}

export default function UserDetailsDialog({ user, isOpen, onOpenChange, onUserUpdated }: UserDetailsDialogProps) {
  const [editingUser, setEditingUser] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<number | null>(null);
  
  const [newAddress, setNewAddress] = useState<CreateAddressRequest>({
    name: '',
    phone_number: '',
    room_number: '',
    street: '',
    area: '',
    city: '',
    state: '',
    country: 'India',
    pincode: 0,
    delivery_suggestion: '',
    user: user.id
  });

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
      toast({
        title: "Error",
        description: error.message || "Failed to load addresses",
        variant: "destructive"
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveUser = async () => {
    try {
      setSaving(true);
      await UserService.updateUser(user.id, { name: editedName });
      toast({
        title: "Success",
        description: "User updated successfully"
      });
      setEditingUser(false);
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAddress = async () => {
    try {
      setSaving(true);
      const { AuthService } = await import("@/components/backend/apiService");
      await AuthService.createAddress(newAddress);
      toast({
        title: "Success",
        description: "Address created successfully"
      });
      setAddingAddress(false);
      setNewAddress({
        name: '',
        phone_number: '',
        room_number: '',
        street: '',
        area: '',
        city: '',
        state: '',
        country: 'India',
        pincode: 0,
        delivery_suggestion: '',
        user: user.id
      });
      await loadAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create address",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      setSaving(true);
      const { AuthService } = await import("@/components/backend/apiService");
      await AuthService.deleteAddress(addressId);
      toast({
        title: "Success",
        description: "Address deleted successfully"
      });
      setDeletingAddress(null);
      await loadAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profile_image || undefined} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {editingUser ? (
                  <div className="space-y-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-xl font-bold"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveUser} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingUser(false);
                        setEditedName(user.name);
                      }}>
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-2xl">{user.name}</DialogTitle>
                      <Button size="sm" variant="ghost" onClick={() => setEditingUser(true)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <DialogDescription>
                      {user.email} {user.phone_number && `| ${user.phone_number}`}
                    </DialogDescription>
                    <div className="flex items-center gap-2 mt-1">
                      {user.is_superuser && <Badge variant="default">Superuser</Badge>}
                      {user.is_staff && !user.is_superuser && <Badge variant="secondary">Staff</Badge>}
                      {!user.is_staff && !user.is_superuser && <Badge variant="outline">User</Badge>}
                      {user.is_active ? (
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <Card className="border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-green-900 dark:text-green-100">
                    <UserIcon className="w-4 h-4 text-green-600" />
                    Personal Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{user.phone_number || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Joined {new Date(user.date_joined).toLocaleDateString()}</span>
                  </div>
                  {user.gender && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="capitalize">{user.gender.replace('_', ' ')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {user.referral_code && (
                <Card className="border-green-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-900 dark:text-green-100">
                      <Gift className="w-4 h-4 text-green-600" />
                      Referral Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Referral Code:</span>
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-xs">
                        {user.referral_code}
                      </code>
                    </div>
                    {user.referred_balance && (
                      <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <span className="font-medium">Referral Balance:</span>
                        <span className="font-bold text-green-600 text-lg">₹{user.referred_balance}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span>First Order Completed:</span>
                      <Badge variant={user.has_completed_first_order ? "default" : "secondary"}>
                        {user.has_completed_first_order ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Addresses ({addresses.length})</h3>
                <Button size="sm" onClick={() => setAddingAddress(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </div>

              {loadingAddresses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No addresses found
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <Card key={addr.id} className="border-green-100">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold">{addr.name}</div>
                            <div className="text-sm text-muted-foreground">{addr.phone_number}</div>
                            <div className="text-sm mt-2">
                              {addr.room_number}, {addr.street}, {addr.area}
                            </div>
                            <div className="text-sm">
                              {addr.city}, {addr.state} - {addr.pincode}
                            </div>
                            {addr.delivery_suggestion && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Note: {addr.delivery_suggestion}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setDeletingAddress(addr.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {addingAddress && (
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-base">Add New Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={newAddress.name}
                          onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <Input
                          value={newAddress.phone_number}
                          onChange={(e) => setNewAddress({ ...newAddress, phone_number: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Room/Flat Number</Label>
                        <Input
                          value={newAddress.room_number}
                          onChange={(e) => setNewAddress({ ...newAddress, room_number: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Street</Label>
                        <Input
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Area</Label>
                        <Input
                          value={newAddress.area}
                          onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Pincode</Label>
                        <Input
                          type="number"
                          value={newAddress.pincode || ''}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Delivery Suggestion (Optional)</Label>
                      <Input
                        value={newAddress.delivery_suggestion}
                        onChange={(e) => setNewAddress({ ...newAddress, delivery_suggestion: e.target.value })}
                        placeholder="e.g., Ring the bell twice"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateAddress} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Address
                      </Button>
                      <Button variant="outline" onClick={() => setAddingAddress(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Orders ({user.orders?.length || 0})</h3>
              </div>

              {!user.orders || user.orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found
                </div>
              ) : (
                <div className="space-y-3">
                  {user.orders.map(order => (
                    <Card key={order.id} className="border-green-100">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">Order #{order.order_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm mt-2">
                              Items: {order.orders?.length || 0}
                            </div>
                            {order.estimated_order_value && (
                              <div className="text-sm font-semibold text-green-600">
                                ₹{order.estimated_order_value}
                              </div>
                            )}
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

            <TabsContent value="referrals" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Referral Information</h3>
              </div>

              {user.referral_code ? (
                <Card className="border-green-100">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Referral Code:</span>
                        <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded font-mono">
                          {user.referral_code}
                        </code>
                      </div>
                      {user.referred_balance && (
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                          <span className="font-medium">Total Earnings:</span>
                          <span className="font-bold text-green-600 text-xl">₹{user.referred_balance}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm">First Order Status:</span>
                        <Badge variant={user.has_completed_first_order ? "default" : "secondary"}>
                          {user.has_completed_first_order ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No referral code assigned
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingAddress !== null} onOpenChange={(open) => !open && setDeletingAddress(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAddress && handleDeleteAddress(deletingAddress)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
