'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { setGlobalSessionExpiredHandler } from '@/components/backend/apiService';

/**
 * Session Expired Dialog Component
 * Displays when user's JWT token expires or authentication fails
 * Automatically redirects to login page
 */
export const SessionExpiredDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Register global handler for session expiration
    setGlobalSessionExpiredHandler((shouldShow: boolean) => {
      if (shouldShow) {
        setIsOpen(true);
      }
    });

    return () => {
      // Cleanup handler on unmount
      setGlobalSessionExpiredHandler(() => {});
    };
  }, []);

  const handleContinue = () => {
    setIsOpen(false);
    // Clear any remaining auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    // Redirect to login
    router.push('/login');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expired</AlertDialogTitle>
          <AlertDialogDescription>
            Your session has expired for security reasons. Please log in again to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleContinue}>
            Go to Login
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
