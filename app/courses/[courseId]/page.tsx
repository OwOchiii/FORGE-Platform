import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { mockCourses, mockModules, mockLessons } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { ChevronDown, ChevronUp, BookOpen, CheckCircle2 } from 'lucide-react';
import CourseDetailContent from '@/components/course/CourseDetailContent';

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = mockCourses.find((c) => c.id === courseId);
  const modules = mockModules[courseId] || [];

  if (!course) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
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
}
