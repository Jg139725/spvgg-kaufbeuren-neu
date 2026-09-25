SVK V38 – 1. Herren: automatisches letztes Spiel + finales Startseiten-Layout

Enthalten:
- scripts/update_herren_spielplan.py
- js/svk-home-v33.js
- js/home-live-v31.js
- js/home-live-v32.js
- js/home-live-games.js

Was V38 ändert:
1. BFV-Spielberichte werden zusätzlich direkt im kompletten BFV-HTML gesucht.
2. Der aktuell verifizierte BFV-Spielbericht Haunstetten–Kaufbeuren ist nur als URL-Startanker enthalten.
   Das Ergebnis 2:3 ist NICHT im Script fest eingetragen, sondern wird aus dem BFV-Bericht gelesen.
3. Neu gefundene BFV-Ergebnisse überschreiben ältere gespeicherte Daten chronologisch.
4. Startseite: Überschrift wird zu „1. Herren“, Unterzeile „Bezirksliga Schwaben Süd“.
5. Letztes Spiel links, nächstes Spiel rechts; mobil untereinander.
6. Kein sichtbarer Aktualisierungs-Zeitstempel.

Installation:
- Inhalt dieses Ordners ins Hauptverzeichnis des GitHub-Repositories hochladen.
- Gleichnamige Dateien ersetzen.
- Committen.
- Danach Actions -> „1. Herren Spielplan und Tabelle aktualisieren“ -> Run workflow -> main.
- Anschließend data/herren-spielplan.json prüfen. lastGame sollte aktuell 19.09.2026 / TSV 1892 Haunstetten / SpVgg Kaufbeuren / 2:3 sein.
