'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { getCourses, getUserProgress } from '@/lib/supabase/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        
        // Fetch published courses
        const publishedCourses = await getCourses(supabase, { status: 'published' });
        setCourses(publishedCourses || []);

        // Fetch user's enrolled courses
        if (user?.id) {
          const userProgress = await getUserProgress(supabase, user.id);
          setEnrolledCourseIds(userProgress?.map((p: any) => p.course_id) || []);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(courses.map((c: any) => c.category).filter(Boolean)));

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">Loading courses...</div>
          </main>
          <AIChat />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Course Catalog</h1>
            <p className="text-muted-foreground">
              Explore our comprehensive collection of training courses designed to enhance your skills.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                  Search Courses
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course: any) => {
                const isEnrolled = enrolledCourseIds.includes(course.id);
                return (
                  <div
                    key={course.id}
                    className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
                  >
                    {/* Course Image */}
                    <div className="h-40 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl opacity-10">📚</div>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold bg-primary/20 text-primary px-3 py-1 rounded-full">
                            {course.category || 'General'}
                          </span>
                          {isEnrolled && (
                            <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                              Enrolled
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                      </div>

                      {/* Footer */}
                      <div className="mt-auto">
                        <Link href={`/courses/${course.id}`}>
                          <Button
                            className={`w-full ${
                              isEnrolled
                                ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                          >
                            {isEnrolled ? 'Continue' : 'Enroll Now'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Courses Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find courses you're looking for.
              </p>
            </div>
          )}
        </main>

        <AIChat />
      </div>
    </ProtectedRoute>
  );
}
