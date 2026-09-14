SVK REDAKTION + SUPABASE V25

Phase 1:
- Login unter /admin/
- Rollen: admin / editor
- Berichte erstellen, bearbeiten, veröffentlichen
- Titelbild in Supabase Storage
- Admin darf löschen
- Einzelartikel über artikel.html

Einrichtung:
1. Supabase > SQL Editor: supabase/SVK_REDAKTION_SETUP_V24.sql komplett ausführen.
2. Authentication > Users: ersten Benutzer anlegen.
3. Im SQL-Skript den ADMIN-Befehl mit deiner E-Mail ausführen.
4. Supabase-Verbindung ist bereits fertig eingetragen.
   NIEMALS service_role oder Secret Key verwenden.
5. Alles ins GitHub-Repo hochladen.
6. Aufrufen: https://jg139725.github.io/spvgg-kaufbeuren-neu/admin/

Wichtig:
V24 überschreibt absichtlich NICHT deine aktuelle Startseite oder news.html.
Wenn Login und Testbeitrag laufen, bauen wir im nächsten Paket die Startseite + News-Seite komplett live auf Supabase um.

V25:
- Project URL eingetragen
- Publishable Key eingetragen
- bereit zum Upload und Login-Test unter /admin/
