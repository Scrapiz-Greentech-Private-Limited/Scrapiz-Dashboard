'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { payments } from "@/lib/data"
import PaymentsTableClient from "@/components/dashboard/payments-table-client"
import { DollarSign, CheckCircle, Clock, XCircle, TrendingUp, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PaymentStatus } from "@/lib/types"

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')

  const stats = {
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    completed: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    failed: payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0),
    count: {
      total: payments.length,
      completed: payments.filter(p => p.status === 'completed').length,
      pending: payments.filter(p => p.status === 'pending').length,
      failed: payments.filter(p => p.status === 'failed').length,
    }
  }

  const filteredPayments = statusFilter === 'all' 
    ? payments 
    : payments.filter(p => p.status === statusFilter)

  const handleExport = () => {
    alert('Export payments data to CSV/Excel')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Management</h2>
          <p className="text-muted-foreground">Process and track payments to sellers and agents</p>
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
              ₹{Math.round(stats.total / stats.count.total).toLocaleString()}
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
              {((stats.count.completed / stats.count.total) * 100).toFixed(1)}%
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
