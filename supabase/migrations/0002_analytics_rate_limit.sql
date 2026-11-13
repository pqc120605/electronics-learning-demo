alter table public.analytics_events
  drop constraint if exists analytics_events_allowed_event;

alter table public.analytics_events
  add constraint analytics_events_allowed_event check (
    event_name in ('page_view', 'lesson_open', 'component_select', 'code_copy', 'builder_run')
  );

create or replace function public.enforce_analytics_session_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_minute integer;
  recent_day integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.session_id::text, 0));

  select count(*)::integer into recent_minute
    from public.analytics_events
    where session_id = new.session_id and created_at > now() - interval '1 minute';
  if recent_minute >= 60 then
    raise exception 'analytics session rate limit exceeded';
  end if;

  select count(*)::integer into recent_day
    from public.analytics_events
    where session_id = new.session_id and created_at > now() - interval '1 day';
  if recent_day >= 1000 then
    raise exception 'analytics session daily limit exceeded';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_analytics_session_rate_limit() from public, anon, authenticated;

drop trigger if exists analytics_events_session_rate_limit on public.analytics_events;
create trigger analytics_events_session_rate_limit
  before insert on public.analytics_events
  for each row execute function public.enforce_analytics_session_rate_limit();
