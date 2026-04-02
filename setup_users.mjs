import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const usersToAdd = [
  { email: 'drnarayanak@gmail.com', password: 'Tata@#viDhya#2026', role: 'Super Admin' },
  { email: 'aimsrcpharmac@gmail.com', password: 'DeVanaHalli-#@Pradeep#2026', role: 'Admin' }, // or Standard
  { email: 'narayanakdr@yahoo.co.in', password: 'User@2026', role: 'Free Subscription' },
  { email: 'bjpdoddaballapura@gmail.com', password: 'User@2026', role: 'Premium User' }
];

async function setup() {
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const existingEmails = authUsers.users.map(u => u.email);
  console.log("JSON_OUTPUT_START");
  console.log(JSON.stringify(existingEmails, null, 2));
  console.log("JSON_OUTPUT_END");

  for (const user of usersToAdd) {
    if (!existingEmails.includes(user.email)) {
      console.log(`Adding ${user.email}...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });
      if (error) {
         console.error(`Failed to add ${user.email}:`, error.message);
      } else {
         console.log(`Successfully added ${user.email} with ID ${data.user.id}`);
         // Insert into public.users if applicable
         await supabase.from('users').upsert({
             id: data.user.id,
             email: user.email,
             role: user.role,
             full_name: user.email.split('@')[0],
             subscription_plan: user.role
         });
      }
    } else {
      console.log(`${user.email} already exists.`);
      // Update password just in case
      const existingUser = authUsers.users.find(u => u.email === user.email);
      await supabase.auth.admin.updateUserById(existingUser.id, { password: user.password });
      
      // Update role
      await supabase.from('users').upsert({
             id: existingUser.id,
             email: user.email,
             role: user.role,
             full_name: user.email.split('@')[0],
             subscription_plan: user.role
      });
    }
  }
  console.log("Done checking and adding users.");
}
setup();
