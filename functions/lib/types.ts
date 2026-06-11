// Shared types for Pages Functions and Worker.
export interface SiteRow {
  id: number;
  name: string;
  url: string;
  type: string;
  method: string;
  expected_status: number;
  headers: string;
  enabled: number;
  created_at: number;
}

export interface CheckRow {
  site_id: number;
  checked_at: number;
  ok: number;
  status_code: number | null;
  latency_ms: number | null;
  error: string | null;
}

export type SitePublic = Omit<SiteRow, "headers">;

export interface SiteInput {
  name: string;
  url: string;
  type: string;
  method: string;
  expected_status: number;
  headers: string;
  enabled: number;
}
