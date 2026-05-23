'use client';

import { useEffect, useState } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Building2, AlertTriangle, Search, MapPin } from "lucide-react";
import { ServiceabilityService } from "@/services/serviceability";
import type {
  ServiceableCity,
  CityStatus,
  CreateCityRequest,
  UpdateCityRequest,
  CityAutocompleteSuggestion,
} from "@/types/serviceability";

interface CityFormData {
  name: string;
  state: string;
  latitude: string;
  longitude: string;
  radius_km: string;
  status: CityStatus;
}

interface FormErrors {
  name?: string;
  state?: string;
  latitude?: string;
  longitude?: string;
  radius_km?: string;
  status?: string;
}

interface CityFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  city?: ServiceableCity;
  onClose: () => void;
  onSubmit: (data: CreateCityRequest | UpdateCityRequest, mode: 'create' | 'edit') => Promise<void>;
  isSubmitting?: boolean;
}

const MAHARASHTRA_STATE = 'Maharashtra';

const initialFormData: CityFormData = {
  name: '',
  state: MAHARASHTRA_STATE,
  latitude: '',
  longitude: '',
  radius_km: '',
  status: 'available',
};

export function CityFormDialog({
  open,
  mode,
  city,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CityFormDialogProps) {
  const [formData, setFormData] = useState<CityFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showStatusWarning, setShowStatusWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CityAutocompleteSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && city) {
        setFormData({
          name: city.name,
          state: MAHARASHTRA_STATE,
          latitude: city.latitude,
          longitude: city.longitude,
          radius_km: city.radius_km,
          status: city.status,
        });
        setSearchQuery(city.name);
      } else {
        setFormData(initialFormData);
        setSearchQuery('');
      }

      setErrors({});
      setShowStatusWarning(false);
      setPendingSubmit(false);
      setSuggestions([]);
      setSearchError('');
      setSuggestionOpen(false);
    }
  }, [open, mode, city]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const normalizedQuery = searchQuery.trim();
    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setSearchError('');
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError('');

    const timer = window.setTimeout(async () => {
      try {
        const results = await ServiceabilityService.searchCitySuggestions(normalizedQuery);
        if (cancelled) {
          return;
        }

        setSuggestions(results);
        setSuggestionOpen(true);
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        setSuggestions([]);
        setSearchError(error.message || 'Unable to load Maharashtra city suggestions.');
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, searchQuery]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'City name is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    } else if (formData.state.trim().toLowerCase() !== MAHARASHTRA_STATE.toLowerCase()) {
      newErrors.state = 'Only Maharashtra cities can be added here';
    }

    const lat = parseFloat(formData.latitude);
    if (formData.latitude === '' || isNaN(lat)) {
      newErrors.latitude = 'Latitude is required';
    } else if (lat < -90 || lat > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    const lng = parseFloat(formData.longitude);
    if (formData.longitude === '' || isNaN(lng)) {
      newErrors.longitude = 'Longitude is required';
    } else if (lng < -180 || lng > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    const radius = parseFloat(formData.radius_km);
    if (formData.radius_km === '' || isNaN(radius)) {
      newErrors.radius_km = 'Service radius is required';
    } else if (radius <= 0) {
      newErrors.radius_km = 'Service radius must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof CityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSuggestionSelect = (suggestion: CityAutocompleteSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      name: suggestion.name,
      state: MAHARASHTRA_STATE,
      latitude: suggestion.latitude.toFixed(6),
      longitude: suggestion.longitude.toFixed(6),
      radius_km: prev.radius_km || '15',
    }));
    setSearchQuery(suggestion.name);
    setSuggestions([]);
    setSuggestionOpen(false);
    setSearchError('');
    setErrors((prev) => ({
      ...prev,
      name: undefined,
      state: undefined,
      latitude: undefined,
      longitude: undefined,
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (mode === 'edit' && city && city.status === 'available' && formData.status === 'coming_soon') {
      setShowStatusWarning(true);
      setPendingSubmit(true);
      return;
    }

    await submitForm();
  };

  const submitForm = async () => {
    const data: CreateCityRequest | UpdateCityRequest = {
      name: formData.name.trim(),
      state: MAHARASHTRA_STATE,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius_km: parseFloat(formData.radius_km),
      status: formData.status,
    };

    await onSubmit(data, mode);
  };

  const handleStatusWarningConfirm = async () => {
    setShowStatusWarning(false);
    if (pendingSubmit) {
      setPendingSubmit(false);
      await submitForm();
    }
  };

  const handleStatusWarningCancel = () => {
    setShowStatusWarning(false);
    setPendingSubmit(false);
  };

  return (
    <>
      <Dialog open={open && !showStatusWarning} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              {mode === 'create' ? 'Add New City' : 'Edit City'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Add a Maharashtra service city using Krutrim-powered autocomplete and coverage coordinates.'
                : 'Update the city details and service parameters.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="rounded-xl border border-green-200 bg-green-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-white p-2 shadow-sm">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-green-900">Maharashtra-only city onboarding</p>
                  <p className="text-sm text-green-800/80">
                    Search a city from Krutrim suggestions and we&apos;ll auto-fill the city name, state,
                    and map coordinates.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="city-search">Search Maharashtra City *</Label>
              <Popover open={suggestionOpen} onOpenChange={setSuggestionOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="city-search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSuggestionOpen(true);
                      }}
                      placeholder="Start typing Mumbai, Pune, Thane..."
                      className="pl-9"
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                  </div>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
                  <div className="space-y-1">
                    {suggestions.length > 0 ? (
                      suggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.place_id}-${suggestion.name}`}
                          type="button"
                          className="flex w-full flex-col rounded-md px-3 py-2 text-left transition hover:bg-muted"
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <span className="text-sm font-medium">{suggestion.name}</span>
                          <span className="text-xs text-muted-foreground">{suggestion.display_name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {isSearching ? 'Looking up Maharashtra cities...' : 'No Maharashtra city suggestions yet.'}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Suggestions are filtered to `{MAHARASHTRA_STATE}` before they reach this dialog.
              </p>
              {searchError && <p className="text-sm text-destructive">{searchError}</p>}
            </div>

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

            <div className="grid gap-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                readOnly
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="radius_km">Service Radius (km) *</Label>
                <Input
                  id="radius_km"
                  type="number"
                  step="any"
                  value={formData.radius_km}
                  onChange={(e) => handleChange('radius_km', e.target.value)}
                  placeholder="e.g., 15"
                  className={errors.radius_km ? 'border-destructive' : ''}
                />
                {errors.radius_km && (
                  <p className="text-sm text-destructive">{errors.radius_km}</p>
                )}
              </div>

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
