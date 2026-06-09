'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { getAllProfiles, updateUserRole, getPlatformStats } from '@/lib/supabase/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, AlertTriangle, BarChart3, Settings, Lock, Trash2, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PlatformStats {
  totalUsers: number;
  totalAdmins: number;
  totalEnrollments: number;
  completedCourses: number;
}

export default function PlatformAdminPage() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalEnrollments: 0,
    completedCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [selectedRoleUser, setSelectedRoleUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('course_admin');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Load users and stats
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allUsers, platformStats] = await Promise.all([
          getAllProfiles(supabase),
          getPlatformStats(supabase),
        ]);
        setUsers(allUsers || []);
        setStats(platformStats);
      } catch (error) {
        console.error('[v0] Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      u.id !== user?.id
  );

  const trainees = users.filter((u) => u.role === 'trainee');
  const admins = users.filter((u) => u.role !== 'trainee');

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(supabase, userId, newRole);
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSelectedRoleUser(null);
      
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('[v0] Error updating user role:', error);
      alert('Error updating user role');
    }
  };

  const toggleBanUser = (userId: string) => {
    setBannedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleExportData = () => {
    const data = {
      users: users,
      stats: stats,
      exportDate: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `platform-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['platform_admin']}>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['platform_admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Administration</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage users, monitor platform health, and enforce policies</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                icon: Users,
                label: 'Total Users',
                value: stats.totalUsers,
                color: 'blue',
              },
              {
                icon: Shield,
                label: 'Admin Users',
                value: stats.totalAdmins,
                color: 'purple',
              },
              {
                icon: BarChart3,
                label: 'Total Enrollments',
                value: stats.totalEnrollments,
                color: 'green',
              },
              {
                icon: AlertTriangle,
                label: 'Banned Users',
                value: bannedUsers.length,
                color: 'red',
              },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      stat.color === 'blue'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : stat.color === 'purple'
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                        : stat.color === 'green'
                        ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                    }`}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <TabsList className="border-b border-gray-200 dark:border-slate-700 rounded-none w-full justify-start px-6 py-0 h-auto bg-transparent">
              <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                User Management
              </TabsTrigger>
              <TabsTrigger value="moderation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Moderation
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* User Management */}
            <TabsContent value="users" className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Users
                </label>
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Trainees</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{trainees.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Active training participants</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Course Admins</h3>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {admins.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Course creators and managers</p>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">All Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {filteredUsers.map((userData) => (
                      <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{userData.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{userData.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400">
                              {(userData.role || 'trainee').replace('_', ' ')}
                            </span>
                            {userData.role === 'trainee' && (
                              <select
                                value={selectedRoleUser === userData.id ? selectedRole : ''}
                                onChange={(e) => {
                                  setSelectedRoleUser(userData.id);
                                  setSelectedRole(e.target.value);
                                }}
                                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                              >
                                <option value="">Change role...</option>
                                <option value="course_admin">Make Course Admin</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              bannedUsers.includes(userData.id)
                                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400'
                                : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400'
                            }`}
                          >
                            {bannedUsers.includes(userData.id) ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          {selectedRoleUser === userData.id && userData.role === 'trainee' && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleChangeRole(userData.id, selectedRole)}
                            >
                              Confirm
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className={
                              bannedUsers.includes(userData.id)
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }
                            onClick={() => {
                              console.log('[v0] Toggling ban for user:', userData.id);
                              toggleBanUser(userData.id);
                            }}
                          >
                            <Lock className="w-4 h-4 mr-1" />
                            {bannedUsers.includes(userData.id) ? 'Unban' : 'Ban'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Moderation */}
            <TabsContent value="moderation" className="p-6">
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Pending Reports
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">No pending moderation reports at this time.</p>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Moderation History</h3>
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6 border border-gray-200 dark:border-slate-600 text-center text-gray-600 dark:text-gray-400">
                <p>No moderation history available</p>
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Total Users</h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Admins: {stats.totalAdmins}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6 border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Course Health</h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.totalEnrollments > 0 ? Math.round((stats.completedCourses / stats.totalEnrollments) * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Completion rate
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Platform Status</h3>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">Good</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">All systems operational</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6 border border-gray-200 dark:border-slate-600 text-center text-gray-600 dark:text-gray-400">
                <p>Detailed analytics dashboard coming soon</p>
              </div>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Platform Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Maintenance Mode</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Temporarily disable platform access
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('[v0] Toggling maintenance mode:', !maintenanceMode);
                          setMaintenanceMode(!maintenanceMode);
                        }}
                      >
                        {maintenanceMode ? 'On' : 'Off'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Enable platform notifications
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('[v0] Toggling email notifications:', !emailNotifications);
                          setEmailNotifications(!emailNotifications);
                        }}
                      >
                        {emailNotifications ? 'On' : 'Off'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Data Export</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Export all platform data
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportData}
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <AIChat />
      </div>
    </ProtectedRoute>
  );
}
