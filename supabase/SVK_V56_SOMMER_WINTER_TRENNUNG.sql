-- SVK V56 – Sommer- und Winterzeiten strikt getrennt
-- NACH V55 einmal ausführen. Löscht keine Trainingszeiten.

update public.training_times
set period='Sommerzeit'
where period is null or btrim(period)='';

alter table public.training_times
drop constraint if exists training_times_period_check;

alter table public.training_times
add constraint training_times_period_check
check (period in ('Sommerzeit','Winterzeit'));

-- Nur Kontrolle: zeigt die Anzahl getrennt nach Plan.
select period, count(*) as einheiten
from public.training_times
group by period
order by period;
