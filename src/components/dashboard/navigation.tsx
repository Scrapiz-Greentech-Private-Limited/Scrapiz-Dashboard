
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Home,
  ShoppingCart,
  Users,
  CreditCard,
  Settings,
  Truck,
  Store,
  Map,
  Wrench,
  Gift,
  Package,
  BarChart3,
  Shield,
  Bell,
  FileText,
  Image,
  Star,
  Recycle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', pageKey: 'dashboard' },
  { href: '/dashboard/services', icon: Recycle, label: 'Services Hub', pageKey: null },
  { href: '/dashboard/authentication', icon: Shield, label: 'Auth', pageKey: 'authentication' },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Orders', pageKey: 'orders' },
  { href: '/dashboard/booking-audits', icon: FileText, label: 'Booking Audits', pageKey: null },
  { href: '/dashboard/service-orders', icon: Wrench, label: 'Services', pageKey: 'service-orders' },
  { href: '/dashboard/catalog', icon: Package, label: 'Catalog', pageKey: 'catalog' },
  { href: '/dashboard/carousel', icon: Image, label: 'Carousel', pageKey: 'carousel' },
  { href: '/dashboard/areas', icon: Map, label: 'Areas', pageKey: null }, // No permission check
  { href: '/dashboard/agents', icon: Truck, label: 'Agents', pageKey: 'agents' },
  { href: '/dashboard/vendors', icon: Store, label: 'Vendors', pageKey: null },
  { href: '/dashboard/reviews', icon: Star, label: 'Reviews', pageKey: null }, // Agent reviews
  { href: '/dashboard/users', icon: Users, label: 'Users', pageKey: 'users' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications', pageKey: 'notifications' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', pageKey: 'analytics' },
  { href: '/dashboard/referrals', icon: Gift, label: 'Referrals', pageKey: 'referrals' },
  { href: '/dashboard/audit-logs', icon: FileText, label: 'Audit Logs', pageKey: null }, // No permission check
  { href: '/dashboard/payments', icon: CreditCard, label: 'Payments', pageKey: null }, // No permission check
];

interface NavigationProps {
  isMobile?: boolean;
}

export default function Navigation({ isMobile = false }: NavigationProps) {
  const pathname = usePathname();
  const { hasPermission, isAdmin } = useAuth();

  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter(item => {
    // If no pageKey, always show (no permission check)
    if (!item.pageKey) return true;
    // Admin sees everything
    if (isAdmin) return true;
    // Check permission
    return hasPermission(item.pageKey, 'view');
  });

  // Mobile navigation (full width with labels)
  if (isMobile) {
    return (
      <nav className="flex flex-col gap-2 p-4" role="navigation" aria-label="Mobile navigation">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 mb-4 bg-green-600 hover:bg-green-700 text-white transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
          aria-label="Scrapiz Admin Home"
        >
          <span className="text-2xl font-bold" aria-hidden="true">S</span>
          <span className="text-lg font-semibold">Scrapiz Admin</span>
        </Link>
        <Link
          href="/dashboard/services"
          className="flex items-center gap-3 rounded-lg px-3 py-2 mb-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          aria-label="Open Services Hub"
        >
          <Recycle className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-semibold">Services Hub</span>
        </Link>
        {filteredNavItems.map((item) => {
          const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2',
                isActive ? 'bg-accent text-accent-foreground font-medium' : ''
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="mt-auto pt-4 border-t">
          <Link
            href="/dashboard/settings"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2',
              pathname.startsWith('/dashboard/settings') ? 'bg-accent text-accent-foreground font-medium' : ''
            )}
            aria-label="Settings"
            aria-current={pathname.startsWith('/dashboard/settings') ? 'page' : undefined}
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Desktop navigation (icon-only sidebar)
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex" role="complementary" aria-label="Sidebar navigation">
      <nav className="flex flex-col items-center gap-4 px-2 py-4" role="navigation" aria-label="Primary navigation">
        <Link
          href="/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-green-600 hover:bg-green-700 text-lg font-bold md:h-8 md:w-8 md:text-base transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
          aria-label="Scrapiz Admin Home"
        >
          <span className="text-xl font-bold text-white transition-all group-hover:scale-110" aria-hidden="true">S</span>
          <span className="sr-only">Scrapiz Admin</span>
        </Link>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/services"
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-800 md:h-8 md:w-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                  pathname.startsWith('/dashboard/services') ? 'bg-emerald-100 text-emerald-800' : ''
                )}
                aria-label="Services Hub"
                aria-current={pathname.startsWith('/dashboard/services') ? 'page' : undefined}
              >
                <Recycle className="h-5 w-5" aria-hidden="true" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Services Hub</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          {filteredNavItems.map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2',
                      isActive ? 'bg-accent text-accent-foreground' : ''
                    )}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4" role="navigation" aria-label="Secondary navigation">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/settings"
                className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2',
                    pathname.startsWith('/dashboard/settings') ? 'bg-accent text-accent-foreground' : ''
                    )}
                aria-label="Settings"
                aria-current={pathname.startsWith('/dashboard/settings') ? 'page' : undefined}
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
