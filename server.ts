import "dotenv/config";
import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Missing Supabase credentials in .env. Integration may fail.");
}

const supabase = createClient(supabaseUrl || "http://localhost", supabaseKey || "anon_key");

// Admin client with service role key (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl || "http://localhost", supabaseServiceKey)
  : supabase;
if (supabaseServiceKey) {
  console.log("✅ Supabase admin client initialized (service role).");
}

// Resend Email Service
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
if (!resendApiKey) {
  console.warn("⚠️ Missing RESEND_API_KEY in .env. Email features will be disabled.");
} else {
  console.log("✅ Resend email service initialized.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/** Escape HTML to prevent XSS in email templates */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Simple in-memory rate limiter */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false; // Not rate limited
  }
  entry.count++;
  if (entry.count > maxRequests) return true; // Rate limited
  return false;
}

// Clean up rate limit store every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

/** Validate and sanitize input string fields */
function validateString(value: any, fieldName: string, maxLength: number = 1000): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error(`${fieldName} must be a string`);
  if (value.length > maxLength) throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  return value.trim();
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ═══════════════════════════════════════════════════════════════════════════
// GEMINI AI CLIENT — Direct REST API via fetch() — NOT @google/genai SDK
// The SDK v1.x routes to Vertex AI even with apiKey set, causing 404 errors.
// Direct REST calls to generativelanguage.googleapis.com are confirmed working.
// SECURITY: API key is server-side only, never exposed to the frontend.
// ═══════════════════════════════════════════════════════════════════════════
const geminiApiKey = process.env.GEMINI_API_KEY;

if (geminiApiKey) {
  console.log("✅ Gemini API key loaded — using direct REST API (generativelanguage.googleapis.com).");
} else {
  console.warn("⚠️ No GEMINI_API_KEY set. AI features will be disabled.");
}

// Use a sentinel so existing guards (if (!genAI)) still work
const genAI = geminiApiKey ? true : null;

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL SELECTION — Verified April 2026 with this API key
// gemini-2.5-flash ✔ ONLY confirmed working model (all others return NOT_FOUND)
// gemini-2.0-flash, gemini-1.5-flash, gemini-2.5-flash-8b — NOT available to new users
// ═══════════════════════════════════════════════════════════════════════════
const GEMINI_MODEL = 'gemini-2.5-flash';

function selectAIModel(_userRole?: string): string {
  return GEMINI_MODEL;
}

function selectFallbackModel(): string {
  // Same model — retry handles transient 429/503 errors
  return GEMINI_MODEL;
}

// ═══════════════════════════════════════════════════════════════════════════
// GEMINI REST HELPER — wraps fetch to generativelanguage.googleapis.com
// Returns { text, usageMetadata } matching the old SDK response shape.
// ═══════════════════════════════════════════════════════════════════════════
interface GeminiContent {
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  role?: string;
}

async function geminiGenerate(opts: {
  model: string;
  contents: string | GeminiContent | GeminiContent[];
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
  tools?: any[];
}): Promise<{ text: string; usageMetadata?: any }> {
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = opts.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

  // Normalise contents to the REST API shape
  let contents: any[];
  if (typeof opts.contents === 'string') {
    contents = [{ parts: [{ text: opts.contents }] }];
  } else if (Array.isArray(opts.contents)) {
    contents = opts.contents;
  } else {
    contents = [opts.contents];
  }

  const body: any = { contents };
  const genConfig: any = {};
  if (opts.responseMimeType) genConfig.responseMimeType = opts.responseMimeType;
  if (opts.temperature !== undefined) genConfig.temperature = opts.temperature;
  // Disable thinking mode — makes gemini-2.5-flash respond like a fast non-thinking model (5-15s)
  genConfig.thinkingConfig = { thinkingBudget: 0 };
  if (Object.keys(genConfig).length) body.generationConfig = genConfig;
  if (opts.systemInstruction) body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  if (opts.tools) body.tools = opts.tools;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json() as any;

  if (!res.ok || json.error) {
    const errMsg = json.error?.message || JSON.stringify(json);
    const status = json.error?.status || res.status;
    throw new Error(`${status}: ${errMsg}`);
  }

  const text = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') ?? '';
  return { text, usageMetadata: json.usageMetadata };
}

// Wrap a promise with a timeout — rejects after ms milliseconds
function withTimeout<T>(promise: Promise<T>, ms: number, label?: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms${label ? ` (${label})` : ''}`));
    }, ms);
    promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// RETRY WITH EXPONENTIAL BACKOFF — handles 429 RESOURCE_EXHAUSTED errors
// ═══════════════════════════════════════════════════════════════════════════
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const is429 = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      if (is429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // 1-2s, 2-3s, 4-5s
        console.log(`⏳ Rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Retry exhausted');
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN USAGE TRACKING — PGMentor Token Multiplier: 2x Gemini Tokens
// For every 1 Gemini AI token used, 2 PGMentor tokens are deducted
// ═══════════════════════════════════════════════════════════════════════════
const PGMENTOR_TOKEN_MULTIPLIER = 2;

async function logTokenUsage(userId: string, geminiTokens: number, endpoint: string) {
  if (!userId || geminiTokens <= 0) return;
  const pgmentorTokens = geminiTokens * PGMENTOR_TOKEN_MULTIPLIER;
  try {
    const { error } = await supabaseAdmin
      .from('token_usage_logs')
      .insert({
        user_id: userId,
        tokens_used: pgmentorTokens,
        gemini_tokens: geminiTokens,
        endpoint: endpoint,
        used_at: new Date().toISOString()
      });
    if (error) {
      console.warn(`⚠️ Token log failed for ${endpoint}:`, error.message);
    } else {
      console.log(`📊 Token usage: ${geminiTokens} Gemini → ${pgmentorTokens} PGMentor tokens (${endpoint}) [user: ${userId.slice(0, 8)}...]`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Token log exception:`, err.message);
  }
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  const APP_URL = process.env.APP_URL || (IS_PRODUCTION ? 'https://www.PGMentor.com' : `http://localhost:${PORT}`);
  const EMAIL_FROM = process.env.EMAIL_FROM || 'PGMentor <noreply@PGMentor.com>';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'healicco@gmail.com';

  app.use(express.json({ limit: '50mb' }));

  // ═══════════════════════════════════════════════════════════════════════════
  // CORS — Only allow requests from the frontend domain in production
  // ═══════════════════════════════════════════════════════════════════════════
  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3000', '${APP_URL}', 'http://localhost:5173'];

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!IS_PRODUCTION && origin) {
      // In dev, allow the requesting origin (not wildcard, to support credentials)
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // API KEY PROTECTION — Block unauthorized direct access to backend
  // ═══════════════════════════════════════════════════════════════════════════
  const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

  if (IS_PRODUCTION && BACKEND_API_KEY) {
    app.use('/api', (req, res, next) => {
      const clientKey = req.headers['x-api-key'];
      if (clientKey !== BACKEND_API_KEY) {
        return res.status(403).json({ error: 'Forbidden: Invalid or missing API key.' });
      }
      next();
    });
    console.log('🔒 API Key protection enabled for /api/* routes.');
  }

  // Health check for Cloud Run
  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // ═══════════════════════════════════════════════════════════════════════════
  // YOUTUBE SEARCH — Find real YouTube videos for embedding
  // ═══════════════════════════════════════════════════════════════════════════

  app.get("/api/youtube-search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: "q query parameter is required" });

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      console.warn("⚠️ YOUTUBE_API_KEY not set — returning empty results");
      return res.json({ videos: [] });
    }

    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&videoEmbeddable=true&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (!response.ok) {
        console.error("❌ YouTube API error:", data);
        return res.status(500).json({ error: "YouTube search failed", details: data.error?.message });
      }

      const videos = (data.items || []).map((item: any) => ({
        videoId: item.id?.videoId,
        title: item.snippet?.title,
        channelTitle: item.snippet?.channelTitle,
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url
      }));

      res.json({ videos });
    } catch (error: any) {
      console.error("❌ YouTube search error:", error.message);
      res.status(500).json({ error: "YouTube search failed" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AI PROXY ROUTES — All Gemini AI calls go through the backend
  // SECURITY: API key is never exposed to the client
  // Token tracking: Every Gemini token = 2 PGMentor tokens deducted
  // ═══════════════════════════════════════════════════════════════════════════

  app.post("/api/ai/generate", async (req, res) => {
    if (!genAI) return res.status(503).json({ error: "AI service not configured" });
    const { prompt, systemInstruction, responseMimeType, useSearch, userRole, userId } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    const primaryModel = selectAIModel(userRole);
    const fallbackModel = selectFallbackModel();
    console.log(`🤖 AI generate request — model: ${primaryModel} (role: ${userRole || 'public'})`);

    const tools = useSearch ? [{ googleSearch: {} }] : undefined;

    let response: any;
    let usedModel = primaryModel;
    try {
      response = await withTimeout(
        retryWithBackoff(() => geminiGenerate({ model: primaryModel, contents: prompt, systemInstruction, responseMimeType: responseMimeType || 'text/plain', temperature: 0.7, tools }), 1),
        120000,
        `${primaryModel} primary`
      );
    } catch (primaryError: any) {
      const isTimeout = primaryError.message?.includes('Timeout');
      const is429 = primaryError.message?.includes('429') || primaryError.message?.includes('RESOURCE_EXHAUSTED');
      const is503 = primaryError.message?.includes('503') || primaryError.message?.includes('UNAVAILABLE');
      console.warn(`⚠️ Primary model ${primaryModel} failed (${primaryError.message?.slice(0, 80)}). ${isTimeout || is429 || is503 ? 'Trying fallback...' : 'Not retrying.'}`);
      if (isTimeout || is429 || is503) {
        try {
          usedModel = fallbackModel;
          response = await withTimeout(
            retryWithBackoff(() => geminiGenerate({ model: fallbackModel, contents: prompt, systemInstruction, responseMimeType: responseMimeType || 'text/plain', temperature: 0.7, tools }), 1),
            45000,
            `${fallbackModel} fallback`
          );
          console.log(`✅ Fallback model ${fallbackModel} succeeded`);
        } catch (fallbackError: any) {
          console.error(`❌ Fallback model ${fallbackModel} also failed:`, fallbackError.message);
          return res.status(500).json({ error: `AI generation failed: ${fallbackError.message}` });
        }
      } else {
        console.error(`❌ AI generate error (model: ${primaryModel}):`, primaryError.message);
        return res.status(500).json({ error: `AI generation failed: ${primaryError.message}` });
      }
    }

    const geminiTokens = response.usageMetadata?.totalTokenCount || Math.ceil((response.text?.length || 0) / 4);
    if (userId) logTokenUsage(userId, geminiTokens, 'ai/generate');
    console.log(`✅ AI generate success — model: ${usedModel}, tokens: ${geminiTokens}`);
    res.json({ text: response.text, tokensUsed: geminiTokens * PGMENTOR_TOKEN_MULTIPLIER });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAMING AI ENDPOINT — SSE keep-alive to prevent Netlify 26s proxy timeout
  // Sends a ping every 5s while Gemini processes, then sends the full result.
  // Used for long-running generation (protocols, manuscripts, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  app.post("/api/ai/generate-stream", async (req, res) => {
    if (!genAI) return res.status(503).json({ error: "AI service not configured" });
    const { prompt, systemInstruction, responseMimeType, useSearch, userRole, userId } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx/proxy buffering
    res.flushHeaders();

    // Send padding to bypass proxy buffering (Netlify, Cloud Run, etc.)
    // Proxies often buffer until ~4KB is reached. SSE comments start with a colon.
    const padding = ':' + ' '.repeat(2048) + '\n\n';
    res.write(padding);

    const primaryModel = selectAIModel(userRole);
    const fallbackModel = selectFallbackModel();
    console.log(`🤖 AI stream request — model: ${primaryModel} (role: ${userRole || 'public'})`);

    const tools = useSearch ? [{ googleSearch: {} }] : undefined;

    // Send keep-alive pings every 5 seconds to prevent proxy timeout
    let keepAliveCount = 0;
    const keepAlive = setInterval(() => {
      keepAliveCount++;
      // Includes padding to ensure Netlify proxy flushes the payload
      res.write(`event: ping\ndata: {"elapsed":${keepAliveCount * 5}}\n:${' '.repeat(2048)}\n\n`);
    }, 5000);

    let aiResponse: any;
    let usedModel = primaryModel;
    try {
      try {
        aiResponse = await withTimeout(
          retryWithBackoff(() => geminiGenerate({ model: primaryModel, contents: prompt, systemInstruction, responseMimeType: responseMimeType || 'text/plain', temperature: 0.7, tools }), 1),
          290000,
          `${primaryModel} stream-primary`
        );
      } catch (primaryError: any) {
        const isTimeout = primaryError.message?.includes('Timeout');
        const is429 = primaryError.message?.includes('429') || primaryError.message?.includes('RESOURCE_EXHAUSTED');
        const is503 = primaryError.message?.includes('503') || primaryError.message?.includes('UNAVAILABLE');
        console.warn(`⚠️ Stream primary model ${primaryModel} failed (${primaryError.message?.slice(0, 80)})`);
        if (isTimeout || is429 || is503) {
          usedModel = fallbackModel;
          aiResponse = await withTimeout(
            retryWithBackoff(() => geminiGenerate({ model: fallbackModel, contents: prompt, systemInstruction, responseMimeType: responseMimeType || 'text/plain', temperature: 0.7, tools }), 1),
            120000,
            `${fallbackModel} stream-fallback`
          );
          console.log(`✅ Stream fallback model ${fallbackModel} succeeded`);
        } else {
          throw primaryError;
        }
      }

      clearInterval(keepAlive);

      const geminiTokens = aiResponse.usageMetadata?.totalTokenCount || Math.ceil((aiResponse.text?.length || 0) / 4);
      if (userId) logTokenUsage(userId, geminiTokens, 'ai/generate-stream');
      console.log(`✅ AI stream success — model: ${usedModel}, tokens: ${geminiTokens}`);

      // Send the final result as an SSE event
      const resultPayload = JSON.stringify({ text: aiResponse.text, tokensUsed: geminiTokens * PGMENTOR_TOKEN_MULTIPLIER });
      res.write(`event: result\ndata: ${resultPayload}\n\n`);
      res.write(`event: done\ndata: {}\n\n`);
      res.end();
    } catch (error: any) {
      clearInterval(keepAlive);
      console.error(`❌ AI stream error:`, error.message);
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || 'AI generation failed' })}\n\n`);
      res.end();
    }
  });

  app.post("/api/ai/extract-contact", async (req, res) => {
    if (!genAI) return res.status(503).json({ error: "AI service not configured" });
    const { image, userId } = req.body;
    if (!image) return res.status(400).json({ error: "image is required" });

    try {
      const systemInstruction = `You are an OCR specialist. Extract contact information from the provided visiting card image. Return JSON with: name, designation, organization, email, phone, website, address. If a field is not found, leave it as an empty string.`;
      const mimeType = image.startsWith('data:') ? image.substring(image.indexOf(':') + 1, image.indexOf(';')) : 'image/jpeg';
      const contents: GeminiContent[] = [{ parts: [{ text: "Extract contact info from this visiting card." }, { inlineData: { mimeType, data: image.split(',')[1] || image } }] }];
      const response = await retryWithBackoff(() => geminiGenerate({ model: selectAIModel(req.body.userRole), contents, systemInstruction, responseMimeType: 'application/json' }));
      const geminiTokens = response.usageMetadata?.totalTokenCount || Math.ceil((response.text?.length || 0) / 4);
      if (userId) logTokenUsage(userId, geminiTokens, 'ai/extract-contact');
      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      console.error("❌ AI extract-contact error:", error.message);
      res.status(500).json({ error: "Contact extraction failed" });
    }
  });

  app.post("/api/ai/analyze-prescription", async (req, res) => {
    if (!genAI) return res.status(503).json({ error: "AI service not configured" });
    const { image, userId } = req.body;
    if (!image) return res.status(400).json({ error: "image is required" });

    try {
      const systemInstruction = `You are an expert AI healthcare systems evaluator. Analyze the provided medical prescription based on WHO Good Prescription Guidelines. Return a structured JSON report with exactly these keys: overall_score, quality_level, scores (patient_information, prescriber_details, clinical_documentation, drug_information, rational_drug_use, safety_compliance), what_was_done_right (array of strings), what_went_wrong (array of strings), how_to_correct (array of strings).`;
      const mimeType = image.startsWith('data:') ? image.substring(image.indexOf(':') + 1, image.indexOf(';')) : 'image/jpeg';
      const contents: GeminiContent[] = [{ parts: [{ text: "Analyze this prescription and generate the evaluation JSON report." }, { inlineData: { mimeType, data: image.split(',')[1] || image } }] }];
      const response = await retryWithBackoff(() => geminiGenerate({ model: selectAIModel(req.body.userRole), contents, systemInstruction, responseMimeType: 'application/json' }));
      const geminiTokens = response.usageMetadata?.totalTokenCount || Math.ceil((response.text?.length || 0) / 4);
      if (userId) logTokenUsage(userId, geminiTokens, 'ai/analyze-prescription');
      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      console.error("❌ AI analyze-prescription error:", error.message);
      res.status(500).json({ error: "Prescription analysis failed: " + error.message });
    }
  });

  app.post("/api/ai/extract-paper", async (req, res) => {
    if (!genAI) return res.status(503).json({ error: "AI service not configured" });
    const { image, userId } = req.body;
    if (!image) return res.status(400).json({ error: "image is required" });

    try {
      const systemInstruction = `You are an expert AI extraction tool. Accurately transcribe the uploaded medical question paper. Maintain exact formatting, structure, question numbers. Return as plain text in Markdown.`;
      const mimeType = image.startsWith('data:') ? image.substring(image.indexOf(':') + 1, image.indexOf(';')) : 'image/jpeg';
      const contents: GeminiContent[] = [{ parts: [{ text: "Extract and format the question paper text exactly as shown." }, { inlineData: { mimeType, data: image.split(',')[1] || image } }] }];
      const response = await retryWithBackoff(() => geminiGenerate({ model: selectAIModel(req.body.userRole), contents, systemInstruction, responseMimeType: 'text/plain' }));
      const geminiTokens = response.usageMetadata?.totalTokenCount || Math.ceil((response.text?.length || 0) / 4);
      if (userId) logTokenUsage(userId, geminiTokens, 'ai/extract-paper');
      res.json({ text: response.text, tokensUsed: geminiTokens * PGMENTOR_TOKEN_MULTIPLIER });
    } catch (error: any) {
      console.error("❌ AI extract-paper error:", error.message);
      res.status(500).json({ error: "Paper extraction failed" });
    }
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD RESET OTP SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  
  // In-memory OTP store: Map<email, { code, expiresAt, attempts, resetToken? }>
  const OTP_STORE_MAX_SIZE = 10000; // Prevent memory exhaustion from spam
  const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number; resetToken?: string }>();

  // Cleanup expired OTPs every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [email, entry] of otpStore) {
      if (now > entry.expiresAt) otpStore.delete(email);
    }
  }, 5 * 60 * 1000);

  // Generate a cryptographically secure 6-digit OTP
  const generateOTP = (): string => {
    return crypto.randomInt(100000, 999999).toString();
  };

  // Generate a cryptographically secure reset token
  const generateResetToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
  };

  // 1. Send Reset Code
  app.post("/api/auth/send-reset-code", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email format" });

    // IP-based rate limiting: max 10 OTP requests per IP per 15 minutes
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (rateLimit(`otp:${clientIp}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    // Per-email rate limit: max 3 OTPs per email within 10 minutes (fixed off-by-one)
    const existing = otpStore.get(email);
    if (existing && existing.attempts >= 3 && Date.now() < existing.expiresAt) {
      return res.status(429).json({ error: "Too many attempts. Please try again later." });
    }

    // Enforce OTP store size limit
    if (otpStore.size >= OTP_STORE_MAX_SIZE && !otpStore.has(email)) {
      console.warn("⚠️ OTP store at capacity, rejecting new request");
      return res.status(503).json({ error: "Service temporarily unavailable. Please try again later." });
    }

    const newAttempts = (existing?.attempts || 0) + 1;
    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email, { code, expiresAt, attempts: newAttempts });

    console.log(`🔑 OTP generated for ${email}`);

    // Send OTP email via Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: [email],
          subject: "Password Reset Code – PGMentor",
          html: emailWrapper("Password Reset", `
            <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Password Reset Request 🔐</h2>
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
              We received a request to reset your PGMentor account password. Use the code below to verify your identity:
            </p>
            
            <div style="background-color:#1e293b;border-radius:16px;padding:32px;text-align:center;margin:0 0 24px 0;">
              <p style="color:#94a3b8;font-size:12px;font-weight:600;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
              <p style="color:#ffffff;font-size:42px;font-weight:800;letter-spacing:12px;margin:0;font-family:'Courier New',monospace;">${code}</p>
            </div>
            
            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:0 0 20px 0;">
              <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                ⚠️ This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email — your account is safe.
              </p>
            </div>
            
            <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">
              For security, never share this code with anyone.
            </p>
          `)
        });
        console.log("📧 Reset code email sent to:", email);
      } catch (err: any) {
        console.error("❌ Failed to send reset code email:", err.message);
        // Still return success – the OTP is stored, log it for dev purposes
      }
    }

    res.json({ success: true, message: "Reset code sent to your email" });
  });

  // 2. Verify Reset Code
  app.post("/api/auth/verify-reset-code", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

    const entry = otpStore.get(email);
    if (!entry) {
      return res.status(400).json({ error: "No reset code was sent for this email. Please request a new one." });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "Code has expired. Please request a new one." });
    }

    if (entry.code !== code.trim()) {
      return res.status(400).json({ error: "Invalid code. Please check and try again." });
    }

    // Code is valid — generate a reset token
    const resetToken = generateResetToken();
    otpStore.set(email, { ...entry, resetToken, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min to set new password
    
    console.log(`✅ OTP verified for ${email}, reset token issued`);
    res.json({ success: true, resetToken });
  });

  // 3. Reset Password (after OTP verification)
  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: "Email, reset token, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const entry = otpStore.get(email);
    if (!entry || entry.resetToken !== resetToken) {
      return res.status(400).json({ error: "Invalid or expired reset session. Please start over." });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "Reset session expired. Please start over." });
    }

    try {
      // Call our Supabase RPC function to securely update the password
      const { data, error } = await supabase.rpc('admin_reset_password', {
        target_email: email,
        new_password: newPassword
      });

      if (error) {
        console.error("❌ Password reset RPC error:", error);
        return res.status(500).json({ error: "Failed to reset password. Please try again." });
      }

      if (data && !data.success) {
        return res.status(404).json({ error: data.error || "User not found" });
      }

      // Clean up the OTP entry
      otpStore.delete(email);
      
      console.log(`🔑 Password reset successful for ${email}`);
      
      // Send confirmation email
      if (resend) {
        resend.emails.send({
          from: EMAIL_FROM,
          to: [email],
          subject: "Password Changed Successfully – PGMentor",
          html: emailWrapper("Password Changed", `
            <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Password Changed Successfully ✅</h2>
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
              Your PGMentor account password has been updated. You can now sign in with your new password.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:0 0 24px 0;">
              <p style="color:#166534;font-size:13px;margin:0;">
                🔒 If you didn't make this change, please contact us immediately.
              </p>
            </div>
            <div style="text-align:center;">
              <a href="${APP_URL}" style="display:inline-block;background-color:#1d4ed8;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px;">
                Sign In Now
              </a>
            </div>
          `)
        }).catch(err => console.error("Confirmation email failed:", err));
      }

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error: any) {
      console.error("❌ Password reset failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN API ROUTES (bypass RLS via SECURITY DEFINER functions)
  // Protected by admin authentication middleware
  // ═══════════════════════════════════════════════════════════════════════════

  // Admin auth middleware: verify the request is from an admin user
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.warn("⚠️ Admin auth: No Authorization header");
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Path 1: Control Panel secret key (for hardcoded CP login)
      const ADMIN_SECRET = process.env.ADMIN_API_SECRET || 'PGMentor-SuperAdmin-SecretKey-2026';
      if (authHeader === `Secret ${ADMIN_SECRET}`) {
        console.log(`✅ Admin auth: via CP secret key`);
        (req as any).adminUser = { email: 'control-panel', role: 'super_admin' };
        return next();
      }

      // Path 2: Supabase JWT Bearer token
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        console.warn("⚠️ Admin auth: Invalid token -", error?.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('email', user.email)
        .single();
      if (profileError) {
        console.error("❌ Admin auth: DB lookup failed for", user.email, "-", profileError.message);
      }
      const ADMIN_ROLES = ['admin', 'super_admin'];
      if (!profile || !ADMIN_ROLES.includes(profile.role)) {
        console.warn(`⚠️ Admin auth: Access denied for ${user.email} (role: ${profile?.role || 'not found'})`);
        return res.status(403).json({ error: 'Admin access required' });
      }
      console.log(`✅ Admin auth: ${user.email} (role: ${profile.role})`);
      (req as any).adminUser = user;
      next();
    } catch (err: any) {
      console.error("❌ Admin auth error:", err.message);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };

  app.get("/api/admin/all-users", requireAdmin, async (req, res) => {
    try {
      // 1. Get profiles from user_profiles table
      const { data: profiles, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // 2. Get auth users to get emails and confirmation status
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const emailMap: Record<string, string> = {};
      const confirmedMap: Record<string, boolean> = {};
      if (!authErr && authData?.users) {
        authData.users.forEach((u: any) => {
          emailMap[u.id] = u.email || '';
          confirmedMap[u.id] = !!u.email_confirmed_at;
        });
      }

      // 3. Merge email + confirmation status into each profile
      const enriched = (profiles || []).map((p: any) => ({
        ...p,
        email: emailMap[p.user_id] || p.email || p.user_id,
        email_confirmed: confirmedMap[p.user_id] ?? true,
      }));

      res.json(enriched);
    } catch (error: any) {
      console.error("❌ admin all-users error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: confirm ALL unconfirmed email addresses in one shot
  app.post("/api/admin/confirm-all-emails", requireAdmin, async (req, res) => {
    try {
      const { data: authData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) throw listErr;

      const unconfirmed = (authData?.users || []).filter((u: any) => !u.email_confirmed_at);
      console.log(`📧 Confirming ${unconfirmed.length} unconfirmed users…`);

      const results: any[] = [];
      for (const u of unconfirmed) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
          email_confirm: true,
        } as any);
        results.push({ id: u.id, email: u.email, ok: !error, error: error?.message });
        if (error) console.warn(`  ⚠ ${u.email}: ${error.message}`);
        else console.log(`  ✅ ${u.email} confirmed`);
      }

      res.json({ confirmed: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, results });
    } catch (err: any) {
      console.error("❌ confirm-all-emails error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: confirm a single user's email
  app.post("/api/admin/confirm-email", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      } as any);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ confirm-email error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/all-subscriptions", requireAdmin, async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error("❌ admin all-subscriptions error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/all-token-overrides", requireAdmin, async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_token_overrides')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/token-usage-summary", requireAdmin, async (req, res) => {
    try {
      // Aggregate token usage per user from token_usage_logs
      const { data, error } = await supabaseAdmin
        .from('token_usage_logs')
        .select('user_id, tokens_used');
      if (error) throw error;
      // Aggregate client-side
      const summary: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        summary[row.user_id] = (summary[row.user_id] || 0) + (Number(row.tokens_used) || 0);
      });
      const result = Object.entries(summary).map(([user_id, total_used]) => ({ user_id, total_used }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/all-token-policies", requireAdmin, async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('token_policies')
        .select('*');
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/all-plans", requireAdmin, async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: reset password for a user
  app.post("/api/admin/reset-password", requireAdmin, async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
      if (!userId || !newPassword) return res.status(400).json({ error: 'userId and newPassword required' });
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;
      await supabaseAdmin.from('admin_audit_logs').insert({
        action_type: 'password_reset', performed_by: 'Super Admin',
        target_user_id: userId, details: { method: 'admin_reset' }
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ admin reset-password error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: update user role
  app.post("/api/admin/update-role", requireAdmin, async (req, res) => {
    try {
      const { userId, role, userEmail } = req.body;
      if (!userId || !role) return res.status(400).json({ error: 'userId and role required' });
      const { error } = await supabaseAdmin.from('user_profiles').update({ role }).eq('user_id', userId);
      if (error) throw error;
      await supabaseAdmin.from('admin_audit_logs').insert({
        action_type: 'role_change', performed_by: 'Super Admin',
        target_user_id: userId, target_user_email: userEmail, details: { new_role: role }
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ admin update-role error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: update plan for user
  app.post("/api/admin/update-plan", requireAdmin, async (req, res) => {
    try {
      const { userId, planId, userEmail } = req.body;
      if (!userId || !planId) return res.status(400).json({ error: 'userId and planId required' });
      const { error } = await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId, plan_id: planId, status: 'active', is_trial: planId === 'trial'
      });
      if (error) throw error;
      await supabaseAdmin.from('admin_audit_logs').insert({
        action_type: 'plan_change', performed_by: 'Super Admin',
        target_user_id: userId, target_user_email: userEmail, details: { new_plan: planId }
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ admin update-plan error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: update account status
  app.post("/api/admin/update-status", requireAdmin, async (req, res) => {
    try {
      const { userId, status, userEmail } = req.body;
      if (!userId || !status) return res.status(400).json({ error: 'userId and status required' });
      const { error } = await supabaseAdmin.from('user_profiles').update({ account_status: status }).eq('user_id', userId);
      if (error) throw error;
      await supabaseAdmin.from('admin_audit_logs').insert({
        action_type: 'status_change', performed_by: 'Super Admin',
        target_user_id: userId, target_user_email: userEmail, details: { new_status: status }
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ admin update-status error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: override token limit
  app.post("/api/admin/override-tokens", requireAdmin, async (req, res) => {
    try {
      const { userId, tokenLimit, reason, userEmail } = req.body;
      if (!userId || tokenLimit === undefined) return res.status(400).json({ error: 'userId and tokenLimit required' });
      const { error } = await supabaseAdmin.from('user_token_overrides').upsert({
        user_id: userId, token_limit: tokenLimit,
        override_reason: reason || 'Admin adjustment', overridden_by: 'Super Admin', is_active: true
      });
      if (error) throw error;
      await supabaseAdmin.from('admin_audit_logs').insert({
        action_type: 'token_override', performed_by: 'Super Admin',
        target_user_id: userId, target_user_email: userEmail, details: { new_limit: tokenLimit, reason }
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ admin override-tokens error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: save token policies
  app.post("/api/admin/save-token-policies", requireAdmin, async (req, res) => {
    try {
      const { policies } = req.body;
      for (const [planId, tokens] of Object.entries(policies as Record<string, number>)) {
        const update = planId === 'trial' ? { trial_tokens: tokens } : { monthly_tokens: tokens };
        await supabaseAdmin.from('token_policies').update(update).eq('plan_id', planId);
      }
      await supabaseAdmin.from('admin_audit_logs').insert({
        action_type: 'token_policy_update', performed_by: 'Super Admin',
        target_user_id: null, details: policies
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ admin save-token-policies error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USER PROFILE & COURSE SELECTION
  // ═══════════════════════════════════════════════════════════════════════════


  // Get user profile (for dashboard course display)
  app.get("/api/user/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("full_name, specialty, selected_course, profession, current_stage")
        .eq("user_id", userId)
        .single();
      if (error) return res.status(400).json({ error: error.message });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user profile by email (for dashboard when using custom auth)
  app.get("/api/user/profile-by-email", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) return res.status(400).json({ error: "email is required" });
      
      // Look up user_id from auth.users via email
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) return res.status(400).json({ error: authError.message });
      
      const authUser = authData?.users?.find((u: any) => u.email === email);
      if (!authUser) return res.status(404).json({ error: "User not found" });
      
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("user_id, full_name, specialty, selected_course, profession, current_stage")
        .eq("user_id", authUser.id)
        .single();
      if (error) return res.status(400).json({ error: error.message });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update selected course
  app.put("/api/user/course", async (req, res) => {
    try {
      const { userId, email, selectedCourse } = req.body;
      if ((!userId && !email) || !selectedCourse) {
        return res.status(400).json({ error: "userId or email, and selectedCourse are required" });
      }
      
      let targetUserId = userId;
      
      // If email provided, look up user_id from auth.users
      if (email && !userId) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) return res.status(400).json({ error: authError.message });
        
        const authUser = authData?.users?.find((u: any) => u.email === email);
        if (!authUser) return res.status(404).json({ error: "User not found for email" });
        targetUserId = authUser.id;
      }
      
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ selected_course: selectedCourse })
        .eq("user_id", targetUserId);
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true, selected_course: selectedCourse });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create or update user profile (bypasses RLS for sign-up)
  app.post("/api/user/profile", async (req, res) => {
    try {
      const profileData = req.body;
      if (!profileData.user_id) return res.status(400).json({ error: "user_id is required" });

      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error("❌ Profile upsert error:", error.message);
        return res.status(500).json({ error: error.message });
      }

      console.log(`✅ User profile created/updated for ${profileData.user_id}`);
      res.json(data);
    } catch (error: any) {
      console.error("❌ Profile creation failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION MANAGEMENT (bypasses RLS via supabaseAdmin)
  // ═══════════════════════════════════════════════════════════════════════════

  // Create a trial subscription for a new user (called during sign-up)
  app.post("/api/user/subscription", async (req, res) => {
    try {
      const { userId, planId, isTrial, trialStartDate, trialEndDate } = req.body;
      if (!userId) return res.status(400).json({ error: "userId is required" });

      const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: userId,
          plan_id: planId || 'trial',
          status: 'active',
          is_trial: isTrial !== undefined ? isTrial : true,
          trial_start_date: trialStartDate || new Date().toISOString(),
          trial_end_date: trialEndDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          start_date: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error("❌ Subscription upsert error:", error.message);
        // Fallback: try insert if upsert fails (no unique constraint on user_id)
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan_id: planId || 'trial',
            status: 'active',
            is_trial: isTrial !== undefined ? isTrial : true,
            trial_start_date: trialStartDate || new Date().toISOString(),
            trial_end_date: trialEndDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            start_date: new Date().toISOString(),
          })
          .select()
          .single();
        if (insertError) {
          console.error("❌ Subscription insert error:", insertError.message);
          return res.status(500).json({ error: insertError.message });
        }
        console.log(`✅ Trial subscription created (insert) for user ${userId}`);
        return res.json(insertData);
      }

      console.log(`✅ Trial subscription created for user ${userId}`);
      res.json(data);
    } catch (error: any) {
      console.error("❌ Subscription creation failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Get a user's active subscription (bypasses RLS for reliable reads)
  app.get("/api/user/subscription/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ error: "userId is required" });

      const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .select("plan_id, is_trial, trial_end_date, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // No active subscription found — auto-create a 15-day trial
        console.log(`📋 No subscription for user ${userId}, auto-creating trial...`);
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
        const trialSub = {
          user_id: userId,
          plan_id: 'trial',
          is_trial: true,
          trial_start_date: now.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          start_date: now.toISOString(),
          status: 'active'
        };
        const { data: newSub, error: insertError } = await supabaseAdmin
          .from("subscriptions")
          .insert(trialSub)
          .select("plan_id, is_trial, trial_end_date, status")
          .single();
        if (insertError) {
          console.error(`❌ Failed to auto-create trial for ${userId}:`, insertError.message);
          return res.json({ plan_id: 'free', is_trial: false, trial_end_date: null, status: 'active' });
        }
        console.log(`✅ Auto-created 15-day trial for user ${userId}`);
        return res.json(newSub);
      }

      // Check if trial has expired
      if (data.plan_id === 'trial' && data.trial_end_date) {
        const trialEnd = new Date(data.trial_end_date);
        if (trialEnd < new Date()) {
          // Trial expired → auto-downgrade to free
          await supabaseAdmin
            .from("subscriptions")
            .update({ plan_id: 'free', is_trial: false, status: 'active' })
            .eq("user_id", userId)
            .eq("plan_id", "trial");
          console.log(`⏰ Trial expired for user ${userId}, downgraded to free`);
          return res.json({ plan_id: 'free', is_trial: false, trial_end_date: data.trial_end_date, status: 'active', trial_expired: true });
        }
      }

      res.json(data);
    } catch (error: any) {
      console.error("❌ Subscription fetch error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Update subscription plan (for admin or upgrade flows)
  app.put("/api/user/subscription", async (req, res) => {
    try {
      const { userId, planId, isTrial } = req.body;
      if (!userId || !planId) return res.status(400).json({ error: "userId and planId are required" });

      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({ plan_id: planId, is_trial: isTrial || false })
        .eq("user_id", userId)
        .eq("status", "active");

      if (error) {
        console.error("❌ Subscription update error:", error.message);
        return res.status(500).json({ error: error.message });
      }

      console.log(`✅ Subscription updated to ${planId} for user ${userId}`);
      res.json({ success: true, plan_id: planId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USER TOKEN BALANCE (for dashboard display)
  // ═══════════════════════════════════════════════════════════════════════════

  app.get("/api/user/token-balance/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ error: "userId is required" });

      // 1. Get user's active subscription to determine plan
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("plan_id, is_trial, trial_end_date, start_date, end_date, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const planId = sub?.plan_id || 'free';

      // 2. Get token policy for this plan
      const { data: policy } = await supabaseAdmin
        .from("token_policies")
        .select("monthly_tokens, trial_tokens")
        .eq("plan_id", planId)
        .single();

      // 3. Check for per-user token override
      const { data: override } = await supabaseAdmin
        .from("user_token_overrides")
        .select("token_limit, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      // 4. Calculate total monthly allocation
      let monthlyAllocation = 0;
      if (override?.token_limit) {
        monthlyAllocation = override.token_limit;
      } else if (policy) {
        monthlyAllocation = sub?.is_trial ? (policy.trial_tokens || policy.monthly_tokens) : policy.monthly_tokens;
      } else {
        // Fallback defaults by plan
        const defaults: Record<string, number> = { trial: 100000, free: 10000, standard: 100000, premium: 300000 };
        monthlyAllocation = defaults[planId] || 10000;
      }

      // 5. Sum tokens used this calendar month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: usageLogs } = await supabaseAdmin
        .from("token_usage_logs")
        .select("tokens_used")
        .eq("user_id", userId)
        .gte("used_at", monthStart)
        .lte("used_at", monthEnd);

      const tokensUsed = (usageLogs || []).reduce((sum: number, row: any) => sum + (row.tokens_used || 0), 0);
      const tokensRemaining = Math.max(0, monthlyAllocation - tokensUsed);

      // 6. Compute subscription expiry
      let subscriptionExpiry: string | null = null;
      if (sub?.is_trial && sub?.trial_end_date) {
        subscriptionExpiry = sub.trial_end_date;
      } else if (sub?.end_date) {
        subscriptionExpiry = sub.end_date;
      }

      res.json({
        plan_id: planId,
        is_trial: sub?.is_trial || false,
        monthly_allocation: monthlyAllocation,
        tokens_used: tokensUsed,
        tokens_remaining: tokensRemaining,
        usage_percentage: monthlyAllocation > 0 ? Math.round((tokensUsed / monthlyAllocation) * 100) : 0,
        subscription_start: sub?.start_date || null,
        subscription_expiry: subscriptionExpiry,
        subscription_status: sub?.status || 'none',
        has_override: !!override?.token_limit
      });
    } catch (error: any) {
      console.error("❌ Token balance fetch error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT (Single Device Login Enforcement)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Check if a user has an active session before login
  app.get("/api/auth/session-status", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) return res.status(400).json({ error: "email is required" });
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError || !authData.users) return res.json({ hasActiveSession: false });
      
      const authUser = authData.users.find((u: any) => u.email === email);
      if (!authUser) return res.json({ hasActiveSession: false });
      
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("active_session_id")
        .eq("user_id", authUser.id)
        .single();
        
      if (error || !data) return res.json({ hasActiveSession: false });
      
      res.json({ hasActiveSession: !!data.active_session_id, activeSessionId: data.active_session_id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Register a new session after successful login
  app.post("/api/auth/session/register", async (req, res) => {
    try {
      const { email, sessionId, deviceId } = req.body;
      if (!email || !sessionId) return res.status(400).json({ error: "email and sessionId required" });
      
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authData?.users?.find((u: any) => u.email === email);
      if (!authUser) return res.status(404).json({ error: "User not found" });
      
      // Use upsert to handle cases where user profile might not exist yet
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .upsert({ 
          user_id: authUser.id,
          active_session_id: sessionId,
          device_id: deviceId || "unknown",
          last_login_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Validate current session against DB
  app.post("/api/auth/session/validate", async (req, res) => {
    try {
      const { email, sessionId } = req.body;
      if (!email || !sessionId) return res.status(400).json({ error: "email and sessionId required" });
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) {
        console.error("❌ Session validation: auth lookup failed:", authError.message);
        // SECURITY: Fail closed — if we can't verify, deny access
        return res.json({ valid: false, reason: "auth_service_unavailable" });
      }
      const authUser = authData?.users?.find((u: any) => u.email === email);
      if (!authUser) return res.json({ valid: true }); // User not in auth system → allow (custom auth user)

      const { data } = await supabaseAdmin
        .from("user_profiles")
        .select("active_session_id")
        .eq("user_id", authUser.id)
        .single();

      if (!data) return res.json({ valid: true }); // No profile → don't kick out

      // If no session is registered in DB, treat as valid (no competing session)
      if (!data.active_session_id) return res.json({ valid: true });

      // Only invalidate when there's an EXPLICIT mismatch (another device registered a DIFFERENT session)
      res.json({ valid: data.active_session_id === sessionId });
    } catch (error: any) {
      console.error("❌ Session validation error:", error.message);
      // SECURITY: Fail closed on unexpected errors
      res.json({ valid: false, reason: "validation_error" });
    }
  });

  // Logout by clearing the active session
  app.post("/api/auth/session/logout", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "email is required" });
      
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authData?.users?.find((u: any) => u.email === email);
      if (!authUser) return res.json({ success: true });
      
      await supabaseAdmin
        .from("user_profiles")
        .update({ active_session_id: null })
        .eq("user_id", authUser.id);
        
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REFERRAL / AFFILIATE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  // Get a user's referral stats (for dashboard card)
  app.get("/api/referral/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      // Generate a deterministic referral code from the user ID
      // Format: PGM-XXXXXXXX (first 8 chars of userId, uppercased)
      const generateCode = (uid: string) => 'PGM-' + uid.replace(/-/g, '').slice(0, 8).toUpperCase();

      // Try to get existing code from user_profiles
      let referralCode = '';
      try {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles').select('referral_code').eq('user_id', userId).single();
        referralCode = profile?.referral_code || '';
      } catch { /* table may not exist */ }

      // If no code found, generate one and try to save it
      if (!referralCode) {
        referralCode = generateCode(userId);
        try {
          await supabaseAdmin.from('user_profiles')
            .upsert({ user_id: userId, referral_code: referralCode }, { onConflict: 'user_id' });
        } catch { /* save failed, that's ok — code is still generated */ }
      }

      // Count referrals (graceful if tables don't exist)
      let totalReferred = 0;
      let totalSubscribed = 0;
      try {
        const { count: refCount } = await supabaseAdmin
          .from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_user_id', userId);
        totalReferred = refCount || 0;

        const { count: subCount } = await supabaseAdmin
          .from('referrals').select('*', { count: 'exact', head: true })
          .eq('referrer_user_id', userId).eq('status', 'subscribed');
        totalSubscribed = subCount || 0;
      } catch { /* referrals table may not exist */ }

      // Get rewards (graceful)
      let rewards: any[] = [];
      try {
        const { data } = await supabaseAdmin
          .from('referral_rewards').select('*').eq('user_id', userId).eq('status', 'active');
        rewards = data || [];
      } catch { /* rewards table may not exist */ }

      res.json({
        referral_code: referralCode,
        total_referred: totalReferred,
        total_subscribed: totalSubscribed,
        rewards
      });
    } catch (error: any) {
      console.error("❌ referral stats error:", error.message);
      // Even on error, return a generated code so the UI always has something
      const fallbackCode = 'PGM-' + (req.params.userId === 'default' ? '00000000-0000-0000-0000-000000000000' : req.params.userId).replace(/-/g, '').slice(0, 8).toUpperCase();
      res.json({ referral_code: fallbackCode, total_referred: 0, total_subscribed: 0, rewards: [] });
    }
  });

  // Lookup referral code → get referrer user_id
  app.get("/api/referral/lookup/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const { data, error } = await supabase
        .from('user_profiles').select('user_id, full_name').eq('referral_code', code.toUpperCase()).single();
      if (error || !data) return res.json({ found: false });
      res.json({ found: true, referrer_user_id: data.user_id, referrer_name: data.full_name });
    } catch (error: any) {
      res.json({ found: false });
    }
  });

  // Record a new referral (called during sign-up)
  app.post("/api/referral/record", async (req, res) => {
    try {
      const { referrer_user_id, referred_user_id, referral_code, referred_user_email } = req.body;
      const { error } = await supabase.from('referrals').insert({
        referrer_user_id,
        referred_user_id,
        referral_code,
        referred_user_email,
        status: 'signed_up'
      });
      if (error) throw error;
      // Also mark referred_by on the new user's profile
      await supabase.from('user_profiles').update({ referred_by: referrer_user_id }).eq('user_id', referred_user_id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("❌ referral record error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all affiliate partners (sorted by referral count)
  app.get("/api/admin/referral/all-partners", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_referral_partners');
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error("❌ admin referral partners error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get referral summary stats
  app.get("/api/admin/referral/summary", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_referral_summary');
      if (error) throw error;
      res.json(data || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get detailed referrals for a specific user
  app.get("/api/admin/referral/user/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_user_referrals', { p_user_id: (req.params.userId === 'default' ? '00000000-0000-0000-0000-000000000000' : req.params.userId) });
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check and grant rewards for a user based on referral thresholds
  app.post("/api/referral/check-rewards/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { count: totalSubscribed } = await supabase
        .from('referrals').select('*', { count: 'exact', head: true })
        .eq('referrer_user_id', userId).eq('status', 'subscribed');

      const subs = totalSubscribed || 0;
      const rewards: string[] = [];

      // Check 100 threshold → 1 month premium
      if (subs >= 100) {
        const { data: existing } = await supabase
          .from('referral_rewards').select('id').eq('user_id', userId).eq('threshold_reached', 100);
        if (!existing || existing.length === 0) {
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          await supabase.from('referral_rewards').insert({
            user_id: userId, reward_type: 'premium_1_month', threshold_reached: 100, expires_at: expiresAt
          });
          // Upgrade to premium
          await supabase.from('subscriptions')
            .update({ plan_id: 'premium', status: 'active' })
            .eq('user_id', userId);
          rewards.push('premium_1_month');
        }
      }

      // Check 1000 threshold → 1 year premium
      if (subs >= 1000) {
        const { data: existing } = await supabase
          .from('referral_rewards').select('id').eq('user_id', userId).eq('threshold_reached', 1000);
        if (!existing || existing.length === 0) {
          const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          await supabase.from('referral_rewards').insert({
            user_id: userId, reward_type: 'premium_1_year', threshold_reached: 1000, expires_at: expiresAt
          });
          await supabase.from('subscriptions')
            .update({ plan_id: 'premium', status: 'active' })
            .eq('user_id', userId);
          rewards.push('premium_1_year');
        }
      }

      res.json({ total_subscribed: subs, rewards_granted: rewards });
    } catch (error: any) {
      console.error("❌ reward check error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes
  app.get("/api/saved", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('saved_items').select('*').order('date', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/saved", async (req, res) => {
    const { id, title, content, featureId, date } = req.body;
    try {
      const { error } = await supabaseAdmin.from('saved_items').upsert({
        id,
        title,
        content,
        feature_id: featureId,
        date: date || new Date().toISOString()
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/saved/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabaseAdmin.from('saved_items').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER-SIDE SIGNUP — Hybrid approach: Admin API → fallback to signUp
  // Creates user via admin API (no automatic confirmation email from Supabase)
  // Falls back to regular signUp if admin API fails (e.g., network issues)
  // Then sends custom verification email via Resend
  // ═══════════════════════════════════════════════════════════════════════════
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, fullName, mobile, profession, specialty, selectedCourse,
            qualification, currentStage, country, state, city, disclaimerAccepted,
            refReferrerId, refCode } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Email, password, and full name are required" });
    }
    if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email format" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    if (password.length > 128) return res.status(400).json({ error: "Password is too long" });

    // Rate limit registration: 5 per IP per hour
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (rateLimit(`signup:${clientIp}`, 5, 60 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many registration attempts. Please try again later." });
    }

    try {
      let userId: string | undefined;
      let usedAdminApi = false;

      // Strategy 1: Try Admin API (best — no Supabase confirmation email, no rate limits)
      if (supabaseServiceKey) {
        try {
          console.log(`🔑 Attempting admin createUser for: ${email}`);
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false,
            user_metadata: { full_name: fullName }
          });

          if (authError) {
            if (authError.message.includes('already') || authError.message.includes('duplicate') || authError.message.includes('exists')) {
              return res.status(409).json({ error: "An account with this email already exists. Please sign in instead." });
            }
            console.warn(`⚠️ Admin createUser returned error: ${authError.message}. Falling back to signUp.`);
          } else if (authData?.user?.id) {
            userId = authData.user.id;
            usedAdminApi = true;
            console.log(`✅ User created via admin API: ${email} (${userId})`);
          }
        } catch (adminErr: any) {
          console.warn(`⚠️ Admin createUser threw: ${adminErr.message}. Falling back to signUp.`);
        }
      }

      // Strategy 2: Fallback to regular signUp (may trigger Supabase's confirmation email)
      if (!userId) {
        console.log(`🔄 Using fallback signUp for: ${email}`);
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });

        if (signUpErr) {
          console.error(`❌ Signup error: ${signUpErr.message}`);
          // Handle specific Supabase errors with user-friendly messages
          if (signUpErr.message.includes('rate limit')) {
            return res.status(429).json({ error: "Email rate limit exceeded. Please wait a few minutes and try again." });
          }
          if (signUpErr.message.includes('already') || signUpErr.message.includes('exists')) {
            return res.status(409).json({ error: "An account with this email already exists. Please sign in instead." });
          }
          return res.status(400).json({ error: signUpErr.message });
        }

        userId = signUpData.user?.id;
        if (!userId) {
          return res.status(500).json({ error: "Failed to create user account" });
        }

        console.log(`✅ User created via signUp fallback: ${email} (${userId})`);

        // Sign out the session created by signUp (user needs to verify first)
        try { await supabase.auth.signOut(); } catch {}
      }

      // 2. Create user profile (bypasses RLS via admin client)
      try {
        await supabaseAdmin.from("user_profiles").upsert({
          user_id: userId,
          full_name: validateString(fullName, 'fullName', 200),
          mobile: validateString(mobile, 'mobile', 20),
          profession: validateString(profession, 'profession', 100),
          specialty: validateString(specialty, 'specialty', 100),
          selected_course: selectedCourse || null,
          highest_qualification: validateString(qualification, 'qualification', 200),
          current_stage: currentStage || 'studying',
          country: validateString(country, 'country', 100),
          state: validateString(state, 'state', 100),
          city: validateString(city, 'city', 100),
          account_status: 'active',
          email_verified: false,
          disclaimer_accepted: disclaimerAccepted || false,
          terms_accepted: true,
        }, { onConflict: 'user_id' });
        console.log(`✅ User profile created for ${userId}`);
      } catch (profileErr: any) {
        console.error("⚠️ Profile creation warning:", profileErr.message);
      }

      // 3. Create trial subscription
      try {
        await supabaseAdmin.from("subscriptions").upsert({
          user_id: userId,
          plan_id: 'trial',
          status: 'active',
          is_trial: true,
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          start_date: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        console.log(`✅ Trial subscription created for ${userId}`);
      } catch (subErr: any) {
        console.error("⚠️ Subscription creation warning:", subErr.message);
      }

      // 4. Generate referral code
      try {
        const { data: existingRef } = await supabaseAdmin
          .from("referrals")
          .select("referral_code")
          .eq("user_id", userId)
          .single();
        if (!existingRef) {
          const code = fullName.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() +
                       Math.random().toString(36).slice(2, 6).toUpperCase();
          await supabaseAdmin.from("referrals").insert({
            user_id: userId,
            referral_code: code,
          });
        }
      } catch {}

      // 5. Record referral if they came via a referral link
      if (refReferrerId && refCode) {
        try {
          await supabaseAdmin.from("referral_records").insert({
            referrer_user_id: refReferrerId,
            referred_user_id: userId,
            referral_code: refCode,
            referred_user_email: email,
          });
        } catch (refErr: any) {
          console.error("⚠️ Referral record warning:", refErr.message);
        }
      }

      // 6. Send verification email via Resend (only if admin API was used OR as a supplement)
      //    If signUp fallback was used, Supabase may have sent its own email, but we send ours too
      let verificationSent = false;
      if (resend) {
        try {
          const verifyToken = crypto.randomBytes(32).toString('hex');
          const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
          verificationTokenStore.set(verifyToken, { email, userId: userId!, expiresAt });
          
          const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${verifyToken}`;
          const userName = escapeHtml(fullName || "Doctor");
          
          await resend.emails.send({
            from: EMAIL_FROM,
            to: [email],
            subject: `Verify your email – PGMentor`,
            html: emailWrapper("Verify Your Email", `
              <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Verify Your Email Address ✉️</h2>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
                Hi <strong>${userName}</strong>, thank you for creating a PGMentor account! 
                Please verify your email address to activate your account and start your learning journey.
              </p>
              
              <div style="text-align:center;margin:32px 0;">
                <a href="${verifyUrl}" style="display:inline-block;background-color:#059669;color:#fff;text-decoration:none;padding:16px 48px;border-radius:12px;font-weight:700;font-size:16px;">
                  ✅ Verify My Email
                </a>
              </div>
              
              <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin:0 0 24px 0;">
                <p style="color:#64748b;font-size:13px;margin:0 0 8px 0;">Or copy and paste this link in your browser:</p>
                <p style="color:#3b82f6;font-size:12px;margin:0;word-break:break-all;">${verifyUrl}</p>
              </div>
              
              <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:0 0 20px 0;">
                <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                  ⚠️ This link expires in <strong>24 hours</strong>. If you didn't create an account, please ignore this email.
                </p>
              </div>
              
              <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">
                Once verified, you can sign in and start exploring PGMentor's AI-powered medical education tools.
              </p>
            `)
          });
          verificationSent = true;
          console.log(`📧 Verification email sent to: ${email}`);
        } catch (emailErr: any) {
          console.error("⚠️ Verification email failed:", emailErr.message);
        }
      }

      res.json({ 
        success: true, 
        userId, 
        verificationSent,
        usedAdminApi,
        message: "Account created successfully. Please check your email to verify your account."
      });
    } catch (error: any) {
      console.error("❌ Signup failed:", error.message, error.stack?.slice(0, 500));
      res.status(500).json({ error: "An unexpected error occurred. Please try again." });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email format" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    if (password.length > 128) return res.status(400).json({ error: "Password is too long" });

    // Rate limit registration: 5 per IP per hour
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (rateLimit(`register:${clientIp}`, 5, 60 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many registration attempts. Please try again later." });
    }

    try {
      // Hash the password before storing
      const { createHash, randomBytes } = await import('crypto');
      const salt = randomBytes(16).toString('hex');
      const hashedPassword = createHash('sha256').update(password + salt).digest('hex');

      const { data, error } = await supabase.from('users').insert({
        email,
        password: `${salt}:${hashedPassword}` // Store as salt:hash
      }).select('id').single();
      if (error) throw error;
      res.json({ success: true, userId: data.id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    // Rate limit login: 10 attempts per IP per 15 minutes
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (rateLimit(`login:${clientIp}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many login attempts. Please try again later." });
    }

    try {
      const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
      if (error || !user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Support both hashed (salt:hash) and legacy plaintext passwords
      let isValidPassword = false;
      if (user.password && user.password.includes(':')) {
        // Hashed password format: salt:hash
        const [salt, storedHash] = user.password.split(':');
        const { createHash } = await import('crypto');
        const inputHash = createHash('sha256').update(password + salt).digest('hex');
        isValidPassword = inputHash === storedHash;
      } else {
        // Legacy plaintext comparison (TODO: migrate all users to hashed passwords)
        isValidPassword = user.password === password;
      }

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Don't send password hash back to client
      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const { data, error } = await supabase.from('users').select('id, email, role, created_at');
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/analytics", async (req, res) => {
    try {
      // In Supabase SQL we'd use grouping or an RPC.
      // Easiest is to fetch all and group in JS, or use a view/rpc.
      // Let's just group in JS for simplicity since it's a small app
      const { data, error } = await supabase.from('usage_logs').select('feature');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((log: any) => {
        counts[log.feature] = (counts[log.feature] || 0) + 1;
      });
      const logs = Object.keys(counts).map(feature => ({ feature, count: counts[feature] }));
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/logs", async (req, res) => {
        const { userId, feature } = req.body;
    try {
      const { error } = await supabaseAdmin.from('usage_logs').insert({ user_id: userId, feature });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Knowledge & Learning Resources Routes
  app.get("/api/knowledge", async (req, res) => {
    try {
      const { data, error } = await supabase.from('knowledge_library').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge", async (req, res) => {
    const { id, user_id, title, content, course, paper, section, topic } = req.body;
    try {
      const { error } = await supabase.from('knowledge_library').upsert({
        id, user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), title, content, course, paper, section, topic
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/essays", async (req, res) => {
    try {
      const { data, error } = await supabase.from('essay_library').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/essays", async (req, res) => {
    const { id, user_id, title, content, course, paper, section, topic } = req.body;
    try {
      const { error } = await supabase.from('essay_library').upsert({
        id, user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), title, content, course, paper, section, topic
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/essays/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('essay_library').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mcqs", async (req, res) => {
    try {
      const { data, error } = await supabase.from('mcq_library').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mcqs", async (req, res) => {
    const { id, user_id, title, question, options, correct_answer, course, paper, section, topic } = req.body;
    try {
      const { error } = await supabase.from('mcq_library').upsert({
        id, user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), title, question, options, correct_answer, course, paper, section, topic
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/flashcards", async (req, res) => {
    try {
      const { data, error } = await supabase.from('flash_cards').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/flashcards", async (req, res) => {
    const { id, user_id, title, front_content, back_content, course, paper, section, topic } = req.body;
    try {
      const { error } = await supabase.from('flash_cards').upsert({
        id, user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), title, front_content, back_content, course, paper, section, topic
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



  app.post("/api/question-paper", async (req, res) => {
    const { id, user_id, paper_number, topic, content, date, reference_content } = req.body;
    try {
      // Save to specialized table
      const { error } = await supabase.from('question_paper_generator').upsert({
        id, 
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), 
        paper_number, 
        topic, 
        generated_question_paper: content, 
        model_question_paper: reference_content,
        date: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on question_paper_generator upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = topic === 'Reference Paper' ? `Reference Paper: ${paper_number || 'N/A'}` : `Question Paper: ${topic || 'Generated'}`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'question-paper',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- STATE MANAGEMENT ROUTES (Replacing LocalStorage) ---

  // Curriculum State
  app.get("/api/state/curriculum/:userId", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('user_curriculum')
        .select('*').eq('user_id', (req.params.userId === 'default' ? '00000000-0000-0000-0000-000000000000' : req.params.userId)).single();
      
      if (error && error.code !== 'PGRST116') throw error; // ignore no-row error
      res.json({ data: data?.data || null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/state/curriculum", async (req, res) => {
    try {
      const { user_id, data } = req.body;
      const dataStr = JSON.stringify(data);
      const GLOBAL_DEFAULT_ID = '00000000-0000-0000-0000-000000000000';
      const resolvedUserId = (user_id === 'default' || !user_id) ? GLOBAL_DEFAULT_ID : user_id;
      const hasGeneratedContent = dataStr.includes('generatedContent') || dataStr.includes('generatedEssayContent') || dataStr.includes('generatedMcqContent') || dataStr.includes('generatedFlashCardsContent');
      console.log(`📥 Saving curriculum for user: ${resolvedUserId}, data length: ${dataStr.length}, hasNotes: ${dataStr.includes('generatedContent')}, hasEssay: ${dataStr.includes('generatedEssayContent')}, hasMcq: ${dataStr.includes('generatedMcqContent')}, hasFlash: ${dataStr.includes('generatedFlashCardsContent')}`);
      
      // Save curriculum for the specific user
      const { error } = await supabaseAdmin.from('user_curriculum').upsert({
        user_id: resolvedUserId,
        data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) {
        console.error('❌ Curriculum save error:', error);
        throw error;
      }

      // ─────────────────────────────────────────────────────────────────────
      // KNOWLEDGE LIBRARY SYNC:
      // If the curriculum contains generated content AND was saved by a real
      // user (not already the global default), also publish it as the global
      // default so the Knowledge Library (/api/state/curriculum/default) can
      // access admin-generated LMS notes for all students.
      // ─────────────────────────────────────────────────────────────────────
      if (hasGeneratedContent && resolvedUserId !== GLOBAL_DEFAULT_ID) {
        try {
          const { error: globalError } = await supabaseAdmin.from('user_curriculum').upsert({
            user_id: GLOBAL_DEFAULT_ID,
            data,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
          if (globalError) {
            console.warn('⚠️ Global curriculum KL sync failed:', globalError.message);
          } else {
            console.log('🌍 Curriculum also published as global default (Knowledge Library sync)');
          }
        } catch (syncErr: any) {
          console.warn('⚠️ Global curriculum sync exception:', syncErr.message);
        }
      }

      console.log('✅ Curriculum saved successfully');
      res.json({ success: true });
    } catch (error: any) {
      console.error('❌ Curriculum save exception:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // NOTE: Contacts State routes (first copy using user_contacts table) removed —
  // duplicate of routes at line ~2193 that use the contacts_management table instead.


  app.get("/api/essay-generator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('essay_generator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/essay-generator", async (req, res) => {
    const { id, user_id, topic, type, content, date } = req.body;
    try {
      // Save to specialized table
      const { error } = await supabase.from('essay_generator').upsert({
        id, 
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), 
        topic, 
        type: type || 'long', 
        content, 
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on essay_generator upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = topic ? `Essay: ${topic}` : `Generated Essay`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'essay-generator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Notes Generator Routes ──────────────────────────────────────────────
  app.get("/api/notes-generator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('notes_generator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/notes-generator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase.from('notes_generator').select('*').eq('id', id).single();
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notes-generator", async (req, res) => {
    const { id, user_id, title, course, topic, notes_type, format, special_instructions, content, date } = req.body;
    try {
      const { error } = await supabase.from('notes_generator').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        title: title || `Notes: ${topic}`,
        course: course || '',
        topic: topic || '',
        notes_type: notes_type || 'clinical-notes',
        format: format || 'structured',
        special_instructions: special_instructions || '',
        content,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on notes_generator upsert:", error.message);
      }

      // Also save to generic saved_items for dashboard visibility
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: title || `Notes: ${topic}`,
        content: content,
        feature_id: 'notes-generator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving notes-generator to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/notes-generator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('notes_generator').delete().eq('id', id);
      if (error) throw error;
      await supabase.from('saved_items').delete().eq('id', id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── MCQ Generator Routes ────────────────────────────────────────────────
  app.get("/api/mcq-generator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('mcq_generator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mcq-generator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase.from('mcq_generator').select('*').eq('id', id).single();
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mcq-generator", async (req, res) => {
    const { id, user_id, title, course, topic, question_type, difficulty, mcq_count, content, date } = req.body;
    try {
      const { error } = await supabase.from('mcq_generator').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        title: title || `MCQs: ${topic}`,
        course: course || '',
        topic: topic || '',
        question_type: question_type || 'single-best',
        difficulty: difficulty || 'mixed',
        mcq_count: mcq_count || 10,
        content,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on mcq_generator upsert:", error.message);
      }

      // Also save to generic saved_items for dashboard visibility
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: title || `MCQs: ${topic}`,
        content: content,
        feature_id: 'mcq-generator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving mcq-generator to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/mcq-generator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('mcq_generator').delete().eq('id', id);
      if (error) throw error;
      await supabase.from('saved_items').delete().eq('id', id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/seminar-builder", async (req, res) => {
    try {
      const { data, error } = await supabase.from('seminar_builder').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/seminar-builder/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase.from('seminar_builder').select('*').eq('id', id).single();
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/seminar-builder", async (req, res) => {
    const { id, user_id, discipline, topic, ppt_structure, detailed_notes, date, title, content } = req.body;
    try {
      // Save directly to specialized table
      // seminar_builder table has: id, user_id, discipline, topic, ppt_slides (JSONB), detailed_notes, created_at
      const { error } = await supabase.from('seminar_builder').upsert({
        id, 
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), 
        discipline, 
        topic,
        ppt_slides: ppt_structure ? JSON.parse(ppt_structure) : null,
        detailed_notes,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on seminar_builder upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the existing generic dashboards
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: title,
        content: content,
        feature_id: 'seminar-builder',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/seminar-builder/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('seminar_builder').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/journal-club", async (req, res) => {
    try {
      const { data, error } = await supabase.from('journal_club').select('*').order('date', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/journal-club/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase.from('journal_club').select('*').eq('id', id).single();
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/journal-club", async (req, res) => {
    const { id, user_id, discipline, topic, criteria, ppt_structure, detailed_notes, date, title, content } = req.body;
    try {
      // Save directly to specialized table
      // journal_club table has: id, user_id, discipline, topic, criteria, ppt_structure (TEXT), detailed_notes, date
      const { error } = await supabase.from('journal_club').upsert({
        id, 
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), 
        discipline, 
        topic, 
        criteria, 
        ppt_structure, 
        detailed_notes,
        date: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on journal_club upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the existing generic dashboards
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: title,
        content: content,
        feature_id: 'journal-club',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/journal-club/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('journal_club').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Protocol Generator Routes
  app.get("/api/protocol-generator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('protocol_generator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/protocol-generator", async (req, res) => {
    const { id, user_id, topic, content, date } = req.body;
    try {
      // Save to specialized protocol_generator table
      const { error } = await supabase.from('protocol_generator').upsert({
        id, 
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), 
        topic, 
        content, 
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on protocol_generator upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = topic ? `Protocol: ${topic}` : `Generated Protocol`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'protocol-generator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/protocol-generator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('protocol_generator').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Manuscript Generator Routes
  app.get("/api/manuscript-generator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('manuscript_generator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/manuscript-generator", async (req, res) => {
    const { id, user_id, topic, content, date } = req.body;
    try {
      const { error } = await supabase.from('manuscript_generator').upsert({
        id, 
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), 
        topic, 
        content, 
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on manuscript_generator upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      const titleText = topic ? `Manuscript: ${topic}` : `Generated Manuscript`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'manuscript-generator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/manuscript-generator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('manuscript_generator').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // StatAssist Routes
  app.get("/api/statassist", async (req, res) => {
    try {
      const { data, error } = await supabase.from('statassist').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/statassist", async (req, res) => {
    const { id, user_id, study_title, methods, results, content, date } = req.body;
    try {
      const { error } = await supabase.from('statassist').upsert({
        id, 
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), 
        study_title,
        methods,
        results,
        content,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on statassist upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      const titleText = study_title ? `StatAssist: ${study_title}` : `Statistical Analysis`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'stat-assist',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/statassist/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('statassist').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Exam Preparation System Routes
  app.get("/api/ai-exam-prep", async (req, res) => {
    try {
      const { data, error } = await supabase.from('ai_exam_preparation_system').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai-exam-prep", async (req, res) => {
    const { id, user_id, course_id, analytics, content, date } = req.body;
    try {
      const { error } = await supabase.from('ai_exam_preparation_system').upsert({
        id, 
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), 
        course_id,
        analytics: analytics || null,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on ai_exam_preparation_system upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = course_id ? `Exam Prep: ${course_id}` : `Exam Preparation System`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content || JSON.stringify(analytics),
        feature_id: 'ai-exam-prep',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/ai-exam-prep/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('ai_exam_preparation_system').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // NOTE: Resume Builder routes (first copy) removed — duplicate of routes at line ~2083
  // The second copy (kept below) has better default value handling.

  // Reflection Generator Routes
  app.get("/api/reflection-generator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('reflection_generator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reflection-generator", async (req, res) => {
    const { id, user_id, subject, topic, content, date } = req.body;
    try {
      const { error } = await supabase.from('reflection_generator').upsert({
        id, 
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id), 
        subject,
        topic, 
        content, 
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on reflection_generator upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = topic ? `Reflection: ${topic}` : `Generated Reflection`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content,
        feature_id: 'reflection-generator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/reflection-generator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('reflection_generator').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clinical Decision Support System Routes
  app.get("/api/clinical-decision-support", async (req, res) => {
    try {
      const { data, error } = await supabase.from('clinical_decision_support_system').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clinical-decision-support", async (req, res) => {
    const { id, user_id, patient_data, recommendations, date } = req.body;
    try {
      const { error } = await supabase.from('clinical_decision_support_system').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        patient_data,
        recommendations,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on clinical_decision_support_system upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table
      const titleText = `Clinical Decision Support`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: recommendations,
        feature_id: 'clinical-decision-support',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/clinical-decision-support/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('clinical_decision_support_system').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // NOTE: Blog Publications routes (first copy) removed — duplicate of routes at line ~2928
  // The second copy (kept below) has better error logging and returns saved data.

  // Doubt Solver Routes
  app.get("/api/doubt-solver", async (req, res) => {
    try {
      const { data, error } = await supabase.from('doubt_solver').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/doubt-solver", async (req, res) => {
    const { id, user_id, topic, style, depth, explanation, date } = req.body;
    try {
      const { error } = await supabase.from('doubt_solver').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        topic,
        style,
        depth,
        explanation,
        title: `Doubt: ${(topic || '').slice(0, 60)}`,
        content: explanation,
        feature_id: 'doubt-solver',
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on doubt_solver upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = topic ? `Doubt: ${topic.slice(0, 60)}` : `Doubt Solver`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: explanation,
        feature_id: 'doubt-solver',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/doubt-solver/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('doubt_solver').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resume Builder Routes
  app.get("/api/resume-builder", async (req, res) => {
    try {
      const { data, error } = await supabase.from('resume_builder').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/resume-builder", async (req, res) => {
    const { id, user_id, full_name, professional_title, email, phone, location, linkedin, summary,
            education, experience, skills, publications, certifications, awards, memberships, conferences,
            selected_template, title, content, feature_id, date } = req.body;
    try {
      // Save to dedicated resume_builder table
      const { error } = await supabase.from('resume_builder').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        full_name: full_name || '',
        professional_title: professional_title || '',
        email: email || '',
        phone: phone || '',
        location: location || '',
        linkedin: linkedin || '',
        summary: summary || '',
        education: education || [],
        experience: experience || [],
        skills: skills || [],
        publications: publications || [],
        certifications: certifications || [],
        awards: awards || [],
        memberships: memberships || [],
        conferences: conferences || [],
        selected_template: selected_template || 'classic',
        title: title || `Resume: ${full_name}`,
        content: content || '',
        feature_id: feature_id || 'resume-builder',
        created_at: date || new Date().toISOString()
      });
      if (error) throw error;

      // Also save to saved_items for dashboard library
      await supabase.from('saved_items').upsert({
        id,
        title: title || `Resume: ${full_name}`,
        content: content || '',
        feature_id: feature_id || 'resume-builder',
        date: date || new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/resume-builder/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('resume_builder').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Scientific Session Search Routes
  app.get("/api/scientific-session-search", async (req, res) => {
    try {
      const { data, error } = await supabase.from('scientific_session_search').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scientific-session-search", async (req, res) => {
    const { id, user_id, subject, topic, region, month, results, date, title, content, featureId } = req.body;
    try {
      // Save to dedicated table
      const { error } = await supabase.from('scientific_session_search').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        subject: subject || '',
        topic: topic || '',
        region: region || '',
        month: month || '',
        results: typeof results === 'string' ? results : JSON.stringify(results),
        created_at: date || new Date().toISOString()
      });
      if (error) throw error;

      // Also save to saved_items for dashboard library
      await supabase.from('saved_items').upsert({
        id,
        title: title || `Session Search: ${subject}`,
        content: content || (typeof results === 'string' ? results : JSON.stringify(results)),
        feature_id: featureId || 'session-search',
        date: date || new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/scientific-session-search/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('scientific_session_search').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contacts Management Routes
  app.get("/api/contacts-management", async (req, res) => {
    try {
      const { data, error } = await supabase.from('contacts_management').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contacts-management", async (req, res) => {
    const { id, user_id, name, designation, organization, email, phone, website, address } = req.body;
    try {
      const { error } = await supabase.from('contacts_management').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        name,
        designation,
        organization,
        email,
        phone,
        website,
        address,
        created_at: new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on contacts_management upsert:", error.message); // Fallback: proceed to save in saved_items
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/contacts-management/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('contacts_management').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // State route for contacts (saves all contacts + personal card, and syncs to contacts_management table)
  app.get("/api/state/contacts/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase.from('contacts_management').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      // Return contacts in the shape the frontend expects
      const contacts = (data || []).filter((c: any) => c.designation !== '__personal_card__');
      const personalCardRow = (data || []).find((c: any) => c.designation === '__personal_card__');
      const personal_card = personalCardRow ? {
        name: personalCardRow.name,
        designation: personalCardRow.organization ? personalCardRow.name : 'Medical Professional',
        organization: personalCardRow.organization,
        email: personalCardRow.email,
        phone: personalCardRow.phone,
        website: personalCardRow.website,
        address: personalCardRow.address
      } : null;
      res.json({ contacts, personal_card });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/state/contacts", async (req, res) => {
    const { user_id, contacts, personal_card } = req.body;
    try {
      // Save each contact individually to contacts_management table
      if (contacts && Array.isArray(contacts)) {
        for (const contact of contacts) {
          const contactId = contact.id || `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const { error } = await supabase.from('contacts_management').upsert({
            id: contactId,
            user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
            name: contact.name || '',
            designation: contact.designation || '',
            organization: contact.organization || '',
            email: contact.email || '',
            phone: contact.phone || '',
            website: contact.website || '',
            address: contact.address || '',
            created_at: contact.created_at || new Date().toISOString()
          });
          if (error) {
            console.error("Error upserting contact:", contactId, error);
          } else {
            console.log("Contact saved:", contactId, contact.name);
          }
        }
      }

      // Save personal card as a special entry
      if (personal_card) {
        const { error } = await supabase.from('contacts_management').upsert({
          id: `personal-card-${(user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id)}`,
          user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
          name: personal_card.name || 'Your Name',
          designation: '__personal_card__',
          organization: personal_card.organization || '',
          email: personal_card.email || '',
          phone: personal_card.phone || '',
          website: personal_card.website || '',
          address: personal_card.address || '',
          created_at: new Date().toISOString()
        });
        if (error) {
          console.error("Error upserting personal card:", error);
        } else {
          console.log("Personal card saved");
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving contacts state:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Digital Diary Routes
  app.get("/api/digital-diary", async (req, res) => {
    try {
      const { data, error } = await supabase.from('digital_diary').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/digital-diary", async (req, res) => {
    const { id, user_id, entry_date, content, action_items, date } = req.body;
    try {
      const { error } = await supabase.from('digital_diary').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        entry_date: entry_date || new Date().toISOString(),
        content,
        action_items,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on digital_diary upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleName = "Digital Diary Entry";
      await supabase.from('saved_items').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        feature_id: 'digital-diary',
        title: titleName,
        content: content,
        date: date || new Date().toISOString()
      });

      res.json({ success: true, id });
    } catch (error: any) {
      console.error("Error saving diary:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Prescription Analyser Report Save Route
  app.post("/api/prescription-analyser", async (req, res) => {
    const { id, user_id, prescription_data, analysis, date } = req.body;
    try {
      // First try to insert into prescription_reports if the table exists
      const { error } = await supabase.from('prescription_reports').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        prescription_data,
        analysis,
        created_at: date || new Date().toISOString()
      });
      
      if (error) {
        console.error("Supabase Error on prescription_reports upsert:", error.message);
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleName = "Prescription Analysis Report";
      await supabase.from('saved_items').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        feature_id: 'prescription-analyser',
        title: titleName,
        content: `**Prescription Analysis**\n\n${analysis}`,
        date: date || new Date().toISOString()
      });

      res.json({ success: true, id });
    } catch (error: any) {
      console.error("Error saving prescription analysis:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/digital-diary/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('digital_diary').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Drug Treatment Assistant Routes
  app.get("/api/drug-treatment-assistant", async (req, res) => {
    try {
      const { data, error } = await supabase.from('drug_treatment_assistant').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/drug-treatment-assistant", async (req, res) => {
    const { id, user_id, query, drug_name, condition, patient_context, mode, style, response, date } = req.body;
    try {
      const titleText = `Drug: ${(query || drug_name || 'Untitled').slice(0, 60)}`;
      const { error } = await supabase.from('drug_treatment_assistant').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        query,
        drug_name,
        condition,
        patient_context,
        mode,
        style,
        response,
        title: titleText,
        content: response,
        feature_id: 'drug-treatment-assistant',
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on drug_treatment_assistant upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: response,
        feature_id: 'drug-treatment-assistant',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/drug-treatment-assistant/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('drug_treatment_assistant').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Saved Guidelines Routes
  app.get("/api/guidelines/saved", async (req, res) => {
    try {
      const { data, error } = await supabase.from('saved_guidelines').select('*').order('savedAt', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/guidelines/saved", async (req, res) => {
    const { id, userId, conditionName, title, organization, publicationYear, sourceUrl, category, summary, notes } = req.body;
    try {
      const { error } = await supabase.from('saved_guidelines').upsert({
        id,
        userId: (userId === 'default' || !userId ? '00000000-0000-0000-0000-000000000000' : userId),
        conditionName,
        title,
        organization,
        publicationYear,
        sourceUrl,
        category,
        summary,
        notes
      });
      if (error) {
        console.error("Supabase Error on saved_guidelines upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: `Guideline: ${title}`,
        content: summary || '',
        feature_id: 'guidelines-generator',
        date: new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/guidelines/saved/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('saved_guidelines').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Prescription Analyser Routes
  app.get("/api/prescription-analyser", async (req, res) => {
    try {
      const { data, error } = await supabase.from('prescription_analyser').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/prescription-analyser", async (req, res) => {
    const { id, user_id, prescription_data, analysis, date } = req.body;
    try {
      const { error } = await supabase.from('prescription_analyser').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        prescription_data,
        analysis,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on prescription_analyser upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table so it appears in the Dashboard Library
      const titleText = `Prescription Analysis`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: analysis,
        feature_id: 'prescription-analyser',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/prescription-analyser/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('prescription_analyser').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Knowledge Analyser (Essay) Routes
  app.get("/api/knowledge-analyser-essay", async (req, res) => {
    try {
      const { data, error } = await supabase.from('knowledge_analyser_essay').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge-analyser-essay", async (req, res) => {
    const { id, user_id, subject, topic, questions, evaluation, content, date } = req.body;
    try {
      const { error } = await supabase.from('knowledge_analyser_essay').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        subject,
        topic,
        questions: questions || null,
        evaluation: evaluation || null,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on knowledge_analyser_essay upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table
      const titleText = subject ? `Essay Analysis: ${subject}` : `Essay Analysis`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content || `Analysis for ${subject} - ${topic}`,
        feature_id: 'answer-analyser',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/knowledge-analyser-essay/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('knowledge_analyser_essay').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Knowledge Analyser (MCQs) Routes
  app.get("/api/knowledge-analyser-mcqs", async (req, res) => {
    try {
      const { data, error } = await supabase.from('knowledge_analyser_mcqs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge-analyser-mcqs", async (req, res) => {
    const { id, user_id, subject, topic, mcqs, evaluation, content, date } = req.body;
    try {
      const { error } = await supabase.from('knowledge_analyser_mcqs').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        subject,
        topic,
        mcqs: mcqs || null,
        evaluation: evaluation || null,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on knowledge_analyser_mcqs upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table
      const titleText = subject ? `MCQ Analysis: ${subject} - ${topic}` : `MCQ Analysis`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content || `MCQ Analysis for ${subject} - ${topic}`,
        feature_id: 'mcqs-analyser',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/knowledge-analyser-mcqs/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('knowledge_analyser_mcqs').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Exam Simulator Routes
  app.get("/api/ai-exam-simulator", async (req, res) => {
    try {
      const { data, error } = await supabase.from('ai_exam_simulator').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai-exam-simulator", async (req, res) => {
    const { id, user_id, subject, paper, topics, questions, evaluation, content, date } = req.body;
    try {
      const { error } = await supabase.from('ai_exam_simulator').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        subject,
        paper: paper || null,
        topics: topics || null,
        questions: questions || null,
        evaluation: evaluation || null,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on ai_exam_simulator upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table
      const titleText = subject ? `Exam Simulation: ${subject}${paper ? ' - ' + paper : ''}` : `Exam Simulation`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content || `Exam Simulation for ${subject} - ${topics}`,
        feature_id: 'ai-exam-simulator',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/ai-exam-simulator/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('ai_exam_simulator').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // NOTE: Guidelines/saved routes (second copy) removed — duplicate of routes at line ~2319
  // The first copy (kept above) includes saved_items synchronization.

  // Clinical Examination System Routes
  app.post("/api/clinical-exam/start", async (req, res) => {
    const { id, userId, specialty, subspecialty, examType, caseData } = req.body;
    try {
      const { error } = await supabase.from('clinical_exam_sessions').insert({
        id, 
        user_id: (userId === 'default' || !userId ? '00000000-0000-0000-0000-000000000000' : userId), 
        specialty, 
        subspecialty, 
        exam_type: examType, 
        case_data: JSON.stringify(caseData), 
        status: 'in_progress'
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clinical-exam/interact", async (req, res) => {
    const { id, sessionId, step, userInput, aiResponse } = req.body;
    try {
      const { error } = await supabase.from('clinical_exam_interactions').insert({
        id, 
        session_id: sessionId, 
        step, 
        user_input: userInput, 
        ai_response: aiResponse
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clinical-exam/submit", async (req, res) => {
    const { sessionId, scores, totalScore, feedback, recommendations } = req.body;
    try {
      const { error: sessionError } = await supabase.from('clinical_exam_sessions')
        .update({ status: 'completed', end_time: new Date().toISOString() })
        .eq('id', sessionId);
      if (sessionError) throw sessionError;
      
      const { error: evalError } = await supabase.from('clinical_exam_evaluations').insert({
        id: `eval_${sessionId}`, 
        session_id: sessionId, 
        scores: JSON.stringify(scores), 
        total_score: totalScore, 
        feedback: JSON.stringify(feedback), 
        recommendations: JSON.stringify(recommendations)
      });
      if (evalError) throw evalError;
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clinical-exam/results/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    try {
      const { data: evaluation } = await supabase.from('clinical_exam_evaluations').select('*').eq('session_id', sessionId).single();
      const { data: session } = await supabase.from('clinical_exam_sessions').select('*').eq('id', sessionId).single();
      const { data: interactions } = await supabase.from('clinical_exam_interactions').select('*').eq('session_id', sessionId).order('timestamp', { ascending: true });
      
      // Safely parse JSON fields with try/catch
      let parsedEvaluation = null;
      if (evaluation) {
        try {
          parsedEvaluation = {
            ...evaluation,
            scores: typeof evaluation.scores === 'string' ? JSON.parse(evaluation.scores) : evaluation.scores,
            feedback: typeof evaluation.feedback === 'string' ? JSON.parse(evaluation.feedback) : evaluation.feedback,
            recommendations: typeof evaluation.recommendations === 'string' ? JSON.parse(evaluation.recommendations) : evaluation.recommendations,
          };
        } catch (parseErr) {
          console.error("⚠️ Failed to parse clinical exam evaluation JSON:", parseErr);
          parsedEvaluation = evaluation; // Return raw data rather than crashing
        }
      }
      res.json({ success: true, session, evaluation: parsedEvaluation, interactions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clinical Examination System Routes
  app.get("/api/clinical-examination-system", async (req, res) => {
    try {
      const { data, error } = await supabase.from('clinical_examination_system').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clinical-examination-system", async (req, res) => {
    const { id, user_id, specialty, exam_type, case_data, history_log, examination_log, investigation_log, diagnosis_text, management_text, viva_qas, final_report, total_score, content, date } = req.body;
    try {
      const { error } = await supabase.from('clinical_examination_system').upsert({
        id,
        user_id: (user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id),
        specialty,
        exam_type,
        case_data: case_data || null,
        history_log: history_log || null,
        examination_log: examination_log || null,
        investigation_log: investigation_log || null,
        diagnosis_text: diagnosis_text || null,
        management_text: management_text || null,
        viva_qas: viva_qas || null,
        final_report: final_report || null,
        total_score: total_score || null,
        created_at: date || new Date().toISOString()
      });
      if (error) {
        console.error("Supabase Error on clinical_examination_system upsert:", error.message); // Fallback: proceed to save in saved_items
      }

      // Also save to generic saved_items table
      const titleText = `Clinical Exam: ${specialty || 'General'} - ${exam_type || 'OSCE'}`;
      const { error: error2 } = await supabase.from('saved_items').upsert({
        id,
        title: titleText,
        content: content || `Clinical Examination for ${specialty} - Score: ${total_score || 'N/A'}`,
        feature_id: 'clinical-examination',
        date: date || new Date().toISOString()
      });
      if (error2) console.error("Error saving to saved_items:", error2);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/clinical-examination-system/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('clinical_examination_system').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Blog Publications API ==========
  // GET all blog posts
  app.get("/api/blog-publications", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('blog_publications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error('Error fetching blog publications:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST create a new blog post
  app.post("/api/blog-publications", async (req, res) => {
    try {
      const { id, title, category, excerpt, content, hashtags, date, views, image_src, imageSrc, status } = req.body;
      const postData = {
        id: id || `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        category: category || 'Education',
        excerpt: excerpt || '',
        content: content || '',
        hashtags: hashtags || '',
        date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        views: views || 0,
        image_src: image_src || imageSrc || '',
        status: status || 'published',
      };
      const { data, error } = await supabase
        .from('blog_publications')
        .upsert(postData, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      console.log('✅ Blog post saved to Supabase:', postData.title);
      res.json(data);
    } catch (error: any) {
      console.error('Error saving blog post:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT update an existing blog post
  app.put("/api/blog-publications/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { title, category, excerpt, content, hashtags, date, views, image_src, imageSrc, status } = req.body;
      const updateData: any = { updated_at: new Date().toISOString() };
      if (title !== undefined) updateData.title = title;
      if (category !== undefined) updateData.category = category;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (content !== undefined) updateData.content = content;
      if (hashtags !== undefined) updateData.hashtags = hashtags;
      if (date !== undefined) updateData.date = date;
      if (views !== undefined) updateData.views = views;
      if (image_src !== undefined) updateData.image_src = image_src;
      else if (imageSrc !== undefined) updateData.image_src = imageSrc;
      if (status !== undefined) updateData.status = status;
      
      const { data, error } = await supabase
        .from('blog_publications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      console.log('✅ Blog post updated in Supabase:', id);
      res.json(data);
    } catch (error: any) {
      console.error('Error updating blog post:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE a blog post
  app.delete("/api/blog-publications/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase
        .from('blog_publications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      console.log('🗑️ Blog post deleted from Supabase:', id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting blog post:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL ROUTES (Resend)
  // ═══════════════════════════════════════════════════════════════════════════

  // Helper: PGMentor branded email HTML wrapper
  const emailWrapper = (title: string, bodyContent: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1e293b;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:28px;margin:0 0 4px 0;font-weight:800;letter-spacing:-0.5px;">PGMentor</h1>
              <p style="color:#94a3b8;font-size:13px;margin:0;letter-spacing:1px;text-transform:uppercase;">AI-Powered Medical Education</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 4px 0;">© ${new Date().getFullYear()} PGMentor. All rights reserved.</p>
              <p style="color:#cbd5e1;font-size:11px;margin:0;">AI-generated content is for educational purposes only and should not replace clinical judgment.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL VERIFICATION SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  // In-memory verification token store: Map<token, { email, userId, expiresAt }>
  const verificationTokenStore = new Map<string, { email: string; userId: string; expiresAt: number }>();

  // Cleanup expired verification tokens every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [token, entry] of verificationTokenStore) {
      if (now > entry.expiresAt) verificationTokenStore.delete(token);
    }
  }, 10 * 60 * 1000);

  // Send verification email with a clickable link
  app.post("/api/auth/send-verification-email", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });
    
    const { email, name, userId } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email format" });

    // Rate limit: max 5 verification emails per IP per 15 min
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (rateLimit(`verify:${clientIp}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    // Generate verification token (URL-safe)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    verificationTokenStore.set(token, { email, userId: userId || '', expiresAt });

    const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;
    const userName = escapeHtml(name || "Doctor");

    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [email],
        subject: `Verify your email – PGMentor`,
        html: emailWrapper("Verify Your Email", `
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Verify Your Email Address ✉️</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
            Hi <strong>${userName}</strong>, thank you for creating a PGMentor account! 
            Please verify your email address to activate your account and start your learning journey.
          </p>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${verifyUrl}" style="display:inline-block;background-color:#059669;color:#fff;text-decoration:none;padding:16px 48px;border-radius:12px;font-weight:700;font-size:16px;">
              ✅ Verify My Email
            </a>
          </div>
          
          <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin:0 0 24px 0;">
            <p style="color:#64748b;font-size:13px;margin:0 0 8px 0;">Or copy and paste this link in your browser:</p>
            <p style="color:#3b82f6;font-size:12px;margin:0;word-break:break-all;">${verifyUrl}</p>
          </div>
          
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:0 0 20px 0;">
            <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
              ⚠️ This link expires in <strong>24 hours</strong>. If you didn't create an account, please ignore this email.
            </p>
          </div>
          
          <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">
            Once verified, you can sign in and start exploring PGMentor's AI-powered medical education tools.
          </p>
        `)
      });

      if (error) {
        console.error("❌ Verification email Resend error:", error);
        return res.status(500).json({ error: error.message });
      }

      console.log(`📧 Verification email sent to: ${email}`);
      res.json({ success: true, message: "Verification email sent" });
    } catch (err: any) {
      console.error("❌ Failed to send verification email:", err.message || err);
      res.status(500).json({ error: "Failed to send verification email" });
    }
  });

  // Verify email via token (called when user clicks the link)
  app.get("/api/auth/verify-email", async (req, res) => {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const entry = verificationTokenStore.get(token);
    if (!entry) {
      // Token not found — might be expired or already used
      return res.redirect(`${APP_URL}?verification=expired`);
    }

    if (Date.now() > entry.expiresAt) {
      verificationTokenStore.delete(token);
      return res.redirect(`${APP_URL}?verification=expired`);
    }

    try {
      // Mark email as verified in user_profiles
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ email_verified: true })
        .eq("user_id", entry.userId);

      if (error) {
        console.error("❌ Email verification DB update error:", error.message);
        // Try by email as fallback
        await supabaseAdmin
          .from("user_profiles")
          .update({ email_verified: true })
          .ilike("full_name", "%"); // This is a fallback — ideally use email column if exists
      }

      // Also update Supabase auth user metadata
      if (entry.userId) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(entry.userId, {
            email_confirm: true,
            user_metadata: { email_verified: true }
          });
        } catch (authErr: any) {
          console.warn("⚠️ Could not update auth metadata:", authErr.message);
        }
      }

      // Clean up used token
      verificationTokenStore.delete(token);
      
      console.log(`✅ Email verified for: ${entry.email}`);
      
      // Redirect to the app with success parameter
      res.redirect(`${APP_URL}?verification=success`);
    } catch (err: any) {
      console.error("❌ Email verification failed:", err.message);
      res.redirect(`${APP_URL}?verification=error`);
    }
  });

  // Check verification status for a user
  app.get("/api/auth/verification-status/:userId", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("email_verified")
        .eq("user_id", (req.params.userId === 'default' ? '00000000-0000-0000-0000-000000000000' : req.params.userId))
        .single();

      if (error) return res.status(404).json({ verified: false });
      res.json({ verified: data?.email_verified === true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });
    const { email, name, userId } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Rate limit: max 3 resends per email per 10 minutes
    if (rateLimit(`resend-verify:${email}`, 3, 10 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many resend requests. Please wait a few minutes." });
    }

    // Remove old tokens for this email
    for (const [t, entry] of verificationTokenStore) {
      if (entry.email === email) verificationTokenStore.delete(t);
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    verificationTokenStore.set(token, { email, userId: userId || '', expiresAt });

    const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;
    const userName = escapeHtml(name || "Doctor");

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: [email],
        subject: `Verify your email – PGMentor`,
        html: emailWrapper("Verify Your Email", `
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Verify Your Email Address ✉️</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
            Hi <strong>${userName}</strong>, click the button below to verify your email and activate your account.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:16px 48px;border-radius:12px;font-weight:700;font-size:16px;box-shadow:0 4px 14px rgba(16,185,129,0.3);">
              ✅ Verify My Email
            </a>
          </div>
          <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin:0 0 20px 0;">
            <p style="color:#64748b;font-size:13px;margin:0 0 8px 0;">Or copy and paste this link:</p>
            <p style="color:#3b82f6;font-size:12px;margin:0;word-break:break-all;">${verifyUrl}</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">This link expires in 24 hours.</p>
        `)
      });
      console.log(`📧 Verification email resent to: ${email}`);
      res.json({ success: true, message: "Verification email resent" });
    } catch (err: any) {
      console.error("❌ Resend verification email failed:", err.message);
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });

  // 1. Welcome Email - sent on new user registration
  app.post("/api/email/welcome", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });
    
    const { to, name } = req.body;
    if (!to) return res.status(400).json({ error: "Recipient email is required" });

    const userName = name || "Doctor";
    
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [to],
        subject: `Welcome to PGMentor, ${userName}! 🎓`,
        html: emailWrapper("Welcome to PGMentor", `
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Welcome aboard, ${userName}! 🎉</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
            Thank you for joining <strong>PGMentor</strong> — your AI-powered companion for medical education and clinical excellence.
          </p>
          
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 24px 0;">
            <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 8px 0;">🎁 Your Free Trial is Active!</p>
            <p style="color:#15803d;font-size:13px;margin:0;line-height:1.6;">
              You have <strong>15 days</strong> of full access to explore all premium features including AI-powered study notes, exam prep, clinical tools, and more.
            </p>
          </div>

          <p style="color:#475569;font-size:14px;font-weight:600;margin:0 0 12px 0;">Here's what you can do:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
            ${[
              ["📚", "LMS Notes & Flashcards", "AI-generated study materials for any medical topic"],
              ["🧠", "AI Exam Preparation", "Practice MCQs with intelligent feedback"],
              ["📝", "Thesis & Research Tools", "Protocol generator, manuscript builder, statistical analysis"],
              ["💊", "Clinical Decision Support", "Evidence-based guidelines and drug interaction checks"],
              ["🎯", "Seminar & Journal Club", "AI-powered presentation builder with detailed notes"]
            ].map(([icon, title, desc]) => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:32px;">
                  <span style="font-size:18px;">${icon}</span>
                </td>
                <td style="padding:8px 0 8px 12px;">
                  <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0;">${title}</p>
                  <p style="color:#64748b;font-size:13px;margin:2px 0 0 0;">${desc}</p>
                </td>
              </tr>
            `).join("")}
          </table>

          <div style="text-align:center;margin:32px 0 16px 0;">
            <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(59,130,246,0.3);">
              Start Exploring PGMentor →
            </a>
          </div>
          
          <p style="color:#94a3b8;font-size:13px;text-align:center;margin:24px 0 0 0;">
            Need help? Simply reply to this email or use the AI Mentor chat in the app.
          </p>
        `)
      });

      if (error) {
        console.error("❌ Resend welcome email error:", error);
        return res.status(500).json({ error: error.message });
      }
      console.log("📧 Welcome email sent to:", to, "| ID:", data?.id);
      res.json({ success: true, emailId: data?.id });
    } catch (error: any) {
      console.error("❌ Email send failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Share Content via Email
  app.post("/api/email/share", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });

    const { to, subject, contentTitle, contentBody, senderName } = req.body;
    if (!to || !contentTitle) return res.status(400).json({ error: "Recipient and content are required" });

    // SECURITY: Sanitize all user input to prevent XSS in email HTML
    const safeSenderName = escapeHtml(senderName || "A colleague");
    const safeContentTitle = escapeHtml(contentTitle);
    const safeContentBody = escapeHtml(contentBody || "No content preview available.");

    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject: subject || `${safeSenderName} shared "${safeContentTitle}" with you`,
        html: emailWrapper("Shared Content", `
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin:0 0 20px 0;">
            <p style="color:#1e40af;font-size:13px;margin:0;">
              📤 <strong>${safeSenderName}</strong> shared this with you via PGMentor
            </p>
          </div>

          <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px 0;">${safeContentTitle}</h2>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:0 0 24px 0;">
            <div style="color:#334155;font-size:14px;line-height:1.8;white-space:pre-line;">${safeContentBody}</div>
          </div>
          
          <div style="text-align:center;">
            <a href="${APP_URL}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px;">
              Open in PGMentor
            </a>
          </div>
        `)
      });

      if (error) {
        console.error("❌ Resend share email error:", error);
        return res.status(500).json({ error: error.message });
      }
      console.log("📧 Content shared via email to:", to, "| ID:", data?.id);
      res.json({ success: true, emailId: data?.id });
    } catch (error: any) {
      console.error("❌ Share email failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Contact / Feedback Form Email
  app.post("/api/email/contact", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });

    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: "Name, email, and message are required" });
    if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email format" });

    // Rate limit contact form: 5 per IP per hour
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (rateLimit(`contact:${clientIp}`, 5, 60 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many submissions. Please try again later." });
    }

    // SECURITY: Sanitize all user input
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || "General Inquiry");
    const safeMessage = escapeHtml(message);

    try {
      // Send notification to admin
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [ADMIN_EMAIL],
        replyTo: email,
        subject: subject || `Contact Form: ${safeName}`,
        html: emailWrapper("Contact Form Submission", `
          <h2 style="color:#0f172a;font-size:20px;margin:0 0 20px 0;">📩 New Contact Form Submission</h2>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
            ${[
              ["Name", safeName],
              ["Email", safeEmail],
              ["Subject", safeSubject]
            ].map(([label, value]) => `
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;width:100px;vertical-align:top;">${label}:</td>
                <td style="padding:8px 0;color:#1e293b;font-size:14px;">${value}</td>
              </tr>
            `).join("")}
          </table>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 16px 0;">
            <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;">Message</p>
            <p style="color:#334155;font-size:14px;line-height:1.7;margin:0;white-space:pre-line;">${safeMessage}</p>
          </div>
        `)
      });

      if (error) {
        console.error("❌ Resend contact email error:", error);
        return res.status(500).json({ error: error.message });
      }

      // Send confirmation to user
      await resend.emails.send({
        from: EMAIL_FROM,
        to: [email],
        subject: "We received your message – PGMentor",
        html: emailWrapper("Message Received", `
          <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px 0;">Thanks for reaching out, ${name}! 👋</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
            We've received your message and will get back to you as soon as possible.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:0 0 16px 0;">
            <p style="color:#166534;font-size:13px;margin:0;">Your message: "${message.substring(0, 200)}${message.length > 200 ? '...' : ''}"</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:0;">
            In the meantime, feel free to explore the AI Mentor chat in the app for immediate assistance.
          </p>
        `)
      });

      console.log("📧 Contact email processed from:", email, "| ID:", data?.id);
      res.json({ success: true, emailId: data?.id });
    } catch (error: any) {
      console.error("❌ Contact email failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Generic Send Email (for custom use cases)
  app.post("/api/email/send", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });

    const { to, subject, html, text } = req.body;
    if (!to || !subject) return res.status(400).json({ error: "Recipient and subject are required" });

    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || emailWrapper(subject, `<p style="color:#334155;font-size:14px;line-height:1.7;">${text || ""}</p>`),
      });

      if (error) {
        console.error("❌ Resend email error:", error);
        return res.status(500).json({ error: error.message });
      }
      console.log("📧 Email sent to:", to, "| ID:", data?.id);
      res.json({ success: true, emailId: data?.id });
    } catch (error: any) {
      console.error("❌ Email send failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Trial Expiry Reminder Email
  app.post("/api/email/trial-reminder", async (req, res) => {
    if (!resend) return res.status(503).json({ error: "Email service not configured" });

    const { to, name, daysLeft } = req.body;
    if (!to) return res.status(400).json({ error: "Recipient email is required" });

    const userName = name || "Doctor";
    const days = daysLeft || 3;

    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [to],
        subject: `⏰ Your PGMentor trial expires in ${days} day${days > 1 ? 's' : ''}`,
        html: emailWrapper("Trial Expiring Soon", `
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px 0;">Hi ${userName}, your trial is ending soon ⏰</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
            Your free trial of PGMentor will expire in <strong>${days} day${days > 1 ? 's' : ''}</strong>. 
            Upgrade now to keep access to all your saved content and premium AI features.
          </p>
          
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:20px;margin:0 0 24px 0;">
            <p style="color:#92400e;font-size:14px;font-weight:600;margin:0 0 8px 0;">⚡ What you'll lose without upgrading:</p>
            <ul style="color:#78350f;font-size:13px;margin:0;padding:0 0 0 20px;line-height:1.8;">
              <li>AI-powered study note generation</li>
              <li>Exam preparation with smart MCQs</li>
              <li>Research tools (thesis, protocol, manuscript)</li>
              <li>Clinical decision support & guidelines</li>
            </ul>
          </div>

          <div style="text-align:center;margin:32px 0 16px 0;">
            <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(245,158,11,0.3);">
              Upgrade Now →
            </a>
          </div>
        `)
      });

      if (error) {
        console.error("❌ Resend trial reminder error:", error);
        return res.status(500).json({ error: error.message });
      }
      console.log("📧 Trial reminder sent to:", to, "| ID:", data?.id);
      res.json({ success: true, emailId: data?.id });
    } catch (error: any) {
      console.error("❌ Trial reminder failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOG OG META TAGS ROUTE (for Social Media Sharing)
  // ═══════════════════════════════════════════════════════════════════════════
  app.get("/blog/:id", async (req, res) => {
    const { id } = req.params;
    const siteUrl = "https://www.PGMentor.com";
    
    try {
      // Fetch the blog post from Supabase
      const { data: post, error } = await supabase
        .from('blog_publications')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !post) {
        // Fallback: redirect to blog page
        return res.redirect(`${siteUrl}/blog`);
      }

      const title = post.title || "PGMentor Blog";
      const description = (post.excerpt || post.title || "Read the latest on PGMentor").substring(0, 200);
      const image = post.image_src || post.imageSrc || `${siteUrl}/og-default.png`;
      const blogUrl = `${siteUrl}/blog/${id}`;
      const hashtags = (post.hashtags || '').split(/\s+/).filter(Boolean).slice(0, 5).join(' ');

      // Serve an HTML page with OG meta tags for social media crawlers
      // Humans get auto-redirected to the SPA
      res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | PGMentor</title>
  <meta name="description" content="${description} — Explore PGMentor: AI-Powered Medical Education" />

  <!-- Open Graph / Facebook / LinkedIn / WhatsApp -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${blogUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description} — Explore PGMentor: AI-Powered Medical Education Platform for Medical Professionals" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="PGMentor" />
  <meta property="article:published_time" content="${post.created_at || new Date().toISOString()}" />
  <meta property="article:section" content="${post.category || 'Medical Education'}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${blogUrl}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description} — Explore PGMentor" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:site" content="@PGMentor" />

  <!-- Auto redirect for humans (crawlers will read the meta tags above) -->
  <meta http-equiv="refresh" content="0;url=${siteUrl}/#/blog/${id}" />
  <link rel="canonical" href="${blogUrl}" />
  <link rel="icon" type="image/png" href="${siteUrl}/favicon.png" />
  
  <style>
    body { margin:0; font-family:'Segoe UI',system-ui,sans-serif; background:#0a0f1c; color:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { max-width:620px; background:#1e293b; border-radius:20px; overflow:hidden; box-shadow:0 25px 50px rgba(0,0,0,.4); }
    .card img { width:100%; height:280px; object-fit:cover; }
    .body { padding:32px; }
    .cat { color:#3b82f6; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
    h1 { font-size:24px; line-height:1.3; margin:0 0 16px; }
    p { color:#94a3b8; font-size:14px; line-height:1.6; margin:0 0 24px; }
    .cta { display:inline-block; background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; text-decoration:none; padding:14px 32px; border-radius:12px; font-weight:700; font-size:14px; }
    .brand { text-align:center; padding:20px; color:#64748b; font-size:12px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${image}" alt="${title}" />
    <div class="body">
      <div class="cat">${post.category || 'Medical Education'}</div>
      <h1>${title}</h1>
      <p>${description}</p>
      <a href="${siteUrl}" class="cta">🔬 Explore PGMentor →</a>
    </div>
    <div class="brand">PGMentor — AI-Powered Medical Education Platform</div>
  </div>
</body>
</html>`);
    } catch (err) {
      console.error('Error serving blog OG page:', err);
      res.redirect(`${siteUrl}`);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // THESIS DATA COLLECTION TOOL — API ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Studies CRUD ──────────────────────────────────────────────────────────

  // GET all studies for a user
  app.get("/api/thesis/studies", async (req, res) => {
    const user_id = req.query.user_id as string;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });
    try {
      const { data, error } = await supabaseAdmin
        .from('thesis_studies')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error("❌ Thesis studies fetch error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST create new study
  app.post("/api/thesis/studies", async (req, res) => {
    try {
      const id = `STUDY-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
      const payload = { id, ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const { data, error } = await supabaseAdmin
        .from('thesis_studies')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      console.log(`✅ Thesis study created: ${data.thesis_title} (${data.id})`);
      res.json(data);
    } catch (err: any) {
      console.error("❌ Thesis study create error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update study
  app.put("/api/thesis/studies/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabaseAdmin
        .from('thesis_studies')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      console.error("❌ Thesis study update error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE study (cascades to cases)
  app.delete("/api/thesis/studies/:id", async (req, res) => {
    const { id } = req.params;
    try {
      // Delete cases first (cascade may or may not work with RLS)
      await supabaseAdmin.from('thesis_cases').delete().eq('study_id', id);
      const { error } = await supabaseAdmin.from('thesis_studies').delete().eq('id', id);
      if (error) throw error;
      console.log(`🗑️ Thesis study deleted: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ Thesis study delete error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Cases CRUD ────────────────────────────────────────────────────────────

  // GET all cases for a study
  app.get("/api/thesis/cases", async (req, res) => {
    const study_id = req.query.study_id as string;
    const user_id = req.query.user_id as string;
    if (!study_id || !user_id) return res.status(400).json({ error: "study_id and user_id are required" });
    try {
      const { data, error } = await supabaseAdmin
        .from('thesis_cases')
        .select('*')
        .eq('study_id', study_id)
        .eq('user_id', user_id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error("❌ Thesis cases fetch error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST create new case
  app.post("/api/thesis/cases", async (req, res) => {
    try {
      const id = `CASE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
      const payload = { id, ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const { data, error } = await supabaseAdmin
        .from('thesis_cases')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      console.log(`✅ Thesis case created: ${data.subject_id} (${data.id})`);
      res.json(data);
    } catch (err: any) {
      console.error("❌ Thesis case create error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update case
  app.put("/api/thesis/cases/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabaseAdmin
        .from('thesis_cases')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      console.error("❌ Thesis case update error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE case
  app.delete("/api/thesis/cases/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabaseAdmin.from('thesis_cases').delete().eq('id', id);
      if (error) throw error;
      console.log(`🗑️ Thesis case deleted: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ Thesis case delete error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // e-PORTFOLIO MS ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  // --- PROFILE ---
  app.get("/api/portfolio/profile", async (req, res) => {
    const { user_id } = req.query as any;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    try {
      const { data, error } = await supabaseAdmin
        .from("portfolio_profiles").select("*").eq("user_id", user_id).maybeSingle();
      if (error) throw error;
      res.json(data || null);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/portfolio/profile", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("portfolio_profiles")
        .upsert({ ...req.body, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
        .select().single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // --- IMAGE UPLOAD (Supabase Storage) ---
  app.post("/api/portfolio/upload-image", async (req, res) => {
    try {
      const { user_id, module, filename, base64, content_type } = req.body;
      if (!user_id || !base64 || !filename) return res.status(400).json({ error: "Missing fields" });
      const buf = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ""), "base64");
      const filePath = `${user_id}/${module || "misc"}/${Date.now()}_${filename}`;
      const { error } = await supabaseAdmin.storage.from("portfolio_images").upload(filePath, buf, {
        contentType: content_type || "image/jpeg", upsert: true
      });
      if (error) throw error;
      const { data: urlData } = supabaseAdmin.storage.from("portfolio_images").getPublicUrl(filePath);
      res.json({ url: urlData.publicUrl, path: filePath });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Generic helper to create module routes
  const makePortfolioRoutes = (
    route: string,
    table: string,
    imageTable: string,
    fkField: string
  ) => {
    app.get(`/api/portfolio/${route}`, async (req, res) => {
      const { user_id } = req.query as any;
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      try {
        const { data, error } = await supabaseAdmin
          .from(table).select(`*, ${imageTable}(*)`)
          .eq("user_id", user_id).order("created_at", { ascending: false });
        if (error) throw error;
        res.json(data || []);
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.post(`/api/portfolio/${route}`, async (req, res) => {
      try {
        const { images, ...body } = req.body;
        const { data, error } = await supabaseAdmin.from(table).insert(body).select().single();
        if (error) throw error;
        if (images?.length) {
          const imgs = images.map((url: string) => ({ [fkField]: data.id, image_url: url }));
          await supabaseAdmin.from(imageTable).insert(imgs);
        }
        res.json(data);
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.put(`/api/portfolio/${route}/:id`, async (req, res) => {
      const { id } = req.params;
      try {
        const { images, deleteImages, ...body } = req.body;
        const { data, error } = await supabaseAdmin
          .from(table).update(body).eq("id", id).select().single();
        if (error) throw error;
        if (deleteImages?.length) {
          await supabaseAdmin.from(imageTable).delete().in("id", deleteImages);
        }
        if (images?.length) {
          const imgs = images.map((url: string) => ({ [fkField]: id, image_url: url }));
          await supabaseAdmin.from(imageTable).insert(imgs);
        }
        res.json(data);
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.delete(`/api/portfolio/${route}/:id`, async (req, res) => {
      const { id } = req.params;
      try {
        const { error } = await supabaseAdmin.from(table).delete().eq("id", id);
        if (error) throw error;
        res.json({ success: true });
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });
  };

  makePortfolioRoutes("logbook", "portfolio_logbook", "portfolio_logbook_images", "logbook_id");
  makePortfolioRoutes("cases", "portfolio_cases", "portfolio_case_images", "case_id");
  makePortfolioRoutes("seminars", "portfolio_seminars", "portfolio_seminar_images", "seminar_id");
  makePortfolioRoutes("journals", "portfolio_journals", "portfolio_journal_images", "journal_id");
  makePortfolioRoutes("teaching", "portfolio_teaching", "portfolio_teaching_images", "teaching_id");
  makePortfolioRoutes("assessments", "portfolio_assessments", "portfolio_assessment_images", "assessment_id");
  makePortfolioRoutes("reflections", "portfolio_reflections", "portfolio_reflection_images", "reflection_id");
  makePortfolioRoutes("documents", "portfolio_documents", "portfolio_document_images", "document_id");

  // --- AI NOTES GENERATOR ---
  app.post("/api/portfolio/generate-notes", async (req, res) => {
    const { module, data: inputData } = req.body;
    if (!geminiApiKey) return res.status(503).json({ error: "AI not configured" });
    const prompts: Record<string, string> = {
      logbook: `Write a concise 4-6 line clinical learning note for a postgraduate medical student who performed/observed the procedure "${inputData?.procedure_name}" at ${inputData?.posting || "the hospital"} on ${inputData?.date}. Role: ${inputData?.role}. Learning points: ${inputData?.learning_points || "not specified"}. Academic clinical tone, first person.`,
      cases: `Write a 4-6 line case presentation note for a postgraduate student. Case: "${inputData?.title}", Diagnosis: ${inputData?.diagnosis}, Type: ${inputData?.case_type}, Department: ${inputData?.department}. Learning points: ${inputData?.learning_points || "none"}. Academic tone, first person.`,
      seminars: `Write a 4-6 line academic note for a postgraduate student seminar. Topic: "${inputData?.title || inputData?.topic}", Department: ${inputData?.department}. Key learnings: ${inputData?.key_learning_points || "none"}. Concise academic tone.`,
      journals: `Write a 4-6 line journal club note. Article: "${inputData?.article_title}", Journal: ${inputData?.journal_name}, Study design: ${inputData?.study_design}. Key findings: ${inputData?.key_findings || "none"}. Critical appraisal style, first person.`,
      teaching: `Write a 4-6 line teaching activity note. Topic taught: "${inputData?.topic}", Audience: ${inputData?.audience}, Method: ${inputData?.teaching_method}. Learning points: ${inputData?.learning_points || "none"}. Reflective academic tone.`,
      assessments: `Write a 4-6 line assessment reflection note. Exam: "${inputData?.exam_type}", Topic: ${inputData?.topic}, Score: ${inputData?.score}. Learning gaps: ${inputData?.learning_gaps || "none"}. Growth-oriented reflective tone.`,
      reflections: `Write a 4-6 line Gibbs cycle reflection. Context: ${inputData?.context}, What happened: ${inputData?.what_happened}, Future plan: ${inputData?.future_plan}. Academic reflective style.`,
      documents: `Write a 4-6 line professional note about this achievement. Title: "${inputData?.title}", Category: ${inputData?.category}, Description: ${inputData?.description || "none"}. Professional academic tone.`,
    };
    const prompt = prompts[module] || `Write a 4-6 line professional academic note about: ${JSON.stringify(inputData)}`;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const result = await response.json() as any;
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      res.json({ notes: text });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // --- CV EXPORT DATA ---
  app.get("/api/portfolio/cv-data", async (req, res) => {
    const { user_id } = req.query as any;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    try {
      const [profile, logbook, cases, seminars, journals, teaching, assessments, documents] = await Promise.all([
        supabaseAdmin.from("portfolio_profiles").select("*").eq("user_id", user_id).maybeSingle(),
        supabaseAdmin.from("portfolio_logbook").select("*").eq("user_id", user_id),
        supabaseAdmin.from("portfolio_cases").select("*").eq("user_id", user_id),
        supabaseAdmin.from("portfolio_seminars").select("*").eq("user_id", user_id),
        supabaseAdmin.from("portfolio_journals").select("*").eq("user_id", user_id),
        supabaseAdmin.from("portfolio_teaching").select("*").eq("user_id", user_id),
        supabaseAdmin.from("portfolio_assessments").select("*").eq("user_id", user_id),
        supabaseAdmin.from("portfolio_documents").select("*").eq("user_id", user_id),
      ]);
      res.json({
        profile: profile.data,
        logbook: logbook.data || [],
        cases: cases.data || [],
        seminars: seminars.data || [],
        journals: journals.data || [],
        teaching: teaching.data || [],
        assessments: assessments.data || [],
        documents: documents.data || [],
      });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files if dist/ exists (full-stack mode)
    // On Cloud Run (backend-only), dist/ won't exist — that's fine
    const distPath = path.join(__dirname, "dist");
    const fs = await import("fs");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        // Don't catch API routes or health check
        if (req.path.startsWith("/api") || req.path === "/health") return;
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PGMentor Server running on http://localhost:${PORT}`);
  });
}

startServer();
