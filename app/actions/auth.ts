'use server';

import { createClient } from '@/lib/supabase/server';

export async function adminSignup(
  email: string,
  name: string,
  password: string
) {
  const supabase = await createClient();
  const adminAuthClient = supabase.auth.admin;

  try {
    // Use Admin API to create user with email already confirmed
    const { data, error } = await adminAuthClient.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for MVP
      user_metadata: {
        name,
        role: 'trainee',
      },
    });

    if (error) throw error;

    // The profile will be auto-created by the database trigger
    // when the user is inserted into auth.users
    return { success: true, user: data.user };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Signup failed');
  }
}
