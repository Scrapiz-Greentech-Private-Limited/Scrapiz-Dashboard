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
import { MapPin, User as UserIcon, Phone, Truck, Calendar, Hash, Box, Weight, DollarSign, StickyNote, Image as ImageIcon, Camera, Mail, Star, CheckCircle2, Clock, Navigation, Package } from "lucide-react"

interface OrderDetailsDialogProps {
  order: Order
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

// Extract customer name from email or phone
const getCustomerName = (order: Order): string => {
  // Try to extract name from email (before @)
  if (order.sellerId && order.sellerId.includes('@')) {
    const emailName = order.sellerId.split('@')[0];
    // Convert email format to readable name (e.g., john.doe -> John Doe)
    return emailName
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  // If it's a phone number or other ID, return as is
  return order.sellerId || 'Unknown Customer';
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
    pending: 'bg-orange-500 text-white border-orange-600',
    scheduled: 'bg-blue-500 text-white border-blue-600',
    transit: 'bg-purple-500 text-white border-purple-600',
    completed: 'bg-green-500 text-white border-green-600',
    cancelled: 'bg-red-500 text-white border-red-600'
  }
  return colors[status as keyof typeof colors] || colors.pending
}

export default function OrderDetailsDialog({ order, isOpen, onOpenChange }: OrderDetailsDialogProps) {
  const customerName = getCustomerName(order);
  const sellerName = order.sellerId;
  const agentName = order.agentId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 bg-gray-50 dark:bg-gray-950">
        {/* Modern Header with gradient - inspired by reference design */}
        <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 p-8 text-white relative overflow-hidden">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
          
          <DialogHeader className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Hash className="h-7 w-7" />
                  <DialogTitle className="text-3xl font-bold text-white">
                    Order {order.id}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-green-50 text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(order.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                </DialogDescription>
              </div>
              <Badge className={`${getStatusColor(order.status)} text-base px-4 py-2 capitalize font-semibold shadow-lg`}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-180px)] p-6 space-y-6">
          {/* Top Section - Customer, Agent, Timeline in modern card layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Customer Card - Enhanced with name prominently displayed */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b">
                <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold uppercase tracking-wide">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-xl">
                    <UserIcon className="h-5 w-5 text-green-600" />
                  </div>
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-4 border-green-100 dark:border-green-900 shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white font-bold text-xl">
                      {customerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{sellerName}</p>
                  </div>
                </div>
                
                {order.customerPhone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{order.customerPhone}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Pickup Address</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.pickupAddress)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-green-600 hover:text-green-700 hover:underline line-clamp-3 font-medium"
                      >
                        {order.pickupAddress}
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Card - Modern design */}
            <Card className={`border-0 shadow-lg bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 ${!agentName ? 'flex flex-col' : ''}`}>
              <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold uppercase tracking-wide">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  Assigned Agent
                </CardTitle>
              </CardHeader>
              <CardContent className={`pt-5 space-y-4 ${!agentName ? 'flex-1 flex items-center justify-center' : ''}`}>
                {agentName ? (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-4 border-blue-100 dark:border-blue-900 shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold text-xl">
                          {agentName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{agentName}</p>
                        {order.assignedAgent && (
                          <>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {order.assignedAgent.agent_code}
                            </p>
                            {order.assignedAgent.phone && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                                {order.assignedAgent.phone}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Navigation className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {order.assignedAgent?.availability || 'Active'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Truck className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No agent assigned yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Waiting for assignment</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Timeline Card - Modern vertical timeline */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-b">
                <CardTitle className="text-sm flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-wide">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-xl">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="relative pl-8 space-y-5">
                  <div className="absolute left-[0.875rem] top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-300 via-purple-200 to-purple-100 dark:from-purple-700 dark:via-purple-800 dark:to-purple-900"></div>
                  {(statusHistory[order.status] || []).map((status: string, index: number) => (
                    <div key={index} className="flex items-start gap-4 relative">
                      <div className="absolute left-[-1.125rem] top-1">
                        <div className="h-4 w-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full z-10 ring-4 ring-purple-100 dark:ring-purple-900 shadow-md"></div>
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{status}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(order.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Section - Order Details & Pricing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Order Details Card */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-b">
                <CardTitle className="text-sm flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold uppercase tracking-wide">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
                    <Package className="h-5 w-5 text-indigo-600" />
                  </div>
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Category</p>
                    <Badge variant="outline" className="font-semibold text-sm bg-white dark:bg-gray-800 border-indigo-200 dark:border-indigo-800">
                      {order.scrapCategory}
                    </Badge>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Est. Weight</p>
                    <div className="flex items-baseline gap-1">
                      <p className="font-bold text-2xl text-gray-900 dark:text-gray-100">{order.estimatedWeight}</p>
                      <span className="text-sm text-gray-500 dark:text-gray-400">kg</span>
                    </div>
                  </div>
                  {order.finalWeight && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Final Weight</p>
                      <div className="flex items-baseline gap-1">
                        <p className="font-bold text-2xl text-green-600 dark:text-green-400">{order.finalWeight.toFixed(2)}</p>
                        <span className="text-sm text-green-600 dark:text-green-400">kg</span>
                      </div>
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Pickup Time</p>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {format(new Date(order.pickupTime), "MMM dd, h:mm a")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Summary Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3 border-b border-green-400/30">
                <CardTitle className="text-sm flex items-center gap-2 text-white font-semibold uppercase tracking-wide">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-xs text-green-100 mb-2 uppercase tracking-wide">Rate per kg</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl text-white/90">₹</span>
                      <p className="font-bold text-3xl text-white">
                        {typeof order.pricePerKg === 'number' ? order.pricePerKg.toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 border-2 border-white/30 shadow-lg">
                    <p className="text-xs text-green-100 mb-2 uppercase tracking-wide">Total Amount</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl text-white">₹</span>
                      <p className="font-black text-5xl text-white">
                        {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section - Photos & Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Customer Photos */}
            {order.photos && order.photos.length > 0 && (
              <Card className="border-0 shadow-lg bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 lg:col-span-2">
                <CardHeader className="pb-3 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-b">
                  <CardTitle className="text-sm flex items-center gap-2 text-cyan-700 dark:text-cyan-300 font-semibold uppercase tracking-wide">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-xl">
                      <Camera className="h-5 w-5 text-cyan-600" />
                    </div>
                    Customer Photos
                    <Badge variant="secondary" className="ml-auto text-sm font-bold">{order.photos.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {order.photos.map((photo, index) => (
                      <a 
                        key={index}
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all duration-300 group cursor-pointer shadow-md hover:shadow-xl block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={photo} 
                          alt={`Order photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-2 right-2 bg-white/95 dark:bg-black/95 px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                          {index + 1}/{order.photos?.length || 0}
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Notes & Proof Column */}
            <div className={`space-y-5 ${order.photos && order.photos.length > 0 ? '' : 'lg:col-span-3'}`}>
              {/* Notes */}
              {order.notes && (
                <Card className="border-0 shadow-lg bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-b">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wide">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-xl">
                        <StickyNote className="h-5 w-5 text-amber-600" />
                      </div>
                      Customer Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {order.notes}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Proof Photo */}
              {order.proofPhotoUrl && (
                <Card className="border-0 shadow-lg bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-b">
                    <CardTitle className="text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wide">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-xl">
                        <ImageIcon className="h-5 w-5 text-emerald-600" />
                      </div>
                      Proof of Pickup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <a 
                      href={order.proofPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative w-full aspect-video rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl transition-all duration-300 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={order.proofPhotoUrl} 
                        alt="Proof of pickup" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Empty state if no notes or proof */}
              {!order.notes && !order.proofPhotoUrl && !order.photos?.length && (
                <Card className="border-0 shadow-lg bg-gray-50 dark:bg-gray-900/50">
                  <CardContent className="py-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No photos or notes available</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Additional information will appear here</p>
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
