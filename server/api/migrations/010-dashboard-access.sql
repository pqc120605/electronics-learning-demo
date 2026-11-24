ALTER TABLE machmo_community.sessions
  ADD COLUMN dashboard_email_proof bytea CHECK (octet_length(dashboard_email_proof) = 32),
  ADD COLUMN dashboard_access_until timestamptz,
  ADD CHECK ((dashboard_email_proof IS NULL) = (dashboard_access_until IS NULL));
