#!/usr/bin/env python3
"""Nächste Spiele und Tabellen der Jugendmannschaften aus den öffentlichen BFV-Daten.

Quelle: BFV-Widget-Schnittstelle (dieselben Daten wie auf bfv.de)
  .../team/<Mannschafts-ID>/matches      -> Spielplan der Mannschaft
  .../competition/<Staffel-ID>/table     -> Tabelle der Staffel

Ausgabe: data/jugend-bfv.json – wird von assets/js/jugend-bfv.js auf den
Jugendseiten angezeigt (nächste 3 Spiele, letzte 3 Ergebnisse, aktuelle Tabelle).

Die Mannschafts-IDs sind dauerhaft gültig; die Staffel wird bei jedem Lauf neu
ermittelt, eine neue Saison braucht also keine Anpassung. Schlägt der Abruf
einer Mannschaft fehl, bleiben deren bisherige Daten erhalten.
"""
import hashlib
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

API = "https://widget-prod.bfv.de/api/service/widget/v1/"
OUT = Path("data/jugend-bfv.json")
LOGO_DIR = Path("assets/images/vereine")  # Vereinswappen lokal, damit Besucher nichts vom BFV laden
LOGO_URL = "https://app.bfv.de/export.media/-/action/getLogo/format/7/id/"
HEAD = {"User-Agent": "Mozilla/5.0 (compatible; SVK-Website/1.0; +https://spvgg-kaufbeuren.de)"}
SVK = "Kaufbeuren"
MAX_SPIELE = 12  # die Seite zeigt die nächsten 3; Reserve, falls der Abruf mal ausfällt
MAX_ERGEBNISSE = 3  # letzte Ergebnisse je Mannschaft
ERGEBNIS = re.compile(r"^(\d{1,2}):(\d{1,2})(?: (n\.?E\.?|n\.?V\.?))?$")

# Seite (jugend/<key>.html) -> BFV-Mannschaften, die dort angezeigt werden
TEAMS = {
    "u19": [("A-Jugend", "016PACIAIS000000VV0AG80NVV8OQVTB")],
    "u17": [("B-Jugend", "016QFTGKJC000000VV0AG811VTSDEJ30")],
    "u15": [("C-Jugend", "016QFU6GAK000000VV0AG811VTSDEJ30")],
    "u13": [("D1-Jugend", "016QFRT9HG000000VV0AG80NVVPVDHC8")],
    "u12": [("D2-Jugend", "011MIC7UJK000000VTVG0001VTR8C1K7"),
            ("D3-Jugend", "031AKVV2KS000000VS5489BSVU0ORN69")],
    "u11": [("E1-Jugend", "011MICU6US000000VTVG0001VTR8C1K7"),
            ("E-Jugend Halle", "02JGRP01SK000000VS5489B2VU644FQC")],
    "u10": [("E2-Jugend", "02IDJ5S9JK000000VS5489B1VUG7QVAU")],
    "u09": [("F1-Jugend", "02BDTKLGG8000000VS5489B1VTPVH7C1")],
    "u08": [("F2-Jugend", "02BDTL2GMC000000VS5489B1VTPVH7C1")],
    "g-jugend": [("G1", "02M579CT50000000VS5489B1VT732LUQ"),
                 ("G2", "031B9FHU5G000000VS5489BSVU0ORN69")],
}


def get(path):
    req = urllib.request.Request(API + path, headers=HEAD)
    with urllib.request.urlopen(req, timeout=40) as r:
        body = json.load(r)
    if body.get("state") != 0 or body.get("data") is None:
        raise RuntimeError(f"BFV-Antwort ohne Daten: {path}")
    return body["data"]


_platzhalter = None
_logo_cache = {}


def fetch(url):
    req = urllib.request.Request(url, headers=HEAD)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def logo(club_id, privat=False):
    """Lädt das Wappen eines Vereins einmalig herunter und liefert die Vereins-ID
    (= Dateiname) zurück – oder "", wenn der BFV kein Wappen hat."""
    global _platzhalter
    if not club_id or privat or not re.fullmatch(r"[0-9A-Z]{32}", club_id):
        return ""
    if club_id in _logo_cache:
        return _logo_cache[club_id]
    ziel = LOGO_DIR / f"{club_id}.png"
    ok = ziel.exists()
    if not ok:
        try:
            if _platzhalter is None:  # das Bild, das der BFV ohne Wappen ausliefert
                _platzhalter = hashlib.md5(fetch(LOGO_URL + "0" * 32)).hexdigest()
            bild = fetch(LOGO_URL + club_id)
            if bild[:8] == b"\x89PNG\r\n\x1a\n" and hashlib.md5(bild).hexdigest() != _platzhalter:
                LOGO_DIR.mkdir(parents=True, exist_ok=True)
                ziel.write_bytes(bild)
                ok = True
        except Exception as e:
            print(f"  Hinweis: Wappen {club_id} nicht geladen: {e}")
    _logo_cache[club_id] = club_id if ok else ""
    return _logo_cache[club_id]


def clean(s):
    return " ".join((s or "").split())


def load_team(label, team_id):
    data = get(f"team/{team_id}/matches")
    team = data.get("team") or {}
    gestern = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

    # Mannschaft -> Verein (für die Wappen in der Tabelle; dort liefert der BFV nur die Mannschaft)
    vereine = {}
    for m in data.get("matches") or []:
        for seite in ("home", "guest"):
            if m.get(f"{seite}TeamPermanentId") and m.get(f"{seite}ClubId") and not m.get(f"{seite}LogoPrivate"):
                vereine[m[f"{seite}TeamPermanentId"]] = m[f"{seite}ClubId"]

    matches, results, roh = [], [], {}
    heute = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for m in data.get("matches") or []:
        home, away = clean(m.get("homeTeamName")), clean(m.get("guestTeamName"))
        if not m.get("kickoffDate") or "SPIELFREI" in (home.upper(), away.upper()):
            continue
        date = datetime.strptime(m["kickoffDate"], "%d.%m.%Y").strftime("%Y-%m-%d")
        spiel = {
            "date": date,
            "time": m.get("kickoffTime") or "",
            "home": home,
            "away": away,
            "heim": m.get("homeTeamPermanentId") == team_id,
            "typ": clean(m.get("competitionType")),
            "wettbewerb": clean(m.get("competitionName")),
        }
        roh[id(spiel)] = m
        ergebnis = ERGEBNIS.match(clean(m.get("result")))
        if ergebnis and date <= heute:
            # nur echte Resultate; Absagen, Abbrüche und nicht angetretene Spiele bleiben weg
            h, a = int(ergebnis.group(1)), int(ergebnis.group(2))
            eigene, gegner = (h, a) if spiel["heim"] else (a, h)
            spiel["score"] = f"{h}:{a}"
            spiel["zusatz"] = {"nE": "n. E.", "nV": "n. V."}.get((ergebnis.group(3) or "").replace(".", ""), "")
            spiel["ausgang"] = "S" if eigene > gegner else "N" if eigene < gegner else "U"
            results.append(spiel)
            continue
        if date < gestern or clean(m.get("result")):
            continue  # vergangen oder schon gespielt
        matches.append(spiel)
    matches.sort(key=lambda g: (g["date"], g["time"] or "99:99"))
    results.sort(key=lambda g: (g["date"], g["time"] or "00:00"), reverse=True)
    matches, results = matches[:MAX_SPIELE], results[:MAX_ERGEBNISSE]
    for spiel in matches + results:  # Wappen nur für Spiele, die wirklich angezeigt werden
        m = roh[id(spiel)]
        spiel["homeLogo"] = logo(m.get("homeClubId"), m.get("homeLogoPrivate"))
        spiel["awayLogo"] = logo(m.get("guestClubId"), m.get("guestLogoPrivate"))

    table, competition = [], clean(team.get("competitionName"))
    compound = team.get("compoundId")
    if compound:
        try:
            t = get(f"competition/{compound}/table")
            rows = [{
                "pos": r.get("position"),
                "name": clean((r.get("team") or {}).get("name")),
                "sp": r.get("matches"),
                "s": r.get("matchesWon"),
                "u": r.get("matchesDrawn"),
                "n": r.get("matchesLost"),
                "diff": r.get("goalsDiff"),
                "pkt": r.get("points"),
                "svk": (r.get("team") or {}).get("permanentId") == team_id,
                "logo": vereine.get((r.get("team") or {}).get("permanentId"), ""),
            } for r in t.get("table") or []]
            # Tabelle nur zeigen, wenn unsere Mannschaft darin steht
            if any(r["svk"] for r in rows):
                table = rows
                for r in table:
                    r["logo"] = logo(r["logo"])
                competition = clean(t.get("competitionName")) or competition
        except Exception as e:  # Tabelle ist optional (z. B. Kinderfußball ohne Wertung)
            print(f"  Hinweis: keine Tabelle für {label}: {e}")

    return {
        "label": label,
        "bfvName": clean(team.get("name")),
        "wettbewerb": competition if table else "",
        "url": f"https://www.bfv.de/mannschaften/-/{team_id}",
        "matches": matches,
        "results": results,
        "table": table,
    }


def main():
    old = {}
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text(encoding="utf-8")).get("teams", {})
        except Exception:
            old = {}

    teams, fehler = {}, 0
    for key, entries in TEAMS.items():
        groups = []
        for label, team_id in entries:
            try:
                groups.append(load_team(label, team_id))
                print(f"{key}: {label} – {len(groups[-1]['matches'])} Spiele, "
                      f"{len(groups[-1]['results'])} Ergebnisse, "
                      f"{len(groups[-1]['table'])} Tabellenplätze")
            except Exception as e:
                fehler += 1
                print(f"{key}: {label} – Abruf fehlgeschlagen ({e}), alte Daten bleiben")
                alt = next((g for g in old.get(key, []) if g.get("label") == label), None)
                if alt:
                    groups.append(alt)
        teams[key] = groups

    if fehler == sum(len(v) for v in TEAMS.values()):
        sys.exit("BFV nicht erreichbar – vorhandene Datei bleibt unverändert.")
    if teams == old:
        print("Keine Änderungen.")
        return

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "https://www.bfv.de",
        "teams": teams,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print("data/jugend-bfv.json gespeichert.")


if __name__ == "__main__":
    main()
