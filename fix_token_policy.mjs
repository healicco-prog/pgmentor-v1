import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixTokenPolicy() {
  // Try inserting with minimal columns
  const { error } = await supabase
    .from('token_policies')
    .upsert({
      plan_id: 'free',
      monthly_tokens: 500,
      trial_tokens: 0
    }, { onConflict: 'plan_id' });
  
  if (error) {
    console.log('token_policies upsert failed:', error.message);
    console.log('Trying direct SQL via RPC...');
    // The table might not exist or have different columns, use RPC if available
  } else {
    console.log('OK: free plan token policy set to 500 tokens/month');
  }

  // Verify what's in the table  
  const { data, error: readErr } = await supabase
    .from('token_policies')
    .select('*');
  
  if (readErr) {
    console.log('Cannot read token_policies:', readErr.message);
  } else {
    console.log('Current token policies:', JSON.stringify(data, null, 2));
  }
}

fixTokenPolicy();
