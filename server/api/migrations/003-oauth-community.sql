ALTER TABLE machmo_community.accounts
  ADD COLUMN role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  ADD COLUMN avatar_url text CHECK (char_length(avatar_url) <= 512);

CREATE TABLE machmo_community.oauth_identities (
  provider text NOT NULL CHECK (provider IN ('google', 'github')),
  provider_user_id text NOT NULL CHECK (char_length(provider_user_id) BETWEEN 1 AND 255),
  account_id uuid NOT NULL REFERENCES machmo_community.accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (provider, provider_user_id),
  UNIQUE (account_id)
);

CREATE TABLE machmo_community.oauth_attempts (
  digest bytea PRIMARY KEY CHECK (octet_length(digest) = 32),
  provider text NOT NULL CHECK (provider IN ('google', 'github')),
  next text NOT NULL,
  verifier text NOT NULL,
  nonce text,
  expires_at timestamptz NOT NULL
);
CREATE INDEX oauth_attempts_by_expiry ON machmo_community.oauth_attempts (expires_at);

CREATE TABLE machmo_community.community_posts (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES machmo_community.accounts(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 8 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 20 AND 10000),
  category text NOT NULL CHECK (category IN ('co-ban','nhung','iot','du-an','hoi-dap-loi')),
  tags text[] NOT NULL CHECK (cardinality(tags) <= 5),
  search_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  hidden boolean NOT NULL DEFAULT false
);
CREATE INDEX community_posts_public_cursor ON machmo_community.community_posts (created_at DESC, id DESC) WHERE NOT hidden;
CREATE INDEX community_posts_by_owner ON machmo_community.community_posts (account_id);

CREATE TABLE machmo_community.community_comments (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES machmo_community.community_posts(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES machmo_community.accounts(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 2 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  hidden boolean NOT NULL DEFAULT false
);
CREATE INDEX community_comments_by_post ON machmo_community.community_comments (post_id, created_at, id);
CREATE INDEX community_comments_by_owner ON machmo_community.community_comments (account_id);

CREATE TABLE machmo_community.community_reports (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES machmo_community.accounts(id) ON DELETE CASCADE,
  post_id uuid REFERENCES machmo_community.community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES machmo_community.community_comments(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam','offensive','unsafe','off-topic','other')),
  note text NOT NULL CHECK (char_length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK (num_nonnulls(post_id, comment_id) = 1),
  UNIQUE (account_id, post_id),
  UNIQUE (account_id, comment_id)
);
CREATE INDEX community_reports_by_post ON machmo_community.community_reports (post_id);
CREATE INDEX community_reports_by_comment ON machmo_community.community_reports (comment_id);

GRANT INSERT (id, display_name, avatar_url, role), UPDATE (display_name, avatar_url, role), DELETE
  ON machmo_community.accounts TO machmo_api_stg_app;
GRANT INSERT ON machmo_community.sessions TO machmo_api_stg_app;
GRANT SELECT, INSERT ON machmo_community.oauth_identities TO machmo_api_stg_app;
GRANT SELECT, INSERT, DELETE ON machmo_community.oauth_attempts TO machmo_api_stg_app;
GRANT SELECT, INSERT, DELETE ON machmo_community.community_posts, machmo_community.community_comments TO machmo_api_stg_app;
GRANT UPDATE (title, body, category, tags, search_text, hidden) ON machmo_community.community_posts TO machmo_api_stg_app;
GRANT UPDATE (body, hidden) ON machmo_community.community_comments TO machmo_api_stg_app;
GRANT SELECT, INSERT, UPDATE (resolved_at) ON machmo_community.community_reports TO machmo_api_stg_app;
