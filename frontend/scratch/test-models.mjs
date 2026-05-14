import fs from 'fs';

const apiKey = "AIzaSyA52EUC8FDocnhlge9hJNR8aOA4tRNqoPk"; // From the user's .env.local

const modelsToTest = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite-001",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite"
];

async function testModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "reply with 'ok'" }] }]
      })
    });
    
    if (response.ok) {
      console.log(`✅ ${model}: SUCCESS`);
      return true;
    } else {
      const data = await response.json();
      console.log(`❌ ${model}: FAILED (${response.status}) - ${data.error?.message?.split('.')[0]}`);
      return false;
    }
  } catch (e) {
    console.log(`❌ ${model}: ERROR - ${e.message}`);
    return false;
  }
}

async function runTests() {
  console.log("Testing Gemini models...");
  for (const model of modelsToTest) {
    await testModel(model);
    // Add small delay to prevent rate limits
    await new Promise(r => setTimeout(r, 1000));
  }
}

runTests();
