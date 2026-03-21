// Test with exact AI MCQ output format
const output = `Here are 10 multiple-choice questions on Pharmacokinetics (ADME) for medical students:

**Q1: A 65-year-old male is prescribed a new oral medication for hypertension. He reports that the medication is not as effective as expected, despite taking the prescribed dose. Pharmacokinetic studies reveal that this drug undergoes extensive first-pass metabolism. Which of the following pharmacokinetic parameters is most likely reduced in this patient, affecting the drug's efficacy?**
A) Volume of distribution
B) Elimination half-life
C) Bioavailability
D) Renal clearance

**Correct Answer:** C
**Explanation:** Extensive first-pass metabolism refers to the metabolism of a drug in the liver...

**Q2: A patient is administered Drug Y intravenously. The drug has a volume of distribution (Vd) of 40L. If the initial plasma concentration is 10 mg/L, what was the administered dose?**
A) 400 mg
B) 40 mg
C) 4 mg
D) 4000 mg

**Correct Answer:** A
**Explanation:** Vd = Dose / Initial Plasma Concentration...`;

const lines = output.split('\n');
const blocks = [];
let currentBlock = "";

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^\*\*?(?:Question\s+\d+|Q\s*\d+)(?:[*.): \t]|$)/i.test(line.trim())) {
     if (currentBlock) blocks.push(currentBlock.trim());
     currentBlock = line + '\n';
  } else {
     currentBlock += line + '\n';
  }
}
if (currentBlock) blocks.push(currentBlock.trim());

console.log("Total blocks:", blocks.length);
blocks.forEach((b, i) => {
  console.log(`--- Block ${i} (first 80 chars) ---`);
  console.log(b.substring(0, 80));
});
