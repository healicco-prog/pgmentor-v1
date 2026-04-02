import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log("Fetching users...");
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }
  let user = users.users.find(u => u.email === 'drnarayanak@gmail.com');
  if (user) {
    console.log(`User found: ${user.id}. Updating password...`);
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: 'Password@123', email_confirm: true }
    );
    if (!error) console.log("Password successfully updated to Password@123");
  } else {
    console.log("User not found in Supabase Auth. Creating...");
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'drnarayanak@gmail.com',
      password: 'Password@123',
      email_confirm: true,
      user_metadata: { full_name: 'Dr Narayana K' }
    });
    if (error) {
       console.error("Failed to create user:", error);
       return;
    }
    user = data.user;
    console.log("User created successfully:", user.id);

    // Create a profile as well so the frontend doesn't crash
    const { error: profileError } = await supabase.from('users').insert({
      email: 'drnarayanak@gmail.com',
      role: 'super_admin'
    });
    console.log("Profile insert in 'users':", profileError ? profileError.message : "Success");
    
    // Also user_profiles
    const { error: upError } = await supabase.from('user_profiles').insert({
      user_id: user.id,
      full_name: 'Dr Narayana K',
      profession: 'Doctor',
      current_stage: 'Practitioner',
      specialty: 'Mastering General Medicine',
      selected_course: 'Mastering General Medicine'
    });
    console.log("Profile insert in 'user_profiles':", upError ? upError.message : "Success");
  }
}
fix();
