// Cron Worker: every minute, check all enabled sites and store results.
import { checkSite, type SiteRow, type CheckResult } from "./check";

export interface Env {
  DB: D1Database;
  TRIGGER_TOKEN?: string;
}

const RETENTION_DAYS = 7;
const CONCURRENCY_LIMIT = 10;

async function runChecks(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT id, url, type, method, expected_status, headers
     FROM sites WHERE enabled = 1`,
  ).all<SiteRow>();
  const sites = results ?? [];
  if (sites.length === 0) return;

  // Run checks with concurrency limit to avoid overwhelming the network.
  const checks: CheckResult[] = [];
  for (let i = 0; i < sites.length; i += CONCURRENCY_LIMIT) {
    const batch = sites.slice(i, i + CONCURRENCY_LIMIT);
    const settled = await Promise.allSettled(batch.map((s) => checkSite(s)));
    for (const r of settled) {
      if (r.status === "fulfilled") {
        checks.push(r.value);
      } else {
        console.error("Check failed:", r.reason);
      }
    }
  }

  if (checks.length > 0) {
    const stmt = env.DB.prepare(
      `INSERT INTO checks (site_id, checked_at, ok, status_code, latency_ms, error)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    await env.DB.batch(
      checks.map((c) =>
        stmt.bind(c.site_id, c.checked_at, c.ok, c.status_code, c.latency_ms, c.error),
      ),
    );
  }

  // Cleanup old rows.
  const cutoff = Math.floor(Date.now() / 1000) - RETENTION_DAYS * 24 * 3600;
  await env.DB.prepare("DELETE FROM checks WHERE checked_at < ?").bind(cutoff).run();
}

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runChecks(env));
  },

  // Manual trigger for testing: GET /?token=xxx triggers one run.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    // Require a trigger token for manual runs (set via wrangler secret put TRIGGER_TOKEN).
    if (token !== env.TRIGGER_TOKEN) {
      return new Response("Forbidden", { status: 403 });
    }
    await runChecks(env);
    return new Response("ok");
  },
};
