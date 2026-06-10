'use client';

import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { ChevronDown, ChevronUp, BookOpen, CheckCircle2, Video, HelpCircle } from 'lucide-react';
import { useState } from 'react';

// DB-shaped types returned by getCourseWithModulesAndLessons
type DBLesson = {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  video_storage_path?: string | null;
  resources: any;
  order: number;
  created_at: string;
};

type DBModuleWithLessons = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  lessons: DBLesson[];
};

type DBCourse = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
};

interface CourseDetailContentProps {
  course: DBCourse;
  modules: DBModuleWithLessons[];
  courseId: string;
}

function lessonIcon(lesson: DBLesson) {
  const isQuiz = (lesson.resources as any)?.type === 'quiz';
  if (isQuiz) return <HelpCircle className="w-4 h-4 text-purple-500 shrink-0" />;
  return <Video className="w-4 h-4 text-blue-500 shrink-0" />;
}

export default function CourseDetailContent({
  course,
  modules,
  courseId,
}: CourseDetailContentProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(modules[0]?.id || null);

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <Link href="/courses" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mb-4 inline-block transition-colors">
            &larr; Back to Courses
          </Link>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="h-48 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40" />
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{course.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl">{course.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full font-medium">
                    {course.category}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Created on {new Date(course.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Modules</h2>

            {modules.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-10 text-center text-gray-500 dark:text-gray-400">
                No modules have been added to this course yet.
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module) => {
                  const lessons = module.lessons ?? [];
                  const isExpanded = expandedModule === module.id;

                  return (
                    <div key={module.id} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                      {/* Module Header */}
                      <button
                        onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{module.title}</h3>
                            {module.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{module.description}</p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>

                      {/* Module Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                          {lessons.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-slate-700">
                              {lessons
                                .slice()
                                .sort((a, b) => a.order - b.order)
                                .map((lesson) => (
                                  <div key={lesson.id} className="px-6 py-4 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                                    <Link
                                      href={`/courses/${courseId}/${module.id}/${lesson.id}`}
                                      className="flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                                          {lesson.order}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {lessonIcon(lesson)}
                                          <p className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            {lesson.title}
                                          </p>
                                        </div>
                                      </div>
                                      <CheckCircle2 className="w-5 h-5 text-gray-300 dark:text-slate-600" />
                                    </Link>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                              <p>No lessons available</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 sticky top-24 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Course Progress</h3>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">0%</span>
                </div>
                <Progress value={0} className="h-3 dark:bg-slate-700" />
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Total Modules</span>
                  <span className="font-semibold">{modules.length}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Total Lessons</span>
                  <span className="font-semibold">{totalLessons}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Modules</h4>
                <div className="space-y-2">
                  {modules.map((module) => (
                    <div key={module.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                      <span className="text-gray-600 dark:text-gray-400">{module.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AIChat />
    </div>
  );
}
