/**
 * Direct API implementation to bypass library conflicts.
 */
export async function analyzeAttendanceSheet(sampleData, typicalDays = "Not specified") {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('Gemini API Key is missing. Please check .env.local and RESTART your server.');
  }

  const aiPrompt = `
    You are an expert data engineer. Analyze this attendance sheet sample and map it to our schema.
    
    SAMPLE DATA:
    ${JSON.stringify(sampleData, null, 2)}
    
    CONSTRAINTS:
    1. Identify indices for: 'usn', 'name', 'email', 'branch_code', 'n8n_link' (e.g. 'n8n invite links').
    2. Identify indices for attendance dates (Headers like '30/04/24' or serials like 45788).
    3. Detect attendance values (e.g., 'P/A', '1/0').

    RETURN JSON ONLY:
    {
      "studentMapping": { 
        "usn": { "index": number, "colName": "string" }, 
        "name": { "index": number, "colName": "string" }, 
        "email": { "index": number, "colName": "string" }, 
        "branch_code": { "index": number, "colName": "string" },
        "n8n_link": { "index": number, "colName": "string" }
      },
      "attendanceColumns": [
        { "index": number, "date": "YYYY-MM-DD", "originalHeader": "string", "isSuggested": boolean }
      ],
      "valueFormat": { "present": "string", "absent": "string" }
    }
  `;

  // Using gemini-2.5-flash-lite specifically from the provided list
  const model = "gemini-2.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  console.log(`Calling Gemini API with model: ${model} (Key length: ${apiKey.length})`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: aiPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API Request failed');
    }

    const result = await response.json();
    const responseText = result.candidates[0].content.parts[0].text;
    return JSON.parse(responseText);
  } catch (err) {
    console.error("Gemini Direct API Error:", err);
    throw new Error(err.message || "Failed to analyze sheet.");
  }
}

/**
 * Debug tool to list models available to this API key.
 */
export async function listAvailableModels() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Failed to list models');
    return data.models.map(m => m.name.replace('models/', ''));
  } catch (err) {
    throw err;
  }
}
