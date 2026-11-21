CREATE TABLE machmo_community.saved_projects (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES machmo_community.accounts(id) ON DELETE CASCADE,
  source_id text NOT NULL CHECK (source_id ~ '^[A-Za-z0-9_-]{1,80}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  digest text NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$'),
  bundle jsonb NOT NULL,
  byte_count integer NOT NULL CHECK (byte_count > 0 AND byte_count <= 57344),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, source_id, digest)
);
CREATE INDEX saved_projects_by_owner ON machmo_community.saved_projects (account_id, created_at DESC, id);

CREATE TABLE machmo_community.project_shares (
  code text PRIMARY KEY CHECK (code ~ '^[A-Za-z0-9_-]{16}$'),
  project_id uuid NOT NULL REFERENCES machmo_community.saved_projects(id) ON DELETE CASCADE,
  listed boolean NOT NULL,
  hidden boolean NOT NULL DEFAULT false,
  views bigint NOT NULL DEFAULT 0 CHECK (views >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, listed)
);
CREATE INDEX project_shares_gallery ON machmo_community.project_shares (created_at DESC) WHERE listed AND NOT hidden;

CREATE TABLE machmo_community.project_likes (
  share_code text NOT NULL REFERENCES machmo_community.project_shares(code) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES machmo_community.accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (share_code, account_id)
);
CREATE INDEX project_likes_by_owner ON machmo_community.project_likes (account_id);

ALTER TABLE machmo_community.community_reports
  ADD COLUMN share_code text REFERENCES machmo_community.project_shares(code) ON DELETE CASCADE,
  DROP CONSTRAINT community_reports_check,
  ADD CHECK (num_nonnulls(post_id, comment_id, share_code) = 1),
  ADD UNIQUE (account_id, share_code);
CREATE INDEX community_reports_by_share ON machmo_community.community_reports (share_code);

GRANT SELECT, INSERT, DELETE ON machmo_community.saved_projects, machmo_community.project_shares, machmo_community.project_likes TO machmo_api_stg_app;
GRANT UPDATE (views, hidden) ON machmo_community.project_shares TO machmo_api_stg_app;
