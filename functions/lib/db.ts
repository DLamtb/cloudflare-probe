// D1 query helpers shared by Pages Functions.
import { Env } from "./env";
import { SiteRow, SitePublic, CheckRow } from "./types";

export async function listSites(env: Env): Promise<SitePublic[]> {
  const { results } = await env.DB.prepare(
    "SELECT id, name, url, type, method, expected_status, enabled, created_at FROM sites ORDER BY created_at DESC",
  ).all<SitePublic>();
  return results ?? [];
}

export async function getSite(env: Env, id: number): Promise<SitePublic | null> {
  return env.DB.prepare(
    "SELECT id, name, url, type, method, expected_status, enabled, created_at FROM sites WHERE id = ?",
  )
    .bind(id)
    .first<SitePublic>();
}

export async function insertSite(
  env: Env,
  s: Omit<SiteRow, "id" | "created_at">,
): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO sites (name, url, type, method, expected_status, headers, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(s.name, s.url, s.type, s.method, s.expected_status, s.headers, s.enabled)
    .run();
  return res.meta.last_row_id as number;
}

export async function updateSite(
  env: Env,
  id: number,
  s: Omit<SiteRow, "id" | "created_at">,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE sites SET name=?, url=?, type=?, method=?, expected_status=?, headers=?, enabled=?
     WHERE id=?`,
  )
    .bind(s.name, s.url, s.type, s.method, s.expected_status, s.headers, s.enabled, id)
    .run();
}

export async function deleteSite(env: Env, id: number): Promise<void> {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sites WHERE id = ?").bind(id),
    env.DB.prepare("DELETE FROM checks WHERE site_id = ?").bind(id),
  ]);
}

// Recent checks for one site (newest first), limited window.
export async function recentChecks(
  env: Env,
  siteId: number,
  sinceSeconds: number,
  limit = 120,
): Promise<CheckRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT site_id, checked_at, ok, status_code, latency_ms, error
     FROM checks WHERE site_id = ? AND checked_at >= ?
     ORDER BY checked_at DESC LIMIT ?`,
  )
    .bind(siteId, sinceSeconds, limit)
    .all<CheckRow>();
  return results ?? [];
}
