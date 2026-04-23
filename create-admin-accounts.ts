/**
 * PGMentor — Create Admin Accounts in Supabase
 * ─────────────────────────────────────────────
 * Run ONCE with:   npx tsx create-admin-accounts.ts
 *
 * This script creates the Control Panel admin accounts in Supabase Auth
 * so that logging in to the admin panel works correctly.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey);

// These must match CP_CREDENTIALS in src/App.tsx exactly
const ADMIN_ACCOUNTS = [
  { email: 'drnarayanak@gmail.com',  password: 'Tata@#viDhya#2026',           role: 'Super Admin' },
  { email: 'aimsrcpharmac@gmail.com', password: 'DeVanaHalli-#@Pradeep#2026',  role: 'Admin' },
];

async function createOrUpdateUser(email: string, password: string, role: string) {
  console.log(`\n▶  Processing ${role}: ${email}`);

  // 1. Check if user already exists
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) { console.error('  ❌  Could not list users:', listErr.message); return; }

  const existing = listData?.users?.find(u => u.email === email);

  if (existing) {
    // 2a. User exists — update password and confirm email
    const { error: updateErr } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (updateErr) {
      console.error(`  ❌  Failed to update ${email}:`, updateErr.message);
    } else {
      console.log(`  ✅  Updated password & confirmed email for ${email} (id: ${existing.id})`);
    }
  } else {
    // 2b. Create new user
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: role, role: 'admin' },
    });
    if (createErr) {
      console.error(`  ❌  Failed to create ${email}:`, createErr.message);
    } else {
      console.log(`  ✅  Created ${email} (id: ${newUser?.user?.id})`);
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  PGMentor — Admin Account Setup');
  console.log(`  Supabase: ${supabaseUrl}`);
  console.log('═══════════════════════════════════════════════════');

  for (const acc of ADMIN_ACCOUNTS) {
    await createOrUpdateUser(acc.email, acc.password, acc.role);
  }

  // Verify
  console.log('\n─── Verification ───────────────────────────────────');
  const { data: listData } = await admin.auth.admin.listUsers();
  const adminEmails = ADMIN_ACCOUNTS.map(a => a.email);
  const found = (listData?.users || []).filter(u => adminEmails.includes(u.email!));
  if (found.length === ADMIN_ACCOUNTS.length) {
    console.log(`✅  All ${found.length} admin accounts exist in Supabase Auth.`);
    found.forEach(u => console.log(`   • ${u.email} — confirmed: ${!!u.email_confirmed_at}`));
  } else {
    console.warn(`⚠️   Only ${found.length}/${ADMIN_ACCOUNTS.length} accounts found.`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Done. You can now log in to the Control Panel.');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
