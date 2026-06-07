#!/usr/bin/env node

/**
 * Seed script to create a platform admin account
 * Usage: node scripts/seed-admin.js
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  try {
    console.log("Creating platform admin account...");

    // Create the auth user with admin API
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: "admin@forge.com",
      password: "AdminPass123!",
      email_confirm: true,
      user_metadata: {
        name: "Platform Admin",
        role: "platform_admin",
      },
    });

    if (createError) {
      throw new Error(`Failed to create auth user: ${createError.message}`);
    }

    console.log(`✓ Created auth user: ${data.user.id}`);

    // Update the profile with platform_admin role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "platform_admin" })
      .eq("id", data.user.id);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    console.log("✓ Updated profile with platform_admin role");

    console.log("\n✅ Platform admin account created successfully!");
    console.log("\nAdmin Credentials:");
    console.log("  Email: admin@forge.com");
    console.log("  Password: AdminPass123!");
    console.log("\nℹ️  Please change the password after first login.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedAdmin();
