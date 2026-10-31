# Medien pflegen: Fotogalerien, Videos, Downloads

Die Seiten `galerie.html`, `videos.html`, `verein/svk-tv.html` und `verein/downloads.html`
lesen ihre Inhalte aus drei JSON-Dateien im Ordner `data/`. Solange eine Datei leer ist,
zeigen die Seiten ihre normalen Hinweis-Karten. Sobald ein Eintrag da ist, erscheinen die Inhalte automatisch.

Pfade in den JSON-Dateien sind immer **vom Hauptordner der Website** aus angegeben (ohne `/` am Anfang).
Datumsangaben im Format `JJJJ-MM-TT`. Die neuesten Einträge stehen automatisch oben.

---

## 1. Fotogalerie anlegen

1. Ordner anlegen, z. B. `assets/images/galerie/2026-11-07-herren-kammlach/`
2. Fotos hineinkopieren. Bitte vorher verkleinern: ca. **1600 px lange Seite**, JPG, möglichst unter 400 KB pro Bild.
3. Album in `data/galerie.json` eintragen:

```json
{
  "alben": [
    {
      "id": "2026-11-07-herren-kammlach",
      "titel": "SVK gegen TSV Kammlach",
      "datum": "2026-11-07",
      "kategorie": "1. Herren",
      "text": "Eindrücke vom Heimspiel im Parkstadion.",
      "fotograf": "Herzfotografen",
      "ordner": "assets/images/galerie/2026-11-07-herren-kammlach/",
      "titelbild": "01.jpg",
      "bilder": [
        { "datei": "01.jpg", "alt": "Jubel nach dem 1:0" },
        "02.jpg",
        "03.jpg"
      ]
    }
  ]
}
```

- `id`: eindeutig, nur Kleinbuchstaben, Zahlen und Bindestriche (erscheint in der Adresse `galerie.html?album=…`)
- `text`, `fotograf`, `titelbild` sind optional (ohne `titelbild` wird das erste Foto genommen)
- Bilder können als einfacher Dateiname oder mit Beschreibung (`alt`) angegeben werden. Beschreibungen helfen Screenreadern und Suchmaschinen.
- Bitte nur Fotos veröffentlichen, für die eine Einverständniserklärung vorliegt (vor allem bei Jugendspielern).

## 2. Video hinzufügen (YouTube)

Video bei YouTube hochladen (gerne als „nicht gelistet“) und in `data/videos.json` eintragen:

```json
{
  "videos": [
    {
      "youtube": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
      "titel": "Highlights SVK – Kammlach",
      "datum": "2026-11-08",
      "kategorie": "Spielbericht",
      "text": "Alle Tore und Szenen vom Heimspiel.",
      "vorschau": "assets/images/galerie/2026-11-07-herren-kammlach/01.jpg"
    }
  ]
}
```

- `youtube`: kompletter Link oder nur die 11-stellige Video-ID
- `vorschau` (optional): eigenes Vorschaubild. Ohne Vorschaubild erscheint ein blauer Hintergrund.
  Vorschaubilder von YouTube werden bewusst **nicht** geladen, damit vor dem Klick keine Daten an Google gehen.
- Das Video wird erst nach Klick über `youtube-nocookie.com` geladen. Der Hinweis dazu steht in der Datenschutzerklärung (Abschnitt „Videos (YouTube)“).
- Videos erscheinen auf `videos.html` und auf `verein/svk-tv.html`.

## 3. PDF-Download bereitstellen

1. PDF nach `assets/downloads/` kopieren, z. B. `assets/downloads/aufnahmeantrag.pdf`
2. In `data/downloads.json` eintragen:

```json
{
  "downloads": [
    { "id": "aufnahmeantrag", "datei": "assets/downloads/aufnahmeantrag.pdf", "stand": "10/2026" }
  ]
}
```

Statt „Auf Anfrage“ erscheint dann der Button „PDF herunterladen (Größe)“. `stand` ist optional und ersetzt die Zeile „Stand: …“.

Mögliche `id`-Werte (stehen als `data-download` in `verein/downloads.html`):

| id | Dokument |
|---|---|
| `aufnahmeantrag` | Aufnahmeantrag SpVgg Kaufbeuren |
| `einverstaendnis-foto-video` | Einverständniserklärung Foto / Video / Presse |
| `bfv-passantrag-erwachsene` | BFV-Passantrag Erwachsene |
| `bfv-passantrag-jugend` | BFV-Passantrag Jugendliche |
| `sport-schadenmeldung` | Sport-Schadenmeldung |
| `satzung` | Satzung der SVK |

Bei der Satzung bitte die aktuell gültige Fassung hochladen und das Datum mit `stand` setzen.

---

**Tipp:** JSON-Dateien vor dem Hochladen prüfen (z. B. auf jsonlint.com). Ein fehlendes Komma führt dazu,
dass die Inhalte nicht angezeigt werden. Die Seite bleibt dann einfach im Ausgangszustand.
