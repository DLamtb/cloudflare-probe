// POST /api/auth/login — create session.
import { Env, json, SESSION_TTL_SECONDS } from "../../lib/env";

// Simple in-memory rate limiter (resets on cold start, acceptable for login).
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return json({ error: "Too many attempts. Please try again later." }, 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Credentials from environment variables. Set via:
  //   wrangler secret put ADMIN_USERNAME
  //   wrangler secret put ADMIN_PASSWORD
  const adminUser = env.ADMIN_USERNAME ?? "admin";
  const adminPass = env.ADMIN_PASSWORD ?? "probe2024";

  if (body.username !== adminUser || body.password !== adminPass) {
    return json({ error: "Invalid credentials" }, 401);
  }

  // Reset rate limit on successful login.
  loginAttempts.delete(ip);

  const token = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_TTL_SECONDS;

  // Store session in D1
  await env.DB.prepare(
    "INSERT INTO sessions (token, username, created_at, expires_at) VALUES (?, ?, ?, ?)",
  )
    .bind(token, adminUser, now, expiresAt)
    .run();

  return json(
    { ok: true },
    200,
    {
      "Set-Cookie": `probe_session=${token}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${SESSION_TTL_SECONDS}`,
    },
  );
};
