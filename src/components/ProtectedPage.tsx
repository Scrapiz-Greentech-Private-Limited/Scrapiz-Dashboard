/**
 * Protected Page Wrapper Component
 * 
 * Wraps dashboard pages to check permissions before rendering.
 * Shows permission denied dialog if user lacks access.
 */

'use client';

import { ReactNode } from 'react';
import { usePermission, getPageKeyFromRoute } from '@/hooks/usePermission';
import { PermissionGate } from '@/components/PermissionDenied';
import { usePathname } from 'next/navigation';

interface ProtectedPageProps {
  children: ReactNode;
  pageKey?: string;
  fallback?: ReactNode;
}

/**
 * Wrapper component for protected dashboard pages.
 * Automatically determines the page key from the current route if not provided.
 */
export function ProtectedPage({ children, pageKey, fallback }: ProtectedPageProps) {
  const pathname = usePathname();
  const effectivePageKey = pageKey || getPageKeyFromRoute(pathname) || '';
  const permission = usePermission(effectivePageKey);

  return (
    <PermissionGate
      hasPermission={permission.hasPermission}
      isLoading={permission.isLoading}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * Higher-order component for protecting pages.
 * Usage: export default withPermission(MyPage, 'analytics');
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  pageKey?: string
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedPage pageKey={pageKey}>
        <Component {...props} />
      </ProtectedPage>
    );
  };
}
