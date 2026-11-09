#!/usr/bin/env python3
"""Jugend-Spielplan der SpVgg Kaufbeuren aus dem offiziellen BFV-Vereinsspielplan (PDF).

Quelle: https://service.bfv.de/rest/pdfexport/vereinsspiele?id=<Vereins-ID>
Enthält alle Vereinsspiele der kommenden Wochen mit Altersklasse, Uhrzeit und Spielort.
Kursiv gedruckte Spiele wurden laut BFV abgesagt, verlegt oder geändert -> "geaendert": true.

Ausgabe: data/jugend-spiele.json (öffentliche BFV-Daten, nur Jugend).
Bekannte Spiele bleiben erhalten, bis sie mehr als 21 Tage vorbei sind, damit
die Jugend-App auch kurz zurückliegende Partien noch zuordnen kann.
"""
import io, json, re, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests
import pdfplumber

VEREIN_ID = "00ES8GNJE4000007VV0AG08LVUPGND5I"
URL = f"https://service.bfv.de/rest/pdfexport/vereinsspiele?id={VEREIN_ID}"
OUT = Path("data/jugend-spiele.json")
HEAD = {"User-Agent": "Mozilla/5.0 (compatible; SVK-Jugend-App/1.0; +https://spvgg-kaufbeuren.de)"}
SVK = "SpVgg Kaufbeuren"
DATE = re.compile(r"^\d{2}\.\d{2}\.\d{4}$")
TIME = re.compile(r"^\d{1,2}:\d{2}$")

# Altersklasse -> mögliche App-Teams (Reihenfolge = Vorschlag, wenn nicht eindeutig)
KLASSE_TEAMS = {
    "A-Junioren": ["u19"], "B-Junioren": ["u17"], "C-Junioren": ["u15"],
    "D-Junioren": ["u13", "u12"], "E-Junioren": ["u11", "u10"],
    "F-Junioren": ["u09", "u08"], "G-Junioren": ["g-jugend"],
    "A-Juniorinnen": ["maedels"], "B-Juniorinnen": ["maedels"], "C-Juniorinnen": ["maedels"],
    "D-Juniorinnen": ["maedels"], "E-Juniorinnen": ["maedels"], "F-Juniorinnen": ["maedels"],
}
TYP = {"ME": "Punktspiel", "PO": "Pokal", "FS": "Freundschaftsspiel", "HM": "Hallenturnier", "TU": "Turnier"}


def clean(s):
    return re.sub(r"\s+", " ", s or "").strip()


def lines_of(page):
    words = page.extract_words(extra_attrs=["fontname", "size"], keep_blank_chars=False)
    rows = {}
    for w in words:
        rows.setdefault(round(w["top"]), []).append(w)
    # nahe beieinander liegende Zeilen zusammenfassen
    merged = []
    for top in sorted(rows):
        if merged and abs(top - merged[-1][0]) <= 2:
            merged[-1][1].extend(rows[top])
        else:
            merged.append([top, list(rows[top])])
    return [(t, sorted(ws, key=lambda w: w["x0"])) for t, ws in merged]


def parse(pdf_bytes):
    games, section = [], None
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            last = None
            for top, ws in lines_of(page):
                texts = [w["text"] for w in ws]
                line = " ".join(texts)
                is_header = all("Ultra" in w["fontname"] for w in ws) and re.search(r"Junior|Herren|Frauen|Senioren|Ü\d", line)
                if is_header:
                    section = clean(line)
                    last = None
                    continue
                di = next((i for i, t in enumerate(texts) if DATE.match(t)), None)
                if di is not None and di + 1 < len(texts) and TIME.match(texts[di + 1]):
                    rest = ws[di + 2:]
                    dash = next((i for i, w in enumerate(rest) if w["text"] in ("-", "–")), None)
                    if dash is None:
                        last = None
                        continue
                    home = clean(" ".join(w["text"] for w in rest[:dash]))
                    away = clean(" ".join(w["text"] for w in rest[dash + 1:]))
                    typ = texts[0] if di > 0 else ""
                    klasse = clean(" ".join(texts[1:di])) if di > 1 else ""
                    italic = any("Italic" in w["fontname"] for w in ws if w["size"] >= 7)
                    d = datetime.strptime(texts[di], "%d.%m.%Y").strftime("%Y-%m-%d")
                    last = {
                        "altersklasse": section or "", "typ": TYP.get(typ, typ), "wettbewerb": klasse,
                        "date": d, "time": texts[di + 1], "home": home, "away": away, "venue": "",
                        "geaendert": italic,
                    }
                    games.append(last)
                elif last is not None and ws and ws[0]["size"] < 8 and ws[0]["x0"] > 200 and not last["venue"]:
                    last["venue"] = clean(line)
                    if any("Italic" in w["fontname"] for w in ws):
                        last["geaendert"] = True
                    last = None
                else:
                    last = None
    return games


def enrich(g):
    heim = g["home"].startswith(SVK) or SVK in g["home"]
    svk_team = g["home"] if heim else g["away"]
    g["heim"] = heim
    g["svk_team"] = svk_team
    g["gegner"] = g["away"] if heim else g["home"]
    g["teams"] = KLASSE_TEAMS.get(g["altersklasse"], [])
    g["id"] = re.sub(r"[^a-z0-9]+", "-", f"{g['date']}-{g['time']}-{g['altersklasse']}-{g['home']}-{g['away']}".lower()).strip("-")
    return g


def main():
    r = requests.get(URL, headers=HEAD, timeout=60)
    r.raise_for_status()
    if "pdf" not in r.headers.get("content-type", ""):
        sys.exit("BFV hat kein PDF geliefert: " + r.headers.get("content-type", ""))
    neu = [enrich(g) for g in parse(r.content)
           if "Junior" in g["altersklasse"] and SVK in (g["home"] + g["away"])]
    if not neu:
        print("Keine Jugendspiele im BFV-Spielplan gefunden – vorhandene Datei bleibt unverändert.")
        return

    old = []
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text(encoding="utf-8")).get("games", [])
        except Exception:
            old = []
    erster_tag = min(g["date"] for g in neu)
    grenze = (datetime.now() - timedelta(days=21)).strftime("%Y-%m-%d")
    # alte Spiele vor dem PDF-Zeitraum behalten (Historie), alles ab PDF-Beginn kommt frisch vom BFV
    behalten = [g for g in old if grenze <= g.get("date", "") < erster_tag]
    games = sorted(behalten + neu, key=lambda g: (g["date"], g["time"], g["altersklasse"]))

    data = {"updatedAt": datetime.now(timezone.utc).isoformat(), "source": URL,
            "zeitraumAb": erster_tag, "games": games}
    if OUT.exists():
        try:
            prev = json.loads(OUT.read_text(encoding="utf-8"))
            if prev.get("games") == games:
                print("Keine Änderungen.")
                return
        except Exception:
            pass
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(neu)} Jugendspiele vom BFV, {len(games)} gesamt gespeichert.")


if __name__ == "__main__":
    main()
