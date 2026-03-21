import fs from 'fs';
import path from 'path';

const file = 'd:/Lenovo Narayana 2026/Software Products/Antigravity Projects/Medimentr/medimentr Ver 1/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/MD General Medicine/g, 'Mastering General Medicine');
content = content.replace(/"name":\s*"(MD\/MS|MS\/MD|MD|MS)\s+(.*?)"/g, '"name": "Mastering $2"');

fs.writeFileSync(file, content);
console.log('App.tsx updated successfully.');
