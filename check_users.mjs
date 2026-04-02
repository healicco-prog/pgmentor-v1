import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log("Checking users in auth.users:");
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Error fetching auth users:", authError.message);
  } else {
    console.log(`Found ${authUsers.users.length} users in auth.users.`);
    authUsers.users.forEach(u => console.log(`- ${u.email}`));
  }

  console.log("\nChecking users in public.users (if it exists):");
  const { data: publicUsers, error: publicError } = await supabase.from('users').select('*');
  if (publicError) {
    console.error("Error fetching public users:", publicError.message);
  } else {
    console.log(`Found ${publicUsers.length} users in public.users.`);
    publicUsers.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));
  }
}

checkUsers();
