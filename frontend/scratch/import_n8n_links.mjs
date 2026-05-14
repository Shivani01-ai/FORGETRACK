import XLSX from 'xlsx';
import pg from 'pg';

const connectionString = 'postgresql://postgres:Shivani%4001%2F2006@db.ziuylkuzhcmlhlxcmoso.supabase.co:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL");

  const filePath = '../docx/Data Engineering and AI - Actual Program.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[1]; // 2nd sheet
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const studentRows = data.slice(2);
  
  const n8nLinkIdx = 3;
  const usnIdx = 4;
  
  try {
    await client.query('BEGIN');
    let count = 0;

    for (const r of studentRows) {
      if (!r[usnIdx] || !r[n8nLinkIdx]) continue;
      const usn = String(r[usnIdx]).trim();
      const n8nLink = String(r[n8nLinkIdx]).trim();

      const res = await client.query(`
        UPDATE public.students 
        SET n8n_link = $1
        WHERE usn = $2
      `, [n8nLink, usn]);
      
      if (res.rowCount > 0) count++;
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully updated ${count} students with n8n links!`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Error during update:", e.message);
  } finally {
    await client.end();
  }
}

run();
