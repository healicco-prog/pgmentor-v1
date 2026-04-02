import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixPerms() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'drnarayanak@gmail.com');
  
  if (user) {
    // 1. Verify email in user_profiles
    await supabase.from('user_profiles').update({ email_verified: true }).eq('user_id', user.id);
    
    // 2. Give premium subscription
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan_id: 'premium',
      status: 'active',
      is_trial: false,
      start_date: new Date().toISOString()
    }, { onConflict: 'user_id' });
    
    console.log("Account verified and upgraded to premium.");
  } else {
    console.log("User not found.");
  }
}
fixPerms();
