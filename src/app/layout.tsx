import type {Metadata} from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary, SessionExpiredDialog, OfflineIndicator } from '@/components/error';
import { SkipNav } from '@/components/ui/skip-nav';

export const metadata: Metadata = {
  title: 'Scrapiz Admin',
  description: 'Admin Dashboard for Scrapiz',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2322c55e"/><text x="50" y="70" font-size="60" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">S</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <SkipNav />
        <ErrorBoundary>
          <AuthProvider>
            <OfflineIndicator />
            <SessionExpiredDialog />
            {children}
          </AuthProvider>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
