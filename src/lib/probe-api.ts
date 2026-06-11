// Client wrappers for the Pages Functions API (/api/*).

export interface MinuteCell {
  t: number;
  ok: number | null;
}

export interface SiteStatus {
  id: number;
  name: string;
  url: string;
  type: string;
  enabled: number;
  latest: {
    ok: number;
    latency_ms: number | null;
    status_code: number | null;
    checked_at: number;
    error: string | null;
  } | null;
  uptime24h: number | null;
  minutes: MinuteCell[];
}

// Public site info returned by GET /api/sites (no headers field).
export interface Site {
  id: number;
  name: string;
  url: string;
  type: string;
  method: string;
  expected_status: number;
  enabled: number;
}

// Input for create/update (includes headers for server-side storage).
export interface SiteInput {
  name: string;
  url: string;
  type: string;
  method: string;
  expected_status: number;
  headers: string;
  enabled: number;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(init?.method && init.method !== "GET" ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const text = (await res.text()).trim();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body as T;
}

export const probeApi = {
  status: () => req<{ sites: SiteStatus[]; now: number }>("/api/status"),
  listSites: () => req<{ sites: Site[] }>("/api/sites"),
  createSite: (data: SiteInput) =>
    req<{ ok: boolean; id: number }>("/api/sites", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSite: (id: number, data: SiteInput) =>
    req<{ ok: boolean }>(`/api/sites/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteSite: (id: number) =>
    req<{ ok: boolean }>(`/api/sites/${id}`, { method: "DELETE" }),
};
