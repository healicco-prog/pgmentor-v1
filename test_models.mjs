const key = 'AIzaSyC9a08lUQJ3qEpCd6rGlyRUtJT0A1esoas';

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
const d = await res.json();

if (d.models) {
  const gen = d.models.filter(m => m.supportedGenerationMethods?.includes('generateContent'));
  console.log(`=== ${gen.length} models support generateContent ===`);
  gen.forEach(m => console.log(' -', m.name));
} else {
  console.error('Error:', JSON.stringify(d));
}

// Also test a quick generate call
console.log('\n=== Testing gemini-2.5-flash ===');
try {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello in 3 words' }] }] })
  });
  const j = await r.json();
  if (j.candidates) {
    console.log('✅ SUCCESS:', j.candidates[0].content.parts[0].text);
  } else {
    console.log('❌ FAILED:', JSON.stringify(j));
  }
} catch(e) {
  console.error('❌ Exception:', e.message);
}

// Test gemini-2.0-flash
console.log('\n=== Testing gemini-2.0-flash ===');
try {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello in 3 words' }] }] })
  });
  const j = await r.json();
  if (j.candidates) {
    console.log('✅ SUCCESS:', j.candidates[0].content.parts[0].text);
  } else {
    console.log('❌ FAILED:', JSON.stringify(j));
  }
} catch(e) {
  console.error('❌ Exception:', e.message);
}
