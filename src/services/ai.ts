// ═══════════════════════════════════════════════════════════════════════════
// AI Service — Routes all AI requests through the backend
// All calls use relative /api/ai/* paths:
//   - In production: Netlify proxy forwards to Cloud Run and injects X-API-Key
//   - In development: Vite/Express dev server handles directly
// SECURITY: No secrets are exposed in the frontend bundle
// ═══════════════════════════════════════════════════════════════════════════

const AI_BASE_URL = '/api/ai';

function getHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' };
}

/**
 * Generic content generation via backend proxy
 */
export const generateMedicalContent = async (
  prompt: string | any[],
  systemInstruction: string,
  responseMimeType: string = "text/plain",
  useSearch: boolean = false,
  userRole?: string,
  userId?: string
) => {
  try {
    const response = await fetch(`${AI_BASE_URL}/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, systemInstruction, responseMimeType, useSearch, userRole, userId }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'AI request failed' }));
      console.error("AI Service Error Detail:", errData.error);
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
 * PGMentor Mentor Chat
 */
export const PGMentorMentorChat = async (message: string) => {
  const systemInstruction = `You are the "PGMentor AI Chatbot". Your SOLE purpose is to explain the features of the PGMentor portal and guide users on how to use it.
  
  PGMentor is an AI-powered academic assistant for postgraduate medical students.
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
  - AI Tutor: A personalized AI study companion for learning medical topics.

  CRITICAL RULES:
  1. You are NOT the "PGMentor AI Mentor" (the AI Tutor). You are the "PGMentor AI Chatbot".
  2. You must ONLY explore and explain what is in the PGMentor Portal.
  3. You MUST NOT explain any medical topics or teach content. 
  4. If the user asks to learn about a specific topic (e.g., "explain hypertension"), guide them to the appropriate feature (like the AI Tutor or Knowledge Library).
  5. If the user asks about a feature, explain it clearly based on the list above.
  6. If it seems the user hasn't logged in and wants to explore features, ask them to Signup to explore the features of PGMentor.`;

  return generateMedicalContent(message, systemInstruction);
};

/**
 * Extract contact info from a visiting card image
 */
export const extractContactFromImage = async (base64Image: string, userId?: string) => {
  try {
    const response = await fetch(`${AI_BASE_URL}/extract-contact`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image: base64Image, userId }),
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
export const analyzePrescriptionImage = async (base64Image: string, userId?: string) => {
  try {
    const response = await fetch(`${AI_BASE_URL}/analyze-prescription`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image: base64Image, userId }),
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
export const extractPaperTextFromImage = async (base64Image: string, userId?: string) => {
  try {
    const response = await fetch(`${AI_BASE_URL}/extract-paper`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image: base64Image, userId }),
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

