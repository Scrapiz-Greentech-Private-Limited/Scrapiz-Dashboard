"use client"

import { useState, useCallback } from "react"

interface UseMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void
}

interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<void>
  mutateAsync: (variables: TVariables) => Promise<TData>
  data: TData | null
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  reset: () => void
}

export function useMutation<TData = unknown, TVariables = void>({
  mutationFn,
  onSuccess,
  onError,
  onSettled,
}: UseMutationOptions<TData, TVariables>): UseMutationReturn<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
    setIsSuccess(false)
    setIsError(false)
  }, [])

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true)
      setError(null)
      setIsSuccess(false)
      setIsError(false)

      try {
        const result = await mutationFn(variables)
        setData(result)
        setIsSuccess(true)
        onSuccess?.(result, variables)
        onSettled?.(result, null, variables)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("An error occurred")
        setError(error)
        setIsError(true)
        onError?.(error, variables)
        onSettled?.(null, error, variables)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  )

  const mutate = useCallback(
    async (variables: TVariables) => {
      try {
        await mutateAsync(variables)
      } catch (err) {
        // Error is already handled in mutateAsync
      }
    },
    [mutateAsync]
  )

  return {
    mutate,
    mutateAsync,
    data,
    error,
    isLoading,
    isSuccess,
    isError,
    reset,
  }
}
