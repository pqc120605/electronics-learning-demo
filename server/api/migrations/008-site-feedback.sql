CREATE TABLE machmo_community.site_feedback (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('bug','idea','content')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  details text NOT NULL CHECK (char_length(details) BETWEEN 10 AND 5000),
  page text NOT NULL CHECK (char_length(page) <= 180),
  steps text NOT NULL CHECK (char_length(steps) <= 3000),
  expected text NOT NULL CHECK (char_length(expected) <= 1500),
  actual text NOT NULL CHECK (char_length(actual) <= 1500),
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX site_feedback_recent ON machmo_community.site_feedback (created_at DESC, id DESC);
GRANT SELECT ON machmo_community.site_feedback TO machmo_api_stg_app;
GRANT INSERT (id,kind,title,details,page,steps,expected,actual,rating)
  ON machmo_community.site_feedback TO machmo_api_stg_app;

CREATE FUNCTION machmo_community.expire_site_feedback()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
  DELETE FROM machmo_community.site_feedback WHERE created_at < now() - interval '180 days';
$$;
REVOKE ALL ON FUNCTION machmo_community.expire_site_feedback() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION machmo_community.expire_site_feedback() TO machmo_api_stg_app;
