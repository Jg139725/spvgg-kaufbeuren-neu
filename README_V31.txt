SVK V31 – Startseiten-News + 1. Herren Automatik

WICHTIG: Dieses Paket überschreibt NICHT deine index.html und NICHT das funktionierende Admin-System.

1) Lade diese Ordner/Dateien in dein Repository hoch:
   .github/workflows/herren-spielplan-tabelle-auto.yml
   scripts/update_herren_spielplan.py
   data/herren-spielplan.json
   js/home-live-v31.js

2) Ganz unten in deiner aktuellen index.html, DIREKT VOR </body>, ergänzen:
   <script src="js/home-live-v31.js"></script>

   Deine vorhandenen Script-Zeilen (z.B. js/home.js / sponsor-final.js) BLEIBEN drin.

3) Falls in .github/workflows noch diese falsche Datei existiert:
   #herren-spielplan-tabelle-auto.yml
   bitte löschen. Es darf nur die Datei OHNE # verwendet werden.

4) GitHub -> Actions -> "1. Herren Spielplan und Tabelle aktualisieren"
   -> Run workflow.
   Danach muss der Lauf grün sein.

Was V31 macht:
- Holt die 1.-Herren-Spiele UND Tabelle direkt von der offiziellen BFV-Teamseite.
- Bricht bei kaputten/leerem BFV-Parsing ab, statt gute Daten mit leeren Daten zu überschreiben.
- Aktualisiert data/herren-spielplan.json stündlich.
- Die Startseite lädt die JSON ohne Browser-Cache und prüft zusätzlich alle 5 Minuten neu.
- Die Startseite ersetzt den bisherigen statischen Spielblock durch das nächste Spiel.
- Die Startseite lädt die 3 neuesten veröffentlichten Beiträge direkt aus dem neuen Supabase.
- Wenn Supabase/BFV kurzfristig nicht erreichbar ist, bleiben die vorhandenen Inhalte als Fallback sichtbar.

Nach dem Upload:
- Erst GitHub Action manuell starten.
- Danach Startseite mit Cmd+Shift+R neu laden.
