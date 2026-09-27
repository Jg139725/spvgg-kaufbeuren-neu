# SVK V68.1 – Trainer-Migration

1. Supabase: `supabase/SVK_V68_1_TRAINER_MIGRATION.sql` **einmal** ausführen.
2. Danach alle übrigen Dateien positionsgleich nach GitHub hochladen/ersetzen.
3. Redaktion + öffentliche Seiten hart neu laden.

Der SQL-Fix ergänzt fehlende Trainer aus dem aktuellen Website-Stand, ohne bestehende Personen doppelt anzulegen.
Außerdem liest jetzt auch die sichtbare 1.-Herren-Seite `herren/erste.html` das Trainerteam aus Supabase.
