import XLSX from 'xlsx';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ziuylkuzhcmlhlxcmoso.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdXlsa3V6aGNtbGhseGNtb3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTkyMjQsImV4cCI6MjA5MzYzNTIyNH0.RXMqOS3uegnrjqQF9tmIwWez1YyNGJnKZxip85mocwU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    // try to format DD/MM/YY or DD-MM-YY to YYYY-MM-DD
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
  const filePath = '../docx/Data Engineering and AI - Actual Program.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[1]; // 2nd sheet
  console.log(`Processing Sheet: ${sheetName}`);
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const headers = data[1]; // Row 1 in zero-indexed array
  const studentRows = data.slice(2);
  
  // Identify columns
  const nameIdx = 1;
  const emailIdx = 2;
  const usnIdx = 4;
  const branchIdx = 6;
  
  const dateCols = [];
  for (let i = 7; i < headers.length; i++) {
    if (headers[i] !== undefined && headers[i] !== null) {
      const parsedDate = parseDateHeader(headers[i]);
      if (parsedDate && parsedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateCols.push({ index: i, date: parsedDate, original: headers[i] });
      }
    }
  }

  console.log(`Found ${dateCols.length} valid date columns.`);

  // 1. Process Students
  const studentsToUpsert = studentRows.filter(r => r[usnIdx]).map(r => ({
    usn: String(r[usnIdx]).trim(),
    name: String(r[nameIdx] || '').trim(),
    email: String(r[emailIdx] || '').trim(),
    branch_code: String(r[branchIdx] || '').trim()
  }));

  console.log(`Upserting ${studentsToUpsert.length} students...`);
  const { data: upsertedStudents, error: stdErr } = await supabase
    .from('students')
    .upsert(studentsToUpsert, { onConflict: 'usn' })
    .select();
    
  if (stdErr) {
    console.error("Student error:", stdErr);
    return;
  }

  // 2. Process Sessions
  const sessionsToUpsert = dateCols.map(col => ({
    date: col.date,
    topic: `Bulk Upload: ${sheetName}`,
    month_number: 1,
    session_type: 'offline'
  }));

  console.log(`Upserting ${sessionsToUpsert.length} sessions...`);
  const { data: upsertedSessions, error: sessErr } = await supabase
    .from('sessions')
    .upsert(sessionsToUpsert, { onConflict: 'date' })
    .select();

  if (sessErr) {
    console.error("Session error:", sessErr);
    return;
  }

  // 3. Process Attendance
  console.log(`Processing attendance records...`);
  const attendanceToInsert = [];
  
  studentRows.forEach(row => {
    if (!row[usnIdx]) return;
    const usn = String(row[usnIdx]).trim();
    const student = upsertedStudents.find(s => s.usn === usn);
    if (!student) return;

    dateCols.forEach(col => {
      const session = upsertedSessions.find(s => s.date === col.date);
      if (!session) return;

      const val = row[col.index];
      // true, false, 'P', 'A'
      const isPresent = val === true || String(val).toLowerCase() === 'p' || String(val) === '1';

      attendanceToInsert.push({
        student_id: student.id,
        session_id: session.id,
        present: isPresent,
        marked_by: 'Manual Script Upload'
      });
    });
  });

  console.log(`Upserting ${attendanceToInsert.length} attendance records...`);
  const { error: attErr } = await supabase
    .from('attendance')
    .upsert(attendanceToInsert, { onConflict: 'student_id,session_id' });

  if (attErr) {
    console.error("Attendance error:", attErr);
    return;
  }

  console.log("✅ Successfully imported the 2nd sheet!");
}

run();
