import pg from 'pg';

const connectionString = 'postgresql://postgres:Shivani%4001%2F2006@db.ziuylkuzhcmlhlxcmoso.supabase.co:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  try {
    console.log('Testing SELECT from auth.users');
    const res = await client.query("SELECT id, email, encrypted_password FROM auth.users WHERE email = 'nischay@theboringpeople.in'");
    console.log('Found user:', res.rows.length);

    console.log('Testing UPDATE on auth.users (simulating sign-in)');
    await client.query("UPDATE auth.users SET last_sign_in_at = now() WHERE email = 'nischay@theboringpeople.in'");
    console.log('UPDATE successful');
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}
run();
