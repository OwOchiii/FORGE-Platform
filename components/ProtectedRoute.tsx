'use client';

import { useAuth } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    redirect('/auth/login');
  }

  if (requiredRoles) {
    if (!user.role) {
      // Role not loaded yet, show loading
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading role...</p>
          </div>
        </div>
      );
    }
    
    if (!requiredRoles.includes(user.role)) {
      // User doesn't have required role - redirect based on their actual role
      if (user.role === 'platform_admin') {
        redirect('/admin/platform');
      } else if (user.role === 'course_admin') {
        redirect('/admin/courses');
      } else {
        redirect('/dashboard');
      }
    }
  }

  return <>{children}</>;
}
