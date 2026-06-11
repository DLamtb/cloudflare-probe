// Worker types (mirrors functions/lib/types.ts for the separate Worker deployment).
export interface SiteRow {
  id: number;
  url: string;
  type: string;
  method: string;
  expected_status: number;
  headers: string;
}

export interface CheckResult {
  site_id: number;
  checked_at: number;
  ok: number;
  status_code: number | null;
  latency_ms: number | null;
  error: string | null;
}
