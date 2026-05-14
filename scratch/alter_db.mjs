import pg from 'pg';
const client = new pg.Client('postgresql://postgres:Shivani%4001%2F2006@db.ziuylkuzhcmlhlxcmoso.supabase.co:5432/postgres');
async function run() {
  await client.connect();
  await client.query("ALTER TABLE public.students ADD COLUMN IF NOT EXISTS n8n_link TEXT;");
  console.log('Added column n8n_link successfully.');
  await client.end();
}
run();
