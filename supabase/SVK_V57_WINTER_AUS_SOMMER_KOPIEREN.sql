-- SVK V57 – aktuellen Sommerplan einmalig als Winter-Vorlage kopieren
-- Sicher wiederholbar: bereits vorhandene identische Winter-Einheiten werden nicht doppelt angelegt.

insert into public.training_times
(scope, team, label, weekday, start_time, end_time, location, note, active, sort_order, period, created_by, updated_by)
select
  s.scope, s.team, s.label, s.weekday, s.start_time, s.end_time, s.location, s.note,
  s.active, s.sort_order, 'Winterzeit', s.created_by, s.updated_by
from public.training_times s
where s.scope='Jugend'
  and s.period='Sommerzeit'
  and not exists (
    select 1
    from public.training_times w
    where w.scope=s.scope
      and w.team=s.team
      and w.period='Winterzeit'
      and w.weekday=s.weekday
      and w.start_time is not distinct from s.start_time
      and w.end_time is not distinct from s.end_time
      and coalesce(w.label,'')=coalesce(s.label,'')
  );

-- Der aktuell öffentliche Plan wird absichtlich NICHT geändert.
-- Umschalten erfolgt weiterhin nur über die Redaktion.
select period, count(*) as einheiten
from public.training_times
where scope='Jugend'
group by period
order by period;
