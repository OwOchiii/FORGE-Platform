/**
 * Supabase Data Access Layer for FORGE Training Platform
 * 
 * This module provides all the read/write operations for the app's data.
 * Import from '@/lib/supabase/client' for client-side or '@/lib/supabase/server' for server-side.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Profile, Course, Module, Lesson, UserProgress, LessonCompletion } from './database.types'

// ============================================
// PROFILES
// ============================================

export async function getProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function updateProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateUserRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  newRole: string
) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getAllProfiles(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getPlatformStats(supabase: SupabaseClient<Database>) {
  // Get total users
  const { count: totalUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  // Get admin count
  const { data: admins, error: adminsError } = await supabase
    .from('profiles')
    .select('id')
    .or("role.eq.platform_admin,role.eq.course_admin")

  // Get total enrollments
  const { count: totalEnrollments, error: enrollError } = await supabase
    .from('user_progress')
    .select('id', { count: 'exact', head: true })

  // Get completed courses
  const { count: completedCourses, error: completeError } = await supabase
    .from('user_progress')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completed')

  return {
    totalUsers: totalUsers || 0,
    totalAdmins: admins?.length || 0,
    totalEnrollments: totalEnrollments || 0,
    completedCourses: completedCourses || 0,
  }
}

// ============================================
// COURSES
// ============================================

export async function getCourses(supabase: SupabaseClient<Database>, options?: {
  status?: 'draft' | 'published' | 'archived'
  category?: string
  creatorId?: string
}) {
  let query = supabase.from('courses').select('*')
  
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.category) {
    query = query.eq('category', options.category)
  }
  if (options?.creatorId) {
    query = query.eq('creator_id', options.creatorId)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getCourseById(supabase: SupabaseClient<Database>, courseId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()
  
  if (error) throw error
  return data
}

export async function getCourseWithModulesAndLessons(supabase: SupabaseClient<Database>, courseId: string) {
  // Get course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()
  
  if (courseError) throw courseError
  
  // Get modules with lessons
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('order', { ascending: true })
  
  if (modulesError) throw modulesError
  
  return { course, modules }
}

export async function createCourse(
  supabase: SupabaseClient<Database>,
  course: Database['public']['Tables']['courses']['Insert']
) {
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateCourse(
  supabase: SupabaseClient<Database>,
  courseId: string,
  updates: Database['public']['Tables']['courses']['Update']
) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteCourse(supabase: SupabaseClient<Database>, courseId: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)
  
  if (error) throw error
}

// ============================================
// MODULES
// ============================================

export async function getModulesByCourse(supabase: SupabaseClient<Database>, courseId: string) {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true })
  
  if (error) throw error
  return data
}

export async function createModule(
  supabase: SupabaseClient<Database>,
  module: Database['public']['Tables']['modules']['Insert']
) {
  const { data, error } = await supabase
    .from('modules')
    .insert(module)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateModule(
  supabase: SupabaseClient<Database>,
  moduleId: string,
  updates: Database['public']['Tables']['modules']['Update']
) {
  const { data, error } = await supabase
    .from('modules')
    .update(updates)
    .eq('id', moduleId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteModule(supabase: SupabaseClient<Database>, moduleId: string) {
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduleId)
  
  if (error) throw error
}

// ============================================
// LESSONS
// ============================================

export async function getLessonsByModule(supabase: SupabaseClient<Database>, moduleId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order', { ascending: true })
  
  if (error) throw error
  return data
}

export async function getLessonById(supabase: SupabaseClient<Database>, lessonId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()
  
  if (error) throw error
  return data
}

export async function createLesson(
  supabase: SupabaseClient<Database>,
  lesson: Database['public']['Tables']['lessons']['Insert']
) {
  const { data, error } = await supabase
    .from('lessons')
    .insert(lesson)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateLesson(
  supabase: SupabaseClient<Database>,
  lessonId: string,
  updates: Database['public']['Tables']['lessons']['Update']
) {
  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', lessonId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteLesson(supabase: SupabaseClient<Database>, lessonId: string) {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)
  
  if (error) throw error
}

// ============================================
// USER PROGRESS
// ============================================

export async function getUserProgress(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*, courses(*)')
    .eq('user_id', userId)
    .order('last_accessed', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getCourseProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

export async function enrollInCourse(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
) {
  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: userId,
      course_id: courseId,
      progress_percentage: 0,
      status: 'in_progress'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateCourseProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string,
  updates: Partial<Pick<UserProgress, 'progress_percentage' | 'status' | 'last_accessed'>>
) {
  const { data, error } = await supabase
    .from('user_progress')
    .update({
      ...updates,
      last_accessed: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ============================================
// LESSON COMPLETIONS
// ============================================

export async function getLessonCompletions(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId?: string
) {
  let query = supabase
    .from('lesson_completions')
    .select('*, lessons!inner(*, modules!inner(course_id))')
    .eq('user_id', userId)
  
  // Note: filtering by course requires a join through modules
  // The RLS will handle visibility
  
  const { data, error } = await query.order('completed_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function markLessonComplete(
  supabase: SupabaseClient<Database>,
  userId: string,
  lessonId: string,
  timeSpentMinutes: number = 0
) {
  const { data, error } = await supabase
    .from('lesson_completions')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      time_spent_minutes: timeSpentMinutes,
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,lesson_id'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function isLessonCompleted(
  supabase: SupabaseClient<Database>,
  userId: string,
  lessonId: string
) {
  const { data, error } = await supabase
    .from('lesson_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return !!data
}

// ============================================
// UTILITY: Transform DB types to App types
// ============================================

import type { 
  User, 
  Course as AppCourse, 
  Module as AppModule, 
  Lesson as AppLesson,
  UserProgress as AppUserProgress,
  LessonCompletion as AppLessonCompletion
} from '@/lib/types'

export function dbProfileToUser(profile: Profile): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at)
  }
}

export function dbCourseToAppCourse(course: Course): AppCourse {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    creatorId: course.creator_id,
    status: course.status,
    imageUrl: course.image_url ?? undefined,
    createdAt: new Date(course.created_at),
    updatedAt: new Date(course.updated_at)
  }
}

export function dbModuleToAppModule(module: Module): AppModule {
  return {
    id: module.id,
    courseId: module.course_id,
    title: module.title,
    description: module.description ?? '',
    order: module.order,
    createdAt: new Date(module.created_at)
  }
}

export function dbLessonToAppLesson(lesson: Lesson): AppLesson {
  return {
    id: lesson.id,
    moduleId: lesson.module_id,
    title: lesson.title,
    content: lesson.content ?? '',
    videoUrl: lesson.video_url ?? undefined,
    resources: lesson.resources as Record<string, string>[] | undefined,
    order: lesson.order,
    createdAt: new Date(lesson.created_at)
  }
}

export function dbProgressToAppProgress(progress: UserProgress): AppUserProgress {
  return {
    id: progress.id,
    userId: progress.user_id,
    courseId: progress.course_id,
    enrollmentDate: new Date(progress.enrollment_date),
    progressPercentage: progress.progress_percentage,
    status: progress.status,
    lastAccessed: new Date(progress.last_accessed)
  }
}

export function dbCompletionToAppCompletion(completion: LessonCompletion): AppLessonCompletion {
  return {
    id: completion.id,
    userId: completion.user_id,
    lessonId: completion.lesson_id,
    completedAt: new Date(completion.completed_at),
    timeSpentMinutes: completion.time_spent_minutes
  }
}
