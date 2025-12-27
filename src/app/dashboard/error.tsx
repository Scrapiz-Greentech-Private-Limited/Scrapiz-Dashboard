'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            An error occurred while loading the dashboard. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error.message && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {error.message}
              </div>
            )}
            <Button onClick={reset} className="w-full">
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
