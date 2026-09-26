SVK V58 – Herren Ergebnis-/NextGame-Fix

Geändert:
- BFV-Endergebnis SpVgg Kaufbeuren – FC Königsbrunn 1:1 wird korrekt als letztes Spiel übernommen.
- Ein bereits beendetes Spiel kann nicht mehr als „Nächstes Spiel“ stehen bleiben, nur weil die BFV-Mannschaftsübersicht verzögert aktualisiert wird.
- Nach Ablauf eines unbewerteten Spiels (Anstoß + 3 Stunden) wird es aus nextGame/fixtures ausgeschlossen.
- Der nächste Termin rückt dadurch automatisch nach (aktuell FC Wiggensbach – SpVgg Kaufbeuren, 03.10.2026, 15:30 Uhr).
- Bestehende Spielbericht-Auswertung bleibt erhalten und hat weiterhin die Möglichkeit, Ergebnisse automatisch einzulesen.

Installation:
1. ZIP entpacken.
2. scripts/update_herren_spielplan.py im GitHub-Repository ersetzen.
3. Commit durchführen.
4. GitHub Action „Herren Spielplan aktualisieren“ einmal manuell starten (oder den nächsten automatischen Lauf abwarten).
5. Danach data/herren-spielplan.json kontrollieren bzw. Website hart neu laden.

Kein Supabase-SQL nötig.
