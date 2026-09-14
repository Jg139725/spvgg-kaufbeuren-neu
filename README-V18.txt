SVK – Anfahrt Infobox entfernen V18

Dieses Mini-Paket entfernt ausschließlich den Hinweis:
„Die alte Website zeigte beide Standorte nur über eingebettete Karten …“

WICHTIG:
Da die aktuelle anfahrt.html nicht als Datei vorlag, enthält dieses Paket einen
kleinen sicheren Fix, der nur genau diesen Hinweis entfernt.

Einbau:
1. verein/anfahrt-info-fix.js in den Ordner verein hochladen.
2. In verein/anfahrt.html direkt VOR </body> diese Zeile einfügen:

<script src="anfahrt-info-fix.js?v=18"></script>

3. Committen und GitHub Pages kurz aktualisieren lassen.
4. Seite mit Cmd + Shift + R neu laden.

Sonst wird nichts am Layout oder Inhalt geändert.
