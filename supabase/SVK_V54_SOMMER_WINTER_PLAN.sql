-- SVK V54 – Sommer-/Winterplan für Trainingszeiten

-- Bestehende Einträge werden als Sommerzeit übernommen, damit nichts verschwindet.
update public.training_times set period='Sommerzeit' where period is null or btrim(period)='';

create table if not exists public.training_settings (
  scope text primary key,
  active_period text not null default 'Sommerzeit' check (active_period in ('Sommerzeit','Winterzeit')),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id)
);

insert into public.training_settings(scope,active_period) values ('Jugend','Sommerzeit')
on conflict (scope) do nothing;

alter table public.training_settings enable row level security;
grant select on public.training_settings to anon, authenticated;
grant insert, update on public.training_settings to authenticated;

drop policy if exists "training_settings_public_read" on public.training_settings;
create policy "training_settings_public_read" on public.training_settings for select to anon,authenticated using (true);

drop policy if exists "training_settings_insert" on public.training_settings;
create policy "training_settings_insert" on public.training_settings for insert to authenticated
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','editor','redakteur','jugend_redaktion')));

drop policy if exists "training_settings_update" on public.training_settings;
create policy "training_settings_update" on public.training_settings for update to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','editor','redakteur','jugend_redaktion')))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','editor','redakteur','jugend_redaktion')));
