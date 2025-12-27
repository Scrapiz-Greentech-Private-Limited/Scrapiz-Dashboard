/**
 * Permission Denied Dialog Component
 * 
 * Displays when user doesn't have permission to access a page.
 */

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldX } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PermissionDeniedDialogProps {
  open: boolean;
  onClose?: () => void;
}

export function PermissionDeniedDialog({ open, onClose }: PermissionDeniedDialogProps) {
  const router = useRouter();

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    }
    router.push('/dashboard');
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <ShieldX className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Permission Denied
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            You don&apos;t have the required permission to view this page. Please contact the admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="justify-center sm:justify-center">
          <AlertDialogAction
            onClick={handleGoBack}
            className="bg-green-600 hover:bg-green-700 min-w-[120px]"
          >
            Go to Dashboard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Permission Gate Component
 * 
 * Wraps content and shows permission denied if user lacks access.
 */
interface PermissionGateProps {
  children: React.ReactNode;
  hasPermission: boolean;
  isLoading?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  hasPermission,
  isLoading = false,
  fallback,
}: PermissionGateProps) {
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!hasPermission) {
    return <PermissionDeniedDialog open={true} />;
  }

  return <>{children}</>;
}
