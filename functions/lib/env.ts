// Shared binding types for Cloudflare Pages Functions.
export interface Env {
  DB: D1Database;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
}

export const SESSION_COOKIE = "probe_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}
