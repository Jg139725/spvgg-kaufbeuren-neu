SVK V34 REPARATURPAKET

Ziel: Kein weiteres Herumbasteln an index.html.

1) Den INHALT dieses ZIPs in den ROOT des GitHub-Repositories hochladen.
2) Vorhandene Dateien ersetzen/überschreiben.
3) NICHTS an der GitHub Action oder am BFV-Python-Script ändern.
4) Danach Commit changes.
5) 30-60 Sekunden warten und auf der Website Cmd+Shift+R.

Warum V34 robuster ist:
- Es überschreibt bewusst ALLE alten Live-Dateinamen (home-live-games.js, V31, V32 und V33).
  Dadurch funktioniert die Startseite unabhängig davon, welcher dieser bisherigen Dateinamen noch in index.html steht.
- Gleiches gilt für die bisherigen Live-CSS-Dateien.
- Der Loader akzeptiert mehrere JSON-Bezeichnungen (fixtures/games/matches/spiele und table/tabelle/standings).
- herren/spielplan.html bekommt wieder ein vollständiges blau/weißes SVK-Layout.
- Bei Fehlern bleibt nicht mehr endlos "Spieldaten werden geladen ...", sondern es erscheint eine konkrete Fehlermeldung.
- News ohne Bild bekommen einen sauberen blauen SVK-Platzhalter.

WICHTIG:
Die Datei data/herren-spielplan.json und der funktionierende Workflow bleiben unangetastet.
