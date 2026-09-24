SVK V33 FINAL LIVE SYSTEM

Dieses Paket vereinheitlicht:
- Startseite News -> Supabase
- news.html -> Supabase
- artikel.html -> Supabase
- Startseite Spiel -> data/herren-spielplan.json
- herren/spielplan.html -> dieselbe JSON inkl. Tabelle

1. Lade ALLE Dateien/Ordner aus diesem Paket in den ROOT deines Repositories hoch.
   Vorhandene news.html, artikel.html und herren/spielplan.html dabei ersetzen.

2. index.html:
   Im <head> ergänzen:
   <link rel="stylesheet" href="css/svk-live-v33.css">

   Ganz unten VOR </body> ALLE alten Live-Scripte entfernen:
   home-live-games.js
   home-live-v31.js
   home-live-v32.js

   Stattdessen genau diese beiden Zeilen:
   <script src="js/svk-live-core-v33.js"></script>
   <script src="js/svk-home-v33.js"></script>

3. Vorhandene js/home.js und js/sponsor-final.js bleiben bestehen.

4. Die funktionierende GitHub Action und scripts/update_herren_spielplan.py NICHT ändern.

5. Nach Commit: Cmd+Shift+R.

Hinweis:
Die Startseite erwartet deinen bereits vorhandenen Container:
<div id="home-live-games">...</div>
Der ist laut deinem aktuellen Screenshot vorhanden.

Bei News ohne Bild wird ein sauberer blauer SVK-Platzhalter angezeigt.
