SVK V55 – Login-Fix + saubere Sommer/Winter-Trennung

1. In Supabase eine NEUE Query öffnen.
2. Nur supabase/SVK_V55_SOMMER_BESTAND_WINTER_LEER.sql ausführen.
3. Danach die Website-Dateien aus diesem Paket auf GitHub hochladen/ersetzen.
4. Commit/Pages abwarten und Safari mit Cmd+Option+R neu laden.

Ergebnis:
- Alle aktuell vorhandenen Jugend-Trainingszeiten liegen im Sommerplan.
- Winterplan ist leer und kann später separat gepflegt werden.
- Sommer/Winter wird in der Redaktion getrennt angezeigt.
- Umschalten aktiviert den jeweiligen Plan sofort auf der öffentlichen Website.
- Anmelden führt sicher zu admin/index.html; /redaktion/index.html wird nicht mehr verwendet.
