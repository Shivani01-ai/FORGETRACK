import pg from 'pg';

const connectionString = 'postgresql://postgres:Shivani%4001%2F2006@db.ziuylkuzhcmlhlxcmoso.supabase.co:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  try {
    console.log('Fixing NULL tokens in auth.users...');
    const result = await client.query(`
      UPDATE auth.users 
      SET 
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, '')
      WHERE 
        confirmation_token IS NULL OR
        recovery_token IS NULL OR
        email_change_token_new IS NULL OR
        email_change IS NULL;
    `);
    console.log(`Updated ${result.rowCount} rows.`);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}
run();
