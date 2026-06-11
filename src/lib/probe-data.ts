// Data layer for the UI. Currently runs on mock data persisted in
// localStorage so the dashboard is fully interactive without a backend.
// Flip USE_MOCK to false once functions/ + worker/ are deployed to use the
// real /api/* endpoints from probe-api.ts.
import { probeApi, type Site, type SiteInput, type SiteStatus } from "./probe-api";
import { genStatus, getSeedSites, getSeedHeaders } from "./mock-data";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const KEY = "probe.mock.sites.v1";

// Mock storage for headers (not exposed to client via API).
const HEADERS_KEY = "probe.mock.headers.v1";

function loadHeaders(): Record<number, string> {
  if (typeof localStorage === "undefined") return {};
  const raw = localStorage.getItem(HEADERS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<number, string>;
  } catch {
    return {};
  }
}

function persistHeaders(map: Record<number, string>) {
  if (typeof localStorage !== "undefined") localStorage.setItem(HEADERS_KEY, JSON.stringify(map));
}

function load(): Site[] {
  if (typeof localStorage === "undefined") return getSeedSites();
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const sites = getSeedSites();
    localStorage.setItem(KEY, JSON.stringify(sites));
    // Also seed headers.
    const headers: Record<number, string> = {};
    for (const s of sites) headers[s.id] = getSeedHeaders(s.id);
    persistHeaders(headers);
    return sites;
  }
  try {
    return JSON.parse(raw) as Site[];
  } catch {
    return getSeedSites();
  }
}

function persist(sites: Site[]) {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(sites));
}

export const probeData = {
  async status(): Promise<{ sites: SiteStatus[]; now: number }> {
    if (!USE_MOCK) return probeApi.status();
    const now = Math.floor(Date.now() / 1000);
    return { sites: load().map((s) => genStatus(s, now)), now };
  },

  async listSites(): Promise<{ sites: Site[] }> {
    if (!USE_MOCK) return probeApi.listSites();
    return { sites: load() };
  },

  async createSite(data: SiteInput): Promise<{ ok: boolean; id: number }> {
    if (!USE_MOCK) return probeApi.createSite(data);
    const sites = load();
    const id = sites.reduce((m, s) => Math.max(m, s.id), 0) + 1;
    const { headers, ...siteData } = data;
    sites.unshift({ id, ...siteData });
    persist(sites);
    // Store headers separately.
    const headersMap = loadHeaders();
    headersMap[id] = headers;
    persistHeaders(headersMap);
    return { ok: true, id };
  },

  async updateSite(id: number, data: SiteInput): Promise<{ ok: boolean }> {
    if (!USE_MOCK) return probeApi.updateSite(id, data);
    const sites = load().map((s) => (s.id === id ? { ...data, id } : s));
    persist(sites);
    // Update headers if provided.
    if (data.headers) {
      const headersMap = loadHeaders();
      headersMap[id] = data.headers;
      persistHeaders(headersMap);
    }
    return { ok: true };
  },

  async deleteSite(id: number): Promise<{ ok: boolean }> {
    if (!USE_MOCK) return probeApi.deleteSite(id);
    persist(load().filter((s) => s.id !== id));
    // Clean up headers.
    const headersMap = loadHeaders();
    delete headersMap[id];
    persistHeaders(headersMap);
    return { ok: true };
  },
};
