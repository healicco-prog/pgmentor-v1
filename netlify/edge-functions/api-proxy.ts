// Netlify Edge Function — proxies /api/* to Cloud Run backend.
// Injects X-API-Key from the BACKEND_API_KEY environment variable (never from code).
// Runs on Deno at the edge, so Deno.env.get() is available.

import type { Config } from "https://edge.netlify.com";

export default async (request: Request) => {
  const apiKey  = Deno.env.get("BACKEND_API_KEY")  ?? "";
  const backend = Deno.env.get("BACKEND_URL")
    ?? "https://pgmentor-backend-441308586999.us-central1.run.app";

  // Forward the full path + query string to the Cloud Run backend
  const incoming = new URL(request.url);
  const target   = backend + incoming.pathname + incoming.search;

  const headers = new Headers(request.headers);
  // X-API-Key is injected server-side — never visible to the browser
  if (apiKey) headers.set("X-API-Key", apiKey);
  // Remove the host header so the backend sees its own hostname
  headers.delete("host");

  const proxyRequest = new Request(target, {
    method:  request.method,
    headers,
    body:    ["GET", "HEAD"].includes(request.method) ? null : request.body,
    // Required to forward the readable body stream
    duplex:  "half",
  } as RequestInit);

  return fetch(proxyRequest);
};

export const config: Config = { path: "/api/*" };
