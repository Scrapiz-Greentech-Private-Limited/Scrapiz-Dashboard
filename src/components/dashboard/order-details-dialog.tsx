'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { Order, User } from "@/lib/types"
import { users } from "@/lib/data"
import { format } from "date-fns"
import { MapPin, User as UserIcon, Phone, Truck, Calendar, Hash, Box, Weight, DollarSign, StickyNote, Image as ImageIcon, Camera, Mail, Star, CheckCircle2, Clock, Navigation } from "lucide-react"

interface OrderDetailsDialogProps {
  order: Order
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const statusHistory: Record<string, string[]> = {
    pending: ['Order Placed'],
    scheduled: ['Order Placed', 'Agent Scheduled'],
    transit: ['Order Placed', 'Agent Scheduled', 'Agent On The Way'],
    completed: ['Order Placed', 'Agent Scheduled', 'Agent On The Way', 'Order Completed'],
    cancelled: ['Order Placed', 'Order Cancelled'],
}

const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-orange-100 text-orange-700 border-orange-200',
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    transit: 'bg-purple-100 text-purple-700 border-purple-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  }
  return colors[status as keyof typeof colors] || colors.pending
}

export default function OrderDetailsDialog({ order, isOpen, onOpenChange }: OrderDetailsDialogProps) {
  // For backend integration, we'll display the IDs directly since we don't have user lookup
  // In a full implementation, you'd fetch user details from UserService
  const sellerName = order.sellerId;
  const agentName = order.agentId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Hash className="h-6 w-6" />
                  Order {order.id}
                </DialogTitle>
                <DialogDescription className="text-green-100 mt-1">
                  {format(new Date(order.createdAt), "PPP 'at' p")}
                </DialogDescription>
              </div>
              <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1 capitalize`}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-6">
          {/* Top Row - Customer, Agent, Timeline side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Customer Card */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/30 dark:to-background">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-900 dark:text-green-100">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                    <UserIcon className="h-4 w-4 text-green-600" />
                  </div>
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border-2 border-green-200">
                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-lg">
                      {sellerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{sellerName}</p>
                    <p className="text-xs text-muted-foreground truncate">ID: {order.sellerId}</p>
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.pickupAddress)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-green-600 hover:underline line-clamp-2"
                  >
                    {order.pickupAddress}
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Agent Card */}
            <Card className={`border-blue-200 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/30 dark:to-background ${!agentName ? 'flex items-center justify-center' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  Assigned Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {agentName ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 border-2 border-blue-200">
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
                          {agentName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{agentName}</p>
                        <p className="text-xs text-muted-foreground truncate">ID: {order.agentId}</p>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Navigation className="h-4 w-4 text-blue-600" />
                      <span>Agent assigned to this order</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">No agent assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Timeline Card - Compact */}
            <Card className="border-green-200 md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-900 dark:text-green-100">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-5">
                  <div className="absolute left-[0.5rem] top-1 bottom-1 w-0.5 bg-green-200"></div>
                  {(statusHistory[order.status] || []).map((status: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 mb-2.5 relative last:mb-0">
                      <div className="h-2.5 w-2.5 bg-green-600 rounded-full z-10 ring-2 ring-green-100"></div>
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <p className="font-medium text-xs text-green-900 dark:text-green-100 truncate">{status}</p>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
                  {format(new Date(order.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Middle Row - Order Details & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Order Info Card */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/30 dark:to-background">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-purple-900 dark:text-purple-100">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Box className="h-4 w-4 text-purple-600" />
                  </div>
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                    <Badge variant="outline" className="font-medium text-xs">{order.scrapCategory}</Badge>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Est. Weight</p>
                    <p className="font-semibold text-sm">{order.estimatedWeight} kg</p>
                  </div>
                  {order.finalWeight && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Final Weight</p>
                      <p className="font-semibold text-sm text-green-600">{order.finalWeight.toFixed(2)} kg</p>
                    </div>
                  )}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Pickup Time</p>
                    <p className="font-medium text-xs">{format(new Date(order.pickupTime), "MMM dd, h:mm a")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-900 dark:text-green-100">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Rate per kg</p>
                    <p className="font-semibold text-sm">₹{typeof order.pricePerKg === 'number' ? order.pricePerKg.toFixed(2) : '0.00'}</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                    <p className="font-bold text-lg text-green-700 dark:text-green-400">
                      ₹{typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Photos, Notes, Proof */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Customer Photos */}
            {order.photos && order.photos.length > 0 && (
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/30 dark:to-background">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Camera className="h-4 w-4 text-blue-600" />
                    </div>
                    Customer Photos
                    <Badge variant="secondary" className="ml-auto text-xs">{order.photos.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {order.photos.map((photo, index) => (
                      <a 
                        key={index}
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-md block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={photo} 
                          alt={`Order photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                        <div className="absolute bottom-1 right-1 bg-white/90 dark:bg-black/90 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          {index + 1}/{order.photos?.length || 0}
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Notes & Proof Column */}
            <div className="space-y-4">
              {/* Notes */}
              {order.notes && (
                <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50/80 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                      <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <StickyNote className="h-4 w-4 text-yellow-600" />
                      </div>
                      Customer Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-yellow-900 dark:text-yellow-100 leading-relaxed bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                      {order.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Proof Photo */}
              {order.proofPhotoUrl && (
                <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/30 dark:to-background">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-900 dark:text-green-100">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                        <ImageIcon className="h-4 w-4 text-green-600" />
                      </div>
                      Proof of Pickup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a 
                      href={order.proofPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative w-full aspect-video rounded-lg overflow-hidden border-2 border-green-200 shadow-md hover:border-green-400 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={order.proofPhotoUrl} 
                        alt="Proof of pickup" 
                        className="w-full h-full object-cover" 
                      />
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Empty state if no notes or proof */}
              {!order.notes && !order.proofPhotoUrl && !order.photos?.length && (
                <Card className="border-gray-200 bg-gray-50/50 dark:bg-gray-900/20">
                  <CardContent className="py-8 text-center">
                    <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No photos or notes available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
