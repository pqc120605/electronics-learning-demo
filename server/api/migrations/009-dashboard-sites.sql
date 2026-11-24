CREATE TABLE machmo_community.dashboard_daily (
  site_id text NOT NULL CHECK (site_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(site_id) <= 48 AND site_id <> 'mach-mo'),
  day date NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  status text NOT NULL CHECK (status IN ('healthy','degraded','down','unknown')),
  accounts integer CHECK (accounts >= 0),
  new_accounts integer CHECK (new_accounts >= 0),
  sessions integer CHECK (sessions >= 0),
  page_views integer CHECK (page_views >= 0),
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (site_id,day)
);

CREATE TABLE machmo_community.dashboard_feedback (
  LIKE machmo_community.site_feedback INCLUDING DEFAULTS INCLUDING CONSTRAINTS,
  site_id text NOT NULL CHECK (site_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(site_id) <= 48 AND site_id <> 'mach-mo'),
  PRIMARY KEY (site_id,id)
);
CREATE INDEX dashboard_feedback_recent ON machmo_community.dashboard_feedback (site_id,created_at DESC,id DESC);
GRANT SELECT ON machmo_community.dashboard_daily, machmo_community.dashboard_feedback TO machmo_api_stg_app;
GRANT INSERT (site_id,day,revision,status,accounts,new_accounts,sessions,page_views),
  UPDATE (revision,status,accounts,new_accounts,sessions,page_views,received_at)
  ON machmo_community.dashboard_daily TO machmo_api_stg_app;
GRANT INSERT (site_id,id,kind,title,details,page,steps,expected,actual,rating)
  ON machmo_community.dashboard_feedback TO machmo_api_stg_app;

CREATE FUNCTION machmo_community.expire_dashboard_data()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
  DELETE FROM machmo_community.dashboard_daily
    WHERE day < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - interval '13 months';
  DELETE FROM machmo_community.dashboard_feedback WHERE created_at < now() - interval '180 days';
$$;
REVOKE ALL ON FUNCTION machmo_community.expire_dashboard_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION machmo_community.expire_dashboard_data() TO machmo_api_stg_app;
