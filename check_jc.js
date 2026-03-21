import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('journal_club').select('*').order('date', { ascending: false }).limit(5);
  if (error) {
    console.error("Error:", error);
    return;
  }
  fs.writeFileSync('out.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('written to out.json');
}

check();
