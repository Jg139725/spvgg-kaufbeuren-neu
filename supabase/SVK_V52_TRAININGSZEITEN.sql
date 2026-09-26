-- SVK V52: Trainingszeiten + Rolle Jugendredaktion
-- Einmal komplett im Supabase SQL Editor ausführen.

-- 1) Rolle jugend_redaktion erlauben
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('viewer','editor','jugend_redaktion','admin'));

-- 2) Trainingszeiten
create table if not exists public.training_times (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('Jugend','Herren','Frauen')),
  team text not null,
  label text,
  weekday text not null check (weekday in ('Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag')),
  start_time time,
  end_time time,
  location text,
  note text,
  active boolean not null default true,
  sort_order integer not null default 99,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.training_times enable row level security;

-- Policies wiederholbar anlegen
drop policy if exists "training public read" on public.training_times;
drop policy if exists "training staff insert" on public.training_times;
drop policy if exists "training staff update" on public.training_times;
drop policy if exists "training admin delete" on public.training_times;
create policy "training public read" on public.training_times for select to anon, authenticated using (active=true or auth.uid() is not null);
create policy "training staff insert" on public.training_times for insert to authenticated with check (
 exists(select 1 from public.profiles p where p.id=auth.uid() and (p.role in ('admin','editor') or (p.role='jugend_redaktion' and scope='Jugend')))
 and created_by=auth.uid()
);
create policy "training staff update" on public.training_times for update to authenticated using (
 exists(select 1 from public.profiles p where p.id=auth.uid() and (p.role in ('admin','editor') or (p.role='jugend_redaktion' and scope='Jugend')))
) with check (
 exists(select 1 from public.profiles p where p.id=auth.uid() and (p.role in ('admin','editor') or (p.role='jugend_redaktion' and scope='Jugend')))
);
create policy "training admin delete" on public.training_times for delete to authenticated using (
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
);

-- 3) Jugendredaktion darf Jugendberichte lesen/anlegen/bearbeiten
drop policy if exists "youth editor news read" on public.news;
drop policy if exists "youth editor news insert" on public.news;
drop policy if exists "youth editor news update" on public.news;
create policy "youth editor news read" on public.news for select to authenticated using (
 category='Jugend' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='jugend_redaktion')
);
create policy "youth editor news insert" on public.news for insert to authenticated with check (
 category='Jugend' and created_by=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='jugend_redaktion')
);
create policy "youth editor news update" on public.news for update to authenticated using (
 category='Jugend' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='jugend_redaktion')
) with check (
 category='Jugend' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='jugend_redaktion')
);

-- Jugendredaktion darf Titelbilder hochladen
drop policy if exists "youth editor image upload" on storage.objects;
create policy "youth editor image upload" on storage.objects for insert to authenticated with check (
 bucket_id='news-images' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='jugend_redaktion')
);

-- 4) Bestehende Jugend-Trainingszeiten einmalig übernehmen (nur wenn Tabelle leer ist)
do $$
begin
if not exists (select 1 from public.training_times) then
 insert into public.training_times(scope,team,label,weekday,start_time,end_time,location,note,sort_order) values
 ('Jugend','U19','A-Jugend','Montag','19:00','21:00','Sportpark am Haken',null,1),('Jugend','U19','A-Jugend','Dienstag','19:00','21:00','Sportpark am Haken',null,2),('Jugend','U19','A-Jugend','Donnerstag','19:00','21:00','Sportpark am Haken',null,4),
 ('Jugend','U17','B-Jugend','Dienstag','18:30','20:15','Sportpark am Haken',null,2),('Jugend','U17','B-Jugend','Donnerstag','18:30','20:15','Sportpark am Haken',null,4),('Jugend','U17','B-Jugend','Freitag','18:30','20:15','Sportpark am Haken',null,5),
 ('Jugend','U15','C-Jugend','Montag','18:00','19:30','Sportpark am Haken',null,1),('Jugend','U15','C-Jugend','Mittwoch','18:00','19:30','Sportpark am Haken',null,3),('Jugend','U15','C-Jugend','Freitag','16:00','17:30','Sportpark am Haken',null,5),
 ('Jugend','U13','D1-Jugend','Dienstag','17:00','18:30','Sportpark am Haken',null,2),('Jugend','U13','D1-Jugend','Donnerstag','17:00','18:30','Sportpark am Haken',null,4),('Jugend','U13','D1-Jugend','Donnerstag','18:30','19:30','Sportpark am Haken','AuxPro',4),
 ('Jugend','U12','D2-/D3-Jugend','Montag','17:15','18:45','Sportpark am Haken',null,1),('Jugend','U12','D2-/D3-Jugend','Dienstag','17:15','18:45','Sportpark am Haken',null,2),('Jugend','U12','D2-/D3-Jugend','Donnerstag','17:30','18:30','Sportpark am Haken','AuxPro',4),('Jugend','U12','D2-/D3-Jugend','Freitag','15:00','16:30','Sportpark am Haken',null,5),
 ('Jugend','U11','E1-Jugend','Montag','17:00','18:30','Sportpark am Haken',null,1),('Jugend','U11','E1-Jugend','Mittwoch','17:00','18:30','Sportpark am Haken',null,3),('Jugend','U11','E1-Jugend','Donnerstag','16:30','17:30','Sportpark am Haken','AuxPro',4),
 ('Jugend','U10','E2-Jugend','Montag','17:00','18:30','Sportpark am Haken',null,1),('Jugend','U10','E2-Jugend','Mittwoch','17:00','18:30','Sportpark am Haken',null,3),
 ('Jugend','U09','F1-Jugend','Montag','16:30','18:30','Sportpark am Haken',null,1),('Jugend','U09','F1-Jugend','Mittwoch','16:30','18:30','Sportpark am Haken',null,3),
 ('Jugend','U08','F2-Jugend','Dienstag','17:00','18:30','Sportpark am Haken',null,2),('Jugend','U08','F2-Jugend','Donnerstag','17:00','18:30','Sportpark am Haken',null,4),
 ('Jugend','G1/G2','Bambini','Dienstag','17:00','18:30','Sportpark am Haken',null,2),('Jugend','G1/G2','Bambini','Donnerstag','17:00','18:30','Sportpark am Haken',null,4),
 ('Jugend','Mädels','Mädchenfußball','Mittwoch','18:00','19:45','Sportpark am Haken',null,3),('Jugend','Mädels','Mädchenfußball','Freitag','18:00','19:45','Sportpark am Haken',null,5);
end if;
end $$;

-- 5) DIE NEUE JUGEND-REDAKTEURIN ZUWEISEN:
-- E-Mail unten ersetzen und danach NUR diese Zeile ausführen:
-- update public.profiles set role='jugend_redaktion' where id=(select id from auth.users where email='IHRE-EMAIL@BEISPIEL.DE');
