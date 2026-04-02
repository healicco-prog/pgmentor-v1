import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateTokenPolicies() {
  const policies = [
    { plan_id: 'free', monthly_tokens: 10000, trial_tokens: 0 },
    { plan_id: 'trial', monthly_tokens: 100000, trial_tokens: 100000 },
    { plan_id: 'standard', monthly_tokens: 100000, trial_tokens: 0 },
    { plan_id: 'premium', monthly_tokens: 300000, trial_tokens: 0 }
  ];

  for (const p of policies) {
    const { error } = await supabase
      .from('token_policies')
      .update({ monthly_tokens: p.monthly_tokens, trial_tokens: p.trial_tokens })
      .eq('plan_id', p.plan_id);
    
    if (error) {
      // Try upsert if update fails (row might not exist)
      const { error: upsertErr } = await supabase
        .from('token_policies')
        .upsert({ plan_id: p.plan_id, monthly_tokens: p.monthly_tokens, trial_tokens: p.trial_tokens }, { onConflict: 'plan_id' });
      console.log(`${p.plan_id}: ${upsertErr ? 'FAILED - ' + upsertErr.message : 'UPSERTED → ' + p.monthly_tokens.toLocaleString()}`);
    } else {
      console.log(`${p.plan_id}: UPDATED → ${p.monthly_tokens.toLocaleString()} tokens/month`);
    }
  }

  // Verify
  const { data } = await supabase.from('token_policies').select('plan_id, monthly_tokens, trial_tokens');
  console.log('\nCurrent token policies:');
  (data || []).forEach(r => console.log(`  ${r.plan_id}: ${r.monthly_tokens.toLocaleString()} monthly / ${r.trial_tokens.toLocaleString()} trial`));
}

updateTokenPolicies();
