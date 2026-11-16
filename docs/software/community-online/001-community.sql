-- MM-SW-COMMUNITY-ATTACH-001 · revision 1 · 2026-11-16
-- Apply as project owner in Supabase SQL Editor, once, to a fresh community schema.
-- This package does not modify the unrelated analytics/admin migrations.
begin;
create schema if not exists private;
create table public.community_posts (
  id uuid primary key,
  author_id uuid not null references auth.users(id),
  author_name text not null check (length(author_name) between 1 and 80),
  title text not null check (length(btrim(title)) between 8 and 120),
  body text not null check (length(btrim(body)) between 20 and 10000),
  category text not null check (category in ('co-ban','nhung','iot','du-an','hoi-dap-loi')),
  tags text[] not null default '{}' check (cardinality(tags) <= 5),
  status text not null default 'draft' check (status in ('draft','published')),
  manifest jsonb not null default '[]' check (jsonb_typeof(manifest) = 'array' and jsonb_array_length(manifest) <= 5),
  attachments jsonb not null default '[]',
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id),
  author_id uuid not null references auth.users(id),
  author_name text not null,
  body text not null check (length(btrim(body)) between 2 and 4000),
  created_at timestamptz not null default now()
);
create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id),
  target_type text not null check (target_type in ('post','comment')),
  target_id uuid not null,
  reason text not null check (reason in ('spam','offensive','unsafe','off-topic','other')),
  note text not null check (length(note) <= 500),
  created_at timestamptz not null default now()
);
create index community_posts_date on public.community_posts(created_at desc);
create index community_comments_post on public.community_comments(post_id,created_at);
create index community_posts_author on public.community_posts(author_id,created_at);
create index community_comments_author on public.community_comments(author_id,created_at);
create index community_reports_author on public.community_reports(author_id,created_at);
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;
revoke all on public.community_posts, public.community_comments, public.community_reports from public, anon, authenticated;
grant select on public.community_posts, public.community_comments to anon, authenticated;
create policy community_published_posts on public.community_posts for select to anon, authenticated using (status = 'published');
create policy community_published_comments on public.community_comments for select to anon, authenticated using (exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published'));

-- Private bucket; byte limit is enforced by Storage upload service, NOT client MIME/size.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('community-attachments','community-attachments',false,10485760,array['application/octet-stream']);

create function private.community_name() returns text
language sql stable security definer set search_path = '' as $$
  select left(coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),'Thành viên'),80)
  from auth.users u where u.id = auth.uid();
$$;

create function public.community_begin_post(p_id uuid,p_title text,p_body text,p_category text,p_tags text[],p_manifest jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.community_posts; a jsonb; i integer := 0; total bigint := 0; uploaded jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text || ':community',0));
  if p_id is null or p_title is null or p_body is null or p_category is null or p_tags is null or p_manifest is null then raise exception 'Missing input'; end if;
  if jsonb_typeof(p_manifest) <> 'array' or jsonb_array_length(p_manifest) > 5 then raise exception 'Attachment count'; end if;
  for a in select value from jsonb_array_elements(p_manifest) loop
    if a->>'id' is distinct from i::text or a->>'path' is distinct from auth.uid()::text || '/' || p_id::text || '/' || i::text
      or coalesce(a->>'name','') !~* '^[^/\\<>:"|?*[:cntrl:]]{1,120}\.(png|jpe?g|webp|gif|pdf|txt|md|csv|json|ino|c|h|cpp|hpp|py|hex|log)$'
      or coalesce(a->>'kind','') not in ('image','file')
      or coalesce(a->>'sha256','') !~ '^[a-f0-9]{64}$'
      or coalesce(a->>'size','') !~ '^[0-9]{1,8}$'
      then raise exception 'Invalid attachment manifest'; end if;
    if (a->>'size')::bigint not between 1 and 10485760 then raise exception 'File size'; end if;
    total := total + (a->>'size')::bigint;
    i := i + 1;
  end loop;
  if total > 26214400 then raise exception 'Post attachment size'; end if;
  if exists (select 1 from unnest(p_tags) t where length(t) > 24 or length(t) < 1) then raise exception 'Invalid tags'; end if;
  select * into p from public.community_posts where id = p_id for update;
  if found then
    if p.author_id <> auth.uid() then raise exception 'Not owner'; end if;
    if p.title <> p_title or p.body <> p_body or p.category <> p_category or p.tags <> p_tags or p.manifest <> p_manifest then raise exception 'Request id already belongs to different content'; end if;
  else
    if (select count(*) from public.community_posts where author_id = auth.uid() and created_at > now() - interval '1 hour') >= 10 then raise exception 'Post rate limit (10/hour)'; end if;
    insert into public.community_posts(id,author_id,author_name,title,body,category,tags,manifest)
    values(p_id,auth.uid(),private.community_name(),p_title,p_body,p_category,p_tags,p_manifest) returning * into p;
  end if;
  select coalesce(jsonb_agg(o.name),'[]') into uploaded from storage.objects o where o.bucket_id = 'community-attachments' and o.name like auth.uid()::text || '/' || p_id::text || '/%';
  return jsonb_build_object('status',p.status,'uploaded',uploaded);
end;
$$;

-- Authenticated clients cannot write Storage metadata directly. These byte lengths are
-- supplied by the Storage service after upload; MIME and manifest sizes are not proof.
-- Fail closed if the project's Storage version does not populate numeric size metadata.
create function private.community_upload_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.community_posts; n integer; bytes bigint; sum_bytes bigint;
begin
  if new.bucket_id <> 'community-attachments' then return new; end if;
  if auth.uid() is null or split_part(new.name,'/',1) <> auth.uid()::text then raise exception 'Upload owner mismatch'; end if;
  select * into p from public.community_posts where id::text = split_part(new.name,'/',2) for update;
  if not found or p.author_id <> auth.uid() or p.status <> 'draft' then raise exception 'Writable draft required'; end if;
  if not exists(select 1 from jsonb_array_elements(p.manifest) a where a->>'path' = new.name) then raise exception 'Unreserved upload path'; end if;
  if coalesce(new.metadata->>'size','') !~ '^[0-9]{1,8}$' then raise exception 'Storage size metadata required'; end if;
  bytes := (new.metadata->>'size')::bigint;
  if bytes not between 1 and 10485760 then raise exception 'File byte limit'; end if;
  select count(*),coalesce(sum((o.metadata->>'size')::bigint),0) into n,sum_bytes from storage.objects o
    where o.bucket_id = 'community-attachments' and o.name like p.author_id::text || '/' || p.id::text || '/%' and o.id <> new.id;
  if n >= 5 or sum_bytes + bytes > 26214400 then raise exception 'Post byte/count limit'; end if;
  return new;
end;
$$;
create trigger community_storage_guard before insert or update on storage.objects for each row execute function private.community_upload_guard();

create function private.community_can_upload(object_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and split_part(object_name,'/',1) = auth.uid()::text and exists (
    select 1 from public.community_posts p,jsonb_array_elements(p.manifest) a
    where p.author_id = auth.uid() and p.status = 'draft' and a->>'path' = object_name);
$$;
create function private.community_can_read(object_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.community_posts p,jsonb_array_elements(p.attachments) a where p.status = 'published' and a->>'path' = object_name);
$$;
grant usage on schema private to anon, authenticated;
grant execute on function private.community_can_upload(text) to anon, authenticated;
grant execute on function private.community_can_read(text) to anon, authenticated;
create policy community_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'community-attachments' and private.community_can_upload(name));
create policy community_storage_published_read on storage.objects for select to anon,authenticated using (bucket_id = 'community-attachments' and private.community_can_read(name));
-- Restrictive guards also protect this bucket if another app has permissive global
-- storage policies. Never change/rely on those unrelated policies.
create policy community_storage_read_guard on storage.objects as restrictive for select to anon,authenticated using (bucket_id <> 'community-attachments' or private.community_can_read(name));
create policy community_storage_insert_guard on storage.objects as restrictive for insert to anon,authenticated with check (bucket_id <> 'community-attachments' or private.community_can_upload(name));
create policy community_storage_update_guard on storage.objects as restrictive for update to anon,authenticated using (bucket_id <> 'community-attachments') with check (bucket_id <> 'community-attachments');
create policy community_storage_delete_guard on storage.objects as restrictive for delete to anon,authenticated using (bucket_id <> 'community-attachments');
-- No update/delete policy: no overwrite/move/delete races after publication.

create function public.community_publish_post(p_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare p public.community_posts; a jsonb; o storage.objects; result jsonb := '[]'; total bigint := 0; bytes bigint; n integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into p from public.community_posts where id = p_id for update;
  if not found or p.author_id <> auth.uid() then raise exception 'Not owner'; end if;
  if p.status = 'published' then return p_id; end if;
  for a in select value from jsonb_array_elements(p.manifest) loop
    select * into o from storage.objects where bucket_id = 'community-attachments' and name = a->>'path';
    if not found or coalesce(o.metadata->>'size','') !~ '^[0-9]{1,8}$' then raise exception 'Missing upload/size'; end if;
    bytes := (o.metadata->>'size')::bigint;
    if bytes not between 1 and 10485760 or bytes <> (a->>'size')::bigint then raise exception 'Stored byte length mismatch'; end if;
    total := total + bytes;
    result := result || jsonb_build_array(jsonb_build_object('id',a->>'id','path',o.name,'name',a->>'name','kind',a->>'kind','size',bytes));
  end loop;
  select count(*) into n from storage.objects where bucket_id = 'community-attachments' and name like p.author_id::text || '/' || p.id::text || '/%';
  if n <> jsonb_array_length(p.manifest) or n > 5 or total > 26214400 then raise exception 'Stored attachment bounds'; end if;
  update public.community_posts set status = 'published',attachments = result where id = p_id;
  return p_id;
end;
$$;

create function public.community_add_comment(p_post_id uuid,p_body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c public.community_comments;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text || ':community',0));
  if not exists(select 1 from public.community_posts where id = p_post_id and status = 'published') then raise exception 'Published post required'; end if;
  if (select count(*) from public.community_comments where author_id = auth.uid() and created_at > now() - interval '1 hour') >= 60 then raise exception 'Comment rate limit (60/hour)'; end if;
  insert into public.community_comments(post_id,author_id,author_name,body) values(p_post_id,auth.uid(),private.community_name(),p_body) returning * into c;
  update public.community_posts set comment_count = comment_count + 1 where id = p_post_id;
  return to_jsonb(c);
end;
$$;
create function public.community_report(p_target_type text,p_target_id uuid,p_reason text,p_note text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.community_reports;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text || ':community',0));
  if not ((p_target_type = 'post' and exists(select 1 from public.community_posts where id = p_target_id and status = 'published')) or (p_target_type = 'comment' and exists(select 1 from public.community_comments c join public.community_posts p on p.id = c.post_id where c.id = p_target_id and p.status = 'published'))) then raise exception 'Published target required'; end if;
  if (select count(*) from public.community_reports where author_id = auth.uid() and created_at > now() - interval '1 day') >= 20 then raise exception 'Report rate limit (20/day)'; end if;
  insert into public.community_reports(author_id,target_type,target_id,reason,note) values(auth.uid(),p_target_type,p_target_id,p_reason,p_note) returning * into r;
  return jsonb_build_object('id',r.id,'created_at',r.created_at);
end;
$$;
revoke all on function private.community_name(),private.community_upload_guard(),private.community_can_upload(text),private.community_can_read(text) from public;
revoke all on function public.community_begin_post(uuid,text,text,text,text[],jsonb),public.community_publish_post(uuid),public.community_add_comment(uuid,text),public.community_report(text,uuid,text,text) from public,anon;
grant execute on function public.community_begin_post(uuid,text,text,text,text[],jsonb),public.community_publish_post(uuid),public.community_add_comment(uuid,text),public.community_report(text,uuid,text,text) to authenticated;
commit;
