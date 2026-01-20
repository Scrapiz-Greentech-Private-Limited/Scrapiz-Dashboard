'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AuditLog } from "@/components/backend/apiService"
import { Eye, User, Shield, LogIn, LogOut, Key, Trash2, Calendar, MapPin, MoreVertical, MessageSquare } from "lucide-react"
import { format } from 'date-fns'

interface AuditLogsTableClientProps {
  auditLogs: AuditLog[]
}

export default function AuditLogsTableClient({ auditLogs }: AuditLogsTableClientProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn className="h-4 w-4" />
      case 'logout':
        return <LogOut className="h-4 w-4" />
      case 'oauth_login':
        return <Shield className="h-4 w-4" />
      case 'password_reset':
        return <Key className="h-4 w-4" />
      case 'account_deleted':
        return <Trash2 className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getActionBadge = (action: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", color: string }> = {
      login: { variant: "default", color: "bg-green-100 text-green-800 hover:bg-green-100" },
      logout: { variant: "secondary", color: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
      oauth_login: { variant: "default", color: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      apple_oauth_login: { variant: "default", color: "bg-gray-800 text-white hover:bg-gray-800" },
      password_reset: { variant: "default", color: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
      account_deleted: { variant: "destructive", color: "bg-red-100 text-red-800 hover:bg-red-100" },
    }

    const config = variants[action] || { variant: "outline" as const, color: "" }
    
    return (
      <Badge className={`${config.color} text-[10px] sm:text-xs`}>
        <span className="flex items-center gap-0.5 sm:gap-1">
          {getActionIcon(action)}
          <span className="hidden sm:inline">{action.replace(/_/g, ' ').toUpperCase()}</span>
          <span className="sm:hidden">{action.split('_')[0].toUpperCase()}</span>
        </span>
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss')
    } catch {
      return timestamp
    }
  }

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  const handleViewFeedback = (log: AuditLog) => {
    setSelectedLog(log)
    setFeedbackOpen(true)
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'better_alternative': 'Found a better alternative',
      'not_using': 'Not using the service anymore',
      'privacy_concerns': 'Privacy concerns',
      'difficult_to_use': 'Difficult to use',
      'other': 'Other',
      'not_specified': 'Not specified'
    }
    return labels[reason] || reason
  }

  if (auditLogs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No audit logs found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead className="hidden sm:table-cell">User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden md:table-cell">IP Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  {/* Mobile: Show user info below timestamp */}
                  <div className="sm:hidden mt-1">
                    {log.user ? (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{log.user.name}</span>
                        <span className="block truncate max-w-[150px]">{log.user.email}</span>
                      </div>
                    ) : log.action === 'account_deleted' && log.deleted_user_email ? (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{log.deleted_user_name || 'Deleted User'}</span>
                        <span className="block truncate max-w-[150px]">{log.deleted_user_email}</span>
                        <Badge variant="outline" className="text-[9px] mt-0.5 text-red-600 border-red-200">Deleted</Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">System</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {log.user ? (
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="font-medium text-xs sm:text-sm">{log.user.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px] lg:max-w-none">{log.user.email}</div>
                    </div>
                  ) : log.action === 'account_deleted' && log.deleted_user_email ? (
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        <span className="font-medium text-xs sm:text-sm">{log.deleted_user_name || 'Deleted User'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px] lg:max-w-none">{log.deleted_user_email}</div>
                      <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">Account Deleted</Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-xs sm:text-sm">System</span>
                  )}
                </TableCell>
                <TableCell>
                  {getActionBadge(log.action)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {log.ip_address ? (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <span className="font-mono text-xs sm:text-sm">{log.ip_address}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-xs sm:text-sm">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {log.action === 'account_deleted' && (log.deletion_feedback || log.deleted_user_email) && (
                        <DropdownMenuItem onClick={() => handleViewFeedback(log)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Deletion Reason
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Audit Log Details</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 sm:space-y-6">
              {/* Action */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Action</label>
                <div className="mt-1.5 sm:mt-2">
                  {getActionBadge(selectedLog.action)}
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Timestamp</label>
                <div className="mt-1.5 sm:mt-2 flex items-center gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="font-medium text-sm sm:text-base">{formatTimestamp(selectedLog.timestamp)}</span>
                </div>
              </div>

              {/* User Information */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">User Information</label>
                {selectedLog.user ? (
                  <div className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 p-3 sm:p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <span className="font-medium text-sm sm:text-base">{selectedLog.user.name}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground break-all">
                      Email: {selectedLog.user.email}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      User ID: {selectedLog.user.id}
                    </div>
                  </div>
                ) : selectedLog.action === 'account_deleted' && selectedLog.deleted_user_email ? (
                  <div className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                      <span className="font-medium text-sm sm:text-base">{selectedLog.deleted_user_name || 'Deleted User'}</span>
                      <Badge variant="outline" className="text-[10px] text-red-600 border-red-300">Deleted</Badge>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground break-all">
                      Email: {selectedLog.deleted_user_email}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Original User ID: {selectedLog.deleted_user_id}
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 sm:mt-2 p-3 sm:p-4 bg-muted rounded-lg">
                    <span className="text-muted-foreground italic text-sm">System action (no user associated)</span>
                  </div>
                )}
              </div>

              {/* IP Address */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">IP Address</label>
                <div className="mt-1.5 sm:mt-2">
                  {selectedLog.ip_address ? (
                    <div className="flex items-center gap-2 p-3 sm:p-4 bg-muted rounded-lg">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <span className="font-mono text-sm sm:text-base">{selectedLog.ip_address}</span>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4 bg-muted rounded-lg">
                      <span className="text-muted-foreground italic text-sm">No IP address recorded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deletion Feedback Preview (if available) */}
              {selectedLog.action === 'account_deleted' && selectedLog.deletion_feedback && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Deletion Feedback</label>
                  <div className="mt-1.5 sm:mt-2 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-sm text-orange-800">
                        {selectedLog.deletion_feedback.reason_display || getReasonLabel(selectedLog.deletion_feedback.reason)}
                      </span>
                    </div>
                    {selectedLog.deletion_feedback.comments && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                        &quot;{selectedLog.deletion_feedback.comments}&quot;
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => {
                        setDetailsOpen(false)
                        setFeedbackOpen(true)
                      }}
                    >
                      View Full Feedback
                    </Button>
                  </div>
                </div>
              )}

              {/* Log ID */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Log ID</label>
                <div className="mt-1.5 sm:mt-2 p-3 sm:p-4 bg-muted rounded-lg">
                  <span className="font-mono text-xs sm:text-sm break-all">{selectedLog.id}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deletion Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Account Deletion Feedback
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Feedback provided by the user when deleting their account
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 sm:space-y-6">
              {/* User Info */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{selectedLog.deleted_user_name || selectedLog.user?.name || 'Unknown User'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedLog.deleted_user_email || selectedLog.user?.email || 'No email'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  User ID: {selectedLog.deleted_user_id || selectedLog.user?.id || 'N/A'}
                </div>
              </div>

              {/* Deletion Reason */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason for Deletion</label>
                <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  {selectedLog.deletion_feedback ? (
                    <>
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                        {selectedLog.deletion_feedback.reason_display || getReasonLabel(selectedLog.deletion_feedback.reason)}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-2">
                        Reason code: {selectedLog.deletion_feedback.reason}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">No feedback provided</span>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Additional Comments</label>
                <div className="mt-2 p-4 bg-muted rounded-lg min-h-[80px]">
                  {selectedLog.deletion_feedback?.comments ? (
                    <p className="text-sm whitespace-pre-wrap">{selectedLog.deletion_feedback.comments}</p>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No additional comments provided</span>
                  )}
                </div>
              </div>

              {/* Deletion Timestamp */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Deleted At</label>
                <div className="mt-2 flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedLog.deletion_feedback?.deleted_at 
                      ? formatTimestamp(selectedLog.deletion_feedback.deleted_at)
                      : formatTimestamp(selectedLog.timestamp)}
                  </span>
                </div>
              </div>

              {/* IP Address */}
              {selectedLog.ip_address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                  <div className="mt-2 flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{selectedLog.ip_address}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
