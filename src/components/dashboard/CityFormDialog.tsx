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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Building2, AlertTriangle } from "lucide-react";
import type { ServiceableCity, CityStatus, CreateCityRequest, UpdateCityRequest } from "@/types/serviceability";

/**
 * Form data interface for city form
 */
interface CityFormData {
  name: string;
  state: string;
  latitude: string;
  longitude: string;
  radius_km: string;
  status: CityStatus;
}

/**
 * Form validation errors
 */
interface FormErrors {
  name?: string;
  state?: string;
  latitude?: string;
  longitude?: string;
  radius_km?: string;
  status?: string;
}

/**
 * Props for CityFormDialog component
 */
interface CityFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  city?: ServiceableCity;
  onClose: () => void;
  onSubmit: (data: CreateCityRequest | UpdateCityRequest, mode: 'create' | 'edit') => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Initial form data for create mode
 */
const initialFormData: CityFormData = {
  name: '',
  state: '',
  latitude: '',
  longitude: '',
  radius_km: '',
  status: 'available',
};

/**
 * CityFormDialog - Dialog component for creating and editing cities
 * 
 * Requirements: 2.1, 2.3, 2.4, 2.5, 3.1
 */
export function CityFormDialog({
  open,
  mode,
  city,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CityFormDialogProps) {
  // Form state
  const [formData, setFormData] = useState<CityFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showStatusWarning, setShowStatusWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Pre-populate form when editing - Requirements: 3.1
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && city) {
        setFormData({
          name: city.name,
          state: city.state,
          latitude: city.latitude,
          longitude: city.longitude,
          radius_km: city.radius_km,
          status: city.status,
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
      setShowStatusWarning(false);
      setPendingSubmit(false);
    }
  }, [open, mode, city]);

  /**
   * Validate form data
   * Requirements: 2.3, 2.4, 2.5
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'City name is required';
    }

    // State validation
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    // Latitude validation - Requirements: 2.3
    const lat = parseFloat(formData.latitude);
    if (formData.latitude === '' || isNaN(lat)) {
      newErrors.latitude = 'Latitude is required';
    } else if (lat < -90 || lat > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    // Longitude validation - Requirements: 2.4
    const lng = parseFloat(formData.longitude);
    if (formData.longitude === '' || isNaN(lng)) {
      newErrors.longitude = 'Longitude is required';
    } else if (lng < -180 || lng > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    // Radius validation - Requirements: 2.5
    const radius = parseFloat(formData.radius_km);
    if (formData.radius_km === '' || isNaN(radius)) {
      newErrors.radius_km = 'Service radius is required';
    } else if (radius <= 0) {
      newErrors.radius_km = 'Service radius must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form field change
   */
  const handleChange = (field: keyof CityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Check for status change warning - Requirements: 3.4
    if (mode === 'edit' && city && city.status === 'available' && formData.status === 'coming_soon') {
      setShowStatusWarning(true);
      setPendingSubmit(true);
      return;
    }

    await submitForm();
  };

  /**
   * Submit form data to API
   */
  const submitForm = async () => {
    const data: CreateCityRequest | UpdateCityRequest = {
      name: formData.name.trim(),
      state: formData.state.trim(),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius_km: parseFloat(formData.radius_km),
      status: formData.status,
    };

    await onSubmit(data, mode);
  };

  /**
   * Handle status warning confirmation
   */
  const handleStatusWarningConfirm = async () => {
    setShowStatusWarning(false);
    if (pendingSubmit) {
      setPendingSubmit(false);
      await submitForm();
    }
  };

  /**
   * Handle status warning cancel
   */
  const handleStatusWarningCancel = () => {
    setShowStatusWarning(false);
    setPendingSubmit(false);
  };

  return (
    <>
      <Dialog open={open && !showStatusWarning} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              {mode === 'create' ? 'Add New City' : 'Edit City'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Add a new serviceable city to expand Scrapiz coverage.'
                : 'Update the city details and service parameters.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* City Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">City Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Mumbai"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* State */}
            <div className="grid gap-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="e.g., Maharashtra"
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state}</p>
              )}
            </div>

            {/* Coordinates Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Latitude */}
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleChange('latitude', e.target.value)}
                  placeholder="e.g., 19.0760"
                  className={errors.latitude ? 'border-destructive' : ''}
                />
                {errors.latitude && (
                  <p className="text-sm text-destructive">{errors.latitude}</p>
                )}
              </div>

              {/* Longitude */}
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleChange('longitude', e.target.value)}
                  placeholder="e.g., 72.8777"
                  className={errors.longitude ? 'border-destructive' : ''}
                />
                {errors.longitude && (
                  <p className="text-sm text-destructive">{errors.longitude}</p>
                )}
              </div>
            </div>

            {/* Radius and Status Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Service Radius */}
              <div className="grid gap-2">
                <Label htmlFor="radius_km">Service Radius (km) *</Label>
                <Input
                  id="radius_km"
                  type="number"
                  step="any"
                  value={formData.radius_km}
                  onChange={(e) => handleChange('radius_km', e.target.value)}
                  placeholder="e.g., 50"
                  className={errors.radius_km ? 'border-destructive' : ''}
                />
                {errors.radius_km && (
                  <p className="text-sm text-destructive">{errors.radius_km}</p>
                )}
              </div>

              {/* Status */}
              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value as CityStatus)}
                >
                  <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Add City' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Warning Dialog - Requirements: 3.4 */}
      <AlertDialog open={showStatusWarning} onOpenChange={setShowStatusWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are changing the city status from &quot;Available&quot; to &quot;Coming Soon&quot;. 
              This may impact service availability for customers in this area.
              <br /><br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStatusWarningCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleStatusWarningConfirm}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
