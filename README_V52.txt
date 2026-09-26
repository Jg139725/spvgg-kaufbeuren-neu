SVK V52 – Trainingszeiten in der Redaktion + Trainingsgelände im Header

1. Alle Website-Dateien dieses Pakets in die GitHub-Hauptebene hochladen und ersetzen.
2. Supabase > SQL Editor öffnen.
3. supabase/SVK_V52_TRAININGSZEITEN.sql komplett ausführen.
4. Für die neue Jugendredakteurin ganz unten im SQL die E-Mail einsetzen und die UPDATE-Zeile ausführen.
5. Redaktion neu laden. Dort gibt es jetzt die Tabs „Berichte“ und „Trainingszeiten“.

Rechte:
- admin/editor: Trainingszeiten aller Bereiche bearbeiten
- jugend_redaktion: nur Jugendberichte + Jugendtrainingszeiten
- Löschen von Trainingszeiten bleibt Admin

Öffentlich:
- Jugend-Übersicht lädt Trainingszeiten automatisch aus Supabase.
- Trainingsgelände zeigt den aktuellen Wochenplan.
- Stadion in der globalen Kopfzeile hat Parkstadion + Trainingsgelände.

Hinweis: Dieses Paket ersetzt nur die enthaltenen Dateien und lässt alle anderen Seiten unangetastet.
