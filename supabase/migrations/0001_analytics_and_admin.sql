create schema if not exists private;

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;
revoke all on table public.site_admins from public, anon, authenticated;
grant select on table public.site_admins to authenticated;

create policy "site_admins_read_own_role"
  on public.site_admins
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  event_name text not null,
  path text not null,
  component_id text,
  created_at timestamptz not null default now(),
  constraint analytics_events_allowed_event check (
    event_name in ('page_view', 'lesson_open', 'component_select', 'code_copy')
  ),
  constraint analytics_events_bounded_path check (
    length(path) between 1 and 200 and path ~ '^/[A-Za-z0-9/_-]{0,199}$'
  ),
  constraint analytics_events_bounded_component check (
    component_id is null or component_id in ('esp32', 'breadboard', 'led', 'resistor', 'jumper')
  ),
  constraint analytics_events_component_required check (
    (event_name = 'component_select' and component_id is not null)
    or (event_name <> 'component_select' and component_id is null)
  )
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at);
create index if not exists analytics_events_session_created_at_idx
  on public.analytics_events (session_id, created_at);

alter table public.analytics_events enable row level security;
revoke all on table public.analytics_events from public, anon, authenticated;
grant insert (session_id, event_name, path, component_id)
  on table public.analytics_events to anon, authenticated;
grant select on table public.analytics_events to authenticated;

create policy "analytics_events_accept_bounded_events"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

create or replace function private.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.site_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_site_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_site_admin() to authenticated;

create policy "analytics_events_admin_read"
  on public.analytics_events
  for select
  to authenticated
  using ((select private.is_site_admin()));

create or replace function public.get_analytics_summary(
  p_start_at timestamptz,
  p_end_at timestamptz
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_summary jsonb;
begin
  if not private.is_site_admin() then
    raise insufficient_privilege using message = 'Admin access required';
  end if;

  if p_start_at is null or p_end_at is null or p_end_at <= p_start_at then
    raise invalid_parameter_value using message = 'A valid date range is required';
  end if;

  if p_end_at - p_start_at > interval '93 days' then
    raise invalid_parameter_value using message = 'Date range cannot exceed 93 days';
  end if;

  with filtered as (
    select session_id, event_name, path, created_at
    from public.analytics_events
    where created_at >= p_start_at and created_at < p_end_at
  ),
  daily as (
    select
      (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
      count(*)::bigint as events,
      count(distinct session_id)::bigint as sessions
    from filtered
    group by 1
  ),
  by_event as (
    select event_name, count(*)::bigint as events
    from filtered
    group by event_name
  ),
  by_path as (
    select path, count(*)::bigint as events
    from filtered
    group by path
  )
  select jsonb_build_object(
    'sessionCount', (select count(distinct session_id)::bigint from filtered),
    'eventCount', (select count(*)::bigint from filtered),
    'daily', coalesce(
      (select jsonb_agg(jsonb_build_object(
        'day', day,
        'sessions', sessions,
        'events', events
      ) order by day) from daily),
      '[]'::jsonb
    ),
    'byEvent', coalesce(
      (select jsonb_agg(jsonb_build_object(
        'eventName', event_name,
        'events', events
      ) order by event_name) from by_event),
      '[]'::jsonb
    ),
    'byPath', coalesce(
      (select jsonb_agg(jsonb_build_object(
        'path', path,
        'events', events
      ) order by events desc, path) from by_path),
      '[]'::jsonb
    )
  ) into v_summary;

  return v_summary;
end;
$$;

revoke all on function public.get_analytics_summary(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_analytics_summary(timestamptz, timestamptz) to authenticated;

comment on table public.analytics_events is
  'Anonymous learning usage events only; never store names, emails, IP addresses, or user-entered content here.';
comment on table public.site_admins is
  'Explicit site admin allowlist. Add the initial founder from the trusted Supabase dashboard/SQL editor only.';

-- Initial founder setup after creating the Auth user in Supabase Dashboard:
-- insert into public.site_admins (user_id) values ('AUTH_USER_UUID_HERE');
