import XLSX from 'xlsx';
import pg from 'pg';

const connectionString = 'postgresql://postgres:Shivani%4001%2F2006@db.ziuylkuzhcmlhlxcmoso.supabase.co:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

function excelDateToJSDate(serial) {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate()).toISOString().split('T')[0];
}

function parseDateHeader(header) {
  if (typeof header === 'number') {
    return excelDateToJSDate(header);
  }
  if (typeof header === 'string') {
    const parts = header.split(/[-/]/);
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (y.length === 2) y = '20' + y;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return header;
  }
  return null;
}

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL");

  const filePath = '../docx/Data Engineering and AI - Actual Program.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[1]; // 2nd sheet
  console.log(`Processing Sheet: ${sheetName}`);
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const headers = data[1]; 
  const studentRows = data.slice(2);
  
  const nameIdx = 1;
  const emailIdx = 2;
  const usnIdx = 4;
  const branchIdx = 6;
  
  const dateCols = [];
  const today = new Date().toISOString().split('T')[0];
  for (let i = 7; i < headers.length; i++) {
    if (headers[i] !== undefined && headers[i] !== null) {
      const parsedDate = parseDateHeader(headers[i]);
      if (parsedDate && parsedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        if (parsedDate <= today && parsedDate >= '2025-08-04') {
          dateCols.push({ index: i, date: parsedDate });
        } else {
          console.log(`Skipping out-of-bounds date: ${parsedDate}`);
        }
      }
    }
  }

  console.log(`Found ${dateCols.length} valid date columns.`);

  try {
    await client.query('BEGIN');

    // 1. Process Students
    const upsertedStudents = {}; // usn -> id
    for (const r of studentRows) {
      if (!r[usnIdx]) continue;
      const usn = String(r[usnIdx]).trim();
      const name = String(r[nameIdx] || '').trim();
      const email = String(r[emailIdx] || '').trim();
      const branch_code = String(r[branchIdx] || '').trim();

      const res = await client.query(`
        INSERT INTO public.students (usn, name, email, branch_code)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (usn) DO UPDATE 
        SET name = EXCLUDED.name, email = EXCLUDED.email, branch_code = EXCLUDED.branch_code
        RETURNING id;
      `, [usn, name, email, branch_code]);
      
      upsertedStudents[usn] = res.rows[0].id;
    }
    console.log(`Upserted ${Object.keys(upsertedStudents).length} students.`);

    // 2. Process Sessions
    const upsertedSessions = {}; // date -> id
    for (const col of dateCols) {
      const res = await client.query(`
        INSERT INTO public.sessions (date, topic, month_number, session_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (date) DO UPDATE 
        SET topic = EXCLUDED.topic
        RETURNING id;
      `, [col.date, `Bulk Upload: ${sheetName}`, 1, 'offline']);
      
      upsertedSessions[col.date] = res.rows[0].id;
    }
    console.log(`Upserted ${Object.keys(upsertedSessions).length} sessions.`);

    // 3. Process Attendance
    let attCount = 0;
    for (const r of studentRows) {
      if (!r[usnIdx]) continue;
      const usn = String(r[usnIdx]).trim();
      const studentId = upsertedStudents[usn];
      if (!studentId) continue;

      for (const col of dateCols) {
        const sessionId = upsertedSessions[col.date];
        if (!sessionId) continue;

        const val = r[col.index];
        const isPresent = val === true || String(val).toLowerCase() === 'p' || String(val) === '1';

        await client.query(`
          INSERT INTO public.attendance (student_id, session_id, present, marked_by)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (student_id, session_id) DO UPDATE 
          SET present = EXCLUDED.present
        `, [studentId, sessionId, isPresent, 'Manual Script Upload']);
        attCount++;
      }
    }
    console.log(`Upserted ${attCount} attendance records.`);

    await client.query('COMMIT');
    console.log("✅ Successfully imported the 2nd sheet!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Error during import:", e.message);
  } finally {
    await client.end();
  }
}

run();
