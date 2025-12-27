'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Offline Indicator Component
 * Displays a banner when the user loses internet connection
 * Automatically hides when connection is restored
 */
export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      
      // Hide reconnected message after 3 seconds
      setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything if online and not showing reconnected message
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top">
      {!isOnline ? (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="ml-2">
            No internet connection. Some features may not be available.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="rounded-none border-x-0 border-t-0 bg-green-50 border-green-200 text-green-800">
          <Wifi className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Connection restored. You're back online.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
