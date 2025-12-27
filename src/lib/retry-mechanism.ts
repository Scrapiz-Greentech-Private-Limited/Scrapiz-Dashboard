/**
 * Retry mechanism utilities for failed API requests
 * Implements exponential backoff strategy
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 && status < 600;
  },
  onRetry: () => {},
};

/**
 * Calculate delay for next retry using exponential backoff
 */
const calculateDelay = (attempt: number, options: Required<RetryOptions>): number => {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelay);
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects after all retries fail
 * 
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   () => apiClient.get('/users'),
 *   { maxRetries: 3, onRetry: (attempt) => console.log(`Retry attempt ${attempt}`) }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted all attempts
      if (attempt > opts.maxRetries) {
        throw error;
      }

      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        throw error;
      }

      // Calculate delay and notify
      const delay = calculateDelay(attempt, opts);
      opts.onRetry(attempt, error);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Create a retry wrapper for an API service method
 * 
 * @example
 * ```typescript
 * const getUsersWithRetry = createRetryWrapper(UserService.getAllUsers);
 * const users = await getUsersWithRetry();
 * ```
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return retryWithBackoff(() => fn(...args), options);
  }) as T;
}

/**
 * Retry configuration presets
 */
export const RetryPresets = {
  /**
   * Quick retry for fast operations (3 retries, 500ms initial delay)
   */
  quick: {
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 2000,
  } as RetryOptions,

  /**
   * Standard retry for normal operations (3 retries, 1s initial delay)
   */
  standard: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 5000,
  } as RetryOptions,

  /**
   * Patient retry for slow operations (5 retries, 2s initial delay)
   */
  patient: {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 10000,
  } as RetryOptions,

  /**
   * Aggressive retry for critical operations (10 retries, 500ms initial delay)
   */
  aggressive: {
    maxRetries: 10,
    initialDelay: 500,
    maxDelay: 5000,
  } as RetryOptions,
};

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors (no response)
  if (!error.response) return true;

  const status = error.response.status;

  // Server errors (5xx)
  if (status >= 500 && status < 600) return true;

  // Rate limiting (429)
  if (status === 429) return true;

  // Request timeout (408)
  if (status === 408) return true;

  return false;
}
