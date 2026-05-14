import XLSX from 'xlsx';
import path from 'path';

const filePath = '../docx/Data Engineering and AI - Actual Program.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  console.log('Sheets:', workbook.SheetNames);

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Print first 5 rows to see structure
    data.slice(0, 10).forEach((row, i) => {
      console.log(`Row ${i}:`, row);
    });
  });
} catch (err) {
  console.error('Error reading file:', err.message);
}
