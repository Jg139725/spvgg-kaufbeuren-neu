# SVK V73 – Förderverein / Launch

## Installation
1. **Nur den Inhalt dieses ZIPs** mit identischen Pfaden ins GitHub-Repository hochladen; Dateien ersetzen.
2. `supabase/SVK_V73_FOERDERVEREIN.sql` im Supabase SQL Editor ausführen.
3. In Supabase Authentication → Users einen **neuen Förderverein-Benutzer** mit eigener E-Mail-Adresse anlegen (Passwort nicht im GitHub-Code speichern).
4. Dessen User-ID kopieren und die letzte auskommentierte `UPDATE public.profiles ...`-Zeile mit der echten UUID ausführen.
5. Unter `admin/index.html` anmelden und Förderverein sowie Berichte testen.

## Enthalten
- Förderverein im globalen Header.
- Förderverein-Filter in Aktuelles.
- Eigener Förderverein-Redaktionszugang für Förderverein-Berichte.
- Förderverein-Seite zeigt veröffentlichte Förderverein-Berichte.
- Förderverein-Editor für Vorstandsfoto, Bildunterschrift, Namen/Funktionen und Sponsorennamen/Links.
- Kontakt-E-Mail `homjen@web.de` auf der Förderverein-Kontaktseite.
- Copyright-Vermerk in Seiten mit globalem Header.

## Noch offen
- **Instagram:** Keine URL vorhanden. Es wird absichtlich kein erfundener oder leerer Link eingebaut. Bitte den offiziellen Instagram-Profil-Link nachreichen.
- Vorstands- und Sponsorenangaben im Editor prüfen, bevor sie geändert werden. Solange keine CMS-Daten gespeichert wurden, zeigt die Website die vorhandenen Angaben.
- Bildrechte, Veröffentlichungsfreigaben und rechtliche Vereinsdaten durch den Verein prüfen.
- Supabase-SQL und Login wurden nicht gegen die produktive Datenbank getestet.
- Bei neuen Förderverein-Berichten muss die RLS-Konfiguration der bestehenden `news`-Tabelle mit den vorhandenen Policies zusammenpassen.

## Sicherheit
Der Förderverein-Login bekommt die Rolle `foerderverein_redaktion`; die Datenbank-Policies begrenzen seine Beiträge auf die Kategorie Förderverein. Ein eigenes Passwort wird ausschließlich in Supabase Auth verwaltet.
