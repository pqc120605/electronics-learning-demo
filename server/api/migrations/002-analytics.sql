CREATE SCHEMA machmo_analytics;
REVOKE ALL ON SCHEMA machmo_analytics FROM PUBLIC;

CREATE TABLE machmo_analytics.events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid NOT NULL,
  event_name text NOT NULL CHECK (event_name IN ('page_view', 'lesson_open', 'component_select', 'code_copy', 'builder_run')),
  path text NOT NULL CHECK (path ~ '^/[a-zA-Z0-9/_-]*$' AND length(path) <= 80),
  component_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((event_name = 'component_select' AND component_id IS NOT NULL AND component_id IN ('esp32', 'breadboard', 'led', 'resistor', 'jumper'))
         OR (event_name <> 'component_select' AND component_id IS NULL))
);
CREATE INDEX events_created_at_idx ON machmo_analytics.events (created_at);
CREATE INDEX events_session_created_at_idx ON machmo_analytics.events (session_id, created_at);

CREATE FUNCTION machmo_analytics.expire_events()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
  DELETE FROM machmo_analytics.events WHERE created_at < now() - interval '30 days';
$$;
REVOKE ALL ON FUNCTION machmo_analytics.expire_events() FROM PUBLIC;

GRANT USAGE ON SCHEMA machmo_analytics TO machmo_api_stg_app;
GRANT SELECT ON machmo_analytics.events TO machmo_api_stg_app;
GRANT INSERT (session_id, event_name, path, component_id) ON machmo_analytics.events TO machmo_api_stg_app;
GRANT EXECUTE ON FUNCTION machmo_analytics.expire_events() TO machmo_api_stg_app;
