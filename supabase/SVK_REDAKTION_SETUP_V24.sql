create extension if not exists pgcrypto;
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text,role text not null default 'viewer' check(role in('viewer','editor','admin')),created_at timestamptz default now());
create table if not exists public.news(id uuid primary key default gen_random_uuid(),category text not null,date date not null default current_date,title text not null,teaser text not null,content text not null,image_url text,status text not null default 'draft' check(status in('draft','published')),published_at timestamptz,created_by uuid references auth.users(id),updated_by uuid references auth.users(id),created_at timestamptz default now(),updated_at timestamptz default now());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$begin insert into public.profiles(id,full_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.email),'viewer') on conflict(id) do nothing;return new;end$$;
drop trigger if exists on_auth_user_created on auth.users;create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
alter table public.profiles enable row level security;alter table public.news enable row level security;
create policy "profile self read" on public.profiles for select to authenticated using(id=auth.uid());
create policy "public published read" on public.news for select to anon using(status='published' and published_at<=now());
create policy "staff read all" on public.news for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('editor','admin')));
create policy "staff insert" on public.news for insert to authenticated with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('editor','admin')) and created_by=auth.uid());
create policy "staff update" on public.news for update to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('editor','admin'))) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('editor','admin')));
create policy "admin delete" on public.news for delete to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('news-images','news-images',true,8388608,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=true;
create policy "public image read" on storage.objects for select using(bucket_id='news-images');
create policy "staff image upload" on storage.objects for insert to authenticated with check(bucket_id='news-images' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('editor','admin')));
create policy "admin image delete" on storage.objects for delete to authenticated using(bucket_id='news-images' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
-- ERSTEN ADMIN NACH USER-ANLAGE:
-- update public.profiles set full_name='Name',role='admin' where id=(select id from auth.users where email='DEINE-EMAIL@BEISPIEL.DE');
-- REDAKTEUR:
-- update public.profiles set full_name='Name',role='editor' where id=(select id from auth.users where email='REDAKTEUR@BEISPIEL.DE');
