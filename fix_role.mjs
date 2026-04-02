import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixRole() {
  const email = 'narayanakdr@yahoo.co.in';

  // 1. Get the user from auth.users
  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUser = authData.users.find(u => u.email === email);
  if (!authUser) {
    console.log("Auth user not found.");
    return;
  }

  console.log(`Working on user: ${authUser.id}`);

  // 2. Set role to 'user' in users table
  const { error: usersErr } = await supabase
    .from('users')
    .upsert({ id: authUser.id, email: email, role: 'user', subscription_plan: 'Free Subscription' }, { onConflict: 'id' });
    
  if (usersErr) {
    console.error("users table error:", usersErr);
  } else {
    console.log("users table updated: role='user'");
  }

  // 3. Set role to 'user' in user_profiles table (if it has a role column)
  const { error: profileErr } = await supabase
    .from('user_profiles')
    .update({ role: 'user' })
    .eq('user_id', authUser.id);
    
  if (profileErr && !profileErr.message.includes('column "role" of relation "user_profiles" does not exist')) {
    console.error("user_profiles error:", profileErr);
  } else {
    console.log("user_profiles table updated: role='user' (if existed)");
  }

  // 4. Ensure subscription is 'free'
  const { error: subErr } = await supabase
    .from('subscriptions')
    .update({ plan_id: 'free' })
    .eq('user_id', authUser.id);

  if (subErr) {
     console.error("subscriptions error:", subErr);
  } else {
     console.log("subscriptions table updated: plan_id='free'");
  }
}

fixRole();
