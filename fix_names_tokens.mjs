import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const users = [
  { email: 'drnarayanak@gmail.com', full_name: 'Dr. Narayana K', role: 'super_admin' },
  { email: 'aimsrcpharmac@gmail.com', full_name: 'AIMS RC Pharma', role: 'admin' },
  { email: 'narayanakdr@yahoo.co.in', full_name: 'Narayana K', role: 'user' },
  { email: 'bjpdoddaballapura@gmail.com', full_name: 'BJP Doddaballapura', role: 'user' }
];

async function fixAll() {
  const { data: authData } = await supabase.auth.admin.listUsers();

  for (const u of users) {
    const authUser = authData.users.find(a => a.email === u.email);
    if (!authUser) { console.log(`User ${u.email} not found`); continue; }

    // 1. Fix auth user_metadata to show correct name
    const { error: metaErr } = await supabase.auth.admin.updateUserById(authUser.id, {
      user_metadata: { full_name: u.full_name, name: u.full_name }
    });
    console.log(`Auth metadata for ${u.email}: ${metaErr ? 'FAILED - ' + metaErr.message : 'OK → ' + u.full_name}`);

    // 2. Fix users table role
    const { error: roleErr } = await supabase
      .from('users')
      .update({ role: u.role, full_name: u.full_name })
      .eq('id', authUser.id);
    console.log(`Users table for ${u.email}: ${roleErr ? 'FAILED - ' + roleErr.message : 'OK → role=' + u.role}`);

    // 3. Fix user_profiles full_name
    const { error: profErr } = await supabase
      .from('user_profiles')
      .update({ full_name: u.full_name })
      .eq('user_id', authUser.id);
    console.log(`Profile for ${u.email}: ${profErr ? 'FAILED - ' + profErr.message : 'OK → ' + u.full_name}`);
  }

  // 4. Add 'free' plan to plans table if not exists
  const { error: planErr } = await supabase.from('plans').upsert({
    id: 'free',
    name: 'Free',
    price_monthly: 0,
    description: 'Basic access with limited tokens',
    is_trial: false,
    trial_days: 0,
    is_active: true
  }, { onConflict: 'id' });
  console.log(`Plans table 'free' entry: ${planErr ? 'FAILED - ' + planErr.message : 'OK'}`);

  // 5. Add token policy for 'free' plan
  const { error: policyErr } = await supabase.from('token_policies').upsert({
    plan_id: 'free',
    monthly_tokens: 500,
    trial_tokens: 0,
    reset_monthly: true,
    hard_stop_on_exhaustion: false,
    alert_at_70: true,
    alert_at_90: true
  }, { onConflict: 'plan_id' });
  console.log(`Token policy for 'free' plan: ${policyErr ? 'FAILED - ' + policyErr.message : 'OK → 500 tokens/month'}`);

  console.log('\n✅ All fixes applied!');
}

fixAll();
