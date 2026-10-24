begin;
create table public.stadium_settings (
 id boolean primary key default true check(id),
 url text not null default '' check(url='' or (length(url)<=2048 and url ~ '^https://[a-zA-Z0-9][a-zA-Z0-9.-]+(:[0-9]+)?([/?#][^[:space:]]*)?$')),
 updated_at timestamptz not null default now()
);
alter table public.stadium_settings enable row level security;
revoke all on public.stadium_settings from anon,authenticated;
grant select on public.stadium_settings to anon,authenticated;
grant insert,update on public.stadium_settings to authenticated;
create policy stadium_settings_read on public.stadium_settings for select to anon,authenticated using(true);
create policy stadium_settings_insert on public.stadium_settings for insert to authenticated with check(exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor','herren_news_redaktion')));
create policy stadium_settings_update on public.stadium_settings for update to authenticated using(exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor','herren_news_redaktion'))) with check(exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor','herren_news_redaktion')));
insert into public.stadium_settings(id,url) values(true,'');
commit;
