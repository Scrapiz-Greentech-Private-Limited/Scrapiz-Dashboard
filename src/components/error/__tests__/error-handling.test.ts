/**
 * Tests for error handling system
 * Run with: npm test error-handling.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import { parseApiError } from '@/lib/toast-helpers';
import { isRetryableError } from '@/lib/retry-mechanism';

describe('Error Message Parsing', () => {
  it('should parse 400 Bad Request errors', () => {
    const error = {
      response: {
        status: 400,
        data: { error: 'Invalid email format' },
      },
    };
    const message = parseApiError(error);
    expect(message).toBe('Invalid email format');
  });

  it('should parse 401 Unauthorized errors', () => {
    const error = {
      response: {
        status: 401,
        data: {},
      },
    };
    const message = parseApiError(error);
    expect(message).toBe('Your session has expired. Please log in again.');
  });

  it('should parse 403 Forbidden errors', () => {
    const error = {
      response: {
        status: 403,
        data: {},
      },
    };
    const message = parseApiError(error);
    expect(message).toBe('You do not have permission to perform this action.');
  });

  it('should parse 404 Not Found errors', () => {
    const error = {
      response: {
        status: 404,
        data: {},
      },
    };
    const message = parseApiError(error);
    expect(message).toBe('The requested resource was not found.');
  });

  it('should parse 500 Server errors', () => {
    const error = {
      response: {
        status: 500,
        data: {},
      },
    };
    const message = parseApiError(error);
    expect(message).toContain('server error');
  });

  it('should parse network errors', () => {
    const error = {
      message: 'Network Error',
    };
    const message = parseApiError(error);
    expect(message).toContain('Unable to connect');
  });

  it('should handle validation errors with multiple fields', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errors: {
            email: ['Email is required', 'Email must be valid'],
            password: ['Password is too short'],
          },
        },
      },
    };
    const message = parseApiError(error);
    expect(message).toContain('email');
    expect(message).toContain('password');
  });
});

describe('Retry Logic', () => {
  it('should identify retryable errors (5xx)', () => {
    const error500 = { response: { status: 500 } };
    const error502 = { response: { status: 502 } };
    const error503 = { response: { status: 503 } };
    
    expect(isRetryableError(error500)).toBe(true);
    expect(isRetryableError(error502)).toBe(true);
    expect(isRetryableError(error503)).toBe(true);
  });

  it('should identify retryable errors (429 rate limit)', () => {
    const error = { response: { status: 429 } };
    expect(isRetryableError(error)).toBe(true);
  });

  it('should identify retryable errors (408 timeout)', () => {
    const error = { response: { status: 408 } };
    expect(isRetryableError(error)).toBe(true);
  });

  it('should identify retryable errors (network)', () => {
    const error = { message: 'Network Error' };
    expect(isRetryableError(error)).toBe(true);
  });

  it('should identify non-retryable errors (4xx)', () => {
    const error400 = { response: { status: 400 } };
    const error401 = { response: { status: 401 } };
    const error404 = { response: { status: 404 } };
    
    expect(isRetryableError(error400)).toBe(false);
    expect(isRetryableError(error401)).toBe(false);
    expect(isRetryableError(error404)).toBe(false);
  });
});

describe('HTTP Status Code Coverage', () => {
  const testCases = [
    { status: 400, expected: 'Invalid request' },
    { status: 401, expected: 'session has expired' },
    { status: 403, expected: 'permission' },
    { status: 404, expected: 'not found' },
    { status: 409, expected: 'conflict' },
    { status: 422, expected: 'process your request' },
    { status: 429, expected: 'Too many requests' },
    { status: 500, expected: 'server error' },
    { status: 502, expected: 'temporarily unavailable' },
    { status: 503, expected: 'temporarily unavailable' },
    { status: 504, expected: 'timed out' },
  ];

  testCases.forEach(({ status, expected }) => {
    it(`should handle ${status} status code`, () => {
      const error = {
        response: {
          status,
          data: {},
        },
      };
      const message = parseApiError(error);
      expect(message.toLowerCase()).toContain(expected.toLowerCase());
    });
  });
});
