'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function adminSignup(
  email: string,
  name: string,
  password: string
) {
  // Create admin client with service role key for server-side operations
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Use Admin API to create user with email already confirmed
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for MVP (bypasses email verification)
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
