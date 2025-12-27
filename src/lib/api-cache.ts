/**
 * Simple in-memory cache for API responses
 * Implements stale-while-revalidate pattern
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Return data even if stale (stale-while-revalidate)
    return entry.data;
  }

  /**
   * Check if cache entry is stale (needs revalidation)
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return true;
    }

    return Date.now() > entry.expiresAt;
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      // Remove entries that are expired for more than 10 minutes
      if (now > entry.expiresAt + 10 * 60 * 1000) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const apiCache = new APICache();

// Run cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Helper function to create cache keys
 */
export function createCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params) {
    return endpoint;
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `${endpoint}?${sortedParams}`;
}

/**
 * Wrapper for cached API calls with stale-while-revalidate
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    forceRefresh?: boolean;
  }
): Promise<T> {
  const { ttl, forceRefresh = false } = options || {};

  // If force refresh, skip cache
  if (forceRefresh) {
    const data = await fetcher();
    apiCache.set(key, data, ttl);
    return data;
  }

  // Check cache first
  const cached = apiCache.get<T>(key);
  const isStale = apiCache.isStale(key);

  // If we have cached data and it's not stale, return it
  if (cached && !isStale) {
    return cached;
  }

  // If we have stale data, return it but revalidate in background
  if (cached && isStale) {
    // Revalidate in background
    fetcher()
      .then(data => {
        apiCache.set(key, data, ttl);
      })
      .catch(error => {
        console.error('Background revalidation failed:', error);
      });

    return cached;
  }

  // No cached data, fetch fresh
  const data = await fetcher();
  apiCache.set(key, data, ttl);
  return data;
}
