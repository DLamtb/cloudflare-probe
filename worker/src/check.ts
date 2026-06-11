// Single-site check: timed fetch with timeout + SSRF protection.
import type { SiteRow, CheckResult } from "./types";
export type { SiteRow, CheckResult } from "./types";

const TIMEOUT_MS = 10_000;

function isPrivateHost(hostname: string): boolean {
  // Normalize: strip IPv6 brackets
  const host = hostname.replace(/^\[|\]$/g, "");

  // Block loopback
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0" || host === "[::]") return true;
  // Block private IPv4 (10.x, 172.16-31.x, 192.168.x)
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(host)) return true;
  // Block IPv6 private/loopback (fc00::/8, fd00::/8, fe80::/10, ::ffff:127.0.0.1)
  if (/^(fc|fd|fe80|::ffff:127)/i.test(host)) return true;
  // Block link-local and cloud metadata
  if (/^(169\.254\.|metadata\.google\.internal|169\.254\.169\.254)/.test(host)) return true;
  return false;
}

export async function checkSite(site: SiteRow): Promise<CheckResult> {
  const checked_at = Math.floor(Date.now() / 1000);

  let url: URL;
  try {
    url = new URL(site.url);
  } catch {
    return { site_id: site.id, checked_at, ok: 0, status_code: null, latency_ms: null, error: "Invalid URL" };
  }

  if (isPrivateHost(url.hostname)) {
    return { site_id: site.id, checked_at, ok: 0, status_code: null, latency_ms: null, error: "SSRF blocked: private host" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  let headers: Record<string, string> = {};
  try {
    headers = JSON.parse(site.headers || "{}");
  } catch {
    headers = {};
  }

  try {
    const res = await fetch(site.url, {
      method: site.method || "GET",
      headers,
      signal: controller.signal,
      redirect: "manual",
    });
    // If redirected, check if target is private (SSRF via redirect).
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("Location");
      if (location) {
        try {
          const redirectUrl = new URL(location, site.url);
          if (isPrivateHost(redirectUrl.hostname)) {
            return { site_id: site.id, checked_at, ok: 0, status_code: null, latency_ms: Date.now() - start, error: "SSRF blocked: redirect to private host" };
          }
        } catch {
          // Invalid redirect URL
        }
      }
    }
    const latency_ms = Date.now() - start;
    const ok = res.status === site.expected_status ? 1 : 0;
    await res.arrayBuffer().catch(() => undefined);
    return {
      site_id: site.id,
      checked_at,
      ok,
      status_code: res.status,
      latency_ms,
      error: ok ? null : `Unexpected status ${res.status}`,
    };
  } catch (err) {
    const latency_ms = Date.now() - start;
    const message = err instanceof Error ? err.message : "Request failed";
    return {
      site_id: site.id,
      checked_at,
      ok: 0,
      status_code: null,
      latency_ms,
      error: message.slice(0, 200),
    };
  } finally {
    clearTimeout(timer);
  }
}
