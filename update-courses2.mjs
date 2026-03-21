import fs from 'fs';

const files = [
  'd:/Lenovo Narayana 2026/Software Products/Antigravity Projects/Medimentr/medimentr Ver 1/sort-curriculum.js',
  'd:/Lenovo Narayana 2026/Software Products/Antigravity Projects/Medimentr/medimentr Ver 1/sort-curriculum.cjs',
  'd:/Lenovo Narayana 2026/Software Products/Antigravity Projects/Medimentr/medimentr Ver 1/check.mjs'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/(?:"|')(MD\/MS|MS\/MD|MD|MS)\s*(.*?)(?:"|')/g, '"Mastering $2"');
    
    fs.writeFileSync(file, content);
    console.log(file + ' updated');
  }
});
