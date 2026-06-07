'use server';

import { createClient } from '@/lib/supabase/server';

export async function testSignupAction(email: string, password: string, name: string) {
  const supabase = await createClient();

  // Test the signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'trainee',
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      user_id: data.user?.id,
      email: data.user?.email,
      confirm_required: !data.user?.email_confirmed_at,
    },
  };
}
