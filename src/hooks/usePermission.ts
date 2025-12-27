/**
 * Permission Hook
 * 
 * Hook for checking page-level permissions in the admin dashboard.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminAuthService, AdminPermissions } from '@/services/adminAuth';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface UsePermissionResult {
  hasPermission: boolean;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

// Map routes to page keys
const routeToPageKey: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/analytics': 'analytics',
  '/dashboard/agents': 'agents',
  '/dashboard/carousel': 'carousel',
  '/dashboard/catalog': 'catalog',
  '/dashboard/notifications': 'notifications',
  '/dashboard/orders': 'orders',
  '/dashboard/referrals': 'referrals',
  '/dashboard/service-orders': 'service-orders',
  '/dashboard/users': 'users',
  '/dashboard/authentication': 'authentication',
  '/dashboard/settings': 'settings',
};

/**
 * Get page key from route path
 */
export function getPageKeyFromRoute(pathname: string): string | null {
  // Direct match
  if (routeToPageKey[pathname]) {
    return routeToPageKey[pathname];
  }

  // Check for nested routes (e.g., /dashboard/orders/123)
  for (const [route, pageKey] of Object.entries(routeToPageKey)) {
    if (pathname.startsWith(route + '/') || pathname === route) {
      return pageKey;
    }
  }

  return null;
}

/**
 * Hook to check permissions for a specific page
 */
export function usePermission(pageKey?: string): UsePermissionResult {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Determine the page key to check
  const effectivePageKey = pageKey || getPageKeyFromRoute(pathname);

  useEffect(() => {
    const loadPermissions = () => {
      const storedPermissions = AdminAuthService.getStoredPermissions();
      const storedUser = AdminAuthService.getStoredUser();
      
      setPermissions(storedPermissions);
      setIsAdmin(storedUser?.is_admin ?? false);
      setIsLoading(false);
    };

    loadPermissions();
  }, []);

  // If user is admin, they have all permissions
  if (isAdmin) {
    return {
      hasPermission: true,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      isLoading,
      isAdmin: true,
    };
  }

  // If no page key or permissions, deny access
  if (!effectivePageKey || !permissions) {
    return {
      hasPermission: false,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      isLoading,
      isAdmin: false,
    };
  }

  const pagePermission = permissions[effectivePageKey];

  return {
    hasPermission: pagePermission?.can_view ?? false,
    canView: pagePermission?.can_view ?? false,
    canCreate: pagePermission?.can_create ?? false,
    canEdit: pagePermission?.can_edit ?? false,
    canDelete: pagePermission?.can_delete ?? false,
    isLoading,
    isAdmin: false,
  };
}

/**
 * Hook to check if user can access current page
 * Redirects to permission denied if not authorized
 */
export function usePageAccess(pageKey?: string): UsePermissionResult {
  const router = useRouter();
  const permission = usePermission(pageKey);

  useEffect(() => {
    if (!permission.isLoading && !permission.hasPermission) {
      // Don't redirect, let the component show the permission denied dialog
    }
  }, [permission.isLoading, permission.hasPermission, router]);

  return permission;
}

/**
 * Check permission synchronously (for conditional rendering)
 */
export function checkPermission(pageKey: string, action: PermissionAction = 'view'): boolean {
  return AdminAuthService.hasPermission(pageKey, action);
}
