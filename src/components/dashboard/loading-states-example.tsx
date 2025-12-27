"use client"

/**
 * Loading States Example Component
 * 
 * This file demonstrates all loading state patterns implemented in the dashboard.
 * Use this as a reference when implementing loading states in your components.
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { TableSkeleton } from "./table-skeleton"
import { CardSkeleton, KPICardSkeleton, ChartCardSkeleton, RecentActivitySkeleton } from "./card-skeleton"
import { Shimmer } from "@/components/ui/shimmer"
import { BulkOperationProgress } from "./bulk-operation-progress"
import { useDataSync } from "@/hooks/useDataSync"
import { useMutation } from "@/hooks/useMutation"
import { RefreshCw } from "lucide-react"

// Example 1: Simple Loading Spinner
export function Example1_LoadingSpinner() {
  const [loading, setLoading] = React.useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 1: Loading Spinner</CardTitle>
        <CardDescription>Simple loading indicator</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => setLoading(!loading)}>
          Toggle Loading
        </Button>
        
        {loading && (
          <div className="flex items-center gap-4">
            <LoadingSpinner size="sm" />
            <LoadingSpinner size="md" />
            <LoadingSpinner size="lg" />
            <LoadingSpinner size="xl" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Example 2: Button with Loading State
export function Example2_ButtonLoading() {
  const [loading, setLoading] = React.useState(false)

  const handleClick = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 2: Button Loading</CardTitle>
        <CardDescription>Button with integrated spinner</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button loading={loading} onClick={handleClick}>
            Submit Form
          </Button>
          <Button variant="outline" loading={loading} onClick={handleClick}>
            Save Draft
          </Button>
          <Button variant="destructive" loading={loading} onClick={handleClick}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Example 3: Table Skeleton
export function Example3_TableSkeleton() {
  const [loading, setLoading] = React.useState(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 3: Table Skeleton</CardTitle>
        <CardDescription>Skeleton loader for tables</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setLoading(!loading)} className="mb-4">
          Toggle Loading
        </Button>
        
        {loading ? (
          <TableSkeleton rows={5} columns={6} showAvatar={true} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Table content would appear here
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Example 4: Card Skeletons
export function Example4_CardSkeletons() {
  const [loading, setLoading] = React.useState(true)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Example 4: Card Skeletons</h3>
          <p className="text-sm text-muted-foreground">Different skeleton variants</p>
        </div>
        <Button onClick={() => setLoading(!loading)}>
          Toggle Loading
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <CardSkeleton />
            <KPICardSkeleton />
            <CardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Loaded Card 1</CardTitle>
              </CardHeader>
              <CardContent>Content here</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Loaded Card 2</CardTitle>
              </CardHeader>
              <CardContent>Content here</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Loaded Card 3</CardTitle>
              </CardHeader>
              <CardContent>Content here</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Loaded Card 4</CardTitle>
              </CardHeader>
              <CardContent>Content here</CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartCardSkeleton />
            <RecentActivitySkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Chart</CardTitle>
              </CardHeader>
              <CardContent>Chart content here</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>Activity list here</CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

// Example 5: Shimmer Effect
export function Example5_ShimmerEffect() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 5: Shimmer Effect</CardTitle>
        <CardDescription>Custom shimmer animations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Shimmer width="100%" height="20px" rounded="md" />
          <Shimmer width="80%" height="20px" rounded="md" />
          <Shimmer width="60%" height="20px" rounded="md" />
        </div>
        
        <div className="flex items-center gap-4">
          <Shimmer width="60px" height="60px" rounded="full" />
          <div className="flex-1 space-y-2">
            <Shimmer width="40%" height="16px" rounded="md" />
            <Shimmer width="60%" height="12px" rounded="md" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Example 6: Bulk Operation Progress
export function Example6_BulkProgress() {
  const [progress, setProgress] = React.useState({
    total: 100,
    completed: 0,
    successful: 0,
    failed: 0,
  })
  const [isRunning, setIsRunning] = React.useState(false)

  const startBulkOperation = () => {
    setIsRunning(true)
    setProgress({ total: 100, completed: 0, successful: 0, failed: 0 })

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev.completed >= prev.total) {
          clearInterval(interval)
          setIsRunning(false)
          return prev
        }

        const success = Math.random() > 0.1 // 90% success rate
        return {
          ...prev,
          completed: prev.completed + 1,
          successful: prev.successful + (success ? 1 : 0),
          failed: prev.failed + (success ? 0 : 1),
        }
      })
    }, 50)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Example 6: Bulk Operation Progress</h3>
        <p className="text-sm text-muted-foreground">Progress tracking for bulk operations</p>
      </div>

      <Button onClick={startBulkOperation} disabled={isRunning}>
        Start Bulk Operation
      </Button>

      <BulkOperationProgress
        {...progress}
        isComplete={!isRunning && progress.completed === progress.total}
        operationName="Bulk Update Orders"
      />
    </div>
  )
}

// Example 7: useDataSync Hook
export function Example7_DataSyncHook() {
  const { data, loading, error, refetch } = useDataSync({
    fetchFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { message: "Data loaded at " + new Date().toLocaleTimeString() }
    },
    autoRefresh: false,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 7: useDataSync Hook</CardTitle>
        <CardDescription>Data fetching with loading states</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={refetch} loading={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refetch Data
        </Button>

        {loading && !data && (
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-muted-foreground">Loading data...</span>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
            Error: {error.message}
          </div>
        )}

        {data && (
          <div className="p-4 bg-green-50 rounded-md">
            <p className="text-sm font-medium">{data.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Example 8: useMutation Hook
export function Example8_MutationHook() {
  const { mutate, isLoading, isSuccess, isError, error, reset } = useMutation({
    mutationFn: async (data: { name: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (Math.random() > 0.7) throw new Error("Random error occurred")
      return { success: true, name: data.name }
    },
    onSuccess: () => {
      setTimeout(reset, 2000) // Reset after 2 seconds
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 8: useMutation Hook</CardTitle>
        <CardDescription>Data mutations with loading states</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={() => mutate({ name: "Test Item" })}
          loading={isLoading}
        >
          Submit Mutation
        </Button>

        {isSuccess && (
          <div className="p-4 bg-green-50 text-green-700 rounded-md">
            ✓ Mutation successful!
          </div>
        )}

        {isError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            ✗ Error: {error?.message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main Example Component
export default function LoadingStatesExample() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Loading States Examples</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive examples of all loading state patterns
        </p>
      </div>

      <Example1_LoadingSpinner />
      <Example2_ButtonLoading />
      <Example3_TableSkeleton />
      <Example4_CardSkeletons />
      <Example5_ShimmerEffect />
      <Example6_BulkProgress />
      <Example7_DataSyncHook />
      <Example8_MutationHook />
    </div>
  )
}
