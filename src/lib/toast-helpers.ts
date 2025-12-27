/**
 * Toast notification helpers for consistent error and success messaging
 * Provides user-friendly messages for all error types
 */

import { toast } from '@/hooks/use-toast';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

/**
 * Show success toast notification
 */
export const showSuccess = (message: string, options?: ToastOptions) => {
  toast({
    title: options?.title || 'Success',
    description: message,
    duration: options?.duration || 3000,
    variant: 'default',
  });
};

/**
 * Show error toast notification
 */
export const showError = (message: string, options?: ToastOptions) => {
  toast({
    title: options?.title || 'Error',
    description: message,
    duration: options?.duration || 5000,
    variant: 'destructive',
  });
};

/**
 * Show info toast notification
 */
export const showInfo = (message: string, options?: ToastOptions) => {
  toast({
    title: options?.title || 'Info',
    description: message,
    duration: options?.duration || 3000,
    variant: 'default',
  });
};

/**
 * Show warning toast notification
 */
export const showWarning = (message: string, options?: ToastOptions) => {
  toast({
    title: options?.title || 'Warning',
    description: message,
    duration: options?.duration || 4000,
    variant: 'default',
  });
};

/**
 * Parse API error and return user-friendly message
 */
export const parseApiError = (error: any): string => {
  // Handle network errors
  if (!error.response) {
    if (error.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Handle specific HTTP status codes
  switch (status) {
    case 400:
      // Bad request - validation errors
      if (data?.error) return data.error;
      if (data?.message) return data.message;
      if (data?.errors) {
        // Handle field-specific validation errors
        const errors = Object.entries(data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        return errors || 'Invalid request. Please check your input.';
      }
      return 'Invalid request. Please check your input and try again.';

    case 401:
      return 'Your session has expired. Please log in again.';

    case 403:
      return 'You do not have permission to perform this action.';

    case 404:
      return 'The requested resource was not found.';

    case 409:
      return data?.error || 'A conflict occurred. The resource may already exist.';

    case 422:
      return data?.error || 'Unable to process your request. Please check your input.';

    case 429:
      return 'Too many requests. Please wait a moment and try again.';

    case 500:
      return 'A server error occurred. Our team has been notified. Please try again later.';

    case 502:
    case 503:
      return 'The service is temporarily unavailable. Please try again in a few moments.';

    case 504:
      return 'The request timed out. Please try again.';

    default:
      return data?.error || data?.message || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Show error toast from API error
 */
export const showApiError = (error: any, customTitle?: string) => {
  const message = parseApiError(error);
  showError(message, { title: customTitle });
};

/**
 * Show validation error toast with field-specific messages
 */
export const showValidationError = (errors: Record<string, string[]>) => {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
      return `${fieldName}: ${messages.join(', ')}`;
    })
    .join('\n');

  showError(errorMessages, { title: 'Validation Error' });
};

/**
 * Show loading toast (returns dismiss function)
 */
export const showLoading = (message: string = 'Loading...') => {
  const { dismiss } = toast({
    title: message,
    description: 'Please wait...',
    duration: Infinity, // Don't auto-dismiss
  });
  return dismiss;
};
