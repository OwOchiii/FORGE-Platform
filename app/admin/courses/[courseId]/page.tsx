'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import {
  getCourseById, updateCourse,
  getModulesByCourse, createModule, updateModule, deleteModule,
  getLessonsByModule, createLesson, deleteLesson,
} from '@/lib/supabase/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Plus, Video, HelpCircle, GripVertical,
  Pencil, Trash2, Loader2, AlertCircle, Check, ChevronDown,
  ChevronRight, BookOpen, Globe, FileText, X,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type LessonType = 'video' | 'quiz';

type DBLesson = {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
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
  status: 'draft' | 'published' | 'archived';
  creator_id: string;
};

function lessonTypeFromDB(lesson: DBLesson): LessonType {
  return (lesson.resources as any)?.type === 'quiz' ? 'quiz' : 'video';
}

// ── Module item ────────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: DBLesson;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const type = lessonTypeFromDB(lesson);
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 group hover:bg-slate-800/70 transition-colors">
      <GripVertical className="w-3.5 h-3.5 text-slate-600 shrink-0 cursor-grab" />
      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
        type === 'video' ? 'bg-blue-900/60' : 'bg-purple-900/60'
      }`}>
        {type === 'video'
          ? <Video className="w-3.5 h-3.5 text-blue-400" />
          : <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
        }
      </div>
      <span className="text-slate-200 text-sm flex-1 truncate">{lesson.title}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Module accordion ───────────────────────────────────────────────────────────

function ModuleSection({
  mod,
  lessons,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onDeleteModule,
  onRenameModule,
}: {
  mod: DBModule;
  lessons: DBLesson[];
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (lesson: DBLesson) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onRenameModule: (moduleId: string, title: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(mod.title);

  function commitRename() {
    if (titleValue.trim() && titleValue !== mod.title) {
      onRenameModule(mod.id, titleValue.trim());
    }
    setEditingTitle(false);
  }

  return (
    <div className="border border-slate-700/60 rounded-xl overflow-hidden">
      {/* Module header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/60 border-b border-slate-700/40">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {open
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
          }
        </button>

        {editingTitle ? (
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingTitle(false); }}
            className="flex-1 bg-transparent border-b border-blue-500 text-white text-sm font-medium outline-none py-0.5"
          />
        ) : (
          <span
            className="flex-1 text-white text-sm font-medium cursor-pointer hover:text-blue-300 transition-colors"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {mod.title}
          </span>
        )}

        <span className="text-xs text-slate-500">{lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}</span>

        <button
          onClick={() => setEditingTitle(true)}
          className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700 transition"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDeleteModule(mod.id)}
          className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Lessons */}
      {open && (
        <div className="px-4 py-3 space-y-2 bg-slate-900/30">
          {lessons.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-3">No lessons yet — add one below</p>
          )}
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              onEdit={() => onEditLesson(lesson)}
              onDelete={() => onDeleteLesson(mod.id, lesson.id)}
            />
          ))}
          <button
            onClick={() => onAddLesson(mod.id)}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-900/10 transition-colors text-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add lesson
          </button>
        </div>
      )}
    </div>
  );
}

// ── Add Lesson modal ───────────────────────────────────────────────────────────

function AddLessonModal({
  moduleId,
  onClose,
  onCreated,
}: {
  moduleId: string;
  onClose: () => void;
  onCreated: (lesson: DBLesson) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [type, setType] = useState<LessonType>('video');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collect the next order from parent — simpler to just do count+1 in DB
  async function handleCreate() {
    if (!title.trim()) { setError('Title is required'); return; }
    try {
      setSaving(true);
      setError(null);
      const { data: siblings } = await supabase
        .from('lessons')
        .select('order')
        .eq('module_id', moduleId)
        .order('order', { ascending: false })
        .limit(1);
      const nextOrder = siblings && siblings.length > 0 ? (siblings[0].order + 1) : 1;

      const created = await createLesson(supabase, {
        module_id: moduleId,
        title: title.trim(),
        content: '',
        video_url: null,
        resources: { type },
        order: nextOrder,
      });
      onCreated(created as DBLesson);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create lesson');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2744] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">Add Lesson</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Type picker */}
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">Lesson type</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'video' as LessonType, label: 'Video Lecture', icon: Video, color: 'blue' },
                { id: 'quiz' as LessonType, label: 'Multiple Choice', icon: HelpCircle, color: 'purple' },
              ] as const).map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setType(id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    type === id
                      ? color === 'blue'
                        ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                        : 'border-purple-500 bg-purple-900/30 text-purple-300'
                      : 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'video' ? 'e.g. Introduction to Sales' : 'e.g. Module 1 Quiz'}
              className="bg-[#0d1b2e] border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <Button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Lesson'}
          </Button>
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main course editor ─────────────────────────────────────────────────────────

function CourseEditorContent({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [course, setCourse] = useState<DBCourse | null>(null);
  const [modules, setModules] = useState<DBModule[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, DBLesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Course meta editing
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ title: '', description: '', category: '' });
  const [savingMeta, setSavingMeta] = useState(false);

  // Module creation
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [creatingModule, setCreatingModule] = useState(false);

  // Lesson modal
  const [addLessonModuleId, setAddLessonModuleId] = useState<string | null>(null);

  // Status change
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    loadAll();
  }, [courseId]);

  async function loadAll() {
    try {
      setLoading(true);
      setError(null);
      const [courseData, modulesData] = await Promise.all([
        getCourseById(supabase, courseId),
        getModulesByCourse(supabase, courseId),
      ]);
      setCourse(courseData as DBCourse);
      setMetaForm({
        title: courseData.title,
        description: courseData.description ?? '',
        category: courseData.category ?? '',
      });
      setModules((modulesData as DBModule[]) ?? []);

      // Load lessons per module
      const lessonMap: Record<string, DBLesson[]> = {};
      await Promise.all(
        (modulesData ?? []).map(async (mod: any) => {
          const lessons = await getLessonsByModule(supabase, mod.id);
          lessonMap[mod.id] = (lessons as DBLesson[]) ?? [];
        })
      );
      setLessonsByModule(lessonMap);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }

  async function saveMeta() {
    if (!metaForm.title.trim()) return;
    try {
      setSavingMeta(true);
      const updated = await updateCourse(supabase, courseId, {
        title: metaForm.title.trim(),
        description: metaForm.description.trim(),
        category: metaForm.category.trim() || 'General',
      });
      setCourse((prev) => prev ? { ...prev, ...updated } : null);
      setEditingMeta(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleAddModule() {
    if (!newModuleTitle.trim()) return;
    try {
      setCreatingModule(true);
      const nextOrder = modules.length + 1;
      const created = await createModule(supabase, {
        course_id: courseId,
        title: newModuleTitle.trim(),
        description: '',
        order: nextOrder,
      });
      setModules((prev) => [...prev, created as DBModule]);
      setLessonsByModule((prev) => ({ ...prev, [created.id]: [] }));
      setNewModuleTitle('');
      setAddingModule(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingModule(false);
    }
  }

  async function handleRenameModule(moduleId: string, title: string) {
    await updateModule(supabase, moduleId, { title });
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, title } : m));
  }

  async function handleDeleteModule(moduleId: string) {
    await deleteModule(supabase, moduleId);
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
    setLessonsByModule((prev) => { const n = { ...prev }; delete n[moduleId]; return n; });
  }

  async function handleDeleteLesson(moduleId: string, lessonId: string) {
    await deleteLesson(supabase, lessonId);
    setLessonsByModule((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] ?? []).filter((l) => l.id !== lessonId),
    }));
  }

  function handleLessonCreated(lesson: DBLesson) {
    setLessonsByModule((prev) => ({
      ...prev,
      [lesson.module_id]: [...(prev[lesson.module_id] ?? []), lesson],
    }));
    setAddLessonModuleId(null);
    // Navigate to the lesson editor
    router.push(`/admin/courses/${courseId}/lessons/${lesson.id}`);
  }

  async function handleTogglePublish() {
    if (!course) return;
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      setSavingStatus(true);
      await updateCourse(supabase, courseId, { status: newStatus });
      setCourse((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1b2e] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#0d1b2e] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-300">{error ?? 'Course not found'}</p>
        <Link href="/admin/courses">
          <Button variant="outline" className="border-slate-600 text-slate-300">Back to courses</Button>
        </Link>
      </div>
    );
  }

  const totalLessons = Object.values(lessonsByModule).reduce((sum, ls) => sum + ls.length, 0);
  const videoCount = Object.values(lessonsByModule).flat().filter((l) => lessonTypeFromDB(l) === 'video').length;
  const quizCount = Object.values(lessonsByModule).flat().filter((l) => lessonTypeFromDB(l) === 'quiz').length;

  return (
    <div className="min-h-screen bg-[#0d1b2e]">
      <Navbar />

      {addLessonModuleId && (
        <AddLessonModal
          moduleId={addLessonModuleId}
          onClose={() => setAddLessonModuleId(null)}
          onCreated={handleLessonCreated}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/admin/courses" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            My Courses
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-300 truncate max-w-xs">{course.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column: meta + stats ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Course info card */}
            <div className="bg-[#0f2744] border border-slate-700 rounded-xl p-5">
              {!editingMeta ? (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <button
                      onClick={() => setEditingMeta(true)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <h2 className="text-white font-semibold text-lg leading-snug mb-1">{course.title}</h2>
                  {course.description && (
                    <p className="text-slate-400 text-sm leading-relaxed mb-3">{course.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                      {course.category || 'General'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      course.status === 'published'
                        ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/50'
                        : 'bg-amber-900/50 text-amber-400 border border-amber-800/50'
                    }`}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-white font-medium text-sm mb-2">Edit course details</h3>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Title</label>
                    <Input
                      value={metaForm.title}
                      onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })}
                      className="bg-[#0d1b2e] border-slate-600 text-white text-sm focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Category</label>
                    <Input
                      value={metaForm.category}
                      onChange={(e) => setMetaForm({ ...metaForm, category: e.target.value })}
                      className="bg-[#0d1b2e] border-slate-600 text-white text-sm focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Description</label>
                    <textarea
                      value={metaForm.description}
                      onChange={(e) => setMetaForm({ ...metaForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md bg-[#0d1b2e] border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveMeta} disabled={savingMeta} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white flex-1">
                      {savingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" />Save</>}
                    </Button>
                    <Button onClick={() => setEditingMeta(false)} size="sm" variant="outline" className="border-slate-600 text-slate-300">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-[#0f2744] border border-slate-700 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Content Summary</h3>
              {[
                { label: 'Modules', value: modules.length, icon: FileText, color: 'text-slate-300' },
                { label: 'Total Lessons', value: totalLessons, icon: BookOpen, color: 'text-blue-400' },
                { label: 'Video Lectures', value: videoCount, icon: Video, color: 'text-blue-400' },
                { label: 'Quizzes', value: quizCount, icon: HelpCircle, color: 'text-purple-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Icon className={`w-4 h-4 ${color}`} />
                    {label}
                  </div>
                  <span className="text-white font-semibold text-sm">{value}</span>
                </div>
              ))}
            </div>

            {/* Publish toggle */}
            <Button
              onClick={handleTogglePublish}
              disabled={savingStatus}
              className={`w-full font-medium ${
                course.status === 'published'
                  ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
            >
              {savingStatus
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : course.status === 'published'
                  ? <><X className="w-4 h-4 mr-2" />Unpublish Course</>
                  : <><Globe className="w-4 h-4 mr-2" />Publish Course</>
              }
            </Button>
          </div>

          {/* ── Right column: curriculum builder ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Curriculum</h2>
              <Button
                onClick={() => setAddingModule(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Module
              </Button>
            </div>

            {/* Add module inline */}
            {addingModule && (
              <div className="flex gap-2 items-center bg-[#0f2744] border border-blue-600/50 rounded-xl px-4 py-3">
                <Input
                  autoFocus
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Module title (e.g. Introduction)"
                  className="flex-1 bg-[#0d1b2e] border-slate-600 text-white text-sm focus:border-blue-500"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddModule(); if (e.key === 'Escape') setAddingModule(false); }}
                />
                <Button
                  onClick={handleAddModule}
                  disabled={creatingModule}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                >
                  {creatingModule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
                </Button>
                <Button
                  onClick={() => { setAddingModule(false); setNewModuleTitle(''); }}
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-white shrink-0 px-2"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {modules.length === 0 && !addingModule ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-700 rounded-xl gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-slate-500" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">No modules yet</p>
                  <p className="text-slate-400 text-sm mt-1">Add a module to start building your curriculum</p>
                </div>
                <Button
                  onClick={() => setAddingModule(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Module
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((mod) => (
                  <ModuleSection
                    key={mod.id}
                    mod={mod}
                    lessons={lessonsByModule[mod.id] ?? []}
                    onAddLesson={setAddLessonModuleId}
                    onEditLesson={(lesson) => router.push(`/admin/courses/${courseId}/lessons/${lesson.id}`)}
                    onDeleteLesson={handleDeleteLesson}
                    onDeleteModule={handleDeleteModule}
                    onRenameModule={handleRenameModule}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CourseEditorPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  return (
    <ProtectedRoute requiredRoles={['course_admin']}>
      <CourseEditorContent courseId={courseId} />
    </ProtectedRoute>
  );
}
