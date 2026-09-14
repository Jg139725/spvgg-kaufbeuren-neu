# SVK 1. Herren – Spielplan + Tabelle V15

Neu auf `herren/spielplan.html`:
- aktuelle Tabelle der BZL Schwaben Süd
- SpVgg Kaufbeuren wird in der Tabelle hervorgehoben
- die nächsten 10 Spiele der 1. Herren
- responsive für Handy / Tablet / PC
- keine Weiterleitung auf die alte SVK-Seite

Automatik:
- GitHub Action läuft einmal pro Stunde.
- nächste 10 Spiele werden von der öffentlichen BFV-Mannschaftsseite geladen.
- Tabelle wird aus dem öffentlichen Liga-Spielplan aktualisiert.
- die Seite selbst lädt beim Öffnen immer die neueste JSON-Version und prüft bei offenem Tab alle 5 Minuten.

Nach Upload:
1. alles ins Root von `spvgg-kaufbeuren-neu` hochladen
2. gleichnamige Dateien ersetzen
3. Commit
4. GitHub -> Actions -> `1. Herren Spielplan und Tabelle aktualisieren`
5. einmal `Run workflow`

Danach automatisch.
