"use client"

import { useState, useCallback, useEffect, useRef } from "react"

interface UseDataSyncOptions<T> {
  fetchFn: () => Promise<T>
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

interface UseDataSyncReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  mutate: (updater: (data: T | null) => T | null) => void
}

export function useDataSync<T>({
  fetchFn,
  onSuccess,
  onError,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds default
}: UseDataSyncOptions<T>): UseDataSyncReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An error occurred")
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, onSuccess, onError])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const mutate = useCallback((updater: (data: T | null) => T | null) => {
    setData(updater)
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData()
      }, refreshInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [autoRefresh, refreshInterval, fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
  }
}
