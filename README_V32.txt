SVK V32 – Design-Fix

Du hattest recht: Der Spielbereich blieb auf "Spieldaten werden geladen ..." und bei einem Beitrag ohne Bild wurde das Vereinslogo riesig hochskaliert.

V32 behebt genau diese beiden Punkte.

UPLOAD:
1. js/home-live-v32.js -> in deinen vorhandenen Ordner /js
2. css/home-live-v32.css -> in deinen vorhandenen Ordner /css

INDEX.HTML ÄNDERN:
Im <head> direkt nach deiner vorhandenen Zeile
<link rel="stylesheet" href="css/home-live-games.css">
diese Zeile ergänzen:
<link rel="stylesheet" href="css/home-live-v32.css">

Ganz unten die V31-Zeile:
<script src="js/home-live-v31.js"></script>
ersetzen durch:
<script src="js/home-live-v32.js"></script>

WICHTIG:
- home-live-games.js NICHT mehr in index.html einbinden.
- V31 NICHT zusätzlich einbinden.
- Der Workflow / BFV-Updater bleibt unverändert.
- Bei News ohne Bild zeigt V32 ein sauberes blaues SVK-Platzhalterfeld.
- Sobald im Redaktionssystem ein echtes Titelbild hinterlegt ist, wird automatisch das echte Bild verwendet.

Danach Commit und auf der Startseite Cmd+Shift+R.
