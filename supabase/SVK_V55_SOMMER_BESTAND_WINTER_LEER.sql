-- SVK V55 – bestehende Jugendzeiten = Sommerplan, Winterplan zunächst leer
-- Einmalig NACH V54 ausführen.

-- Alle aktuell vorhandenen Jugend-Trainingszeiten gehören zum Sommerplan.
update public.training_times
set period = 'Sommerzeit'
where scope = 'Jugend';

-- Sommerplan ist zunächst der aktive öffentliche Plan.
insert into public.training_settings(scope, active_period, updated_at)
values ('Jugend','Sommerzeit',now())
on conflict (scope) do update
set active_period='Sommerzeit', updated_at=now();

-- Kontrolle: Winter muss jetzt 0 Einträge haben.
select period, count(*) as einheiten
from public.training_times
where scope='Jugend'
group by period
order by period;
