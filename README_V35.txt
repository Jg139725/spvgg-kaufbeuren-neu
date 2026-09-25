SVK V35
1. Alles in den Repository-Root hochladen und vorhandene Dateien ersetzen.
2. Commit.
3. GitHub > Actions > '1. Herren Spielplan und Tabelle aktualisieren' > Run workflow.
4. Nach Erfolg die Seite mit Cmd+Shift+R neu laden.

V35 speichert:
- fixtures: bis zu 10 kommende Spiele
- nextGame: nächstes Spiel
- lastGame: letztes Spiel
- allGames: zusammengeführte Spiele
- table: Tabelle

Zusätzlich wird der kaputte BFV-UI-Text im Spielort nicht mehr übernommen.
Die BFV-Seite liefert serverseitig teils nur fünf kommende Karten; deshalb enthält der Parser für die bereits bekannten nächsten Ligatermine einen Fallback. Neue Daten vom BFV haben Vorrang.
