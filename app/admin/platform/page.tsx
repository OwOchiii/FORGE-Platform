'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';

export default function PlatformAdminPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRoles={['platform_admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Platform Administration Dashboard
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              User: {user?.email} | Role: {user?.role}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Welcome, {user?.name || 'Admin'}!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  User Management
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage users, roles, and permissions
                </p>
              </div>
              
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  System Health
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor platform performance and security
                </p>
              </div>
              
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Analytics
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  View platform statistics and reports
                </p>
              </div>
              
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure system settings and policies
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
