// ═══════════════════════════════════════════════════════════════════════════
// API Helper — Environment-aware fetch wrapper
// In development: calls /api/* directly (same origin)
// In production: Netlify proxies /api/* → Cloud Run (via netlify.toml redirects)
// The X-API-Key header is injected server-side by Netlify proxy, NOT by client
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Returns the base URL for API calls.
 * In production with Netlify proxy, this is just '' (same origin).
 * The Netlify _redirects handle forwarding to Cloud Run.
 */
export const API_BASE = '';

/**
 * Wrapper around fetch that automatically prepends the API base URL.
 * Usage: apiFetch('/api/saved') instead of fetch('/api/saved')
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });
}
