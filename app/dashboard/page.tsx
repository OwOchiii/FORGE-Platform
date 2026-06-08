'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { useAuth } from '@/lib/auth-context';
import { mockUserProgress, mockCourses } from '@/lib/mock-data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { SimulatorProgressChart } from '@/components/simulator/SimulatorProgressChart';

export default function DashboardPage() {
  const { user } = useAuth();

  // Get user's enrolled courses
  const enrolledCourses = mockUserProgress.filter((p) => p.userId === user?.id);
  const courseDetails = enrolledCourses.map((progress) => ({
    ...progress,
    course: mockCourses.find((c) => c.id === progress.courseId),
  }));

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

  return (
    <ProtectedRoute requiredRoles={['trainee']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <Navbar />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            {/* Welcome Header */}
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, {user?.name}!</h1>
              <p className="text-gray-600 dark:text-gray-400">Continue your learning journey and master new skills.</p>
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
                  value: `${Math.round(enrolledCourses.reduce((sum, p) => sum + p.progressPercentage, 0) / enrolledCourses.length || 0)}%`,
                  color: 'red',
                },
                {
                  icon: Award,
                  label: 'Certifications',
                  value: enrolledCourses.filter((p) => p.status === 'completed').length,
                  color: 'green',
                },
                {
                  icon: Clock,
                  label: 'Learning Hours',
                  value: '24.5',
                  color: 'orange',
                },
              ].map((stat, i) => (
                <motion.div key={i} variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400`}
                    >
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Continue Learning</h2>
              {courseDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courseDetails.map((item) => (
                    <div key={item.courseId} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40" />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.course?.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {item.course?.description}
                        </p>
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{item.progressPercentage}%</span>
                          </div>
                          <Progress value={item.progressPercentage} className="h-2 dark:bg-slate-700" />
                        </div>
                        <Link href={`/courses/${item.courseId}`}>
                          <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white">
                            Continue
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Courses Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You haven't enrolled in any courses yet. Browse available courses to get started.
                  </p>
                  <Link href="/courses">
                    <Button className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white">
                      Explore Courses
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Recommendations */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recommended for You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockCourses
                  .filter((c) => !enrolledCourses.some((p) => p.courseId === c.id))
                  .slice(0, 2)
                  .map((course) => (
                    <div key={course.id} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{course.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full font-medium">
                          {course.category}
                        </span>
                        <Link href={`/courses/${course.id}`}>
                          <Button size="sm" variant="outline" className="dark:border-slate-600 dark:text-slate-300">
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
