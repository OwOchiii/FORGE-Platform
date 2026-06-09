'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { getCourses, createCourse, deleteCourse } from '@/lib/supabase/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, BookOpen, Users, BarChart3,
  Search, X, Loader2, AlertCircle, ChevronRight,
} from 'lucide-react';

type Course = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  creator_id: string;
  created_at: string;
};

type NewCourseForm = {
  title: string;
  description: string;
  category: string;
};

function CourseAdminContent() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<NewCourseForm>({ title: '', description: '', category: '' });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchCourses();
  }, [user]);

  async function fetchCourses() {
    try {
      setLoading(true);
      setError(null);
      const data = await getCourses(supabase, { creatorId: user!.id });
      setCourses((data as Course[]) ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.title.trim()) {
      setFormError('Course title is required');
      return;
    }
    try {
      setCreating(true);
      setFormError(null);
      const created = await createCourse(supabase, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || 'General',
        creator_id: user!.id,
        status: 'draft',
      });
      router.push(`/admin/courses/${created.id}`);
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to create course');
      setCreating(false);
    }
  }

  async function handleDelete(courseId: string) {
    try {
      setDeleteId(courseId);
      await deleteCourse(supabase, courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete course');
    } finally {
      setDeleteId(null);
    }
  }

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalCourses = courses.length;
  const published = courses.filter((c) => c.status === 'published').length;
  const drafts = courses.filter((c) => c.status === 'draft').length;

  return (
    <div className="min-h-screen bg-[#0d1b2e]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Courses</h1>
            <p className="text-slate-400 text-sm mt-1">Create and manage your training content</p>
          </div>
          <Button
            onClick={() => { setShowForm(true); setFormError(null); }}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Course
          </Button>
        </div>

        {/* Create Course Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0f2744] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Create New Course</h2>
                <button
                  onClick={() => { setShowForm(false); setForm({ title: '', description: '', category: '' }); }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Course Title <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Sales Fundamentals 101"
                    className="bg-[#0d1b2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Category
                  </label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Onboarding, Sales, Product"
                    className="bg-[#0d1b2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief overview of what this course covers..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-md bg-[#0d1b2e] border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                {formError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-6 pt-0">
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  {creating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</>
                  ) : (
                    'Create Course'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowForm(false); setForm({ title: '', description: '', category: '' }); }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Courses', value: totalCourses, icon: BookOpen },
            { label: 'Published', value: published, icon: BarChart3 },
            { label: 'Drafts', value: drafts, icon: Edit2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#0f2744] border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">{label}</span>
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Search + Table */}
        <div className="bg-[#0f2744] border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="pl-9 bg-[#0d1b2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-slate-400 text-sm">{error}</p>
              <Button onClick={fetchCourses} variant="outline" size="sm" className="border-slate-600 text-slate-300">
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">
                  {search ? 'No courses match your search' : 'No courses yet'}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {search ? 'Try a different search term' : 'Create your first course to get started'}
                </p>
              </div>
              {!search && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2 mt-1"
                >
                  <Plus className="w-4 h-4" />
                  New Course
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-900/50 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{course.title}</p>
                          {course.description && (
                            <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{course.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 text-sm">{course.category || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        course.status === 'published'
                          ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/50'
                          : course.status === 'draft'
                          ? 'bg-amber-900/50 text-amber-400 border border-amber-800/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/admin/courses/${course.id}`)}
                          className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(course.id)}
                          disabled={deleteId === course.id}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-900/20 w-8 h-8 p-0"
                        >
                          {deleteId === course.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CourseAdminPage() {
  return (
    <ProtectedRoute requiredRoles={['course_admin']}>
      <CourseAdminContent />
    </ProtectedRoute>
  );
}
