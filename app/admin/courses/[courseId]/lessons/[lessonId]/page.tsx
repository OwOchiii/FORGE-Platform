'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/client';
import { getLessonById, updateLesson, getModulesByCourse, getLessonsByModule } from '@/lib/supabase/data';
import { uploadVideoToStorage, getVideoPublicUrl, deleteVideoFromStorage } from '@/lib/supabase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft, Video, HelpCircle, Plus, Trash2, Check,
  Loader2, AlertCircle, ChevronRight, GripVertical,
  PlayCircle, CheckCircle2, Circle, X, Upload, File,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type LessonType = 'video' | 'quiz';

type MCQOption = {
  id: string;
  text: string;
};

type MCQQuestion = {
  id: string;
  question: string;
  options: MCQOption[];
  correctId: string;
};

type QuizResources = {
  type: 'quiz';
  questions: MCQQuestion[];
};

type VideoResources = {
  type: 'video';
};

type DBLesson = {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  video_storage_path: string | null;
  resources: any;
  order: number;
};

function getLessonType(lesson: DBLesson): LessonType {
  return (lesson.resources as any)?.type === 'quiz' ? 'quiz' : 'video';
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Video editor ───────────────────────────────────────────────────────────────

function VideoEditor({
  lesson,
  onSave,
  saving,
  supabase,
  lessonId,
}: {
  lesson: DBLesson;
  onSave: (updates: Partial<DBLesson>) => void;
  saving: boolean;
  supabase: any;
  lessonId: string;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [videoUrl, setVideoUrl] = useState(lesson.video_url ?? '');
  const [content, setContent] = useState(lesson.content ?? '');
  const [videoStoragePath, setVideoStoragePath] = useState(lesson.video_storage_path ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Detect YouTube embed
  function getYoutubeEmbed(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  }

  const embedUrl = videoUrl ? getYoutubeEmbed(videoUrl) : null;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload to Supabase Storage
      const storagePath = await uploadVideoToStorage(supabase, file, lessonId);
      
      if (storagePath) {
        setVideoStoragePath(storagePath);
        const publicUrl = getVideoPublicUrl(supabase, storagePath);
        setVideoUrl(publicUrl);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    onSave({
      title: title.trim(),
      video_url: videoUrl.trim() || null,
      video_storage_path: videoStoragePath || null,
      content: content.trim(),
      resources: { type: 'video' } as VideoResources,
    });
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Lesson Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-[#0d1b2e] border-slate-600 text-white text-base font-medium focus:border-blue-500"
          placeholder="Lesson title"
        />
      </div>

      {/* Video upload or URL */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Video Source
          </label>
          <div className="space-y-3">
            {/* File upload */}
            <div>
              <label className="text-xs text-slate-400 font-medium">Upload Video File</label>
              <div className="flex gap-2 mt-1.5">
                <div className="relative flex-1">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition ${
                      uploading
                        ? 'border-blue-600/50 bg-blue-900/10'
                        : 'border-slate-600 hover:border-blue-500 hover:bg-slate-800/50'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span className="text-sm text-blue-400">Uploading... {uploadProgress}%</span>
                      </>
                    ) : videoStoragePath ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400">Video uploaded</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">Click to upload or drag & drop</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Supported: MP4, WebM, Ogg (max 500MB)</p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#0f2744] text-slate-500">OR</span>
              </div>
            </div>

            {/* YouTube/URL input */}
            <div>
              <label className="text-xs text-slate-400 font-medium">YouTube or Video URL</label>
              <div className="flex gap-2 mt-1.5">
                <div className="relative flex-1">
                  <PlayCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="pl-9 bg-[#0d1b2e] border-slate-600 text-white focus:border-blue-500 placeholder:text-slate-500"
                    placeholder="https://youtube.com/watch?v=... or video URL"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video preview */}
      {embedUrl && (
        <div className="aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video preview"
          />
        </div>
      )}

      {/* Uploaded video preview */}
      {videoStoragePath && videoUrl && !embedUrl && (
        <div className="aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
          <video
            src={videoUrl}
            controls
            className="w-full h-full"
            title="Uploaded video preview"
          />
        </div>
      )}

      {/* Transcript / notes */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Lesson Notes / Transcript
          <span className="text-slate-500 font-normal ml-2 text-xs">optional</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Add notes, key takeaways, or a transcript for this lesson..."
          className="w-full px-3 py-2.5 rounded-lg bg-[#0d1b2e] border border-slate-600 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || !title.trim()}
        className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6"
      >
        {saving
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
          : <><Check className="w-4 h-4 mr-2" />Save Lesson</>
        }
      </Button>
    </div>
  );
}

// ── MCQ question card ──────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  onChange,
  onDelete,
}: {
  question: MCQQuestion;
  index: number;
  onChange: (updated: MCQQuestion) => void;
  onDelete: () => void;
}) {
  function setQuestionText(text: string) {
    onChange({ ...question, question: text });
  }

  function setOptionText(id: string, text: string) {
    onChange({
      ...question,
      options: question.options.map((o) => o.id === id ? { ...o, text } : o),
    });
  }

  function addOption() {
    if (question.options.length >= 6) return;
    onChange({
      ...question,
      options: [...question.options, { id: uid(), text: '' }],
    });
  }

  function removeOption(id: string) {
    if (question.options.length <= 2) return;
    onChange({
      ...question,
      options: question.options.filter((o) => o.id !== id),
      correctId: question.correctId === id ? question.options[0]?.id ?? '' : question.correctId,
    });
  }

  function setCorrect(id: string) {
    onChange({ ...question, correctId: id });
  }

  return (
    <div className="bg-[#0d1b2e] border border-slate-700 rounded-xl p-5 space-y-4">
      {/* Question header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-full bg-purple-900/60 flex items-center justify-center text-purple-300 text-xs font-bold">
            {index + 1}
          </div>
          <span className="text-xs text-slate-400 font-medium">Question</span>
        </div>
        <button
          onClick={onDelete}
          className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-md p-1.5 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <textarea
        value={question.question}
        onChange={(e) => setQuestionText(e.target.value)}
        rows={2}
        placeholder={`Question ${index + 1}: e.g. What is the primary goal of a sales discovery call?`}
        className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
      />

      {/* Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">Answer options <span className="text-slate-600">(click the circle to mark correct)</span></p>
          {question.options.length < 6 && (
            <button
              onClick={addOption}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />Add option
            </button>
          )}
        </div>

        {question.options.map((opt, oi) => (
          <div key={opt.id} className="flex items-center gap-2">
            <button
              onClick={() => setCorrect(opt.id)}
              className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                question.correctId === opt.id
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-slate-600 hover:border-slate-400'
              }`}
              title="Mark as correct answer"
            >
              {question.correctId === opt.id && <Check className="w-2.5 h-2.5 text-white" />}
            </button>
            <input
              value={opt.text}
              onChange={(e) => setOptionText(opt.id, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
              className={`flex-1 px-3 py-2 rounded-lg text-sm border text-white placeholder:text-slate-600 bg-slate-800/50 focus:outline-none focus:border-blue-500 transition-colors ${
                question.correctId === opt.id
                  ? 'border-emerald-700/50 bg-emerald-900/10'
                  : 'border-slate-700'
              }`}
            />
            <button
              onClick={() => removeOption(opt.id)}
              disabled={question.options.length <= 2}
              className="text-slate-600 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quiz editor ────────────────────────────────────────────────────────────────

function QuizEditor({
  lesson,
  onSave,
  saving,
}: {
  lesson: DBLesson;
  onSave: (updates: Partial<DBLesson>) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [questions, setQuestions] = useState<MCQQuestion[]>(() => {
    const res = lesson.resources as QuizResources | null;
    return res?.questions ?? [];
  });

  function addQuestion() {
    const newQ: MCQQuestion = {
      id: uid(),
      question: '',
      options: [
        { id: uid(), text: '' },
        { id: uid(), text: '' },
        { id: uid(), text: '' },
        { id: uid(), text: '' },
      ],
      correctId: '',
    };
    // Auto-set correct to first option
    newQ.correctId = newQ.options[0].id;
    setQuestions((prev) => [...prev, newQ]);
  }

  function updateQuestion(index: number, updated: MCQQuestion) {
    setQuestions((prev) => prev.map((q, i) => i === index ? updated : q));
  }

  function deleteQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    onSave({
      title: title.trim(),
      content: '',
      video_url: null,
      resources: {
        type: 'quiz',
        questions,
      } as QuizResources,
    });
  }

  const isValid = title.trim() && questions.length > 0
    && questions.every((q) => q.question.trim() && q.correctId && q.options.every((o) => o.text.trim()));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Quiz Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-[#0d1b2e] border-slate-600 text-white text-base font-medium focus:border-blue-500"
          placeholder="Quiz title"
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">Questions</span>
            <span className="text-xs bg-purple-900/50 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded-full">
              {questions.length}
            </span>
          </div>
          <Button
            onClick={addQuestion}
            size="sm"
            className="bg-purple-700 hover:bg-purple-600 text-white gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Question
          </Button>
        </div>

        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-700 rounded-xl gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-slate-500" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">No questions yet</p>
              <p className="text-slate-400 text-sm mt-1">Add your first question to build the quiz</p>
            </div>
            <Button
              onClick={addQuestion}
              className="bg-purple-700 hover:bg-purple-600 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Question
            </Button>
          </div>
        ) : (
          <>
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                onChange={(updated) => updateQuestion(i, updated)}
                onDelete={() => deleteQuestion(i)}
              />
            ))}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || !isValid}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
            : <><Check className="w-4 h-4 mr-2" />Save Quiz</>
          }
        </Button>
        {!isValid && questions.length > 0 && (
          <p className="text-xs text-amber-400">Fill in all questions, options, and mark the correct answer</p>
        )}
      </div>
    </div>
  );
}

// ── Sidebar lesson nav ─────────────────────────────────────────────────────────

type SidebarItem = {
  id: string;
  title: string;
  type: LessonType;
  moduleTitle: string;
  moduleId: string;
};

function SidebarNav({
  items,
  activeLessonId,
  courseId,
}: {
  items: SidebarItem[];
  activeLessonId: string;
  courseId: string;
}) {
  const router = useRouter();
  // Group by module
  const grouped: Record<string, SidebarItem[]> = {};
  const moduleOrder: string[] = [];
  for (const item of items) {
    if (!grouped[item.moduleId]) {
      grouped[item.moduleId] = [];
      moduleOrder.push(item.moduleId);
    }
    grouped[item.moduleId].push(item);
  }

  return (
    <nav className="space-y-4">
      {moduleOrder.map((mId) => {
        const lessons = grouped[mId];
        const modTitle = lessons[0]?.moduleTitle ?? 'Module';
        return (
          <div key={mId}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1.5">{modTitle}</p>
            <div className="space-y-0.5">
              {lessons.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(`/admin/courses/${courseId}/lessons/${item.id}`)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left transition-colors ${
                    item.id === activeLessonId
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-700/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {item.type === 'video'
                    ? <Video className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                    : <HelpCircle className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                  }
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// ── Main lesson editor ─────────────────────────────────────────────────────────

function LessonEditorContent({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [lesson, setLesson] = useState<DBLesson | null>(null);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, [lessonId]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [lessonData, modulesData] = await Promise.all([
        getLessonById(supabase, lessonId),
        getModulesByCourse(supabase, courseId),
      ]);

      setLesson(lessonData as DBLesson);

      // Build sidebar items
      const items: SidebarItem[] = [];
      for (const mod of (modulesData ?? []) as any[]) {
        const lessons = await getLessonsByModule(supabase, mod.id);
        for (const l of lessons as DBLesson[]) {
          items.push({
            id: l.id,
            title: l.title,
            type: getLessonType(l),
            moduleTitle: mod.title,
            moduleId: mod.id,
          });
        }
      }
      setSidebarItems(items);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(updates: Partial<DBLesson>) {
    try {
      setSaving(true);
      const updated = await updateLesson(supabase, lessonId, updates as any);
      setLesson((prev) => prev ? { ...prev, ...updated } : null);
      // Also update sidebar title
      setSidebarItems((prev) =>
        prev.map((item) =>
          item.id === lessonId
            ? { ...item, title: updated.title ?? item.title, type: getLessonType(updated as DBLesson) }
            : item
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1b2e] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-[#0d1b2e] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-300">{error ?? 'Lesson not found'}</p>
        <Link href={`/admin/courses/${courseId}`}>
          <Button variant="outline" className="border-slate-600 text-slate-300">Back to Course</Button>
        </Link>
      </div>
    );
  }

  const lessonType = getLessonType(lesson);

  return (
    <div className="min-h-screen bg-[#0d1b2e]">
      <Navbar />

      <div className="flex h-[calc(100vh-64px)]">

        {/* ── Sidebar ── */}
        <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#0a1628] overflow-y-auto">
          <div className="p-4 border-b border-slate-800">
            <Link
              href={`/admin/courses/${courseId}`}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Course
            </Link>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Course Content</p>
            <SidebarNav
              items={sidebarItems}
              activeLessonId={lessonId}
              courseId={courseId}
            />
          </div>
        </aside>

        {/* ── Main editor ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                lessonType === 'video' ? 'bg-blue-900/60' : 'bg-purple-900/60'
              }`}>
                {lessonType === 'video'
                  ? <Video className="w-5 h-5 text-blue-400" />
                  : <HelpCircle className="w-5 h-5 text-purple-400" />
                }
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-semibold text-lg">{lesson.title}</h1>
                  {saved && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />Saved
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">
                  {lessonType === 'video' ? 'Video Lecture' : 'Multiple Choice Quiz'}
                </p>
              </div>
            </div>

            {/* Editor panel */}
            <div className="bg-[#0f2744] border border-slate-700 rounded-xl p-6">
              {lessonType === 'video' ? (
                <VideoEditor lesson={lesson} onSave={handleSave} saving={saving} supabase={supabase} lessonId={lessonId} />
              ) : (
                <QuizEditor lesson={lesson} onSave={handleSave} saving={saving} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function LessonEditorPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  return (
    <ProtectedRoute requiredRoles={['course_admin']}>
      <LessonEditorContent courseId={courseId} lessonId={lessonId} />
    </ProtectedRoute>
  );
}
