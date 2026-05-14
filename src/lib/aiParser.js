import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Utility to extract raw data from files and prepare for AI analysis.
 */
export const extractRawData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const extension = file.name.split('.').pop().toLowerCase();

    reader.onload = (e) => {
      const data = e.target.result;

      if (extension === 'csv') {
        Papa.parse(data, {
          complete: (results) => {
            resolve({
              type: 'csv',
              sheets: [{ name: 'Default', data: results.data }]
            });
          },
          error: (err) => reject(err)
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        try {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheets = workbook.SheetNames.map(name => {
            const sheet = workbook.Sheets[name];
            // Use header: 1 to get raw array of arrays
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
            return { name, data: rawData };
          });
          resolve({ type: 'excel', sheets });
        } catch (err) {
          reject(new Error('Failed to parse Excel file: ' + err.message));
        }
      } else {
        reject(new Error('Unsupported file format'));
      }
    };

    reader.onerror = () => reject(new Error('File reading failed'));

    if (extension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

/**
 * Converts Excel serial dates (e.g., 45788) to ISO strings.
 */
export const formatExcelDate = (val) => {
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    // Excel dates start from 1900-01-01
    const date = new Date((val - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  return val;
};

/**
 * Prepares a sample of the data to send to Gemini.
 * We send headers and first few rows to keep token count low.
 */
export const prepareAiSample = (sheetData) => {
  if (!sheetData || sheetData.length === 0) return { headers: [], rows: [] };

  // Find first non-empty row to use as potential headers
  let headerIndex = 0;
  while (headerIndex < sheetData.length && (!sheetData[headerIndex] || sheetData[headerIndex].length === 0)) {
    headerIndex++;
  }

  const rawHeaders = sheetData[headerIndex] || [];
  const headers = rawHeaders.map(h => formatExcelDate(h)); // Pre-format Excel dates
  const rows = sheetData.slice(headerIndex + 1, headerIndex + 16);

  return {
    headers,
    rows
  };
};
