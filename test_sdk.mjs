// Test the @google/genai SDK with both old and new model name formats
import { GoogleGenAI } from '@google/genai';

const key = 'AIzaSyC9a08lUQJ3qEpCd6rGlyRUtJT0A1esoas';
const ai = new GoogleGenAI({ apiKey: key });

const models = ['gemini-2.5-flash', 'models/gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

for (const model of models) {
  try {
    process.stdout.write(`Testing: ${model} ...\n`);
    const r = await ai.models.generateContent({ model, contents: 'Say hi' });
    process.stdout.write(`  OK: ${String(r.text).slice(0, 60)}\n`);
  } catch (e) {
    const msg = e?.message || String(e);
    process.stdout.write(`  FAIL: ${msg.slice(0, 200)}\n`);
  }
}
