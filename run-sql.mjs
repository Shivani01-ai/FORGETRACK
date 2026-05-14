import fs from 'fs';
import pg from 'pg';
import path from 'path';

// Parse password with special characters
const connectionString = 'postgresql://postgres:Shivani%4001%2F2006@db.ziuylkuzhcmlhlxcmoso.supabase.co:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB successfully.');
    
    // Read and execute schema
    const schemaPath = path.resolve('../backend/supabase/schema/001_initial_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('Running Schema Migration...');
    await client.query(schema);
    console.log('✅ Schema migration applied.');

    // Read and execute seed
    const seedPath = path.resolve('../backend/supabase/seed/002_seed_data.sql');
    const seed = fs.readFileSync(seedPath, 'utf-8');
    console.log('Running Seed Data...');
    await client.query(seed);
    console.log('✅ Seed data inserted.');
    
  } catch (err) {
    console.error('❌ Error executing SQL:', err);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

run();
