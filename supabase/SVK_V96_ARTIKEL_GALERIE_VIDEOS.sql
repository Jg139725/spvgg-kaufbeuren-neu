-- V96: Mehrere Bilder und Videos (Highlights) pro Artikel
alter table public.news add column if not exists gallery jsonb not null default '[]'::jsonb;
alter table public.news add column if not exists videos  jsonb not null default '[]'::jsonb;

-- Speicher für hochgeladene Videos (max. 50 MB pro Datei)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-videos','news-videos', true, 52428800, array['video/mp4','video/quicktime','video/webm'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "v96 news videos read" on storage.objects;
create policy "v96 news videos read" on storage.objects for select
  using (bucket_id = 'news-videos');

drop policy if exists "v96 news videos upload" on storage.objects;
create policy "v96 news videos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'news-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.current_user_role() = any (array['admin','editor','herren_news_redaktion','jugend_redaktion','foerderverein_redaktion','damen_redaktion']));

drop policy if exists "v96 news videos delete" on storage.objects;
create policy "v96 news videos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'news-videos'
    and (public.current_user_role() = 'admin' or (storage.foldername(name))[1] = auth.uid()::text));
