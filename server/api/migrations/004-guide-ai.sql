CREATE SCHEMA machmo_guide_ai;
REVOKE ALL ON SCHEMA machmo_guide_ai FROM PUBLIC;
GRANT USAGE ON SCHEMA machmo_guide_ai TO machmo_api_stg_app;

CREATE TABLE machmo_guide_ai.daily_total (
  day date PRIMARY KEY,
  used integer NOT NULL CHECK (used > 0)
);
CREATE TABLE machmo_guide_ai.daily_account (
  day date NOT NULL,
  account_id uuid NOT NULL REFERENCES machmo_community.accounts(id) ON DELETE CASCADE,
  used integer NOT NULL CHECK (used > 0),
  PRIMARY KEY (day, account_id)
);
CREATE INDEX daily_account_by_owner ON machmo_guide_ai.daily_account (account_id);

CREATE TABLE machmo_guide_ai.guide_ai_requests (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  provider text NOT NULL CHECK (provider IN ('openai', 'mock', 'ollama')),
  model text NOT NULL CHECK (char_length(model) BETWEEN 1 AND 64),
  status text NOT NULL CHECK (status IN ('answered', 'insufficient', 'error')),
  elapsed_ms integer NOT NULL CHECK (elapsed_ms >= 0),
  input_tokens integer CHECK (input_tokens >= 0),
  output_tokens integer CHECK (output_tokens >= 0),
  cache_hit boolean NOT NULL,
  failure_reason text CHECK (failure_reason IN ('timeout', 'upstream', 'internal')),
  helpful boolean
);
CREATE INDEX guide_ai_requests_by_time ON machmo_guide_ai.guide_ai_requests (created_at);
GRANT SELECT, INSERT, UPDATE (used), DELETE ON machmo_guide_ai.daily_total, machmo_guide_ai.daily_account TO machmo_api_stg_app;
GRANT SELECT, INSERT, UPDATE (helpful), DELETE ON machmo_guide_ai.guide_ai_requests TO machmo_api_stg_app;
