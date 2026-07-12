# Fanshop Textilstars – Hardfix

Dieses Paket behebt auch zwischengespeicherte oder alte Fanshop-Verweise.

## Richtiger Shop
https://textilstars.com/SpVgg-Kaufbeuren

## Technische Änderungen
- Startseite: alle Links mit Text „Fanshop“ werden direkt umgestellt.
- Unterseiten: alle Fanshop-, Fan12- und lokalen `fanshop.html`-Links werden umgestellt.
- Neuer Tab wird erzwungen.
- `fanshop.html` enthält keine Meta-Weiterleitung mehr.
- Die Weiterleitung erfolgt sofort über `window.location.replace`.
- Alte Fan12-Adressen werden beim Laden überschrieben.

## Upload
1. ZIP entpacken.
2. Alle Dateien hochladen.
3. Gleichnamige Dateien ersetzen.
4. GitHub Pages 1–3 Minuten aktualisieren lassen.
5. Browsercache vollständig neu laden:
   - Mac: Cmd + Shift + R
   - Windows: Strg + F5
6. Falls nötig, die Seite einmal in einem privaten Browserfenster testen.
