# Sponsoren V75

Die neun bestehenden Sponsoren bleiben als statische Rückfallanzeige erhalten. Sobald in Supabase `foerderverein_content.sponsors` Einträge vorhanden sind, werden Startseite und Sponsoren-Unterseite daraus dynamisch gefüllt.

Im Adminbereich Förderverein: Sponsorzeilen als `Name | https://website.de` eingeben. Zum Hochladen eines Logos die Zeilennummer (ab 1) angeben, Datei auswählen und speichern. Bestehende Logos werden anhand des Sponsor-Namens erhalten. Zum Löschen eine Zeile entfernen und speichern.

Voraussetzung: `supabase/SVK_V73_FOERDERVEREIN.sql` muss im Supabase SQL Editor ausgeführt sein und der Förderverein-Nutzer die Rolle `foerderverein_redaktion` besitzen. Es werden keine neuen Tabellen benötigt.

Hinweis: Änderungen sind erst nach dem Upload zu GitHub Pages und nach dem Speichern in Supabase öffentlich sichtbar. Bitte Berechtigungen und Logoupload live testen.
