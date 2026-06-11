-- D1 schema for the Cloudflare uptime probe
-- Run: wrangler d1 execute probe-db --file=./schema.sql



CREATE TABLE IF NOT EXISTS sites (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  url             TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'web',      -- web | api | supabase
  method          TEXT NOT NULL DEFAULT 'GET',
  expected_status INTEGER NOT NULL DEFAULT 200,
  headers         TEXT NOT NULL DEFAULT '{}',       -- JSON string
  enabled         INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS checks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id     INTEGER NOT NULL,
  checked_at  INTEGER NOT NULL,                     -- epoch seconds
  ok          INTEGER NOT NULL,                     -- 0 | 1
  status_code INTEGER,
  latency_ms  INTEGER,
  error       TEXT,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  username    TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  expires_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checks_site_time ON checks (site_id, checked_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);
