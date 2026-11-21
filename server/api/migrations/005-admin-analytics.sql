ALTER TABLE machmo_community.accounts ADD COLUMN created_at timestamptz;
ALTER TABLE machmo_community.accounts ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE machmo_analytics.events DROP CONSTRAINT events_event_name_check;
ALTER TABLE machmo_analytics.events
  ADD CHECK (event_name IN ('page_view','lesson_open','component_select','code_copy','builder_run','lesson_complete')),
  ADD COLUMN device text CHECK (device IN ('mobile','tablet','desktop')),
  ADD COLUMN referrer_host text CHECK (char_length(referrer_host) <= 253),
  ADD COLUMN lesson_id text CHECK (lesson_id ~ '^[a-z0-9-]{1,64}$'),
  ADD COLUMN board_id text CHECK (board_id ~ '^[a-z0-9-]{1,64}$');
GRANT INSERT (device, referrer_host, lesson_id, board_id) ON machmo_analytics.events TO machmo_api_stg_app;

CREATE TABLE machmo_analytics.daily_totals (
  day date PRIMARY KEY,
  sessions integer NOT NULL,
  events integer NOT NULL,
  by_event jsonb NOT NULL
);
GRANT SELECT ON machmo_analytics.daily_totals TO machmo_api_stg_app;

CREATE OR REPLACE FUNCTION machmo_analytics.expire_events()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
  WITH bounds AS (
    SELECT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS today
  ), days_to_roll AS (
    SELECT (e.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day, e.event_name, e.session_id
    FROM machmo_analytics.events e, bounds b
    WHERE e.created_at < (b.today::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND (e.created_at >= ((b.today-1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')
         OR NOT EXISTS (SELECT 1 FROM machmo_analytics.daily_totals d WHERE d.day=(e.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date))
  ), event_counts AS (
    SELECT day, event_name, count(*) AS num FROM days_to_roll GROUP BY day,event_name
  ), totals AS (
    SELECT day, count(DISTINCT session_id)::int AS sessions, count(*)::int AS events FROM days_to_roll GROUP BY day
  )
  INSERT INTO machmo_analytics.daily_totals (day,sessions,events,by_event)
  SELECT t.day, t.sessions, t.events, (SELECT jsonb_object_agg(event_name,num) FROM event_counts WHERE day=t.day)
  FROM totals t ON CONFLICT (day) DO UPDATE SET sessions=excluded.sessions, events=excluded.events, by_event=excluded.by_event;
  DELETE FROM machmo_analytics.events WHERE created_at < now() - interval '90 days';
  DELETE FROM machmo_analytics.daily_totals WHERE day < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - interval '13 months';
$$;
