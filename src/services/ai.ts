// ═══════════════════════════════════════════════════════════════════════════
// AI Service — Routes all AI requests through the backend
// In production: calls Cloud Run backend DIRECTLY (bypasses Netlify 26s proxy timeout)
// In development: calls /api/ai/* (same origin, proxied by Vite/Express dev server)
// SECURITY: Gemini API key stays server-side only
// ═══════════════════════════════════════════════════════════════════════════

// In production (Netlify), use direct Cloud Run URL to avoid 26-second proxy timeout.
// VITE_BACKEND_URL and VITE_BACKEND_API_KEY are set in Netlify environment variables.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const BACKEND_API_KEY = import.meta.env.VITE_BACKEND_API_KEY || '';

function getAIBaseUrl(): string {
  // If VITE_BACKEND_URL is set (production), call Cloud Run directly
  if (BACKEND_URL) return `${BACKEND_URL}/api/ai`;
  // Otherwise (development), use relative path (same-origin proxy)
  return '/api/ai';
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // In production, include the API key for Cloud Run authentication
  if (BACKEND_API_KEY) headers['X-API-Key'] = BACKEND_API_KEY;
  return headers;
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
    const baseUrl = getAIBaseUrl();
    const response = await fetch(`${baseUrl}/generate`, {
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
  const systemInstruction = `You are PGMentor AI Mentor, a helpful assistant for the PGMentor platform.
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

  Explain these features to users and guide them on how to use the portal.`;

  return generateMedicalContent(message, systemInstruction);
};

/**
 * Extract contact info from a visiting card image
 */
export const extractContactFromImage = async (base64Image: string, userId?: string) => {
  try {
    const baseUrl = getAIBaseUrl();
    const response = await fetch(`${baseUrl}/extract-contact`, {
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
    const baseUrl = getAIBaseUrl();
    const response = await fetch(`${baseUrl}/analyze-prescription`, {
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
    const baseUrl = getAIBaseUrl();
    const response = await fetch(`${baseUrl}/extract-paper`, {
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

