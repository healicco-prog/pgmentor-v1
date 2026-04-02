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

async function confirmEmails() {
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listing users:", listError.message);
    return;
  }

  for (const email of userEmails) {
    const user = authUsers.users.find(u => u.email === email);
    if (user) {
      console.log(`Confirming email for ${email}...`);
      const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
      });
      if (error) {
        console.error(`Error confirming ${email}:`, error.message);
      } else {
        console.log(`Successfully confirmed email for ${email}`);
      }
    } else {
      console.log(`User ${email} not found.`);
    }
  }
}

confirmEmails();
