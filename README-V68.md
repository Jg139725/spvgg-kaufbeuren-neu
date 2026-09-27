# SVK V68 – Trainer & Funktionsteam

1. In Supabase SQL Editor **nur** `supabase/SVK_V68_TRAINER_FUNKTIONSTEAM.sql` einmal ausführen.
2. Danach alle Dateien dieses Pakets positionsgleich in GitHub hochladen/ersetzen.
3. Redaktion neu laden. Neuer Reiter: **Trainer & Funktionsteam**.

## Rechte
- `admin` / `editor`: 1. Herren, U23 und Jugend verwalten.
- `jugend_redaktion`: ausschließlich Jugendteams.

## Funktionen
- Person hinzufügen
- Name/Funktion/Kontakt/Foto ändern
- Mannschaft ändern = Person verschieben
- Aktiv/Inaktiv
- Löschen
- Fotos direkt in Supabase Storage `trainer-images` hochladen

Die öffentlichen Mannschaftsseiten lesen danach die Trainer aus Supabase. Falls Supabase einmal nicht erreichbar ist, bleibt der bisher statisch eingebaute Bestand sichtbar (Fallback).
