'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, MapPin } from "lucide-react";
import type { ServiceArea, CreateAreaRequest, UpdateAreaRequest } from "@/types/serviceability";

interface AreaFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  area?: ServiceArea;
  pincodeId: number;
  pincodeName: string;
  onClose: () => void;
  onSubmit: (data: CreateAreaRequest | UpdateAreaRequest, mode: 'create' | 'edit') => Promise<void>;
  isSubmitting?: boolean;
}

export function AreaFormDialog({
  open,
  mode,
  area,
  pincodeId,
  pincodeName,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AreaFormDialogProps) {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or mode changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && area) {
        setName(area.name);
        setLatitude(area.latitude || '');
        setLongitude(area.longitude || '');
        setIsActive(area.is_active);
      } else {
        setName('');
        setLatitude('');
        setLongitude('');
        setIsActive(true);
      }
      setErrors({});
    }
  }, [open, mode, area]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Area name is required';
    }

    if (latitude && (isNaN(parseFloat(latitude)) || parseFloat(latitude) < -90 || parseFloat(latitude) > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    if (longitude && (isNaN(parseFloat(longitude)) || parseFloat(longitude) < -180 || parseFloat(longitude) > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const data: CreateAreaRequest | UpdateAreaRequest = mode === 'create'
      ? {
          pincode: pincodeId,
          name: name.trim(),
          ...(latitude && { latitude: parseFloat(latitude) }),
          ...(longitude && { longitude: parseFloat(longitude) }),
          is_active: isActive,
        }
      : {
          name: name.trim(),
          ...(latitude && { latitude: parseFloat(latitude) }),
          ...(longitude && { longitude: parseFloat(longitude) }),
          is_active: isActive,
        };

    await onSubmit(data, mode);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            {mode === 'create' ? 'Add New Area' : 'Edit Area'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? `Add a new area under pincode ${pincodeName}`
              : `Update area details for pincode ${pincodeName}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Area Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Area Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Adarsh Nagar, DN Nagar"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Coordinates (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude (Optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 19.0760"
                  className={errors.latitude ? 'border-destructive' : ''}
                />
                {errors.latitude && (
                  <p className="text-sm text-destructive">{errors.latitude}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude (Optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., 72.8777"
                  className={errors.longitude ? 'border-destructive' : ''}
                />
                {errors.longitude && (
                  <p className="text-sm text-destructive">{errors.longitude}</p>
                )}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this area for service
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Add Area' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
