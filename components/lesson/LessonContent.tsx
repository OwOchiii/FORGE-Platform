'use client';

import { useState } from 'react';
import InteractiveVideoPlayer from './InteractiveVideoPlayer';
import { Lesson, Module, Course } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import AISalesSimulator from './AISalesSimulator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LessonContentProps {
  lesson: Lesson;
  course: Course;
  module: Module;
  lessons: Lesson[];
}

export default function LessonContent({
  lesson,
  course,
  module,
  lessons,
}: LessonContentProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showAIHelp, setShowAIHelp] = useState(false);

  const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const totalLessons = lessons.length;
  const progressPercent = ((currentIndex + 1) / totalLessons) * 100;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/courses" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Courses
            </Link>
            <span>/</span>
            <Link href={`/courses/${course.id}`} className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {course.title}
            </Link>
            <span>/</span>
            <span>{module.title}</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-semibold">{lesson.title}</span>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentIndex + 1} of {totalLessons}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 dark:bg-slate-700" />
          </div>

          {lesson.id === 'l5' || lesson.id === 'l11' ? (
            <div className="w-full mb-8">
              {lesson.id === 'l5' ? (
                <AISalesSimulator
                  productName="EcoBot Smart Water Bottle"
                  productDescription="AI-powered hydration tracking, temperature control, 48-hour cold/hot retention, 100% recycled materials, app integration"
                  productPrice="$89.99"
                  scenarioDescription="You're a sales representative for EcoBot. The customer is skeptical about the price. Your goal is to convince them of the value and close the sale."
                />
              ) : (
                <AISalesSimulator
                  productName="Truffle Wagyu Ribeye Steak"
                  productDescription="A5 Japanese Wagyu, infused with white truffle butter, served with Himalayan salt and rosemary reduction, sourced from sustainable farms"
                  productPrice="$150.00"
                  scenarioDescription="You're a waiter at a premium restaurant. The customer is a food enthusiast wanting to know about the ingredients and preparation before ordering. Your goal is to convince them to try this signature dish."
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Interactive Video Section */}
                <div className="mb-8">
                  <InteractiveVideoPlayer
                    videoUrl={lesson.videoUrl || lesson.videoStoragePath || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}
                    title={lesson.title}
                  />
                </div>

                {/* Lesson Content */}
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm p-8 md:p-10 mb-8">
                  <div
                    className="prose prose-sm md:prose-base max-w-none text-gray-700 dark:text-gray-300 dark:prose-headings:text-white dark:prose-strong:text-white dark:prose-a:text-blue-400"
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                </div>

                {/* Notes Section */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 mb-8">
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="flex items-center justify-between w-full mb-4 group focus:outline-none"
                  >
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-slate-600 transition-colors">📓</span>
                      My Notes
                    </h2>
                    <span className="text-gray-400 dark:text-gray-500 font-medium text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      {showNotes ? '−' : '+'}
                    </span>
                  </button>
                  {showNotes && (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add your notes here..."
                      className="w-full h-32 p-4 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-gray-50/50 dark:bg-slate-900 dark:text-white"
                    />
                  )}
                </div>

                {/* Resources */}
                {lesson.resources && lesson.resources.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-8 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Resources</h2>
                    <div className="space-y-2">
                      {lesson.resources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource.url}
                          className="flex items-center gap-2 p-3 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition"
                        >
                          <Download className="w-4 h-4" />
                          {resource.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation inside grid */}
                <div className="flex gap-4">
                  {previousLesson && (
                    <Link
                      href={`/courses/${course.id}/${module.id}/${previousLesson.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous Lesson
                      </Button>
                    </Link>
                  )}
                  {nextLesson && (
                    <Link
                      href={`/courses/${course.id}/${module.id}/${nextLesson.id}`}
                      className="flex-1"
                    >
                      <Button className="w-full dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700">
                        Next Lesson
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Course Overview */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-slate-700 rounded-full blur-3xl -z-10" />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-500">📚</span> Course Overview
                  </h3>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-transparent dark:border-slate-700">
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Course</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{course.title}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-transparent dark:border-slate-700">
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Module</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{module.title}</p>
                    </div>
                    <div className="flex items-center justify-between p-2">
                      <p className="text-gray-500 dark:text-gray-400">Current Lesson</p>
                      <p className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full">{currentIndex + 1} / {totalLessons}</p>
                    </div>
                  </div>
                </div>

                {/* AI Help */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-500/30 p-6">
                  <button
                    onClick={() => setShowAIHelp(!showAIHelp)}
                    className="w-full text-left font-bold text-orange-900 dark:text-orange-400 mb-2 focus:outline-none"
                  >
                    Need Help?
                  </button>
                  {showAIHelp && (
                    <p className="text-sm text-orange-800 dark:text-orange-300">
                      Use the AI chat in the bottom right corner to ask questions about this lesson.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation for Simulator (outside grid) */}
          {(lesson.id === 'l5' || lesson.id === 'l11') && (
            <div className="flex gap-4 mt-8">
              {previousLesson && (
                <Link
                  href={`/courses/${course.id}/${module.id}/${previousLesson.id}`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous Lesson
                  </Button>
                </Link>
              )}
              {nextLesson && (
                <Link
                  href={`/courses/${course.id}/${module.id}/${nextLesson.id}`}
                  className="flex-1"
                >
                  <Button className="w-full dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700">
                    Next Lesson
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <AIChat />

      </div>
    </>
  );
}
