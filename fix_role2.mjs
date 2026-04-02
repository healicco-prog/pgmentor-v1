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
    .update({ role: 'user' })
    .eq('id', authUser.id);
    
  if (usersErr) {
    console.error("users table error:", usersErr);
  } else {
    console.log("users table updated: role='user'");
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
