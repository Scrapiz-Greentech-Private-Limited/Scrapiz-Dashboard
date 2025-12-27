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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AuditLog } from "@/components/backend/apiService"
import { Eye, User, Shield, LogIn, LogOut, Key, Trash2, Calendar, MapPin } from "lucide-react"
import { format } from 'date-fns'

interface AuditLogsTableClientProps {
  auditLogs: AuditLog[]
}

export default function AuditLogsTableClient({ auditLogs }: AuditLogsTableClientProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

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
      password_reset: { variant: "default", color: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
      account_deleted: { variant: "destructive", color: "bg-red-100 text-red-800 hover:bg-red-100" },
    }

    const config = variants[action] || { variant: "outline" as const, color: "" }
    
    return (
      <Badge className={config.color}>
        <span className="flex items-center gap-1">
          {getActionIcon(action)}
          {action.replace(/_/g, ' ').toUpperCase()}
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatTimestamp(log.timestamp)}
                  </div>
                </TableCell>
                <TableCell>
                  {log.user ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{log.user.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{log.user.email}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">System</span>
                  )}
                </TableCell>
                <TableCell>
                  {getActionBadge(log.action)}
                </TableCell>
                <TableCell>
                  {log.ip_address ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{log.ip_address}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(log)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              {/* Action */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Action</label>
                <div className="mt-2">
                  {getActionBadge(selectedLog.action)}
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                <div className="mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatTimestamp(selectedLog.timestamp)}</span>
                </div>
              </div>

              {/* User Information */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">User Information</label>
                {selectedLog.user ? (
                  <div className="mt-2 space-y-2 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedLog.user.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Email: {selectedLog.user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      User ID: {selectedLog.user.id}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <span className="text-muted-foreground italic">System action (no user associated)</span>
                  </div>
                )}
              </div>

              {/* IP Address */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                <div className="mt-2">
                  {selectedLog.ip_address ? (
                    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{selectedLog.ip_address}</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-lg">
                      <span className="text-muted-foreground italic">No IP address recorded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Log ID */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Log ID</label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <span className="font-mono text-sm">{selectedLog.id}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
