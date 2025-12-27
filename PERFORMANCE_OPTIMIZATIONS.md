# Performance Optimizations

This document outlines all performance optimizations implemented in the admin dashboard.

## Overview

The admin dashboard has been optimized for performance with the following improvements:

1. **Code Splitting & Lazy Loading**
2. **Image Optimization**
3. **Pagination (50 items per page)**
4. **React.memo for Expensive Components**
5. **API Response Caching**
6. **Bundle Size Optimization**

## 1. Code Splitting & Lazy Loading

### Chart Components

All chart components are now lazy-loaded using Next.js `dynamic()` import with SSR disabled:

```typescript
const OrdersChart = dynamic(() => import("@/components/dashboard/orders-chart"), {
  loading: () => <CardSkeleton />,
  ssr: false
})
```

**Benefits:**
- Reduces initial bundle size
- Charts only load when needed
- Improves Time to Interactive (TTI)
- Shows loading skeleton while loading

**Affected Components:**
- `OrdersChart`
- `ScrapVolumeChart`
- `RevenueChart`
- `CategoryPerformanceChart`
- `AgentPerformanceChart`
- `ServiceStatsChart`

## 2. Image Optimization

### Next.js Image Configuration

Updated `next.config.ts` with optimized image settings:

```typescript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

**Benefits:**
- Automatic format optimization (AVIF/WebP)
- Responsive image sizes
- Lazy loading by default
- Automatic image optimization

**Usage:**
Always use Next.js `Image` component instead of `<img>` tags:

```typescript
import Image from 'next/image'

<Image 
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={false} // Set to true for above-the-fold images
/>
```

## 3. Pagination

### Large Dataset Handling

All table components now use pagination with 50 items per page:

```typescript
const ITEMS_PER_PAGE = 50;
```

**Affected Components:**
- `OrdersTableClient` - 50 orders per page
- `UsersTableClient` - 50 users per page
- Other table components

**Benefits:**
- Reduces DOM nodes
- Improves rendering performance
- Better memory management
- Faster initial load

## 4. React.memo for Expensive Components

### Memoized Chart Components

All chart components are wrapped with `React.memo()` to prevent unnecessary re-renders:

```typescript
import { memo } from "react";

function RevenueChart() {
  // Component logic
}

export default memo(RevenueChart);
```

**Memoized Components:**
- `RevenueChart`
- `OrdersChart`
- `ScrapVolumeChart`
- `CategoryPerformanceChart`
- `AgentPerformanceChart`
- `ServiceStatsChart`

**Benefits:**
- Prevents re-renders when props haven't changed
- Reduces CPU usage
- Improves overall responsiveness

## 5. API Response Caching

### Caching Strategy

Implemented stale-while-revalidate caching for API responses:

**Cache Layer:** `src/lib/api-cache.ts`
- In-memory cache with TTL
- Stale-while-revalidate pattern
- Automatic cleanup of expired entries

**Cached Services:** `src/lib/cached-api-service.ts`
- `CachedUserService` - 2 minute TTL
- `CachedOrderService` - 1 minute TTL
- `CachedInventoryService` - 5 minute TTL
- `CachedServiceBookingService` - 2 minute TTL
- `CachedNotificationService` - 5 minute TTL
- `CachedReferralService` - 3 minute TTL
- `CachedAuditService` - 5 minute TTL

**Usage Example:**

```typescript
import { CachedUserService } from '@/lib/cached-api-service';

// Use cached version (returns stale data immediately, revalidates in background)
const users = await CachedUserService.getAllUsers();

// Force refresh (bypass cache)
const freshUsers = await CachedUserService.getAllUsers(true);
```

**Benefits:**
- Reduces API calls
- Faster data loading
- Better user experience
- Reduced server load

**Cache Invalidation:**
Caches are automatically invalidated on mutations:
- Creating/updating/deleting users invalidates user cache
- Creating/updating orders invalidates order cache
- etc.

## 6. Bundle Size Optimization

### Next.js Configuration

Optimized build configuration in `next.config.ts`:

```typescript
{
  compress: true,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-avatar', '@radix-ui/react-dialog'],
  }
}
```

**Features:**
- Gzip compression enabled
- Source maps disabled in production
- SWC minification
- Package import optimization for common libraries

### Bundle Analysis

Run bundle analysis after building:

```bash
npm run build
npm run analyze
```

**Target:** < 500KB gzipped

**Optimization Tips:**
1. Use dynamic imports for large components
2. Remove unused dependencies
3. Tree-shake unused code
4. Optimize images
5. Use React.memo for expensive components

## Performance Metrics

### Target Metrics

- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Total Blocking Time (TBT):** < 300ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Bundle Size (gzipped):** < 500KB

### Monitoring

Use Chrome DevTools Lighthouse to monitor performance:

1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "Performance" category
4. Click "Generate report"

## Best Practices

### 1. Component Optimization

```typescript
// ✅ Good - Memoized component
const ExpensiveComponent = memo(({ data }) => {
  // Component logic
});

// ❌ Bad - Re-renders on every parent render
const ExpensiveComponent = ({ data }) => {
  // Component logic
};
```

### 2. Data Fetching

```typescript
// ✅ Good - Use cached service
import { CachedUserService } from '@/lib/cached-api-service';
const users = await CachedUserService.getAllUsers();

// ❌ Bad - Direct API call every time
import { UserService } from '@/components/backend/apiService';
const users = await UserService.getAllUsers();
```

### 3. Image Loading

```typescript
// ✅ Good - Next.js Image with optimization
import Image from 'next/image';
<Image src="/image.jpg" width={500} height={300} alt="Description" />

// ❌ Bad - Regular img tag
<img src="/image.jpg" alt="Description" />
```

### 4. Code Splitting

```typescript
// ✅ Good - Dynamic import for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
});

// ❌ Bad - Static import
import HeavyComponent from './HeavyComponent';
```

## Troubleshooting

### Large Bundle Size

If bundle size exceeds target:

1. Run `npm run analyze` to identify large pages
2. Check for duplicate dependencies
3. Use dynamic imports for large components
4. Remove unused dependencies
5. Optimize images

### Slow API Responses

If API responses are slow:

1. Check cache TTL settings
2. Verify cache is being used (check `apiCache.getStats()`)
3. Consider increasing cache TTL for stable data
4. Implement pagination for large datasets

### Memory Leaks

If experiencing memory issues:

1. Check for unmounted component subscriptions
2. Verify cache cleanup is running
3. Monitor cache size with `getCacheStats()`
4. Clear cache manually if needed: `clearAllCaches()`

## Future Optimizations

Potential future improvements:

1. **Service Worker** - Offline support and caching
2. **Virtual Scrolling** - For very large lists
3. **Web Workers** - For heavy computations
4. **CDN Integration** - For static assets
5. **Database Indexing** - Backend optimization
6. **GraphQL** - Reduce over-fetching
7. **Redis Caching** - Server-side caching

## Monitoring Tools

Recommended tools for monitoring performance:

1. **Chrome DevTools Lighthouse** - Performance audits
2. **React DevTools Profiler** - Component render analysis
3. **Next.js Analytics** - Real user monitoring
4. **Bundle Analyzer** - Bundle size analysis
5. **WebPageTest** - Detailed performance metrics

## References

- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
