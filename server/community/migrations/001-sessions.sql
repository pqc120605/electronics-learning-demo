BEGIN;
CREATE SCHEMA machmo_community;
REVOKE ALL ON SCHEMA machmo_community FROM PUBLIC;

CREATE TABLE machmo_community.accounts (
    id uuid PRIMARY KEY,
    display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 60),
    revoked_at timestamptz
);

CREATE TABLE machmo_community.invites (
    digest bytea PRIMARY KEY CHECK (octet_length(digest) = 32),
    account_id uuid NOT NULL REFERENCES machmo_community.accounts(id),
    expires_at timestamptz NOT NULL,
    redeemed_at timestamptz
);

CREATE TABLE machmo_community.sessions (
    digest bytea PRIMARY KEY CHECK (octet_length(digest) = 32),
    account_id uuid NOT NULL REFERENCES machmo_community.accounts(id),
    expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_by_expiry ON machmo_community.sessions (expires_at);

GRANT USAGE ON SCHEMA machmo_community TO machmo_community_app;
GRANT SELECT ON machmo_community.accounts, machmo_community.invites, machmo_community.sessions TO machmo_community_app;
GRANT UPDATE (redeemed_at) ON machmo_community.invites TO machmo_community_app;
GRANT INSERT, DELETE ON machmo_community.sessions TO machmo_community_app;
COMMIT;
