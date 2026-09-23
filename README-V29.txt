SVK – Spielplan Automatik Fix V29

Dieses Paket stellt die fehlende GitHub Action für die 1. Herren wieder her.

Enthalten:
- .github/workflows/herren-spielplan-tabelle-auto.yml
- scripts/update_herren_spielplan.py
- data/bfv-team-urls.json

WICHTIG BEIM HOCHLADEN:
Der Ordner .github beginnt mit einem Punkt und ist auf dem Mac versteckt.
Am einfachsten NICHT nur die sichtbaren Ordner aus dem Finder auswählen.

Nach dem Upload muss im GitHub-Repository dieser Pfad existieren:
.github/workflows/herren-spielplan-tabelle-auto.yml

Danach:
1. GitHub → Actions öffnen.
2. Links sollte „1. Herren Spielplan und Tabelle aktualisieren“ erscheinen.
3. Workflow öffnen.
4. „Run workflow“ → „Run workflow“ anklicken.
5. Nach erfolgreichem Lauf wird data/herren-spielplan.json aktualisiert, sofern neue BFV-Daten erkannt wurden.

Zeitplan:
Die Action läuft automatisch jede Stunde bei Minute 23.
Zusätzlich kann sie jederzeit manuell gestartet werden.

Quelle:
BFV Mannschaftsseite der 1. Herren; Tabelle über fussball.de/BFV-Wettbewerb.
