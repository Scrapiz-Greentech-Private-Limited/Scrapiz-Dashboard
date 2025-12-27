'use client';

/**
 * Example component demonstrating all error handling features
 * This file serves as documentation and can be used for testing
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess, showError, showWarning, showInfo, showApiError } from '@/lib/toast-helpers';
import { useApiCall, useMutation } from '@/hooks/useApiCall';
import { UserService } from '@/components/backend/apiService';

export const ErrorHandlingExample: React.FC = () => {
  // Example 1: Using toast helpers directly
  const handleShowSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const handleShowError = () => {
    showError('Something went wrong. Please try again.');
  };

  const handleShowWarning = () => {
    showWarning('This action cannot be undone.');
  };

  const handleShowInfo = () => {
    showInfo('New features are available. Check them out!');
  };

  // Example 2: Using useApiCall hook with retry
  const { data: users, loading: loadingUsers, execute: loadUsers } = useApiCall(
    UserService.getAllUsers,
    {
      successMessage: 'Users loaded successfully',
      retry: true, // Enable automatic retry on failure
    }
  );

  // Example 3: Using useMutation hook for updates
  const { loading: updating, execute: updateUser } = useMutation(
    (id: number, data: any) => UserService.updateUser(id, data),
    {
      successMessage: 'User updated successfully',
      onSuccess: () => {
        // Refresh users list after update
        loadUsers();
      },
    }
  );

  // Example 4: Simulating API errors
  const handleSimulate401 = () => {
    const mockError = {
      response: {
        status: 401,
        data: { error: 'Unauthorized access' },
      },
    };
    showApiError(mockError);
  };

  const handleSimulate500 = () => {
    const mockError = {
      response: {
        status: 500,
        data: { error: 'Internal server error' },
      },
    };
    showApiError(mockError);
  };

  const handleSimulateNetwork = () => {
    const mockError = {
      message: 'Network Error',
    };
    showApiError(mockError);
  };

  // Example 5: Trigger React error (for ErrorBoundary)
  const [shouldThrow, setShouldThrow] = React.useState(false);
  
  if (shouldThrow) {
    throw new Error('This is a test error to demonstrate ErrorBoundary');
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Handling Examples</CardTitle>
          <CardDescription>
            Demonstration of all error handling and user feedback features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toast Notifications */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Toast Notifications</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleShowSuccess} variant="default">
                Show Success
              </Button>
              <Button onClick={handleShowError} variant="destructive">
                Show Error
              </Button>
              <Button onClick={handleShowWarning} variant="outline">
                Show Warning
              </Button>
              <Button onClick={handleShowInfo} variant="secondary">
                Show Info
              </Button>
            </div>
          </div>

          {/* API Error Simulations */}
          <div>
            <h3 className="text-lg font-semibold mb-3">API Error Handling</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSimulate401} variant="outline">
                Simulate 401 (Unauthorized)
              </Button>
              <Button onClick={handleSimulate500} variant="outline">
                Simulate 500 (Server Error)
              </Button>
              <Button onClick={handleSimulateNetwork} variant="outline">
                Simulate Network Error
              </Button>
            </div>
          </div>

          {/* API Call with Retry */}
          <div>
            <h3 className="text-lg font-semibold mb-3">API Call with Retry</h3>
            <Button onClick={() => loadUsers()} disabled={loadingUsers}>
              {loadingUsers ? 'Loading...' : 'Load Users (with retry)'}
            </Button>
            {users && (
              <p className="mt-2 text-sm text-muted-foreground">
                Loaded {users.length} users
              </p>
            )}
          </div>

          {/* Error Boundary Test */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Error Boundary</h3>
            <Button 
              onClick={() => setShouldThrow(true)} 
              variant="destructive"
            >
              Trigger React Error
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              This will trigger the ErrorBoundary component
            </p>
          </div>

          {/* Session Expired */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Session Management</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Session expired dialog appears automatically when JWT token expires (401/403 errors)
            </p>
          </div>

          {/* Offline Indicator */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Offline Indicator</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Try disconnecting your internet to see the offline indicator at the top of the page
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
