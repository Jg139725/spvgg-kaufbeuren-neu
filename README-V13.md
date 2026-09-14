# SVK Spiele getrennt – V13

Jetzt sauber getrennt:

- **Startseite:** nur die Spiele der **1. Herren**
- **Damen-Seite:** nur die **Damen-Spiele**
- jeweils oben nächstes Spiel, direkt darunter letztes Spiel
- getrennte JSON-Dateien:
  - `data/herren-spiele.json`
  - `data/frauen-spiele.json`

## Wichtig
Die BFV-URL der Frauen ist bereits eingetragen.

Für die 1. Herren brauche ich noch die exakte BFV-Mannschafts-URL.
Deshalb steht in `data/bfv-team-urls.json` aktuell:
`HIER_BFV_URL_DER_1_HERREN_EINTRAGEN`

Solange diese URL fehlt, zeigt die Startseite **keine Damen-Spiele mehr** und verwechselt die Teams nicht.
Sobald die Herren-BFV-URL eingetragen ist, läuft die automatische Aktualisierung für beide Teams stündlich.

## Upload
Alles ins Root von `spvgg-kaufbeuren-neu` hochladen und gleichnamige Dateien ersetzen.
