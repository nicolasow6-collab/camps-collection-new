-- API Metrics Tracking Table (persistent across refreshes)
-- Tracks: first_call_date, active_days (JSONB array), total_api_calls

CREATE TABLE IF NOT EXISTS api_metrics (
  id SERIAL PRIMARY KEY,
  first_call_date DATE NOT NULL,
  active_days JSONB NOT NULL DEFAULT '[]',
  total_api_calls BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE api_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anon to SELECT (for dashboard display)
CREATE POLICY api_metrics_select ON api_metrics
  FOR SELECT
  USING (true);

-- Policy: Allow service role to INSERT/UPDATE/DELETE (for server-side tracking)
CREATE POLICY api_metrics_service ON api_metrics
  FOR ALL
  USING (true);

-- Initialize with first record (optional - server will create on first API call)
-- INSERT INTO api_metrics (first_call_date, active_days, total_api_calls)
-- VALUES (CURRENT_DATE, '[]', 0);
