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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin } from "lucide-react";
import type { 
  ServiceablePincode, 
  ServiceableCity,
  CreatePincodeRequest, 
  UpdatePincodeRequest 
} from "@/types/serviceability";

/**
 * Form data interface for pincode form
 */
interface PincodeFormData {
  pincode: string;
  area_name: string;
  city: string; // city ID as string for form handling
}

/**
 * Form validation errors
 */
interface FormErrors {
  pincode?: string;
  area_name?: string;
  city?: string;
}

/**
 * Props for PincodeFormDialog component
 */
interface PincodeFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  pincode?: ServiceablePincode;
  cities: ServiceableCity[];
  selectedCityId?: number;
  onClose: () => void;
  onSubmit: (data: CreatePincodeRequest | UpdatePincodeRequest, mode: 'create' | 'edit') => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Initial form data for create mode
 */
const initialFormData: PincodeFormData = {
  pincode: '',
  area_name: '',
  city: '',
};

/**
 * Validate pincode format
 * Requirements: 6.3, 6.4
 * - Must be exactly 6 digits
 * - Must start with 1-9
 */
function validatePincodeFormat(pincode: string): string | undefined {
  if (!pincode.trim()) {
    return 'Pincode is required';
  }
  
  // Check if exactly 6 digits
  if (!/^\d{6}$/.test(pincode)) {
    return 'Pincode must be exactly 6 digits';
  }
  
  // Check if starts with 1-9
  if (!/^[1-9]/.test(pincode)) {
    return 'Pincode must start with a digit from 1-9';
  }
  
  return undefined;
}

/**
 * PincodeFormDialog - Dialog component for creating and editing pincodes
 * 
 * Requirements: 6.1, 7.1
 * - Form fields: pincode, area_name, city (dropdown)
 * - Client-side validation for pincode format
 * - Support both create and edit modes
 */
export function PincodeFormDialog({
  open,
  mode,
  pincode,
  cities,
  selectedCityId,
  onClose,
  onSubmit,
  isSubmitting = false,
}: PincodeFormDialogProps) {
  // Form state
  const [formData, setFormData] = useState<PincodeFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});

  // Pre-populate form when editing or set default city - Requirements: 7.1
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && pincode) {
        setFormData({
          pincode: pincode.pincode,
          area_name: pincode.area_name || '',
          city: pincode.city.toString(),
        });
      } else {
        // For create mode, pre-select the currently selected city
        setFormData({
          ...initialFormData,
          city: selectedCityId?.toString() || '',
        });
      }
      setErrors({});
    }
  }, [open, mode, pincode, selectedCityId]);

  /**
   * Validate form data
   * Requirements: 6.3, 6.4
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Pincode validation (only for create mode, pincode cannot be changed in edit)
    if (mode === 'create') {
      const pincodeError = validatePincodeFormat(formData.pincode);
      if (pincodeError) {
        newErrors.pincode = pincodeError;
      }
    }

    // City validation
    if (!formData.city) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form field change
   */
  const handleChange = (field: keyof PincodeFormData, value: string) => {
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

    if (mode === 'create') {
      const data: CreatePincodeRequest = {
        pincode: formData.pincode.trim(),
        city: parseInt(formData.city, 10),
        area_name: formData.area_name.trim() || undefined,
      };
      await onSubmit(data, mode);
    } else {
      const data: UpdatePincodeRequest = {
        city: parseInt(formData.city, 10),
        area_name: formData.area_name.trim() || undefined,
      };
      await onSubmit(data, mode);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            {mode === 'create' ? 'Add New Pincode' : 'Edit Pincode'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new serviceable pincode to expand coverage within a city.'
              : 'Update the pincode details.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Pincode */}
          <div className="grid gap-2">
            <Label htmlFor="pincode">Pincode *</Label>
            <Input
              id="pincode"
              value={formData.pincode}
              onChange={(e) => handleChange('pincode', e.target.value)}
              placeholder="e.g., 401107"
              maxLength={6}
              disabled={mode === 'edit'} // Pincode cannot be changed in edit mode
              className={errors.pincode ? 'border-destructive' : ''}
            />
            {errors.pincode && (
              <p className="text-sm text-destructive">{errors.pincode}</p>
            )}
            {mode === 'edit' && (
              <p className="text-xs text-muted-foreground">
                Pincode cannot be changed after creation.
              </p>
            )}
          </div>

          {/* Area Name */}
          <div className="grid gap-2">
            <Label htmlFor="area_name">Area Name</Label>
            <Input
              id="area_name"
              value={formData.area_name}
              onChange={(e) => handleChange('area_name', e.target.value)}
              placeholder="e.g., Mira Road East"
              className={errors.area_name ? 'border-destructive' : ''}
            />
            {errors.area_name && (
              <p className="text-sm text-destructive">{errors.area_name}</p>
            )}
          </div>

          {/* City Selection */}
          <div className="grid gap-2">
            <Label htmlFor="city">City *</Label>
            <Select
              value={formData.city}
              onValueChange={(value) => handleChange('city', value)}
            >
              <SelectTrigger className={errors.city ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id.toString()}>
                    {city.name}, {city.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city}</p>
            )}
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
            {mode === 'create' ? 'Add Pincode' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
