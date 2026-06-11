// GET /api/checks?site_id=&hours=&limit= — public read: raw history for one site.
import { Env, json } from "../lib/env";
import { recentChecks } from "../lib/db";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const siteId = Number(url.searchParams.get("site_id"));
  if (!siteId || Number.isNaN(siteId)) return json({ error: "site_id required" }, 400);

  const hours = Math.min(Math.max(Number(url.searchParams.get("hours")) || 24, 1), 168);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 120, 1), 2000);
  const since = Math.floor(Date.now() / 1000) - hours * 3600;
  const checks = await recentChecks(env, siteId, since, limit);
  return json(
    { site_id: siteId, checks },
    200,
    { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
  );
};
