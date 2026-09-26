SVK V57 – Winter-Vorlage + öffentlicher Plan-Fix

1. In Supabase eine NEUE Query öffnen.
2. Nur supabase/SVK_V57_WINTER_AUS_SOMMER_KOPIEREN.sql ausführen.
   Dadurch werden die aktuellen Sommerzeiten einmalig als Winter-Vorlage kopiert.
   Sommer und Winter bleiben danach getrennte Datensätze.
3. Danach die Dateien dieses Pakets auf GitHub hochladen und vorhandene Dateien ersetzen.
4. Commit/Pages-Deployment abwarten und Browser mit Cmd+Option+R neu laden.

Fix:
- Jede einzelne Jugendseite kennt jetzt ihre Mannschaft über data-training-team.
- Die öffentliche Seite liest zuerst training_settings.active_period.
- Danach werden ausschließlich Einträge dieses aktiven Plans geladen.
- Ist Winter aktiv, werden auf U11/U17/etc. keine fest eingebauten Sommerzeiten mehr angezeigt.
