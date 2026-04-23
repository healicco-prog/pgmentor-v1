import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Searching for BJP Doddaballapura in users/profiles...");
  
  // Try finding the user by email or name in profiles
  let userId = null;
  
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .ilike('name', '%BJP%');
    
  if (profileError) {
    console.log("Could not search profiles by name. Error:", profileError.message);
  } else if (profiles && profiles.length > 0) {
    console.log("Found profile:", profiles[0]);
    userId = profiles[0].id || profiles[0].user_id;
  }
  
  // If not found in profiles, try auth users
  if (!userId) {
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (!userError && users && users.users) {
      const match = users.users.find(u => 
        (u.email && u.email.toLowerCase().includes('bjp')) ||
        (u.user_metadata && u.user_metadata.name && u.user_metadata.name.toLowerCase().includes('bjp'))
      );
      if (match) {
        console.log("Found auth user:", match.email);
        userId = match.id;
      }
    }
  }

  // If still not found, let's grab the first subscription to just test the update
  if (!userId) {
      console.log("Could not find BJP Doddaballapura. Getting a random subscription user...");
      const { data: randomSub } = await supabaseAdmin.from('subscriptions').select('user_id').limit(1);
      if (randomSub && randomSub.length > 0) {
          userId = randomSub[0].user_id;
          console.log("Using random subscription userId:", userId);
      }
  }

  if (!userId) {
    console.log("No users or subscriptions found.");
    return;
  }

  console.log("Executing debug steps for userId:", userId);

  const [userMatch, allSubs] = await Promise.all([
    supabaseAdmin.from('subscriptions').select('*').eq('user_id', userId),
    supabaseAdmin.from('subscriptions').select('user_id')
  ]);

  const updateAttempt = await supabaseAdmin
    .from('subscriptions')
    .update({ updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select();

  console.log("\n--- DEBUG RESULT ---");
  console.log(JSON.stringify({
    searchedUserId: userId,
    rowsFoundByUserId: userMatch.data?.length || 0,
    updateResult: updateAttempt,
    totalSubscriptions: allSubs.data?.length || 0,
    subscriptionSample: allSubs.data?.slice(0, 3)
  }, null, 2));
}

run();
