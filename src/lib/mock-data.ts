import type { Site, SiteStatus, MinuteCell } from "./probe-api";

// Deterministic pseudo-random in [0,1) from two integers.
function rand(a: number, b: number): number {
  let h = 2166136261 ^ a;
  h = Math.imul(h ^ (b & 0xffff), 16777619);
  h = Math.imul(h ^ (b >>> 16), 16777619);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

// Internal seed data with headers (not exposed to client).
interface SeedSite extends Site {
  _headers: string;
}

const seedSites: SeedSite[] = [
  {
    id: 1,
    name: "主站官网",
    url: "https://example.com",
    type: "web",
    method: "GET",
    expected_status: 200,
    enabled: 1,
    _headers: "{}",
  },
  {
    id: 2,
    name: "用户 API",
    url: "https://api.example.com/v1/health",
    type: "api",
    method: "GET",
    expected_status: 200,
    enabled: 1,
    _headers: '{"Authorization":"Bearer ***"}',
  },
  {
    id: 3,
    name: "Supabase 保活",
    url: "https://xyzcompany.supabase.co/rest/v1/",
    type: "supabase",
    method: "GET",
    expected_status: 200,
    enabled: 1,
    _headers: '{"apikey":"***"}',
  },
  {
    id: 4,
    name: "支付网关",
    url: "https://pay.example.com/status",
    type: "api",
    method: "GET",
    expected_status: 200,
    enabled: 1,
    _headers: "{}",
  },
  {
    id: 5,
    name: "博客 (维护中)",
    url: "https://blog.example.com",
    type: "web",
    method: "GET",
    expected_status: 200,
    enabled: 0,
    _headers: "{}",
  },
];

// down rate (%) per site for realistic-looking history
const DOWN_RATE: Record<number, number> = { 1: 1, 2: 4, 3: 0, 4: 9, 5: 0 };
const BASE_LATENCY: Record<number, number> = { 1: 90, 2: 140, 3: 60, 4: 220, 5: 0 };

export function getSeedSites(): Site[] {
  return seedSites.map(({ _headers, ...rest }) => rest);
}

export function getSeedHeaders(id: number): string {
  return seedSites.find((s) => s.id === id)?._headers ?? "{}";
}

export function genStatus(site: Site, now: number): SiteStatus {
  const nowMinute = Math.floor(now / 60);
  const downRate = DOWN_RATE[site.id] ?? 3;
  const base = BASE_LATENCY[site.id] ?? 120;

  if (!site.enabled) {
    const minutes: MinuteCell[] = [];
    for (let m = nowMinute - 59; m <= nowMinute; m++) minutes.push({ t: m * 60, ok: null });
    return {
      id: site.id,
      name: site.name,
      url: site.url,
      type: site.type,
      enabled: 0,
      latest: null,
      uptime24h: null,
      minutes,
    };
  }

  const minutes: MinuteCell[] = [];
  for (let m = nowMinute - 59; m <= nowMinute; m++) {
    const ok = rand(site.id, m) < downRate / 100 ? 0 : 1;
    minutes.push({ t: m * 60, ok });
  }

  const lastOk = minutes[minutes.length - 1].ok === 1;
  const latency = Math.round(base + rand(site.id, nowMinute) * 80);
  const uptime24h = Math.round((100 - downRate - rand(site.id, 7) * 0.6) * 10) / 10;

  return {
    id: site.id,
    name: site.name,
    url: site.url,
    type: site.type,
    enabled: 1,
    latest: {
      ok: lastOk ? 1 : 0,
      latency_ms: lastOk ? latency : null,
      status_code: lastOk ? site.expected_status : 503,
      checked_at: now,
      error: lastOk ? null : "Connection timed out",
    },
    uptime24h,
    minutes,
  };
}
