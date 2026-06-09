import { ProtectedRoute } from '@/components/ProtectedRoute';
import { createClient } from '@/lib/supabase/server';
import { getLessonById, getCourseById, getModulesByCourse, getLessonsByModule } from '@/lib/supabase/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import LessonContent from '@/components/lesson/LessonContent';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const { courseId, moduleId, lessonId } = await params;
  const supabase = await createClient();

  try {
    // Fetch all required data in parallel
    const [lesson, course, modules, lessons] = await Promise.all([
      getLessonById(supabase, lessonId).catch(() => null),
      getCourseById(supabase, courseId).catch(() => null),
      getModulesByCourse(supabase, courseId).catch(() => []),
      getLessonsByModule(supabase, moduleId).catch(() => []),
    ]);

    const module = modules?.find((m: any) => m.id === moduleId);

    if (!lesson || !course || !module) {
      return (
        <ProtectedRoute>
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">Lesson Not Found</h1>
              <p className="text-muted-foreground mb-4">
                courseId: {courseId}, moduleId: {moduleId}, lessonId: {lessonId}
              </p>
              <Link href="/courses">
                <Button>Back to Courses</Button>
              </Link>
            </div>
          </div>
        </ProtectedRoute>
      );
    }

    return (
      <ProtectedRoute>
        <LessonContent
          lesson={lesson}
          course={course}
          module={module}
          lessons={lessons || []}
        />
      </ProtectedRoute>
    );
  } catch (error) {
    console.error('Error loading lesson:', error);
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Lesson</h1>
            <p className="text-muted-foreground mb-4">Unable to fetch lesson details.</p>
            <Link href="/courses">
              <Button>Back to Courses</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
}
