'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { getUserProgress, getCourses } from '@/lib/supabase/data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { SimulatorProgressChart } from '@/components/simulator/SimulatorProgressChart';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (user?.id) {
          const supabase = createClient();
          
          // Fetch user's enrollments with course details
          const userProgress = await getUserProgress(supabase, user.id);
          setEnrolledCourses(userProgress || []);

          // Fetch all published courses for recommendations
          const published = await getCourses(supabase, { status: 'published' });
          setAllCourses(published || []);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const avgProgress = enrolledCourses.length > 0 
    ? Math.round(enrolledCourses.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / enrolledCourses.length)
    : 0;

  const certifications = enrolledCourses.filter((p) => p.status === 'completed').length;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">Loading dashboard...</div>
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            {/* Welcome Header */}
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user?.name}!</h1>
              <p className="text-muted-foreground">Continue your learning journey and master new skills.</p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                {
                  icon: BookOpen,
                  label: 'Courses Enrolled',
                  value: enrolledCourses.length,
                  color: 'orange',
                },
                {
                  icon: TrendingUp,
                  label: 'Average Progress',
                  value: `${avgProgress}%`,
                  color: 'red',
                },
                {
                  icon: Award,
                  label: 'Certifications',
                  value: certifications,
                  color: 'green',
                },
                {
                  icon: Clock,
                  label: 'Learning Hours',
                  value: '24.5',
                  color: 'orange',
                },
              ].map((stat, i) => (
                <motion.div key={i} variants={itemVariants} className="bg-card border border-border rounded-lg p-6 shadow-sm transition-transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-500/20 text-${stat.color}-400`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Simulator Chart */}
            <motion.div variants={itemVariants} className="mb-12">
              <SimulatorProgressChart />
            </motion.div>

            {/* Continue Learning */}
            <motion.div variants={itemVariants} className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Continue Learning</h2>
              {enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map((item: any) => (
                    <div key={item.course_id} className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-primary/30 to-accent/20" />
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground mb-2">{item.courses?.title || 'Course'}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {item.courses?.description}
                        </p>
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Progress</span>
                            <span className="text-xs font-bold text-foreground">{item.progress_percentage}%</span>
                          </div>
                          <Progress value={item.progress_percentage} className="h-2" />
                        </div>
                        <Link href={`/courses/${item.course_id}`}>
                          <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                            Continue
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't enrolled in any courses yet. Browse available courses to get started.
                  </p>
                  <Link href="/courses">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Explore Courses
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Recommendations */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold text-foreground mb-6">Recommended for You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allCourses
                  .filter((c) => !enrolledCourses.some((p) => p.course_id === c.id))
                  .slice(0, 2)
                  .map((course) => (
                    <div key={course.id} className="bg-card border border-border p-6 hover:shadow-md transition flex flex-col justify-between rounded-lg">
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
                          {course.category || 'General'}
                        </span>
                        <Link href={`/courses/${course.id}`}>
                          <Button size="sm" variant="outline" className="border-border text-muted-foreground">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        </main>

        {/* AI Chat */}
        <AIChat />
      </div>
    </ProtectedRoute>
  );
}
