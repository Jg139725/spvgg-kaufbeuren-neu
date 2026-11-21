-- V95: Jede Redaktion darf Artikel aus ihrem eigenen Bereich löschen.
-- (Admins dürfen weiterhin alles löschen, Damen-Redaktion hatte das schon.)
drop policy if exists "v95 herren news delete" on public.news;
create policy "v95 herren news delete" on public.news for delete to authenticated
  using (category = 'Herren' and public.current_user_role() = 'herren_news_redaktion');

drop policy if exists "v95 jugend news delete" on public.news;
create policy "v95 jugend news delete" on public.news for delete to authenticated
  using (category = 'Jugend' and public.current_user_role() = 'jugend_redaktion');

drop policy if exists "v95 fv news delete" on public.news;
create policy "v95 fv news delete" on public.news for delete to authenticated
  using (category = 'Förderverein' and public.current_user_role() = 'foerderverein_redaktion');
