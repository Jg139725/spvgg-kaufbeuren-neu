SVK V39 – BFV Ergebnis-Fix

1. ZIP entpacken.
2. Den Ordner scripts in das Hauptverzeichnis des GitHub-Repositories ziehen.
3. update_herren_spielplan.py ersetzen.
4. Committen.
5. Actions -> 1. Herren Spielplan und Tabelle aktualisieren -> Run workflow -> main.

Wichtig:
Der Fix benutzt beim BFV-Spielbericht NICHT das Veröffentlichungsdatum als Spieltag.
Er ordnet das Ergebnis der bereits bekannten Spielpaarung zu.
Außerdem gibt der Action-Log jetzt 'BFV-Ergebnis erkannt:' aus, wenn das Auslesen klappt.
