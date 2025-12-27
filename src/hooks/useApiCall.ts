/**
 * Custom hook for making API calls with automatic error handling, loading states, and retry logic
 */

import { useState, useCallback } from 'react';
import { showApiError, showSuccess } from '@/lib/toast-helpers';
import { retryWithBackoff, RetryOptions, isRetryableError } from '@/lib/retry-mechanism';

export interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  retry?: boolean | RetryOptions;
}

export interface UseApiCallResult<T, Args extends any[]> {
  data: T | null;
  loading: boolean;
  error: any | null;
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for making API calls with automatic error handling and retry logic
 * 
 * @param apiFunction - The API function to call
 * @param options - Configuration options
 * @returns Object with data, loading state, error, and execute function
 * 
 * @example
 * ```typescript
 * const { data, loading, error, execute } = useApiCall(
 *   UserService.getAllUsers,
 *   {
 *     successMessage: 'Users loaded successfully',
 *     retry: true,
 *   }
 * );
 * 
 * // Call the API
 * await execute();
 * ```
 */
export function useApiCall<T, Args extends any[] = []>(
  apiFunction: (...args: Args) => Promise<T>,
  options: UseApiCallOptions<T> = {}
): UseApiCallResult<T, Args> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessToast = false,
    showErrorToast = true,
    retry = false,
  } = options;

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        let result: T;

        if (retry) {
          // Use retry mechanism
          const retryOptions = typeof retry === 'object' ? retry : {
            shouldRetry: isRetryableError,
            onRetry: (attempt: number) => {
              console.log(`Retrying API call (attempt ${attempt})...`);
            },
          };

          result = await retryWithBackoff(
            () => apiFunction(...args),
            retryOptions
          );
        } else {
          // Direct call without retry
          result = await apiFunction(...args);
        }

        setData(result);

        // Show success toast if enabled
        if (showSuccessToast && successMessage) {
          showSuccess(successMessage);
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err: any) {
        console.error('API call failed:', err);
        setError(err);

        // Show error toast if enabled
        if (showErrorToast) {
          if (errorMessage) {
            showApiError(err, errorMessage);
          } else {
            showApiError(err);
          }
        }

        // Call error callback
        if (onError) {
          onError(err);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast, retry]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook for making mutation API calls (create, update, delete)
 * Automatically shows success/error toasts
 * 
 * @example
 * ```typescript
 * const { loading, execute } = useMutation(
 *   UserService.updateUser,
 *   {
 *     successMessage: 'User updated successfully',
 *     onSuccess: () => refetchUsers(),
 *   }
 * );
 * 
 * await execute(userId, userData);
 * ```
 */
export function useMutation<T, Args extends any[] = []>(
  apiFunction: (...args: Args) => Promise<T>,
  options: UseApiCallOptions<T> = {}
): Omit<UseApiCallResult<T, Args>, 'data'> {
  const { data, ...rest } = useApiCall(apiFunction, {
    showSuccessToast: true,
    showErrorToast: true,
    ...options,
  });

  return rest;
}
