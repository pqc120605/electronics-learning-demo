CREATE TABLE machmo_community.post_attachments (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES machmo_community.accounts(id) ON DELETE CASCADE,
  draft_id uuid NOT NULL,
  post_id uuid REFERENCES machmo_community.community_posts(id) ON DELETE CASCADE,
  slot smallint NOT NULL CHECK (slot BETWEEN 0 AND 4),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  size integer NOT NULL CHECK (size BETWEEN 1 AND 10485760),
  kind text NOT NULL CHECK (kind IN ('image', 'file')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, draft_id, slot),
  CHECK (post_id IS NULL OR post_id = draft_id)
);
CREATE INDEX post_attachments_published ON machmo_community.post_attachments (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX post_attachments_pending ON machmo_community.post_attachments (created_at) WHERE post_id IS NULL;

CREATE TABLE machmo_community.post_attachment_chunks (
  attachment_id uuid NOT NULL REFERENCES machmo_community.post_attachments(id) ON DELETE CASCADE,
  part smallint NOT NULL CHECK (part BETWEEN 0 AND 9),
  data bytea NOT NULL CHECK (octet_length(data) BETWEEN 1 AND 1048576),
  PRIMARY KEY (attachment_id, part)
);
GRANT SELECT, INSERT, UPDATE (post_id), DELETE ON machmo_community.post_attachments TO machmo_api_stg_app;
GRANT SELECT, INSERT ON machmo_community.post_attachment_chunks TO machmo_api_stg_app;
