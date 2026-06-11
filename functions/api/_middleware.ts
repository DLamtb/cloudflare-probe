// Pages Functions middleware: CORS headers + session auth for write operations.
import { Env, json } from "../lib/env";

const ALLOWED_ORIGINS = [
  // Add your production domain(s) here, e.g.:
  // "https://probe-panel.pages.dev",
  // "https://your-custom-domain.com",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return headers;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const origin = request.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const isWrite = ["POST", "PUT", "DELETE"].includes(request.method);
  if (!isWrite) return next();

  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)probe_session=([^;]*)/);
  const token = match?.[1];

  if (!token) {
    return json({ error: "Authentication required" }, 401, cors);
  }

  // Check session in D1
  const now = Math.floor(Date.now() / 1000);
  const session = await env.DB.prepare(
    "SELECT token FROM sessions WHERE token = ? AND expires_at > ?",
  )
    .bind(token, now)
    .first();

  if (!session) {
    return json({ error: "Invalid or expired session" }, 401, cors);
  }

  const response = await next();
  const newResponse = new Response(response.body, response);
  for (const [k, v] of Object.entries(cors)) {
    newResponse.headers.set(k, v);
  }
  return newResponse;
};
