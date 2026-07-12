# Einheitliche Kopfzeile – final

Dieses Paket vereinheitlicht die Header der Unterseiten mit dem Design der Startseite.

## Was geändert wird

- zweizeilige Kopfzeile wie auf der Startseite
- dunkelblaue obere Kontaktleiste
- großes originales SVK-Logo
- gleiche Schrift, Höhe und Abstände
- identische Navigation
- aktive Seite wird blau markiert
- blauer Fanshop-Button
- einheitliches mobiles Hamburger-Menü

## Betroffene Seiten

Alle Unterseiten, die eines dieser gemeinsamen Skripte laden:

- `assets/js/subpages.js`
- `assets/js/herren2.js`

Dazu gehören unter anderem:

- Herren 1 und Herren 2
- Spielerprofile
- Jugendmannschaften
- News und Newsartikel
- Verein und Historie
- Stadion
- Sponsoren
- Live-Center, Rekorde und Hall of Fame

Die Startseite bleibt unverändert, weil sie bereits das gewünschte Originaldesign besitzt.

## Upload

1. ZIP entpacken.
2. Alles in das bestehende GitHub-Repository hochladen.
3. Nichts vorher löschen.
4. Gleichnamige Dateien ersetzen lassen.
5. GitHub Pages aktualisieren lassen.
6. Anschließend mit Strg/Cmd + Shift + R neu laden.

## Hinweis

Die Header werden zentral durch das gemeinsame JavaScript erzeugt.
Künftige Änderungen müssen deshalb nur noch in `svk-global-header.js`
beziehungsweise den beiden gemeinsamen Skripten vorgenommen werden.
