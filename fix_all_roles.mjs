import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const correctRoles = {
  'drnarayanak@gmail.com': { role: 'super_admin', plan: 'premium' },
  'aimsrcpharmac@gmail.com': { role: 'admin', plan: 'standard' },
  'narayanakdr@yahoo.co.in': { role: 'user', plan: 'free' },
  'bjpdoddaballapura@gmail.com': { role: 'user', plan: 'premium' }
};

async function fixAll() {
  const { data: authData } = await supabase.auth.admin.listUsers();
  
  for (const [email, config] of Object.entries(correctRoles)) {
    const authUser = authData.users.find(u => u.email === email);
    if (!authUser) continue;
    
    // Update role
    const { error: userErr } = await supabase
      .from('users')
      .update({ role: config.role })
      .eq('id', authUser.id);
      
    console.log(`Updated ${email} role to ${config.role}: ${userErr ? 'FAILED' : 'OK'}`);
    
    // Update subscription plan
    const { error: subErr } = await supabase
      .from('subscriptions')
      .update({ plan_id: config.plan })
      .eq('user_id', authUser.id);
      
    console.log(`Updated ${email} plan to ${config.plan}: ${subErr ? 'FAILED' : 'OK'}`);
  }
}

fixAll();
