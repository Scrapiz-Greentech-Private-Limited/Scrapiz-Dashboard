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
import { Loader2, AlertCircle } from "lucide-react"

export default function DeletionFeedbackPage() {
  const [feedback, setFeedback] = useState<DeletionFeedback[]>([])
  const [loading, setLoading] = useState(true)
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
    'not_useful': 'Not Useful',
    'privacy_concerns': 'Privacy Concerns',
    'too_expensive': 'Too Expensive',
    'found_alternative': 'Found Alternative',
    'technical_issues': 'Technical Issues',
    'other': 'Other'
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deletions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Reason</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {(() => {
                if (feedback.length === 0) return 'N/A'
                const reasonCounts = feedback.reduce((acc, curr) => {
                  acc[curr.reason] = (acc[curr.reason] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                const mostCommon = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
                return mostCommon ? reasonLabels[mostCommon] : 'N/A'
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Comments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.filter(f => f.comments && f.comments.trim().length > 0).length}
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
                    <TableHead>User Email</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.user_email || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {reasonLabels[item.reason] || item.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {item.comments || <span className="text-muted-foreground italic">No comments</span>}
                      </TableCell>
                      <TableCell>
                        {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
