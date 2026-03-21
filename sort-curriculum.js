const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const startMatch = content.indexOf('export const DEFAULT_CURRICULUM = [');
if (startMatch === -1) throw new Error("not found");

const endMatch = content.indexOf('];\n\nconst ControlPanel', startMatch);
if (endMatch === -1) throw new Error("end not found");

const arrayStr = content.substring(startMatch + 'export const DEFAULT_CURRICULUM = '.length, endMatch + 1);

let curriculumArray = null;
// Evaluate the string to get the array
eval('curriculumArray = ' + arrayStr);

const requestedOrder = [
  "MD/MS Anatomy",
  "MD Physiology", 
  "MD Biochemistry",
  "MD Pharmacology",
  "MD Pathology",
  "MD Microbiology",
  "MD PSM / Community Medicine", 
  "MD Forensic Medicine & Toxicology",
  "MS/MD Ophthalmology", 
  "MS ENT",
  "MD General Medicine",
  "MD Pediatrics",
  "MD Psychiatry",
  "MD Dermatology (DVL)", 
  "MS General Surgery",
  "MS Orthopaedics", 
  "MS Obstetrics & Gynecology",
  "MD Anaesthesiology", 
  "MD Radio Diagnosis"
];

const nameToCourse = {};
curriculumArray.forEach(c => {
  nameToCourse[c.name.trim()] = c;
});

const sortedArray = [];
requestedOrder.forEach(name => {
  const norm = name.trim();
  if (nameToCourse[norm]) {
    sortedArray.push(nameToCourse[norm]);
  } else {
    console.log("Missing course from original data:", norm);
  }
});

// For any courses that were in curriculumArray but NOT in requestedOrder, maybe append them?
// The user removed duplicate versions anyway.
curriculumArray.forEach(c => {
  if (!requestedOrder.find(name => name.trim() === c.name.trim())) {
    console.log("Dangling course excluded:", c.name);
  }
});

const newContent = content.substring(0, startMatch) + 
  'export const DEFAULT_CURRICULUM = ' + 
  JSON.stringify(sortedArray, null, 2) + 
  content.substring(endMatch + 1);

fs.writeFileSync('src/App.tsx', newContent, 'utf-8');
console.log('Successfully reordered DEFAULT_CURRICULUM!');
