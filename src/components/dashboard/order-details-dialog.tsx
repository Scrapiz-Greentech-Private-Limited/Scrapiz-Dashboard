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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer & Agent */}
            <div className="lg:col-span-1 space-y-4">
              {/* Customer Card */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-900 dark:text-green-100">
                    <UserIcon className="h-5 w-5 text-green-600" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-green-200">
                      <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                        {sellerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{sellerName}</p>
                      <p className="text-xs text-muted-foreground">Customer ID: {order.sellerId}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.pickupAddress)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-green-600 hover:underline"
                      >
                        {order.pickupAddress}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Agent Card */}
              {agentName && (
                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <Truck className="h-5 w-5 text-blue-600" />
                      Assigned Agent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-blue-200">
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                          {agentName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{agentName}</p>
                        <p className="text-xs text-muted-foreground">Agent ID: {order.agentId}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Info Card */}
              <Card className="border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-purple-900 dark:text-purple-100">
                    <Box className="h-5 w-5 text-purple-600" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline" className="font-medium">{order.scrapCategory}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Est. Weight</span>
                    <span className="font-medium">{order.estimatedWeight} kg</span>
                  </div>
                  {order.finalWeight && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Final Weight</span>
                      <span className="font-semibold text-green-600">{order.finalWeight.toFixed(2)} kg</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(order.pickupTime), "PPp")}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Card */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-900 dark:text-green-100">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rate per kg</span>
                    <span className="font-medium">₹{typeof order.pricePerKg === 'number' ? order.pricePerKg.toFixed(2) : '0.00'}</span>
                  </div>
                  {order.totalAmount != null && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                          ₹{typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Right Column - Timeline & Media */}
            <div className="lg:col-span-2 space-y-4">
              {/* Status Timeline Card */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-900 dark:text-green-100">
                    <Clock className="h-5 w-5 text-green-600" />
                    Status Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-6">
                    <div className="absolute left-[0.6875rem] top-2 bottom-2 w-0.5 bg-green-200"></div>
                    {(statusHistory[order.status] || []).map((status: string, index: number) => (
                      <div key={index} className="flex items-start gap-4 mb-4 relative">
                        <div className="h-3.5 w-3.5 bg-green-600 rounded-full z-10 ring-4 ring-green-100"></div>
                        <div className="flex-1 pb-4">
                          <p className="font-semibold text-sm text-green-900 dark:text-green-100">{status}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(order.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Photos */}
              {order.photos && order.photos.length > 0 && (
                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <Camera className="h-5 w-5 text-blue-600" />
                      Customer Photos
                      <Badge variant="secondary" className="ml-auto">{order.photos.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                          <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/90 px-2 py-1 rounded text-xs font-medium">
                            {index + 1}/{order.photos?.length || 0}
                          </div>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Notes */}
              {order.notes && (
                <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                      <StickyNote className="h-5 w-5 text-yellow-600" />
                      Customer Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-yellow-900 dark:text-yellow-100 leading-relaxed">
                      {order.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Proof Photo */}
              {order.proofPhotoUrl && (
                <Card className="border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-green-900 dark:text-green-100">
                      <ImageIcon className="h-5 w-5 text-green-600" />
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
