-- SVK V53: Zeitraum + Löschrechte für Redaktion
alter table public.training_times add column if not exists period text;

grant select, insert, update, delete on table public.training_times to authenticated;
grant select on table public.training_times to anon;

drop policy if exists "training_times_delete" on public.training_times;
create policy "training_times_delete" on public.training_times for delete to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','editor','redakteur','jugend_redaktion')));
