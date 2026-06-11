// Validate and normalize a site payload from the admin UI.
import { json } from "./env";
import { SiteInput } from "./types";

const TYPES = ["web", "api", "supabase"];
const METHODS = ["GET", "HEAD", "POST"];

export function parseSite(body: Record<string, unknown>): SiteInput | Response {
  const name = String(body.name ?? "").trim();
  const url = String(body.url ?? "").trim();
  if (!name || name.length > 100) return json({ error: "Invalid name" }, 400);
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("scheme");
  } catch {
    return json({ error: "Invalid url" }, 400);
  }

  const type = TYPES.includes(String(body.type)) ? String(body.type) : "web";
  const method = METHODS.includes(String(body.method)) ? String(body.method) : "GET";
  const expected_status = Math.min(Math.max(Number(body.expected_status) || 200, 100), 599);
  const enabled = body.enabled === false || body.enabled === 0 ? 0 : 1;

  let headers = "{}";
  if (body.headers != null && body.headers !== "") {
    try {
      const obj = typeof body.headers === "string" ? JSON.parse(body.headers) : body.headers;
      if (typeof obj !== "object" || Array.isArray(obj)) throw new Error("obj");
      headers = JSON.stringify(obj);
    } catch {
      return json({ error: "Headers must be a JSON object" }, 400);
    }
  }

  return { name, url, type, method, expected_status, headers, enabled };
}
