// /api/sites — GET list (public), POST create (auth via _middleware).
import { Env, json } from "../../lib/env";
import { insertSite, listSites } from "../../lib/db";
import { parseSite } from "../../lib/validate";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const sites = await listSites(env);
  return json(
    { sites },
    200,
    { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = parseSite(body);
  if (parsed instanceof Response) return parsed;
  const id = await insertSite(env, parsed);
  return json({ ok: true, id }, 201);
};
