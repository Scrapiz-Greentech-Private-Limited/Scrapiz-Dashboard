'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import PaymentsTableClient from "@/components/dashboard/payments-table-client"
import { DollarSign, CheckCircle, Clock, XCircle, TrendingUp, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Payment, PaymentStatus } from "@/lib/types"
import { OrderService, OrderSummary as BackendOrderSummary } from "@/components/backend/apiService"

export default function PaymentsPage() {
  const [paymentsData, setPaymentsData] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')

  useEffect(() => {
    let mounted = true

    const toNumber = (value: unknown): number => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }

    const mapOrderToPayment = (order: BackendOrderSummary): Payment | null => {
      const orderRecord = order as BackendOrderSummary & {
        quote_status?: string | null
        quote_total_amount?: string | number | null
        quote_payment_method?: string | null
      }

      const quoteStatus = (orderRecord.quote_status || '').toLowerCase()
      const orderStatus = (order.status?.name || '').toLowerCase()
      const quoteAmount = toNumber(orderRecord.quote_total_amount)
      const estimatedAmount = toNumber(order.estimated_order_value)
      const amount = quoteAmount > 0 ? quoteAmount : estimatedAmount

      if (amount <= 0) {
        return null
      }

      let paymentStatus: PaymentStatus = 'pending'
      if (quoteStatus === 'paid' || orderStatus === 'completed') {
        paymentStatus = 'completed'
      } else if (['rejected', 'expired', 'cancelled'].includes(quoteStatus) || orderStatus === 'cancelled') {
        paymentStatus = 'failed'
      }

      return {
        id: `PAY-${order.id}`,
        userId: String(order.user_id ?? order.user ?? order.id),
        userName: order.user_email || String(order.user || 'Unknown User'),
        orderId: order.order_number,
        amount,
        type: 'sellerPayout',
        paymentMode: orderRecord.quote_payment_method?.toLowerCase() === 'upi' ? 'UPI' : 'bank',
        status: paymentStatus,
        createdAt: order.created_at,
      }
    }

    const loadPayments = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const orders = await OrderService.getAllOrders()
        const mapped = orders
          .map(mapOrderToPayment)
          .filter((item): item is Payment => Boolean(item))
        if (mounted) {
          setPaymentsData(mapped)
        }
      } catch (error: any) {
        if (mounted) {
          setLoadError(error?.message || 'Failed to load payments')
          setPaymentsData([])
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadPayments()

    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const completed = paymentsData.filter(p => p.status === 'completed')
    const pending = paymentsData.filter(p => p.status === 'pending')
    const failed = paymentsData.filter(p => p.status === 'failed')

    return {
      total: paymentsData.reduce((sum, p) => sum + p.amount, 0),
      completed: completed.reduce((sum, p) => sum + p.amount, 0),
      pending: pending.reduce((sum, p) => sum + p.amount, 0),
      failed: failed.reduce((sum, p) => sum + p.amount, 0),
      count: {
        total: paymentsData.length,
        completed: completed.length,
        pending: pending.length,
        failed: failed.length,
      },
    }
  }, [paymentsData])

  const filteredPayments = useMemo(() => {
    if (statusFilter === 'all') {
      return paymentsData
    }
    return paymentsData.filter((p) => p.status === statusFilter)
  }, [paymentsData, statusFilter])

  const handleExport = () => {
    const rows = [
      ['Payment ID', 'Order Number', 'User', 'Type', 'Status', 'Amount', 'Mode', 'Created At'],
      ...filteredPayments.map((payment) => [
        payment.id,
        payment.orderId,
        payment.userName || payment.userId,
        payment.type,
        payment.status,
        String(payment.amount),
        payment.paymentMode,
        payment.createdAt,
      ]),
    ]

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'payments-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Management</h2>
          <p className="text-muted-foreground">Process and track payments to sellers and agents</p>
          {isLoading && <p className="text-sm text-muted-foreground mt-1">Loading payment data...</p>}
          {loadError && <p className="text-sm text-red-600 mt-1">{loadError}</p>}
        </div>
        <Button onClick={handleExport} variant="outline" size="lg">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg border-2"
          style={{ 
            background: statusFilter === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
            borderColor: statusFilter === 'all' ? '#667eea' : '#e5e7eb'
          }}
          onClick={() => setStatusFilter('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${statusFilter === 'all' ? 'text-white' : ''}`}>
              Total Payments
            </CardTitle>
            <DollarSign className={`h-4 w-4 ${statusFilter === 'all' ? 'text-white' : 'text-purple-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statusFilter === 'all' ? 'text-white' : ''}`}>
              ₹{stats.total.toLocaleString()}
            </div>
            <p className={`text-xs ${statusFilter === 'all' ? 'text-purple-100' : 'text-muted-foreground'}`}>
              {stats.count.total} transactions
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:shadow-lg border-2"
          style={{ 
            background: statusFilter === 'completed' ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'white',
            borderColor: statusFilter === 'completed' ? '#11998e' : '#e5e7eb'
          }}
          onClick={() => setStatusFilter('completed')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${statusFilter === 'completed' ? 'text-white' : ''}`}>
              Completed
            </CardTitle>
            <CheckCircle className={`h-4 w-4 ${statusFilter === 'completed' ? 'text-white' : 'text-green-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statusFilter === 'completed' ? 'text-white' : 'text-green-700'}`}>
              ₹{stats.completed.toLocaleString()}
            </div>
            <p className={`text-xs ${statusFilter === 'completed' ? 'text-green-100' : 'text-green-600'}`}>
              {stats.count.completed} successful
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:shadow-lg border-2"
          style={{ 
            background: statusFilter === 'pending' ? 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)' : 'white',
            borderColor: statusFilter === 'pending' ? '#fc4a1a' : '#e5e7eb'
          }}
          onClick={() => setStatusFilter('pending')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${statusFilter === 'pending' ? 'text-white' : ''}`}>
              Pending
            </CardTitle>
            <Clock className={`h-4 w-4 ${statusFilter === 'pending' ? 'text-white' : 'text-orange-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statusFilter === 'pending' ? 'text-white' : 'text-orange-700'}`}>
              ₹{stats.pending.toLocaleString()}
            </div>
            <p className={`text-xs ${statusFilter === 'pending' ? 'text-orange-100' : 'text-orange-600'}`}>
              {stats.count.pending} awaiting
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:shadow-lg border-2"
          style={{ 
            background: statusFilter === 'failed' ? 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' : 'white',
            borderColor: statusFilter === 'failed' ? '#eb3349' : '#e5e7eb'
          }}
          onClick={() => setStatusFilter('failed')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${statusFilter === 'failed' ? 'text-white' : ''}`}>
              Failed
            </CardTitle>
            <XCircle className={`h-4 w-4 ${statusFilter === 'failed' ? 'text-white' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statusFilter === 'failed' ? 'text-white' : 'text-red-700'}`}>
              ₹{stats.failed.toLocaleString()}
            </div>
            <p className={`text-xs ${statusFilter === 'failed' ? 'text-red-100' : 'text-red-600'}`}>
              {stats.count.failed} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              ₹{Math.round(stats.total / Math.max(stats.count.total, 1)).toLocaleString()}
            </div>
            <p className="text-xs text-blue-600">Per transaction</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {((stats.count.completed / Math.max(stats.count.total, 1)) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-green-600">Completion rate</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {stats.count.pending}
            </div>
            <p className="text-xs text-purple-600">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === 'all' ? 'All Payments' : `${statusFilter} Payments`}
          </CardTitle>
          <CardDescription>
            {statusFilter === 'all' 
              ? `Showing all ${filteredPayments.length} payments` 
              : `Showing ${filteredPayments.length} ${statusFilter.toLowerCase()} payments`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsTableClient payments={filteredPayments} />
        </CardContent>
      </Card>
    </div>
  )
}
