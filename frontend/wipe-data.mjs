import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple env parser
const envContent = fs.readFileSync(join(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function wipeData() {
  console.log('Logging in as mentor...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nischay@theboringpeople.in',
    password: 'password123'
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  console.log('Login successful. Wiping tables...');

  // Delete in order of dependencies
  const { error: attError } = await supabase.from('attendance').delete().neq('id', -1);
  if (attError) console.error('Error deleting attendance:', attError);
  else console.log('Attendance cleared.');

  const { error: matError } = await supabase.from('materials').delete().neq('id', -1);
  if (matError) console.error('Error deleting materials:', matError);
  else console.log('Materials cleared.');

  const { error: sessError } = await supabase.from('sessions').delete().neq('id', -1);
  if (sessError) console.error('Error deleting sessions:', sessError);
  else console.log('Sessions cleared.');

  const { error: stdError } = await supabase.from('students').delete().neq('id', -1);
  if (stdError) console.error('Error deleting students:', stdError);
  else console.log('Students cleared.');

  const { error: impError } = await supabase.from('import_log').delete().neq('id', -1);
  if (impError) console.error('Error deleting import_log:', impError);
  else console.log('Import logs cleared.');

  console.log('Data wipe complete.');
}

wipeData();
