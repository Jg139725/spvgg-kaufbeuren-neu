# Jugendleitung – direkter Öffnungsstatus-Fix

Die aktuelle Live-Seite enthielt weder die Statuskarte noch den Öffnungszeiten-Bereich.
Dieses Paket ersetzt deshalb direkt:

`jugend/abteilungsleitung.html`

## Enthaltene Sprechzeiten
- Montag bis Donnerstag: 16:00–20:00 Uhr
- Freitag: 16:00–18:00 Uhr
- Samstag und Sonntag: geschlossen

## Automatische Anzeige
- grüner Punkt: Jetzt geöffnet
- roter Punkt: Derzeit geschlossen
- Hinweis:
  - Heute bis ...
  - Öffnet heute um ...
  - Öffnet morgen um ...
  - Öffnet am Montag um ...

Die Berechnung verwendet immer die deutsche Zeitzone `Europe/Berlin`.

## Upload
1. ZIP entpacken.
2. Alles in das bestehende GitHub-Repository hochladen.
3. Nichts vorher löschen.
4. Gleichnamige Dateien ersetzen lassen.
5. Warten, bis der orange GitHub-Pages-Punkt verschwunden ist.
6. Danach Strg/Cmd + Shift + R drücken.

Der orange Punkt während des Uploads war nicht schlimm. Er zeigt nur an,
dass GitHub Pages die Website gerade neu erstellt.
