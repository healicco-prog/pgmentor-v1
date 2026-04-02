# PGMentor - Project Bug & Issues Report

**AI-Powered Medical Education Platform**
**Date:** March 22, 2026 | **Analysis:** Automated Static Code Analysis

---

## Executive Summary

A comprehensive static analysis of the PGMentor codebase was performed covering the Express backend (`server.ts`, ~3,300 lines), React frontend (`App.tsx`, ~19,000+ lines), authentication system, services layer, and configuration files.

**TypeScript Type Check:** PASSED (0 errors)
**Vite Build:** Could not execute in sandbox (missing platform-specific rollup binary - not a project bug)

| Severity | Count | Area | Action |
|----------|-------|------|--------|
| CRITICAL | 8 | Security, Auth, Data | Immediate action required |
| HIGH | 12 | API, Performance, Logic | Fix before next deploy |
| MEDIUM | 18 | Code Quality, UX | Plan for next sprint |
| LOW | 17+ | Maintenance, Cleanup | Address when convenient |

---

## 1. CRITICAL Security Issues

### 1.1 API Key Exposed in Client-Side Bundle
**Files:** `vite.config.ts` (line 11), `src/services/ai.ts` (line 4), `dist/` (compiled bundle)

The Vite config explicitly bundles the Gemini API key into the frontend JavaScript using the `define` plugin. The literal API key string is visible in browser DevTools, view-source, and extractable by any visitor.

**Fix:**
- Remove `GEMINI_API_KEY` from `vite.config.ts` define block
- Create a backend proxy endpoint (`/api/ai/chat`) that calls Gemini server-side
- Frontend should call your backend, not Gemini directly

### 1.2 Cleartext Password Storage
**File:** `server.ts` (lines 880-882)

Passwords are stored in plaintext in the database. The code contains a comment acknowledging this is known but unfixed. For a medical education platform, this is a critical compliance risk.

**Fix:** Use Supabase Auth's native authentication or implement bcrypt hashing.

### 1.3 Backend API Key in netlify.toml
**File:** `netlify.toml` (lines 14-18)

The backend API key is hardcoded in the Netlify redirect configuration and visible to anyone with repository access.

**Fix:** Move to Netlify environment variables/secrets.

### 1.4 XSS Vulnerability in Email Templates
**File:** `server.ts` (line 2992)

Unescaped user input (`contentBody`) is directly embedded into HTML email templates via `/api/email/share`. Malicious HTML/JavaScript can execute in email clients.

**Fix:** Sanitize all user input before embedding in HTML templates.

### 1.5 Insecure Token Generation
**File:** `server.ts` (lines 107-109)

Password reset tokens use weak random hex generation instead of cryptographic randomness.

**Fix:** Use `crypto.randomBytes()` for token generation.

### 1.6 Real Credentials in .env Files
**Files:** `.env`, `.env.cloudrun`

Both files contain real production credentials (Gemini key, Supabase service role key, Resend key, backend API key). If these were ever committed to git history, all credentials are compromised.

**Fix:** Rotate ALL credentials immediately. Verify git history with `git log --all --full-history -- .env`.

### 1.7 Supabase Service Role Key Exposure Risk
**Files:** `.env`, `.env.cloudrun`

The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row-Level Security entirely. If accidentally bundled into client code, it grants complete unrestricted database access to medical student records.

### 1.8 Session Validation Fails Open
**File:** `server.ts` (line 632)

When Supabase Auth lookup fails, session validation returns `valid: true` instead of `valid: false`. If the auth service is down, ALL users are considered valid.

**Fix:** Change to fail closed - return `valid: false` on any error.

---

## 2. Backend Issues (server.ts)

### 2.1 Duplicate Route Handlers (3 sets found)
- `/api/resume-builder` defined at lines 1618 AND 1920 - second overwrites first
- `/api/guidelines/saved` defined at lines 2284 AND 2565 - dead code
- `/api/blog-publications` defined at lines 1797 AND 2760 - dead code

**Fix:** Remove duplicate definitions and consolidate logic.

### 2.2 Missing Input Validation (50+ Endpoints)
Nearly all POST/PUT endpoints accept user input without any validation, type checking, length limits, or sanitization. Examples: `/api/doubt-solver`, `/api/knowledge-analyser-essay`, `/api/prescription-analyser`.

**Fix:** Add input validation middleware (e.g., Zod, Joi, or express-validator).

### 2.3 Missing Authentication & Authorization
- Admin routes (lines 272-342) have NO authentication check
- Multiple routes allow accessing another user's data by changing `userId`
- API key protection only applies in production when key is set

**Fix:** Add auth middleware to all routes. Verify resource ownership on every request.

### 2.4 Memory Leak in OTP Store
**File:** `server.ts` (lines 90-99)

In-memory Map stores OTP entries with no limit. A malicious actor can exhaust server memory by requesting OTPs for many email addresses.

**Fix:** Add maximum entry limit and use Redis for production.

### 2.5 Unbounded Data Fetches (25+ Routes)
All `.select('*')` queries return unlimited data with no pagination. Routes like `/api/knowledge`, `/api/essays`, `/api/flashcards`, and admin routes can return massive datasets.

**Fix:** Add pagination (limit/offset) to all list endpoints.

### 2.6 Hardcoded localhost URLs in Email Templates
**Lines:** 253, 2947, 2996, 3144, 3279

Email templates hardcode `http://localhost:3005`. All links in production emails are broken.

**Fix:** Replace with `process.env.APP_URL` or similar environment variable.

### 2.7 Unsafe JSON.parse Without Try/Catch
**Lines:** 2684-2686

`JSON.parse()` for stored clinical exam results has no error handling. Malformed stored data crashes the endpoint.

### 2.8 Off-by-One OTP Error
**Line:** 118

The OTP attempt check runs AFTER incrementing, allowing 4 attempts instead of the intended 3.

### 2.9 No Rate Limiting on Sensitive Endpoints
Password reset, login, contact form, and email endpoints have no rate limiting, enabling brute force attacks and spam.

### 2.10 Race Condition in Subscription Creation
**Lines:** 450-499

Upsert fails and retries with insert. Concurrent requests can create multiple subscriptions. Use a database unique constraint instead.

### 2.11 Race Condition in Referral Rewards
**Lines:** 800-830

No locking mechanism. Two concurrent requests can both grant the same reward.

### 2.12 Hardcoded Contact Email
**Line:** 3026

Contact form submissions go to `onboarding@resend.dev` (Resend demo account), not a real admin email.

### 2.13 CORS Misconfiguration
**Lines:** 56-57

Development mode allows wildcard origin (`*`) with credentials enabled. This combination is invalid per the CORS specification.

---

## 3. Frontend Issues

### 3.1 Memory Leak: Timer Intervals in useEffect
**File:** `App.tsx` (lines 3546-3577)

Timer intervals have `simTimeRemaining` in the dependency array, which changes every second. This causes the interval to be cleared and recreated hundreds of times during an exam, causing severe performance degradation.

**Fix:** Use a ref-based timer pattern.

### 3.2 Memory Leak: AuthModal Timer Not Cleaned
**File:** `AuthModal.tsx` (lines 177-183)

Cooldown timer interval is created but never stored for cleanup. Each call to `handleSendResetCode` creates a new interval without clearing the previous one.

**Fix:** Store interval reference and clean up in useEffect return.

### 3.3 Race Conditions in Feature Switching
**File:** `App.tsx` (lines 2053-2055)

When `featureId` changes, `fetchSaved` fires but doesn't cancel pending API requests. Rapid switching causes old results to overwrite new ones.

**Fix:** Use `AbortController` to cancel pending requests.

### 3.4 Unhandled JSON.parse Exceptions
**File:** `App.tsx` (lines 3436, 3469, 3478, 3501, 3510, 3521)

`JSON.parse()` calls on AI responses lack try-catch. When AI returns malformed JSON, the UI breaks silently.

### 3.5 Silent Error Swallowing
**File:** `App.tsx` (line 2251)

Empty `.catch(() => {})` blocks silently swallow errors, making debugging impossible.

### 3.6 Missing null Check on localStorage
**File:** `App.tsx` (line 2240)

`localStorage.getItem('user')` returns `string|null` but is passed directly to `JSON.parse` without a null check, causing a throw.

### 3.7 State Updates After Failed API Calls
**File:** `App.tsx` (lines 2061-2064)

DELETE requests don't validate response status before updating local state. UI shows items as deleted even when server returns an error.

### 3.8 No Request Cancellation
**File:** `App.tsx` (lines 2013-2029)

No `AbortController` for fetch calls. Component unmounts or navigation during requests cause state updates on unmounted components.

### 3.9 Disabled ESLint Without Fix
**File:** `App.tsx` (line 3542)

`eslint-disable-next-line react-hooks/exhaustive-deps` suppresses a missing dependency warning without fixing the root cause. The `handleGenerate` function may become stale.

---

## 4. Architecture Concerns

### 4.1 Monolithic Files
- `App.tsx` is **757KB** (~19,000+ lines)
- `server.ts` is **128KB** (~3,300 lines)

These files are far too large for maintainability and code review.

**Recommendation:** Split App.tsx into page components, feature modules, and shared hooks. Split server.ts into route modules (auth, admin, features, email).

### 4.2 Duplicate Data Writes Without Transactions
Many endpoints write to both a specialized table AND `saved_items` without database transactions (lines 1068-1077, 1248-1257). One write can succeed while the other fails.

### 4.3 No CSRF Protection
No CSRF tokens on any state-changing operations across the entire application.

### 4.4 Empty page.tsx
**File:** `src/app/page.tsx` is 0 bytes - dead file that should be removed or implemented.

---

## 5. Priority Recommendations

### Immediate (This Week)
1. **Rotate ALL exposed credentials** (Gemini, Supabase, Resend, Backend API key)
2. **Move Gemini API calls to backend proxy** - remove key from client bundle
3. **Implement password hashing** (bcrypt) - replace cleartext storage
4. **Sanitize HTML in email templates** to prevent XSS
5. **Replace hardcoded localhost URLs** with environment variables
6. **Fix session validation** to fail closed (return `valid: false` on error)

### Short-Term (Next 2 Weeks)
1. Add input validation to all API endpoints
2. Add authentication/authorization middleware to admin and user routes
3. Fix all duplicate route handlers - remove dead code
4. Add pagination to all data fetch endpoints
5. Fix frontend memory leaks (timer intervals, useEffect cleanup)
6. Add AbortController to fetch calls for request cancellation
7. Add try-catch around all JSON.parse calls

### Medium-Term (Next Month)
1. Split App.tsx and server.ts into smaller, focused modules
2. Add rate limiting to sensitive endpoints (login, password reset, email)
3. Implement CSRF protection
4. Add database transactions for multi-table writes
5. Add error boundaries to React component tree
6. Set up automated linting and security scanning in CI/CD

---

*Report generated by automated static analysis. Manual review recommended for critical security items.*
