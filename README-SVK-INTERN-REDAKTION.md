# SVK – Paket „Alles auf der neuen Seite + Redaktion“ V1

Dieses Paket ist als **Overlay** gebaut. Es überschreibt bewusst keine aktuellen Dateien aus `herren/`, `herren2/` oder `jugend/`.

## Enthalten

- lokale Vereinsseiten unter `verein/`
- Vereinsgeschichte unter `verein/geschichte.html`
- Förderverein-Seiten unter `foerderverein/`
- lokale Service-/Rechtsseiten (Impressum, Datenschutz, Galerie, Videos, Fanshop, Stadionzeitung)
- News-Bereich auf der neuen Website
- Redaktionszugang unter `admin/index.html`
- News erstellen, bearbeiten und löschen
- Bild-Upload für News
- direkte Veröffentlichung über die GitHub Contents API
- `assets/js/svk-internal-links.js`: alte Links auf `www.spvgg-kaufbeuren.de` werden auf passende Seiten der neuen Website umgebogen
- `data/news.json`: Datenquelle für Beiträge, die über die Redaktion veröffentlicht werden

## Installation

Den **Inhalt dieses ZIP-Pakets in die oberste Ebene** des GitHub-Repositories
`Jg139725/spvgg-kaufbeuren-neu` hochladen. Vorhandene Dateien mit gleichem Namen ersetzen.

Wichtig: Das Paket enthält absichtlich keine Herren-/Jugend-Dateien, damit die zuletzt bearbeiteten Mannschaftsseiten erhalten bleiben.

## Redaktionszugang

Adresse nach dem Upload:
`https://jg139725.github.io/spvgg-kaufbeuren-neu/admin/`

Da GitHub Pages eine statische Website ist, gibt es dort keinen eigenen Server für Benutzerkonten.
Die Redaktion nutzt deshalb einen **Fine-grained GitHub Token** mit Schreibrecht auf „Contents“ ausschließlich für dieses Repository.

Empfehlung:
- pro Redakteur eigener GitHub-Account
- Fine-grained Token nur für `spvgg-kaufbeuren-neu`
- Repository permission `Contents: Read and write`
- Token nicht gemeinsam per WhatsApp/E-Mail herumreichen
- bei Austritt eines Redakteurs Token widerrufen

Der Token wird von der Admin-Seite nicht in LocalStorage gespeichert, sondern nur während der geöffneten Browser-Sitzung gehalten.

## Hinweis zu alten externen SVK-Links

Alle in diesem Paket enthaltenen Seiten laden den Link-Fixer automatisch.
Bekannte alte SVK-Pfade werden direkt auf lokale Seiten der neuen Website umgestellt.
Unbekannte alte SVK-Pfade landen sicher auf der neuen Vereinsübersicht, statt die alte Seite zu öffnen.
