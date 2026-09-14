# SVK Frauen – automatischer Spielplan V11

Neu:
- eigene lokale Seite `frauen/spielplan.html`
- zeigt nur **Nächstes Spiel** und **Letztes Spiel**
- kein Link mehr zur alten SVK-Seite
- Datenquelle: öffentliche BFV-Mannschaftsseite der SVK Frauen
- GitHub Action aktualisiert `data/frauen-spiele.json` automatisch **stündlich**
- die Webseite lädt die JSON-Datei ohne Cache und prüft während eines geöffneten Tabs alle 5 Minuten erneut
- wenn ein Spiel vorbei ist und BFV es als "Letztes Spiel" führt, wandert es automatisch nach unten; das folgende Spiel wird oben als "Nächstes Spiel" angezeigt

BFV-Team-ID:
`016PA7VSOC000000VV0AG80NVV8OQVTB`

## Einbau
1. ZIP entpacken.
2. Alles in das Root deines Repos `spvgg-kaufbeuren-neu` hochladen.
3. Gleichnamige Dateien ersetzen.
4. Commit Changes.
5. Unter GitHub -> Actions prüfen, ob der Workflow `Frauen Spielplan automatisch aktualisieren` angezeigt wird.
6. Einmal `Run workflow` manuell starten. Danach läuft er stündlich automatisch.

## Wichtig
GitHub Actions muss für das Repository aktiviert sein und der Workflow benötigt Schreibrechte auf `contents`.
Das Paket setzt `permissions: contents: write` direkt im Workflow.

Die Seite selbst bleibt vollständig auf deiner neuen GitHub-Pages-Webseite.
