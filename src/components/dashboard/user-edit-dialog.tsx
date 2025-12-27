'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserProfile, UserService } from "@/components/backend/apiService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface UserEditDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUserUpdated?: () => void;
}

export default function UserEditDialog({ 
  user, 
  isOpen, 
  onOpenChange, 
  onUserUpdated 
}: UserEditDialogProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone_number: user.phone_number || '',
    gender: user.gender || '',
    is_active: user.is_active ?? true,
    is_staff: user.is_staff ?? false,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Build update payload with only changed fields
      const updateData: Partial<UserProfile> = {};
      
      if (formData.name !== user.name) {
        updateData.name = formData.name;
      }
      if (formData.phone_number !== (user.phone_number || '')) {
        updateData.phone_number = formData.phone_number || undefined;
      }
      if (formData.gender !== (user.gender || '')) {
        updateData.gender = formData.gender as UserProfile['gender'] || undefined;
      }
      if (formData.is_active !== user.is_active) {
        updateData.is_active = formData.is_active;
      }
      if (formData.is_staff !== user.is_staff) {
        updateData.is_staff = formData.is_staff;
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No Changes",
          description: "No changes were made to the user.",
        });
        return;
      }

      await UserService.updateUser(user.id, updateData);
      
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      
      onOpenChange(false);
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

  // Reset form when dialog opens with new user
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setFormData({
        name: user.name || '',
        phone_number: user.phone_number || '',
        gender: user.gender || '',
        is_active: user.is_active ?? true,
        is_staff: user.is_staff ?? false,
      });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.profile_image || undefined} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select 
              value={formData.gender || 'not_set'} 
              onValueChange={(value) => setFormData({ ...formData, gender: value === 'not_set' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_set">Not specified</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="is_active" className="text-base">Account Active</Label>
              <p className="text-sm text-muted-foreground">
                User can log in when active
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          {/* Staff Status - Only show if not superuser */}
          {!user.is_superuser && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="is_staff" className="text-base">Staff Access</Label>
                <p className="text-sm text-muted-foreground">
                  Grant admin dashboard access
                </p>
              </div>
              <Switch
                id="is_staff"
                checked={formData.is_staff}
                onCheckedChange={(checked) => setFormData({ ...formData, is_staff: checked })}
              />
            </div>
          )}

          {/* Read-only info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono">{user.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>
            </div>
            {user.referral_code && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Referral Code</span>
                <code className="bg-background px-2 py-0.5 rounded">{user.referral_code}</code>
              </div>
            )}
            {user.date_joined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Joined</span>
                <span>{new Date(user.date_joined).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
