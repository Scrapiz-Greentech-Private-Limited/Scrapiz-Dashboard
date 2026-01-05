"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  Search,
  ShoppingCart,
  Users,
  PanelLeft,
  DollarSign,
  Truck,
  Settings,
  User,
  CreditCard,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";
import Navigation from "./navigation";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const pageTitle = pathname.split("/").pop()?.replace(/-/g, ' ') || 'dashboard';

  const handleSettings = () => {
    router.push('/dashboard/authentication');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to orders page with search query
      router.push(`/dashboard/orders?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6" role="banner">
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            variant="outline" 
            className="sm:hidden focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            aria-label="Toggle navigation menu"
          >
            <PanelLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs p-0" aria-describedby="navigation-description">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="sr-only" id="navigation-description">Navigation menu</div>
          <Navigation isMobile={true} />
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex" aria-label="Breadcrumb navigation">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator aria-hidden="true" />
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize">{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <form 
        onSubmit={handleSearch} 
        className="relative ml-auto flex-1 md:grow-0"
        role="search"
        aria-label="Search orders and users"
      >
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search orders, users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px] focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
          aria-label="Search input"
        />
      </form>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            aria-label={`User menu for ${user?.name || 'account'}`}
          >
            <User className="h-5 w-5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            {user?.name || 'My Account'}
            {user?.email && (
              <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleSettings} 
            className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout} 
            className="cursor-pointer text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
