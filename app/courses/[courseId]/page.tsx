import { ProtectedRoute } from '@/components/ProtectedRoute';
import { createClient } from '@/lib/supabase/server';
import { getCourseWithModulesAndLessons } from '@/lib/supabase/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CourseDetailContent from '@/components/course/CourseDetailContent';

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();

  try {
    const { course, modules } = await getCourseWithModulesAndLessons(supabase, courseId);

    if (!course) {
      return (
        <ProtectedRoute>
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">Course Not Found</h1>
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
        <CourseDetailContent course={course} modules={modules} courseId={courseId} />
      </ProtectedRoute>
    );
  } catch (error) {
    console.error('Error loading course:', error);
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Course</h1>
            <p className="text-muted-foreground mb-4">Unable to fetch course details.</p>
            <Link href="/courses">
              <Button>Back to Courses</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
}
