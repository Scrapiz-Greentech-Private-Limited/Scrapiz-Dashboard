'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserService, DeletionFeedback } from "@/components/backend/apiService"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, User, Calendar, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'

export default function DeletionFeedbackPage() {
  const [feedback, setFeedback] = useState<DeletionFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<DeletionFeedback | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadFeedback()
  }, [])

  const loadFeedback = async () => {
    try {
      setLoading(true)
      const data = await UserService.getAccountDeletionFeedback()
      setFeedback(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load deletion feedback",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const reasonLabels: Record<string, string> = {
    'better_alternative': 'Found a better alternative',
    'not_using': 'Not using the service anymore',
    'privacy_concerns': 'Privacy concerns',
    'difficult_to_use': 'Difficult to use',
    'other': 'Other',
    'not_specified': 'Not specified'
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss')
    } catch {
      return timestamp
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Account Deletion Feedback</h2>
        <p className="text-muted-foreground">View feedback from users who deleted their accounts</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deletions</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{feedback.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Reason</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-orange-600">
              {(() => {
                if (feedback.length === 0) return 'N/A'
                const reasonCounts = feedback.reduce((acc, curr) => {
                  acc[curr.reason] = (acc[curr.reason] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                const mostCommon = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]
                return mostCommon ? `${reasonLabels[mostCommon[0]] || mostCommon[0]} (${mostCommon[1]})` : 'N/A'
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {feedback.filter(f => f.comments && f.comments.trim().length > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {feedback.filter(f => {
                if (!f.deleted_at) return false
                const deletedDate = new Date(f.deleted_at)
                const now = new Date()
                return deletedDate.getMonth() === now.getMonth() && deletedDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deletion Feedback</CardTitle>
          <CardDescription>
            Showing {feedback.length} deletion feedback entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deletion feedback found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="hidden md:table-cell">Comments</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{item.user_name || 'Unknown'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{item.user_email || 'No email'}</div>
                          {item.user_id && (
                            <div className="text-xs text-muted-foreground">ID: {item.user_id}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {item.reason_display || reasonLabels[item.reason] || item.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md hidden md:table-cell">
                        {item.comments ? (
                          <span className="text-sm line-clamp-2">{item.comments}</span>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">No comments</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">
                            {item.deleted_at ? formatTimestamp(item.deleted_at) : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFeedback(item)
                            setDetailsOpen(true)
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Deletion Feedback Details
            </DialogTitle>
            <DialogDescription>
              Complete feedback from the deleted account
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{selectedFeedback.user_name || 'Unknown User'}</span>
                </div>
                <div className="text-sm text-muted-foreground">{selectedFeedback.user_email || 'No email'}</div>
                {selectedFeedback.user_id && (
                  <div className="text-xs text-muted-foreground mt-1">Original User ID: {selectedFeedback.user_id}</div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                    {selectedFeedback.reason_display || reasonLabels[selectedFeedback.reason] || selectedFeedback.reason}
                  </Badge>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Comments</label>
                <div className="mt-2 p-4 bg-muted rounded-lg min-h-[80px]">
                  {selectedFeedback.comments ? (
                    <p className="text-sm whitespace-pre-wrap">{selectedFeedback.comments}</p>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No comments provided</span>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Deleted At</label>
                <div className="mt-2 flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedFeedback.deleted_at ? formatTimestamp(selectedFeedback.deleted_at) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
