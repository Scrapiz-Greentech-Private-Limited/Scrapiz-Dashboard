'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AgentService } from "@/services/agent"
import type { CreateAgentRequest } from "@/types/agent"
import { showError } from "@/lib/toast-helpers"
import { Loader2, Upload, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AddAgentDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSuccess: () => void
}

interface FormErrors {
  name?: string
  phone?: string
  email?: string
  address?: string
}

export default function AddAgentDialog({ isOpen, onOpenChange, onSuccess }: AddAgentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  
  // Form state
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    phone: '',
    email: '',
    address: '',
    profile_image_url: null,
    vehicle_number: null,
    vehicle_type: null,
    daily_capacity: 10,
    coverage_location: null,
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      profile_image_url: null,
      vehicle_number: null,
      vehicle_type: null,
      daily_capacity: 10,
      coverage_location: null,
    })
    setErrors({})
  }

  // Handle input change
  const handleChange = (field: keyof CreateAgentRequest, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[+]?[\d\s-]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      await AgentService.createAgent(formData)
      resetForm()
      onSuccess()
    } catch (error: any) {
      showError(error.message || 'Failed to create agent')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Agent</DialogTitle>
          <DialogDescription>
            Create a new pickup agent. Fill in the required details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.profile_image_url || undefined} alt="Profile" />
              <AvatarFallback className="text-lg">
                {formData.name ? getInitials(formData.name) : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="profile_image_url">Profile Image URL</Label>
              <Input
                id="profile_image_url"
                placeholder="https://example.com/image.jpg"
                value={formData.profile_image_url || ''}
                onChange={(e) => handleChange('profile_image_url', e.target.value || null)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a URL for the agent's profile image
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter agent's full name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="agent@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="daily_capacity">Daily Capacity</Label>
              <Input
                id="daily_capacity"
                type="number"
                min={1}
                max={50}
                value={formData.daily_capacity}
                onChange={(e) => handleChange('daily_capacity', parseInt(e.target.value) || 10)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum orders per day
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="address"
              placeholder="Enter agent's full address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={errors.address ? 'border-destructive' : ''}
              rows={3}
            />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address}</p>
            )}
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Vehicle Information (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_number">Vehicle Number</Label>
                <Input
                  id="vehicle_number"
                  placeholder="MH 01 AB 1234"
                  value={formData.vehicle_number || ''}
                  onChange={(e) => handleChange('vehicle_number', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Vehicle Type</Label>
                <Input
                  id="vehicle_type"
                  placeholder="e.g., Tempo, Auto, Bike"
                  value={formData.vehicle_type || ''}
                  onChange={(e) => handleChange('vehicle_type', e.target.value || null)}
                />
              </div>
            </div>
          </div>

          {/* Coverage Location */}
          <div className="space-y-2">
            <Label htmlFor="coverage_location">Coverage Location (Optional)</Label>
            <Input
              id="coverage_location"
              placeholder="e.g., North Delhi, Sector 15, Downtown Area"
              value={formData.coverage_location || ''}
              onChange={(e) => handleChange('coverage_location', e.target.value || null)}
            />
            <p className="text-xs text-muted-foreground">
              Specify the area or location this agent will cover
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Agent'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
