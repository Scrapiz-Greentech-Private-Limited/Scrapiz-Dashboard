"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuthService, AdminUser, AdminPermissions } from '@/services/adminAuth';

interface AuthContextType {
  user: AdminUser | null;
  permissions: AdminPermissions | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  pendingEmail: string | null;
  requiresVerification: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyEmail: (otp: string) => Promise<void>;
  resendOTP: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (pageKey: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const router = useRouter();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (!AdminAuthService.isAuthenticated()) {
        setUser(null);
        setPermissions(null);
        setIsLoading(false);
        return;
      }

      // Try to get fresh user data from API
      try {
        const userData = await AdminAuthService.getCurrentUser();
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          is_admin: userData.is_admin,
          is_active: userData.is_active,
        });
        setPermissions(userData.permissions);
        
        // Update stored data
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminUser', JSON.stringify(userData));
          localStorage.setItem('adminPermissions', JSON.stringify(userData.permissions));
        }
      } catch (error) {
        // If API fails, try to use stored data
        const storedUser = AdminAuthService.getStoredUser();
        const storedPermissions = AdminAuthService.getStoredPermissions();
        
        if (storedUser) {
          setUser(storedUser);
          setPermissions(storedPermissions);
        } else {
          // No valid session
          setUser(null);
          setPermissions(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('adminAuthToken');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminPermissions');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await AdminAuthService.login(email, password);
      
      setUser(response.user);
      setPermissions(response.permissions);
      setPendingEmail(null);
      setRequiresVerification(false);
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Check if account needs email verification
      if (error.message?.includes('not active') || error.message?.includes('verify')) {
        setPendingEmail(email);
        setRequiresVerification(true);
        throw new Error('Account not verified. Please check your email for the verification code.');
      }
      
      throw error;
    }
  };

  const verifyEmail = async (otp: string) => {
    if (!pendingEmail) {
      throw new Error('No pending verification. Please login again.');
    }

    try {
      await AdminAuthService.verifyEmail(pendingEmail, otp);
      
      // After verification, user needs to login again
      setPendingEmail(null);
      setRequiresVerification(false);
      
      // Redirect to login with success message
      router.push('/login?verified=true');
    } catch (error: any) {
      console.error('Verification error:', error);
      throw error;
    }
  };

  const resendOTP = async () => {
    if (!pendingEmail) {
      throw new Error('No pending verification. Please login again.');
    }

    try {
      await AdminAuthService.resendOTP(pendingEmail);
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AdminAuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setPermissions(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await AdminAuthService.getCurrentUser();
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        is_admin: userData.is_admin,
        is_active: userData.is_active,
      });
      setPermissions(userData.permissions);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const hasPermission = (pageKey: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
    // Admin has all permissions
    if (user?.is_admin) {
      return true;
    }

    if (!permissions) {
      return false;
    }

    const pagePermission = permissions[pageKey];
    if (!pagePermission) {
      return false;
    }

    switch (action) {
      case 'view':
        return pagePermission.can_view;
      case 'create':
        return pagePermission.can_create;
      case 'edit':
        return pagePermission.can_edit;
      case 'delete':
        return pagePermission.can_delete;
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: user?.is_admin ?? false,
        pendingEmail,
        requiresVerification,
        login,
        verifyEmail,
        resendOTP,
        logout,
        refreshUser,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
