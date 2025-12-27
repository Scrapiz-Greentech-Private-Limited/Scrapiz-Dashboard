"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BulkOperationProgressProps {
  total: number
  completed: number
  successful: number
  failed: number
  isComplete: boolean
  operationName?: string
}

export function BulkOperationProgress({
  total,
  completed,
  successful,
  failed,
  isComplete,
  operationName = "Operation"
}: BulkOperationProgressProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {!isComplete && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
              {isComplete && <CheckCircle className="h-5 w-5 text-green-600" />}
              {operationName}
            </CardTitle>
            <CardDescription>
              {isComplete 
                ? "Operation completed" 
                : `Processing ${completed} of ${total} items...`
              }
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-700">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-muted-foreground">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <CheckCircle className="h-5 w-5" />
              {successful}
            </div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>
          <div className="space-y-1">
            <div className={cn(
              "text-2xl font-bold flex items-center justify-center gap-1",
              failed > 0 ? "text-red-600" : "text-muted-foreground"
            )}>
              <XCircle className="h-5 w-5" />
              {failed}
            </div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
