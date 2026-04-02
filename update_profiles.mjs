import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const userEmails = [
  'drnarayanak@gmail.com',
  'aimsrcpharmac@gmail.com',
  'narayanakdr@yahoo.co.in',
  'bjpdoddaballapura@gmail.com'
];

async function updateProfiles() {
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  
  for (const email of userEmails) {
    const user = authUsers.users.find(u => u.email === email);
    if (!user) {
       console.log(`User ${email} not found in auth.users`);
       continue;
    }
    
    // First update user_profiles
    const { error: profileError } = await supabase
       .from('user_profiles')
       .update({ email_verified: true })
       .eq('user_id', user.id);
       
    if (profileError) {
        console.error(`Error updating user_profiles for ${email}:`, profileError.message);
    } else {
        console.log(`Updated email_verified=true in user_profiles for ${email}`);
    }
    
    // Also update users table just in case they added a flag there
    const { error: usersError } = await supabase
       .from('users')
       .update({ email_verified: true })
       .eq('id', user.id);
       
    if (usersError && !usersError.message.includes('column "email_verified" of relation "users" does not exist')) {
        console.error(`Error updating users table for ${email}:`, usersError.message);
    }
  }
}
updateProfiles();
