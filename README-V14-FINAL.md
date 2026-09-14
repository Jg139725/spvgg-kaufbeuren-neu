# SVK Spiele FINAL V14

Startseite = nur 1. Herren.
Damen-Seite = nur Damen.

Aktuell für die 1. Herren:
- Letztes Spiel: SpVgg Kaufbeuren – TSV Legau 2:3, 13.09.2026
- Nächstes Spiel: TSV 1892 Haunstetten – SpVgg Kaufbeuren, 19.09.2026 um 14:00 Uhr

BFV 1. Herren:
https://www.bfv.de/mannschaften/-/016PILCMSS000000VV0AG80NVUT1FLRU

BFV Damen:
https://www.bfv.de/mannschaften/spvgg-kaufbeuren/016PA7VSOC000000VV0AG80NVV8OQVTB

Automatik:
GitHub Actions prüft beide BFV-Seiten stündlich getrennt und aktualisiert:
- data/herren-spiele.json
- data/frauen-spiele.json

Upload:
1. Alles ins Root des Repos hochladen.
2. Gleichnamige Dateien ersetzen.
3. Commit.
4. GitHub > Actions > Herren und Damen Spiele automatisch aktualisieren
5. Einmal Run workflow starten.
