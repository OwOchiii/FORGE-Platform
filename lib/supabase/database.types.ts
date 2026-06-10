// Supabase Database Types for FORGE Training Platform
// These types match the database schema created in Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'trainee' | 'course_admin' | 'platform_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'trainee' | 'course_admin' | 'platform_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'trainee' | 'course_admin' | 'platform_admin'
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          creator_id: string
          status: 'draft' | 'published' | 'archived'
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          creator_id: string
          status?: 'draft' | 'published' | 'archived'
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          creator_id?: string
          status?: 'draft' | 'published' | 'archived'
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          order?: number
          created_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          content: string | null
          video_url: string | null
          video_storage_path: string | null
          resources: Json
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          content?: string | null
          video_url?: string | null
          video_storage_path?: string | null
          resources?: Json
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          content?: string | null
          video_url?: string | null
          video_storage_path?: string | null
          resources?: Json
          order?: number
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrollment_date: string
          progress_percentage: number
          status: 'in_progress' | 'completed' | 'failed'
          last_accessed: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          enrollment_date?: string
          progress_percentage?: number
          status?: 'in_progress' | 'completed' | 'failed'
          last_accessed?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrollment_date?: string
          progress_percentage?: number
          status?: 'in_progress' | 'completed' | 'failed'
          last_accessed?: string
        }
      }
      lesson_completions: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          completed_at: string
          time_spent_minutes: number
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          completed_at?: string
          time_spent_minutes?: number
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          completed_at?: string
          time_spent_minutes?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easy access
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type Module = Database['public']['Tables']['modules']['Row']
export type Lesson = Database['public']['Tables']['lessons']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type LessonCompletion = Database['public']['Tables']['lesson_completions']['Row']
