import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ziuylkuzhcmlhlxcmoso.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rhzB2WNWj4FYKtHf3Shtdg_ecdH5QxS';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  console.log('Testing Mentor Login...');
  const res1 = await supabase.auth.signInWithPassword({
    email: 'nischay@theboringpeople.in',
    password: 'password123'
  });
  console.log('Mentor Result:', res1.error ? `ERROR: ${res1.error.status} - ${res1.error.message}` : 'SUCCESS');
  if (res1.data?.user) {
    console.log('User Role:', res1.data.user.user_metadata?.role);
    console.log('User Metadata:', res1.data.user.user_metadata);
  }
}

testAuth();
