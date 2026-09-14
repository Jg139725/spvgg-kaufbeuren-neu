# SVK Startseite – Automatische Spiele V12

Dieses Paket ersetzt den statischen Spielplan-Block auf der STARTSEITE.

## Anzeige
Oben:
- Nächstes Spiel

Direkt darunter:
- Letztes Spiel

Die Daten werden aus `data/frauen-spiele.json` geladen.

## Automatische Aktualisierung
Der GitHub-Workflow `Startseite Spiele automatisch aktualisieren` ruft stündlich die
öffentliche BFV-Mannschaftsseite der SVK Frauen ab und aktualisiert die JSON-Datei.

Wenn ein Spiel vorbei ist und BFV es als "Letztes Spiel" führt:
- landet es automatisch unten
- das neue nächste Spiel erscheint automatisch oben

## Einbau
1. ZIP entpacken.
2. ALLE Dateien/Ordner in das Root von `spvgg-kaufbeuren-neu` hochladen.
3. `index.html` ersetzen.
4. Commit Changes.
5. GitHub -> Actions -> `Startseite Spiele automatisch aktualisieren`
6. einmal `Run workflow` drücken.

Danach stündlich automatisch.

Wichtig:
GitHub Actions muss im Repository aktiviert sein.
