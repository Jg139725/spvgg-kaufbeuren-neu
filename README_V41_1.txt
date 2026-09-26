SVK V41.1 – HEADER FIX

Ursache:
Der bisherige globale Header erzeugte zusätzlich eine alte Topbar. Auf dem Live-Center blieb dadurch links der blaue Block mit 'SpVgg Kaufbeuren / Kontakt / Partner / Kontakt'.

Fix:
- alte Topbar komplett entfernt
- doppelte Header werden vor dem Einsetzen entfernt
- 'Spiele' führt bereits zum Live-Center, deshalb doppelten Menüpunkt 'SVK Live' entfernt
- sauberer einzeiliger Desktop-Header
- Verein-Dropdown bleibt erhalten
- Fanshop-Button bleibt erhalten
- Mobile-Menü bleibt erhalten

UPLOAD:
assets/js/svk-global-header.js ersetzen
assets/css/svk-global-header.css ersetzen

Danach committen und Safari mit Cmd+Option+R neu laden.
