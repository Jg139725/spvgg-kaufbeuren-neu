# SVK-News-Redaktion

Die Seite `redaktion.html` führt zu zwei GitHub-Formularen: Meldung erstellen und Meldung entfernen. Die Anmeldung erfolgt über das eigene GitHub-Konto. **Es gibt kein gemeinsames Passwort.**

## Einmalige Einrichtung

1. Alle Dateien dieses Pakets samt `.github/ISSUE_TEMPLATE` und `.github/workflows` in das Stammverzeichnis des Repositories hochladen. Im macOS-Finder zeigt `⌘ Umschalt .` versteckte Ordner an.
2. Im Repository unter **Settings → Actions → General → Workflow permissions** den Schreibzugriff für `GITHUB_TOKEN` erlauben. GitHub Issues und Actions müssen aktiv sein.
3. In `redaktion/editors.json` weitere GitHub-Benutzernamen als Zeichenketten ergänzen. Nur diese Konten dürfen News veröffentlichen oder entfernen. Ein Schreibzugriff auf das Repository für Redakteure ist nicht erforderlich.
4. Eine Testmeldung über `redaktion.html` erstellen. Den Lauf unter **Actions → SVK-News Redaktion** prüfen; nach Erfolg wird das Issue geschlossen. Die Meldung erscheint nach Aktualisierung der öffentlichen GitHub-Rohdatei, in der Regel innerhalb weniger Minuten.

News liegen in `data/editor-news.json`. Die zuvor vorhandene Datei `data/news.json` bleibt unberührt. Das Entfernen einer Meldung löscht sie aus der öffentlichen Übersicht und der dynamischen Detailansicht; historische statische Artikel sind davon nicht betroffen.

Die GitHub-Issues selbst sind im öffentlichen Repository sichtbar. Keine unveröffentlichten oder vertraulichen Angaben in ein Formular eintragen. Fotos müssen über eine öffentlich erreichbare HTTPS-Adresse bereitstehen und zur Veröffentlichung freigegeben sein. Redaktionelle Meldungen werden als Text angezeigt; HTML wird nicht ausgeführt.

Falls ein Lauf nicht durchgeht, in GitHub Actions die Fehlermeldung prüfen. Automatische News-Aktualisierung nutzt `raw.githubusercontent.com` und benötigt eine Internetverbindung beim Besuch der Website.
