begin;
create table public.stadium_issues (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 160),
 issue_date date not null default current_date, file_path text not null unique check(file_path ~ '^[0-9a-f-]+/[0-9a-f-]+\.pdf$'),
 created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now()
);
alter table public.stadium_issues enable row level security;
grant select on public.stadium_issues to anon,authenticated;
grant insert,delete on public.stadium_issues to authenticated;
create policy issues_read on public.stadium_issues for select to anon,authenticated using(true);
create policy issues_insert on public.stadium_issues for insert to authenticated with check(created_by=auth.uid() and split_part(file_path,'/',1)=auth.uid()::text and exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor','herren_news_redaktion')));
create policy issues_delete on public.stadium_issues for delete to authenticated using(exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor','herren_news_redaktion')));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('stadium-issues','stadium-issues',true,20971520,array['application/pdf']);
create policy issues_upload on storage.objects for insert to authenticated with check(bucket_id='stadium-issues' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor','herren_news_redaktion')));
create policy issues_storage_read on storage.objects for select to authenticated using(bucket_id='stadium-issues' and exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor','herren_news_redaktion')));
create policy issues_storage_delete on storage.objects for delete to authenticated using(bucket_id='stadium-issues' and exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor','herren_news_redaktion')));
create table public.site_visits (
 id bigint generated always as identity primary key, visited_at timestamptz not null default now(),
 visit_id uuid not null, path text not null check(length(path)<=200 and path ~ '^/[a-zA-Z0-9/_.,-]*$'),
 source text not null check(source in ('Direkt / unbekannt','Google','Instagram','Facebook','Bing','Andere Website'))
);
alter table public.site_visits enable row level security;
revoke all on public.site_visits from anon,authenticated;
grant insert(visit_id,path,source) on public.site_visits to anon;
grant usage on sequence public.site_visits_id_seq to anon;
create policy visits_insert on public.site_visits for insert to anon with check(true);
-- Only aggregate statistics are returned; raw visits remain inaccessible through the API.
create schema if not exists svk_private;
revoke all on schema svk_private from public;
grant usage on schema svk_private to authenticated;
create function svk_private.visit_summary() returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Nur für Admins' using errcode='42501'; end if;
 select jsonb_build_object('today',count(distinct visit_id) filter(where (visited_at at time zone 'Europe/Berlin')::date=(now() at time zone 'Europe/Berlin')::date),'week',count(distinct visit_id) filter(where visited_at>=date_trunc('week',now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin'),'month',count(distinct visit_id) filter(where visited_at>=date_trunc('month',now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin'),'pages',(select coalesce(jsonb_agg(x),'[]') from(select path,count(*) as views from public.site_visits where visited_at>=now()-interval '30 days' group by path order by count(*) desc limit 20)x),'sources',(select coalesce(jsonb_agg(x),'[]') from(select source,count(distinct visit_id) as visits from public.site_visits where visited_at>=now()-interval '30 days' group by source order by count(distinct visit_id) desc)x)) into result from public.site_visits where visited_at>=now()-interval '90 days';
 return result;
end $$;
revoke all on function svk_private.visit_summary() from public;
grant execute on function svk_private.visit_summary() to authenticated;
create function public.svk_visit_summary() returns jsonb language sql security invoker set search_path='' as $$ select svk_private.visit_summary() $$;
revoke all on function public.svk_visit_summary() from public;
grant execute on function public.svk_visit_summary() to authenticated;
create extension if not exists pg_cron;
select cron.schedule('svk-visit-retention','17 3 * * *', $$delete from public.site_visits where visited_at < now()-interval '90 days'$$);
commit;
