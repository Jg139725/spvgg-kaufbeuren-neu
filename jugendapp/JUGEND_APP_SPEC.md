# SVK Jugend – Komplette Beschreibung für die native App

Diese Datei beschreibt die bestehende **SVK-Jugend-App** (Web-App unter `https://spvgg-kaufbeuren.de/jugendapp/`)
so vollständig, dass daraus eine **echte App für iPhone und Android** gebaut werden kann.
Die Web-App ist die funktionierende Vorlage: `jugendapp/index.html`, `jugendapp/app.js`, `jugendapp/app.css`, `jugendapp/sw.js`.
Bei Unklarheiten gilt immer: **so verhalten wie die Web-App.**

---

## 1. Zweck

App der Jugendabteilung der **SpVgg Kaufbeuren**. Sie entlastet den Jugendleiter (Rafael Grundei) bei:
- Spielverlegungen (Absprache mit Gegnern, BFV-Antrag nachverfolgen)
- Überblick über Spiele aller Jugendteams (automatisch vom BFV)
- Trainer-Kontakten
- Aufgaben verteilen, abhaken und darüber chatten
- Push-Benachrichtigungen

Sprache der App: **Deutsch**. Zielgerät: vor allem **iPhone**, auch Android.

---

## 2. Technik-Grundlage (bleibt gleich)

- **Backend: Supabase** (bereits produktiv, NICHT neu anlegen, NICHT ändern ohne Rückfrage)
  - Projekt-ID: `tjfnjdzqlrblvwfmswvp`
  - URL und öffentlicher Schlüssel: siehe `assets/js/supabase-config.js` (`window.SVK_SUPABASE.url` / `.anonKey`)
  - Login: Supabase Auth mit E-Mail + Passwort
  - Alle Rechte sind über **Row Level Security** in der Datenbank abgesichert. Die App darf sich darauf verlassen.
- **BFV-Spielplan:** öffentliche JSON-Datei `https://spvgg-kaufbeuren.de/data/jugend-spiele.json`
  (wird alle 3 Std. per GitHub Action `.github/workflows/jugend-spiele-auto.yml` aus dem offiziellen BFV-Vereinsspielplan erzeugt, Skript `scripts/update_jugend_spiele.py`)
- **Push-Versand:** Supabase Edge Function `jugend-push` (Quelltext: `supabase/functions/jugend-push/index.ts`)
- SQL-Historie der Jugend-App: `supabase/SVK_V90_…` bis `SVK_V94_…`

---

## 3. Rollen & Rechte

| Rolle | Wer | Darf |
|---|---|---|
| **Freigeber (Admin)** | nur Justin Grundei (`darf_freigeben = true`) | alles + Zugänge freigeben/sperren/ändern |
| **Jugendleitung** | `rolle = 'leitung'` (z. B. Rafael Grundei) **oder** Website-Rolle `admin`/`jugend_redaktion` | alle Teams, alle Verlegungen (inkl. Status, Löschen), alle Aufgaben |
| **Trainer** | `rolle = 'trainer'`, freigegeben | nur **eigene Teams** (Spielverlegungen sehen/melden/bearbeiten), Aufgaben die ihm zugewiesen sind oder die er angelegt hat |
| **Wartend** | registriert, nicht freigegeben | sieht nur „Zugang beantragt – warte auf Freigabe“ |

Hilfsfunktionen in der DB (per `rpc` aufrufbar bzw. in Policies genutzt):
`jugend_ist_leitung()`, `jugend_meine_teams()`, `jugend_ist_mitglied()`, `jugend_darf_freigeben()`, `jugend_personen()`.

**Teams (feste Liste, Schlüssel → Anzeige):**
`u19→U19, u17→U17, u15→U15, u13→U13, u12→U12, u11→U11, u10→U10, u09→U09, u08→U08, g-jugend→G1/G2, maedels→Mädels`

---

## 4. Datenbank (bereits vorhanden)

### `jugend_app_mitglieder` – wer die App nutzen darf
`user_id (uuid, PK, = auth.users.id)`, `name`, `telefon`, `email`, `rolle ('trainer'|'leitung')`, `teams text[]`, `freigegeben bool`, `darf_freigeben bool`, `created_at`, `updated_at`
- Selbst-Registrierung: eigener Eintrag mit `freigegeben=false, rolle='trainer', teams='{}'`
- Website-Leitung (admin/jugend_redaktion) legt beim ersten Öffnen eigenen Eintrag an: `rolle='leitung', freigegeben=true, teams=alle`
- Ändern/Löschen anderer: nur Freigeber

### `jugend_spielverlegungen`
`id`, `team_key`, `team_name`, `gegner`, `heim bool`, `wettbewerb ('Punktspiel'|'Pokal'|'Freundschaftsspiel'|'Turnier')`, `alt_datum date`, `alt_uhrzeit time`, `neu_datum`, `neu_uhrzeit`, `neu_ort`, `grund`, `angefragt_von ('wir'|'gegner')`, `status`, `kontakt_name`, `kontakt_telefon`, `kontakt_email`, `notizen`, `created_by`, `updated_by`, `created_at`, `updated_at`
- **Status-Ablauf:** `offen → angefragt → zugestimmt → beantragt → erledigt` (+ `abgelehnt`)
  - Labels: Offen · Angefragt · Zugestimmt · Beim BFV beantragt · Erledigt · Abgelehnt
  - „Nächster Schritt“-Knopf: „Als angefragt markieren“ → „Gegner hat zugestimmt“ → „Beim BFV beantragt“ → „Bestätigt – erledigt“
- Leitung: alles. Trainer: nur `team_key` in eigenen Teams, nicht löschen, Status nicht setzen (neue Meldung immer `offen`).

### `jugend_aufgaben`
`id`, `titel (1–200)`, `beschreibung`, `team_key (optional)`, `zugewiesen_an uuid[]`, `status ('offen'|'in_bearbeitung'|'erledigt')`, `wichtig bool`, `faellig_am date`, `erledigt_am`, `created_by`, `updated_by`, `created_at`, `updated_at`
- Sehen/Ändern: Leitung alles; sonst Ersteller oder Zugewiesene. Löschen: Leitung oder Ersteller.

### `jugend_aufgaben_nachrichten` – Chat pro Aufgabe
`id`, `aufgabe_id`, `user_id`, `text (1–4000)`, `created_at`
- Statuswechsel werden als Systemnachricht gespeichert: `text = '§status:<status>'` → anzeigen als „Name: In Bearbeitung · 20:36“ (mittig, grau)
- Realtime ist für `jugend_aufgaben` und `jugend_aufgaben_nachrichten` aktiviert.

### `team_staff` (gehört zur Website, nur lesen) – Trainer-Kontakte
Filter `area = 'Jugend'`. Felder: `team_key`, `team_name`, `name`, `role`, `phone`, `email`, `image_url`, `active`, `sort_order`.

### `jugend_push_abos` – Geräte für Push
`id`, `user_id`, `endpoint (unique)`, `p256dh`, `auth`, `geraet`, `created_at`, `last_used_at` (jeder nur eigene)

### `jugend_push_config` – nur Server (Service-Role), nie in der App lesen

### RPC `jugend_personen()`
Liefert alle freigegebenen Mitglieder (`user_id, name, rolle, telefon, email, teams`) – Auswahl „Wer soll es machen?“.

---

## 5. Bildschirme & Funktionen

Navigation unten (Tab-Leiste): **Start · Aufgaben · Verlegungen · Spiele · Trainer · Zugänge** (Zugänge nur für Freigeber).
Kopfzeile: SVK-Wappen, Rolle (z. B. „JUGENDLEITUNG“ / „TRAINER · U11“), „SVK Jugend“, Abmelden.

### 5.1 Anmelden / Registrieren
- Anmelden: E-Mail + Passwort. Fehlertexte deutsch („E-Mail oder Passwort falsch.“).
- „Passwort vergessen?“ → Reset-Mail.
- „Zugang beantragen“: Name, Handynummer (für WhatsApp), E-Mail, Passwort (min. 8). Danach ggf. E-Mail bestätigen.
- E-Mail nicht bestätigt / Link abgelaufen → Knopf „Bestätigungs-Mail erneut senden“ (`auth.resend({type:'signup'})`). Hinweis: Link ca. 1 Std. gültig, im Spam schauen.
- Nach Login: Rolle bestimmen (Abschnitt 3). Wartend → Warte-Bildschirm mit „Erneut prüfen“. Freigegeben, aber ohne Team (Trainer) → Hinweis „bitte bei der Jugendleitung melden“.

### 5.2 Start
- „Servus <Vorname>!“, darunter eigene Teams bzw. „Du siehst alle Jugendmannschaften.“
- Karte **Benachrichtigungen** (an/aus, siehe 6)
- Kacheln mit Anzahl Verlegungen je Status (offen, angefragt, zugestimmt, beantragt) + Anzahl Trainer; Freigeber zusätzlich „Zugang wartet auf Freigabe“
- **Meine Aufgaben** (max. 4 offene, mir zugewiesen) + „+ Aufgabe“
- **Nächste Spiele** (3) + „Alle Spiele“
- **Als Nächstes zu tun** (offene Verlegungen) + „+ Verlegung“

### 5.3 Aufgaben
- Umschalter: **Für mich / Von mir / Alle** („Alle“ nur Leitung), Filter Status (Noch nicht erledigt / Erledigt / Alle), Leitung zusätzlich Filter Person.
- Liste: runder Status-Kreis (leer = offen, gestreift orange = in Bearbeitung, grün ✓ = erledigt), Titel (rotes „!“ wenn wichtig), Status-Pille, 👤 zugewiesene Namen, 📅 Fälligkeit (rot „überfällig“), ⚽ Team, „von <Name>“, 💬 Anzahl Nachrichten, roter Punkt bei ungelesenen Nachrichten.
- Sortierung: in Bearbeitung → offen → erledigt, dann wichtig zuerst, dann Fälligkeit.
- Runder **＋**-Knopf unten rechts → **Neue Aufgabe**: Was ist zu tun?, Details, **Wer soll es machen?** (Chips mit Initialen, Mehrfachauswahl, „Ich“ zuerst), Fällig bis, Mannschaft (optional), Wichtig. Personenliste bei jedem Öffnen frisch laden.
- Nach Speichern mit neuen Zugewiesenen: Push auslösen (`typ:'neu'`) und optional WhatsApp/E-Mail-Text anbieten.
- Aufgabe antippen → **Chat-Ansicht** (Vollbild am Handy): Titel, „Für: … · bis … · von …“, Status-Umschalter **Offen | In Bearbeitung | Erledigt**, Beschreibung, Verlauf (eigene Nachrichten rechts blau, andere links weiß mit Name), Eingabefeld + Senden. Statuswechsel → Systemnachricht + Push (`typ:'status'`). Nachricht → Push (`typ:'nachricht'`). Live-Aktualisierung über Supabase Realtime.
- Bearbeiten/Löschen: Ersteller oder Leitung.

### 5.4 Spielverlegungen
- Filter: Offene / Erledigt+abgelehnt / Alle; Mannschaft.
- Karte: „U13 vs. Gegner“ (Heim) bzw. „U13 @ Gegner“ (auswärts), Wettbewerb, Heim/Auswärts, „Wunsch von uns/Gegner“, Grund, alter Termin durchgestrichen → neuer Termin grün, Kontakt, Notizen, „Eingetragen von …“, Status-Pille.
- Knöpfe (Leitung): nächster Status-Schritt, **„Nachricht an Gegner“**, ab „zugestimmt“ **„Trainer informieren“**, Bearbeiten.
- **Nachricht an Gegner**: fertiger Text (Anfrage, wenn wir verlegen wollen / Zusage, wenn der Gegner will), senden per **WhatsApp** (`https://wa.me/<Nummer>?text=…`, deutsche Nummern 0… → 49…), **E-Mail** (mailto), **Anrufen**, **Text kopieren**. Beim Senden: Status automatisch offen → angefragt (bzw. → zugestimmt bei Gegner-Wunsch).
- **Trainer informieren**: Text mit Alt/Neu-Termin an die Trainer des Teams (aus `team_staff` + App-Mitglieder).
- Bei „erledigt“: Rückfrage „Trainer jetzt informieren?“
- Formular: Spiel aus BFV-Spielplan wählen (füllt alles aus) oder manuell: Mannschaft, Wettbewerb, Gegner (Vorschläge aus früheren Einträgen; Kontakt wird übernommen), Heim/Auswärts, wer will verlegen, alter Termin, neuer Termin + Ort, Grund, Kontakt Gegner, Status (nur Leitung), Notizen.
- Trainer: nur eigene Teams, Knopf heißt „+ Verlegung melden“, danach „Die Jugendleitung kümmert sich darum“.
- **BFV-Abgleich** auf der Karte: zeigt der BFV-Spielplan den neuen Termin schon → grün „✓ Der BFV-Spielplan zeigt schon den neuen Termin …“; BFV hat das Spiel als geändert markiert → orange Warnung.

### 5.5 Spiele (BFV)
- Daten aus `jugend-spiele.json`: `{ updatedAt, games:[{ id, altersklasse, typ, wettbewerb, date 'YYYY-MM-DD', time 'HH:MM', home, away, venue, geaendert, heim, svk_team, gegner, teams:[team_keys] }] }`
- Bei D-, E-, F-Junioren enthält `teams` mehrere Keys (z. B. `["u11","u10"]`) → Anzeige „U11/U10“, beim Verlegen Hinweis „Mannschaft prüfen“.
- Liste nach Tagen gruppiert, je Spiel: Uhrzeit, SVK-Team blau hervorgehoben, Gegner, Altersklasse, Wettbewerb, „beim BFV geändert“, „Verlegung: <Status>“ falls eine läuft, 📍 Spielort (öffnet Karten-App), Knopf **Verlegen**.
- Filter Mannschaft, „nur geänderte“. Trainer sehen nur Spiele ihrer Teams. Fußzeile: Quelle + Stand.

### 5.6 Trainer
- Aus `team_staff` (area Jugend), gruppiert nach Team (eigene Teams zuerst, „Dein Team“), Suche.
- Person: Foto/Initialen, Name, Rolle, runde Knöpfe 📞 Anrufen · 💬 WhatsApp · ✉ E-Mail. Pro Team „Mail an alle“. Leitung: „Alle E-Mails kopieren“.

### 5.7 Zugänge (nur Freigeber)
- Oben „Wartet auf Freigabe (n)“ – aufgeklappt; darunter „Freigegeben (n)“ – zugeklappt, antippen zum Bearbeiten.
- Karte: Initialen, Name, E-Mail/Rolle, Pille Wartet/Aktiv/Admin; aufgeklappt: Name ändern, Kontakt-Knöpfe, Rolle **Trainer | Jugendleitung**, Team-Kacheln (bei Jugendleitung ausgeblendet), Knöpfe **Ablehnen | ✓ Freigeben** bzw. **Sperren | Speichern**.
- Nach Freigabe: fertige WhatsApp an die Person („dein Zugang ist freigeschaltet …“ + Link).

---

## 6. Push-Benachrichtigungen

**Wann:** neue Aufgabe (an neu Zugewiesene), Statuswechsel einer Aufgabe, neue Chat-Nachricht (an alle Beteiligten = Zugewiesene + Ersteller, **nie an den Auslöser selbst**).
**Texte:** „Neue Aufgabe von <Vorname>“ / „<Vorname>: In Bearbeitung“ / „<Vorname> in „<Titel>““ + Inhalt. Antippen öffnet die Aufgabe.

**Heute (Web-App):** Web-Push (VAPID). Die App ruft nach der Aktion die Edge Function auf:
`supabase.functions.invoke('jugend-push', { body: { typ: 'neu'|'status'|'nachricht', aufgabe_id, an?: [user_ids], text? } })`
Die Function prüft mit dem Login des Aufrufers, ob er die Aufgabe sehen darf, und schickt an die Geräte aus `jugend_push_abos`.

**Für die native App:** Web-Push-Schlüssel funktionieren dort NICHT. Nötig:
- Firebase Cloud Messaging (Android + iOS über APNs), Apple-Developer-Konto für iOS-Push
- Tabelle `jugend_push_abos` um `plattform ('web'|'ios'|'android')` und `fcm_token` erweitern (neue SQL-Datei, z. B. `SVK_V95_…`)
- Edge Function `jugend-push` erweitern: Web-Abos weiter per Web-Push, native per FCM. **Web-App muss weiter funktionieren.**

---

## 7. Design

- Farben: Navy `#031c3d` (Kopfzeile, aktive Elemente), Blau `#0757b7` (Knöpfe), Hellblau `#8dcbff`, Hintergrund `#f2f6fb`, Linien `#dce5ef`, Grün `#16794a` (erledigt), Orange `#b26a00` (in Bearbeitung/Warnung), Rot `#b42318`.
- Status-Pillen: Offen grau · Angefragt orange · Zugestimmt blau · Beantragt lila · Erledigt grün · Abgelehnt rot.
- Karten weiß, runde Ecken (14–16 px), viel Luft, große Tipp-Flächen (min. 40 px). System-Schrift.
- Logo/Icon: `jugendapp/icons/` (SVK-Wappen auf Navy).
- Datum deutsch: „Sa, 21.11.26“ bzw. lang „Samstag, 21.11.2026“, Uhrzeit „10:30 Uhr“.
- Handy zuerst: nichts darf breiter als der Bildschirm sein, Eingabefelder mind. 16 px (kein Auto-Zoom), Safe-Area (Notch/Home-Balken) beachten.

---

## 8. Wichtige Regeln für die Umsetzung

1. **Supabase-Datenbank, Logins und Rechte NICHT verändern**, außer es ist für Push nötig (dann neue SQL-Datei, vorher fragen).
2. **Website-Logins** (Herren, Damen, Jugend, Förderverein) bleiben unverändert.
3. Die **Web-App `/jugendapp/` muss weiter funktionieren** – beide nutzen dieselben Daten.
4. Kinder-/Personendaten nie in öffentliche Dateien schreiben; alles nur über Supabase mit Login.
5. Keine geheimen Schlüssel (Service-Role, VAPID-Private, Firebase-Server-Key) ins Repo – das Repo ist öffentlich.
6. Den offiziellen Verlegungsantrag im **DFBnet** kann die App nicht stellen (keine Schnittstelle) – nur nachverfolgen.
