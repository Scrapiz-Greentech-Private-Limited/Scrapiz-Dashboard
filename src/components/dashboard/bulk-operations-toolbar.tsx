'use client'

import * as React from "react"
import { Download, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BulkOperationsToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkStatusUpdate?: (status: string) => Promise<void>
  onExport?: () => void
  statusOptions?: { value: string; label: string }[]
  isProcessing?: boolean
  progress?: {
    current: number
    total: number
    successful: number
    failed: number
  }
}

export function BulkOperationsToolbar({
  selectedCount,
  onClearSelection,
  onBulkStatusUpdate,
  onExport,
  statusOptions = [],
  isProcessing = false,
  progress,
}: BulkOperationsToolbarProps) {
  const [selectedStatus, setSelectedStatus] = React.useState<string>("")
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleBulkUpdate = async () => {
    if (!selectedStatus || !onBulkStatusUpdate) return
    
    setIsUpdating(true)
    try {
      await onBulkStatusUpdate(selectedStatus)
      setSelectedStatus("")
    } finally {
      setIsUpdating(false)
    }
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="border-b bg-muted/50 p-3 sm:p-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Badge variant="secondary" className="text-xs sm:text-sm">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
            className="h-8 px-2 text-xs sm:text-sm"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onBulkStatusUpdate && statusOptions.length > 0 && (
            <>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={isProcessing}
              >
                <SelectTrigger className="w-[140px] sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkUpdate}
                disabled={!selectedStatus || isUpdating || isProcessing}
                size="sm"
                className="h-8 sm:h-9 text-xs sm:text-sm"
              >
                {isUpdating && <RefreshCw className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />}
                Update
              </Button>
            </>
          )}

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isProcessing}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              <Download className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export Selected</span>
              <span className="sm:hidden">Export</span>
            </Button>
          )}
        </div>
      </div>

      {progress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">
              Processing {progress.current} of {progress.total}...
            </span>
            <span className="text-muted-foreground">
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>
          <Progress value={(progress.current / progress.total) * 100} />
          <div className="flex gap-3 sm:gap-4 text-xs text-muted-foreground">
            <span className="text-green-600">✓ {progress.successful} successful</span>
            {progress.failed > 0 && (
              <span className="text-destructive">✗ {progress.failed} failed</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
