import pg from 'pg';
const client = new pg.Client('postgresql://postgres:Shivani%4001%2F2006@db.ziuylkuzhcmlhlxcmoso.supabase.co:5432/postgres');
async function run() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students'");
  console.log(res.rows);
  await client.end();
}
run();
