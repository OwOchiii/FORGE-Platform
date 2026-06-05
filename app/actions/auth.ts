'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function confirmUserEmail(email: string) {
  // After regular client-side signup, auto-confirm the email via admin API
  // This bypasses email verification requirement for MVP without touching dashboard
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // List users to find the one we just created
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;

    const user = users.users.find(u => u.email === email);
    if (!user) throw new Error('User not found');

    // Auto-confirm their email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) throw updateError;

    return { success: true, userId: user.id };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Email confirmation failed');
  }
}
