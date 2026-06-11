// GET /api/status — public read: latest status, latency, last 60 minutes, 24h uptime.
import { Env, json } from "../lib/env";
import { listSites } from "../lib/db";

interface CheckRow {
  site_id: number;
  checked_at: number;
  ok: number;
  status_code: number | null;
  latency_ms: number | null;
  error: string | null;
}

async function getChecksForAllSites(env: Env, sites: SiteRow[], since: number): Promise<Map<number, CheckRow[]>> {
  if (sites.length === 0) return new Map();

  const ids = sites.map((s) => s.id);
  const placeholders = ids.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT site_id, checked_at, ok, status_code, latency_ms, error
     FROM checks WHERE site_id IN (${placeholders}) AND checked_at >= ?
     ORDER BY site_id, checked_at DESC`,
  )
    .bind(...ids, since)
    .all<CheckRow>();

  const bySite = new Map<number, CheckRow[]>();
  for (const row of results ?? []) {
    const arr = bySite.get(row.site_id);
    if (arr) arr.push(row);
    else bySite.set(row.site_id, [row]);
  }
  return bySite;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const sites = await listSites(env);
  const now = Math.floor(Date.now() / 1000);
  const dayAgo = now - 24 * 3600;

  const checksBySite = await getChecksForAllSites(env, sites, dayAgo);

  const data = sites.map((s) => {
    const checks = checksBySite.get(s.id) ?? [];
    const latest = checks[0] ?? null;
    const total = checks.length;
    const up = checks.filter((c) => c.ok === 1).length;
    const uptime24h = total ? Math.round((up / total) * 1000) / 10 : null;

    const hourAgo = now - 60 * 60;
    const byMinute = new Map<number, number>();
    for (const c of checks) {
      if (c.checked_at < hourAgo) continue;
      const minute = Math.floor(c.checked_at / 60);
      if (!byMinute.has(minute)) byMinute.set(minute, c.ok);
    }
    const minutes: { t: number; ok: number | null }[] = [];
    const nowMinute = Math.floor(now / 60);
    for (let m = nowMinute - 59; m <= nowMinute; m++) {
      minutes.push({ t: m * 60, ok: byMinute.has(m) ? byMinute.get(m)! : null });
    }

      return {
        id: s.id,
        name: s.name,
        url: s.url,
        type: s.type,
        enabled: s.enabled,
        latest: latest
          ? {
              ok: latest.ok,
              latency_ms: latest.latency_ms,
              status_code: latest.status_code,
              checked_at: latest.checked_at,
              error: latest.error ?? null,
            }
          : null,
        uptime24h,
        minutes,
      };
  });

  return json({ sites: data, now }, 200, {
    "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
  });
};
