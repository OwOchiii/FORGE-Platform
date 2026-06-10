// Storage helpers for FORGE video assets
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/**
 * Get public URL for a video in Supabase Storage (client-side)
 * @param supabase - Supabase client
 * @param storagePath - Path to the file in storage
 * @returns Public URL
 */
export function getVideoPublicUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string
): string {
  const { data } = supabase.storage.from('videos').getPublicUrl(storagePath);
  return data?.publicUrl || '';
}

/**
 * Upload a video file to Supabase Storage
 * @param supabase - Supabase client
 * @param file - File object to upload
 * @param lessonId - Lesson ID for organizing storage path
 * @returns Storage path if successful, null otherwise
 */
export async function uploadVideoToStorage(
  supabase: SupabaseClient<Database>,
  file: File,
  lessonId: string
): Promise<string | null> {
  try {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      throw new Error('File must be a video file');
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 500MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${lessonId}-${timestamp}.${fileExt}`;
    const storagePath = `videos/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    return data?.path || null;
  } catch (error) {
    console.error('Error uploading video:', error);
    return null;
  }
}

/**
 * Delete a video from Supabase Storage
 * @param supabase - Supabase client
 * @param storagePath - Path to the file in storage
 */
export async function deleteVideoFromStorage(
  supabase: SupabaseClient<Database>,
  storagePath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from('videos').remove([storagePath]);
    if (error) {
      console.error('Error deleting video:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
}
