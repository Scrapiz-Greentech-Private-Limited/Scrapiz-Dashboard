# Loading States Implementation Guide

This document describes the loading state components and patterns implemented for the admin dashboard.

## Components

### 1. Loading Spinner (`loading-spinner.tsx`)

A versatile spinner component for general loading states.

**Usage:**
```tsx
import { LoadingSpinner, ButtonSpinner } from "@/components/ui/loading-spinner"

// General loading
<LoadingSpinner size="md" />

// In buttons
<Button>
  <ButtonSpinner />
  Loading...
</Button>
```

**Sizes:** `sm`, `md`, `lg`, `xl`

### 2. Table Skeleton (`table-skeleton.tsx`)

Skeleton loader for table components.

**Usage:**
```tsx
import { TableSkeleton } from "@/components/dashboard/table-skeleton"

{loading && <TableSkeleton rows={5} columns={6} showAvatar={true} />}
```

**Props:**
- `rows`: Number of skeleton rows (default: 5)
- `columns`: Number of columns (default: 6)
- `showAvatar`: Show avatar in first column (default: false)

### 3. Card Skeletons (`card-skeleton.tsx`)

Multiple skeleton variants for different card types.

**Usage:**
```tsx
import { 
  CardSkeleton, 
  KPICardSkeleton, 
  ChartCardSkeleton,
  RecentActivitySkeleton 
} from "@/components/dashboard/card-skeleton"

// Basic card
<CardSkeleton />

// KPI/Stats card
<KPICardSkeleton />

// Chart card
<ChartCardSkeleton />

// Activity list
<RecentActivitySkeleton />
```

### 4. Shimmer Effect (`shimmer.tsx`)

Animated shimmer effect for custom loading states.

**Usage:**
```tsx
import { Shimmer } from "@/components/ui/shimmer"

<Shimmer width="100%" height="20px" rounded="md" />
```

**Props:**
- `width`: Width (string or number)
- `height`: Height (string or number)
- `rounded`: Border radius (`none`, `sm`, `md`, `lg`, `full`)

### 5. Bulk Operation Progress (`bulk-operation-progress.tsx`)

Progress indicator for bulk operations.

**Usage:**
```tsx
import { BulkOperationProgress } from "@/components/dashboard/bulk-operation-progress"

<BulkOperationProgress
  total={100}
  completed={45}
  successful={40}
  failed={5}
  isComplete={false}
  operationName="Updating Orders"
/>
```

### 6. Enhanced Button with Loading State

The Button component now supports a `loading` prop.

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

<Button loading={isSubmitting} onClick={handleSubmit}>
  Submit
</Button>
```

## Hooks

### 1. useDataSync

Hook for data fetching with automatic refresh and loading states.

**Usage:**
```tsx
import { useDataSync } from "@/hooks/useDataSync"

const { data, loading, error, refetch, mutate } = useDataSync({
  fetchFn: async () => await UserService.getAllUsers(),
  onSuccess: (data) => console.log("Loaded:", data),
  onError: (error) => toast.error(error.message),
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
})
```

**Features:**
- Automatic initial fetch
- Manual refetch capability
- Optional auto-refresh
- Optimistic updates via `mutate`
- Loading and error states

### 2. useMutation

Hook for data mutations with loading states.

**Usage:**
```tsx
import { useMutation } from "@/hooks/useMutation"

const { mutate, isLoading, isSuccess, isError } = useMutation({
  mutationFn: async (data) => await OrderService.updateStatus(data),
  onSuccess: (result) => {
    toast.success("Updated successfully")
    refetch() // Refresh data
  },
  onError: (error) => toast.error(error.message),
})

// Trigger mutation
mutate({ orderId: 123, status: "completed" })
```

**Features:**
- Loading state tracking
- Success/error states
- Callbacks for lifecycle events
- Async mutation support

## Patterns

### Pattern 1: Table with Loading State

```tsx
export default function UsersTable({ users, loading, onRefresh }) {
  if (loading && users.length === 0) {
    return <TableSkeleton rows={5} columns={7} showAvatar={true} />
  }

  if (!loading && users.length === 0) {
    return (
      <div className="text-center py-12">
        <p>No users found</p>
        <Button onClick={onRefresh}>Refresh</Button>
      </div>
    )
  }

  return <Table>...</Table>
}
```

### Pattern 2: Page with Data Sync

```tsx
export default function UsersPage() {
  const { data: users, loading, refetch } = useDataSync({
    fetchFn: async () => await UserService.getAllUsers(),
  })

  return (
    <div>
      <Button onClick={refetch} loading={loading}>
        Refresh
      </Button>
      
      {loading && !users ? (
        <CardSkeleton />
      ) : (
        <Card>...</Card>
      )}
    </div>
  )
}
```

### Pattern 3: Form Submission with Loading

```tsx
export default function OrderForm() {
  const { mutate, isLoading } = useMutation({
    mutationFn: async (data) => await OrderService.create(data),
    onSuccess: () => router.push("/orders"),
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      mutate(formData)
    }}>
      <Button type="submit" loading={isLoading}>
        Create Order
      </Button>
    </form>
  )
}
```

### Pattern 4: Bulk Operations

```tsx
export default function BulkUpdate() {
  const [progress, setProgress] = useState({ total: 0, completed: 0, successful: 0, failed: 0 })
  const [isRunning, setIsRunning] = useState(false)

  const handleBulkUpdate = async (items) => {
    setIsRunning(true)
    setProgress({ total: items.length, completed: 0, successful: 0, failed: 0 })

    for (const item of items) {
      try {
        await updateItem(item)
        setProgress(p => ({ ...p, completed: p.completed + 1, successful: p.successful + 1 }))
      } catch {
        setProgress(p => ({ ...p, completed: p.completed + 1, failed: p.failed + 1 }))
      }
    }

    setIsRunning(false)
  }

  return (
    <BulkOperationProgress
      {...progress}
      isComplete={!isRunning}
      operationName="Updating Orders"
    />
  )
}
```

## Best Practices

1. **Always show loading states** - Never leave users wondering if something is happening
2. **Use skeleton loaders for initial loads** - Better UX than spinners for first-time loads
3. **Show spinners for refreshes** - When data already exists, a spinner is appropriate
4. **Disable buttons during loading** - Prevent duplicate submissions
5. **Provide feedback on completion** - Use toasts or success messages
6. **Handle errors gracefully** - Show error messages and retry options
7. **Implement optimistic updates** - Update UI immediately, rollback on error
8. **Use auto-refresh sparingly** - Only for critical real-time data
9. **Show progress for bulk operations** - Users need to see progress on long operations
10. **Maintain data consistency** - Always refetch after mutations

## Animation Classes

The following CSS animations are available:

- `animate-spin` - Rotating spinner
- `animate-pulse` - Pulsing skeleton
- `animate-[shimmer_2s_infinite]` - Shimmer effect

## Accessibility

All loading components include:
- Proper ARIA labels
- Screen reader announcements
- Keyboard navigation support
- Focus management during loading states

## Performance

- Skeleton loaders are lightweight and render quickly
- Animations use CSS transforms for better performance
- Loading states don't block the main thread
- Auto-refresh intervals are configurable and can be disabled
