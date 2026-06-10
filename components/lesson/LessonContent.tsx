'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle, HelpCircle, Video, Check, X } from 'lucide-react';

// DB-shaped types (snake_case, as returned from Supabase)
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

type DBModule = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
};

type DBCourse = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
};

type MCQOption = { id: string; text: string };
type MCQQuestion = { id: string; question: string; options: MCQOption[]; correctId: string };
type QuizResources = { type: 'quiz'; questions: MCQQuestion[] };

interface LessonContentProps {
  lesson: DBLesson;
  course: DBCourse;
  module: DBModule;
  lessons: DBLesson[];
}

// ── Video player ───────────────────────────────────────────────────────────────

function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  const embedUrl = youtubeMatch ? `https://www.youtube.com/embed/${youtubeMatch[1]}` : null;

  if (embedUrl) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lesson video"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm bg-slate-900">
      <video src={videoUrl} controls className="w-full h-full" title="Lesson video" />
    </div>
  );
}

// ── Quiz component ─────────────────────────────────────────────────────────────

function QuizPlayer({ questions }: { questions: MCQQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-10 text-center text-gray-500 dark:text-gray-400">
        This quiz has no questions yet.
      </div>
    );
  }

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctId).length
    : 0;

  function handleSelect(questionId: string, optionId: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleSubmit() {
    if (Object.keys(answers).length < questions.length) return;
    setSubmitted(true);
  }

  function handleRetry() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="space-y-6">
      {/* Score banner */}
      {submitted && (
        <div className={`rounded-xl p-5 flex items-center gap-4 ${
          score === questions.length
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700'
            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700'
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
            score === questions.length
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
          }`}>
            {score}/{questions.length}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {score === questions.length ? 'Perfect score!' : `You got ${score} of ${questions.length} correct`}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {score === questions.length
                ? 'Excellent work — you answered every question correctly.'
                : 'Review the highlighted answers and try again.'}
            </p>
          </div>
          <Button onClick={handleRetry} variant="outline" size="sm" className="ml-auto dark:border-slate-600 dark:text-gray-300">
            Retry
          </Button>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, qi) => {
        const selected = answers[q.id];
        const isCorrect = submitted && selected === q.correctId;
        const isWrong = submitted && selected && selected !== q.correctId;

        return (
          <div key={q.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <span className="shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-bold flex items-center justify-center">
                {qi + 1}
              </span>
              <p className="font-medium text-gray-900 dark:text-white leading-relaxed">{q.question}</p>
              {submitted && (
                isCorrect
                  ? <Check className="w-5 h-5 text-emerald-500 shrink-0 ml-auto" />
                  : <X className="w-5 h-5 text-red-500 shrink-0 ml-auto" />
              )}
            </div>

            <div className="space-y-2 ml-10">
              {q.options.map((opt) => {
                const isSelected = selected === opt.id;
                const isThisCorrect = submitted && opt.id === q.correctId;
                const isThisWrong = submitted && isSelected && opt.id !== q.correctId;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(q.id, opt.id)}
                    disabled={submitted}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                      isThisCorrect
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : isThisWrong
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 disabled:cursor-default'
                    }`}
                  >
                    <span className="font-medium mr-2 text-gray-500 dark:text-gray-400">
                      {String.fromCharCode(65 + q.options.indexOf(opt))}.
                    </span>
                    {opt.text}
                    {isThisCorrect && <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">(correct)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3"
        >
          Submit Quiz
        </Button>
      )}
      {!submitted && Object.keys(answers).length < questions.length && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          Answer all {questions.length} questions to submit
        </p>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function LessonContent({
  lesson,
  course,
  module,
  lessons,
}: LessonContentProps) {
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const sortedLessons = lessons.slice().sort((a, b) => a.order - b.order);
  const currentIndex = sortedLessons.findIndex((l) => l.id === lesson.id);
  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;
  const progressPercent = ((currentIndex + 1) / sortedLessons.length) * 100;

  const isQuiz = (lesson.resources as any)?.type === 'quiz';
  const quizQuestions: MCQQuestion[] = isQuiz
    ? ((lesson.resources as QuizResources)?.questions ?? [])
    : [];

  const videoUrl = lesson.video_url || lesson.video_storage_path || '';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
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
            <span className="text-gray-900 dark:text-white font-semibold truncate max-w-xs">{lesson.title}</span>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isQuiz
                  ? <HelpCircle className="w-5 h-5 text-purple-500" />
                  : <Video className="w-5 h-5 text-blue-500" />
                }
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">
                {currentIndex + 1} of {sortedLessons.length}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 dark:bg-slate-700" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Video or Quiz */}
              {isQuiz ? (
                <QuizPlayer questions={quizQuestions} />
              ) : videoUrl ? (
                <VideoPlayer videoUrl={videoUrl} />
              ) : (
                <div className="aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500">
                  <div className="text-center">
                    <Video className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No video has been added to this lesson yet.</p>
                  </div>
                </div>
              )}

              {/* Lesson Notes / Transcript */}
              {!isQuiz && lesson.content && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-8">
                  <div
                    className="prose prose-sm md:prose-base max-w-none text-gray-700 dark:text-gray-300 dark:prose-headings:text-white dark:prose-strong:text-white dark:prose-a:text-blue-400"
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                </div>
              )}

              {/* My Notes */}
              {!isQuiz && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="flex items-center justify-between w-full focus:outline-none"
                  >
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">My Notes</h2>
                    <span className="text-gray-400 dark:text-gray-500 font-medium text-xl">{showNotes ? '−' : '+'}</span>
                  </button>
                  {showNotes && (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add your notes here..."
                      className="mt-3 w-full h-28 p-3 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 dark:bg-slate-900 dark:text-white text-sm"
                    />
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-4">
                {previousLesson ? (
                  <Link href={`/courses/${course.id}/${module.id}/${previousLesson.id}`} className="flex-1">
                    <Button variant="outline" className="w-full dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous Lesson
                    </Button>
                  </Link>
                ) : <div className="flex-1" />}
                {nextLesson && (
                  <Link href={`/courses/${course.id}/${module.id}/${nextLesson.id}`} className="flex-1">
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                      Next Lesson
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 sticky top-24">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Course Overview</h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-transparent dark:border-slate-700">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Course</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{course.title}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-transparent dark:border-slate-700">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Module</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{module.title}</p>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span>Current Lesson</span>
                    <span className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                      {currentIndex + 1} / {sortedLessons.length}
                    </span>
                  </div>
                </div>

                {/* Lesson list */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Lessons in this module</p>
                  <div className="space-y-1">
                    {sortedLessons.map((l) => {
                      const isActive = l.id === lesson.id;
                      const isLessonQuiz = (l.resources as any)?.type === 'quiz';
                      return (
                        <Link
                          key={l.id}
                          href={`/courses/${course.id}/${module.id}/${l.id}`}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {isLessonQuiz
                            ? <HelpCircle className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                            : <Video className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                          }
                          <span className="truncate">{l.title}</span>
                          {isActive && <CheckCircle className="w-3 h-3 ml-auto text-blue-500 shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AIChat />
      </div>
    </>
  );
}
