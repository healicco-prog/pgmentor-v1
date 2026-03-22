// ═══════════════════════════════════════════════════════════════════════════
// AI Service — Routes all AI requests through the backend proxy
// SECURITY: API keys are NEVER exposed to the client
// ═══════════════════════════════════════════════════════════════════════════

const AI_PROXY_BASE = '/api/ai';

/**
 * Generic content generation via backend proxy
 */
export const generateMedicalContent = async (
  prompt: string | any[],
  systemInstruction: string,
  responseMimeType: string = "text/plain",
  useSearch: boolean = false
) => {
  try {
    const response = await fetch(`${AI_PROXY_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction, responseMimeType, useSearch }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'AI request failed' }));
      throw new Error(errData.error || `AI request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};

/**
 * Medimentr Mentor Chat
 */
export const medimentrMentorChat = async (message: string) => {
  const systemInstruction = `You are Medimentr AI Mentor, a helpful assistant for the Medimentr platform.
  Medimentr is an AI-powered academic assistant for postgraduate medical students.
  Features include:
  - Knowledge Library: Evidence-based PG medical notes.
  - Essay Generator: Long/Short essays and short notes.
  - Seminar Builder: 20-30 slide PPT structure and notes.
  - Journal Club Preparator: Critical appraisal and PPT structure.
  - Thesis/Research Notes: Research protocol generation.
  - StatAssist: Statistical analysis guidance (t-test, ANOVA, etc.).
  - Answer Script Analyser: Rubric-based evaluation of answers.
  - Prescription Analyser: Clinical review of prescriptions.
  - Guidelines Generator: Latest medical guidelines summary.
  - Manuscript Structure Generator: IMRAD format for publications.
  - Question Paper Generator: Pattern-based paper generation.

  Explain these features to users and guide them on how to use the portal.`;

  return generateMedicalContent(message, systemInstruction);
};

/**
 * Extract contact info from a visiting card image
 */
export const extractContactFromImage = async (base64Image: string) => {
  try {
    const response = await fetch(`${AI_PROXY_BASE}/extract-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Contact extraction failed' }));
      throw new Error(errData.error || 'Contact extraction failed');
    }
    return await response.json();
  } catch (error) {
    console.error("OCR Error:", error);
    throw error;
  }
};

/**
 * Analyze a prescription image
 */
export const analyzePrescriptionImage = async (base64Image: string) => {
  try {
    const response = await fetch(`${AI_PROXY_BASE}/analyze-prescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Prescription analysis failed' }));
      throw new Error(errData.error || 'Prescription analysis failed');
    }
    return await response.json();
  } catch (error) {
    console.error("Prescription Analysis Error:", error);
    throw error;
  }
};

/**
 * Extract text from a question paper image
 */
export const extractPaperTextFromImage = async (base64Image: string) => {
  try {
    const response = await fetch(`${AI_PROXY_BASE}/extract-paper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Paper extraction failed' }));
      throw new Error(errData.error || 'Paper extraction failed');
    }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Paper Extraction Error:", error);
    throw error;
  }
};
