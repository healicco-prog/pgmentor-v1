import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createTokenUsageTable() {
  // Use the Supabase REST API to run SQL via the /rest/v1/rpc endpoint
  // Since we can't run raw SQL directly, let's create the table by:
  // 1. First try to insert - if table doesn't exist, we need SQL editor
  
  const sql = `
    CREATE TABLE IF NOT EXISTS public.token_usage_logs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid NOT NULL,
      tokens_used integer NOT NULL DEFAULT 0,
      gemini_tokens integer DEFAULT 0,
      endpoint text DEFAULT '',
      used_at timestamptz DEFAULT now()
    );
    
    -- Add index for fast monthly queries
    CREATE INDEX IF NOT EXISTS idx_token_usage_user_date ON public.token_usage_logs(user_id, used_at);
    
    -- Grant access to service role
    ALTER TABLE public.token_usage_logs ENABLE ROW LEVEL SECURITY;
    
    -- Policy: service role can do everything
    DO $$ BEGIN
      CREATE POLICY "Service role full access" ON public.token_usage_logs
        FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  // Use the Supabase Management API (SQL endpoint)
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  console.log('Project ref:', projectRef);
  
  // Try using fetch to the pg-meta API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({})
  });
  
  console.log('Checking if we can use REST API...');
  
  // Alternative: Just try inserting with a test and handle column issues gracefully
  // The logTokenUsage function already has error handling
  
  // Let's just try creating via the PostgREST approach - insert minimal data
  const { data, error } = await supabase
    .from('token_usage_logs')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000001',
      tokens_used: 0,
      used_at: new Date().toISOString()
    })
    .select();
  
  if (error) {
    console.log('❌ Table does not exist. Please create it in the Supabase SQL Editor:');
    console.log('');
    console.log('=== COPY THIS SQL ===');
    console.log(sql);
    console.log('=== END SQL ===');
  } else {
    console.log('✅ Table exists! Cleaning up test row...');
    await supabase.from('token_usage_logs').delete().eq('user_id', '00000000-0000-0000-0000-000000000001');
    
    // Check if gemini_tokens column exists
    const { data: testData, error: testErr } = await supabase
      .from('token_usage_logs')
      .select('gemini_tokens')
      .limit(1);
    
    if (testErr && testErr.message.includes('gemini_tokens')) {
      console.log('⚠️ Missing gemini_tokens column. Add it in Supabase SQL Editor:');
      console.log('ALTER TABLE public.token_usage_logs ADD COLUMN gemini_tokens integer DEFAULT 0;');
      console.log('ALTER TABLE public.token_usage_logs ADD COLUMN endpoint text DEFAULT \'\';');
    } else {
      console.log('✅ All columns present!');
    }
  }
}

createTokenUsageTable();
