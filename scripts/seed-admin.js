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
  const adminEmail = "admin@forge.com";
  const adminPassword = "AdminPass123!";

  try {
    console.log("Setting up platform admin account...");

    // First, list all users to check if admin exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const existingAdmin = users.users.find((u) => u.email === adminEmail);
    let userId;

    if (existingAdmin) {
      console.log("✓ Admin user already exists, resetting password...");
      userId = existingAdmin.id;

      // Update the password for existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: adminPassword,
        email_confirm: true,
      });

      if (updateError) {
        throw new Error(`Failed to update password: ${updateError.message}`);
      }
      console.log("✓ Password reset successfully");
    } else {
      // Create new auth user
      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: "Platform Admin",
          role: "platform_admin",
        },
      });

      if (createError) {
        throw new Error(`Failed to create auth user: ${createError.message}`);
      }

      userId = data.user.id;
      console.log(`✓ Created auth user: ${userId}`);
    }

    // Update the profile with platform_admin role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "platform_admin" })
      .eq("id", userId);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    console.log("✓ Updated profile with platform_admin role");

    console.log("\n✅ Platform admin account is ready!");
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
