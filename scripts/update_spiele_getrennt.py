#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, re, urllib.request, html, sys

CONFIG = json.loads(Path("data/bfv-team-urls.json").read_text(encoding="utf-8"))

def fetch_team(kind):
    url = CONFIG[kind]
    out = Path(f"data/{kind}-spiele.json")
    if not url.startswith("http"):
        print(f"{kind}: keine gültige BFV-URL eingetragen – übersprungen.")
        return

    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (SVK Website Updater)",
        "Accept-Language": "de-DE,de;q=0.9"
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read().decode("utf-8", "ignore")

    txt = re.sub(r"<script\b[^>]*>.*?</script>", " ", raw, flags=re.S|re.I)
    txt = re.sub(r"<style\b[^>]*>.*?</style>", " ", txt, flags=re.S|re.I)
    txt = re.sub(r"<[^>]+>", " ", txt)
    txt = html.unescape(txt)
    txt = re.sub(r"\s+", " ", txt).strip()

    def iso(d):
        return datetime.strptime(d, "%d.%m.%Y").strftime("%Y-%m-%d")

    def parse(label):
        p = txt.find(label)
        if p < 0:
            return None
        chunk = txt[p:p+1000]
        dt = re.search(r"(\d{2}\.\d{2}\.\d{4})\s*/\s*(\d{1,2}:\d{2})\s*Uhr", chunk)
        if not dt:
            return None
        body = chunk[dt.end():]
        q = body.find("Zum Spiel")
        if q >= 0:
            body = body[:q]
        body = re.sub(r"[\ue000-\uf8ff]", " ", body)
        body = re.sub(r"\s+", " ", body).strip()

        score = None
        if " - : - " in body:
            home, away = body.split(" - : - ", 1)
        else:
            m = re.search(r"\b(\d{1,2})\s*:\s*(\d{1,2})\b", body)
            if m:
                score = f"{m.group(1)}:{m.group(2)}"
                home, away = body[:m.start()], body[m.end():]
            else:
                club = "SpVgg Kaufbeuren"
                pos = body.find(club)
                if pos < 0:
                    return None
                if pos < len(body)/2:
                    home, away = club, body[pos+len(club):]
                else:
                    home, away = body[:pos], club

        def clean(v):
            v = re.sub(r"\s+", " ", v).strip(" -")
            for marker in ["Unsere Neuigkeiten","Lade Daten","Frauen BOL","Spielberichte"]:
                v = v.split(marker)[0].strip()
            return v

        return {
            "date": iso(dt.group(1)),
            "time": dt.group(2),
            "home": clean(home),
            "away": clean(away),
            "score": score,
            "venue": ""
        }

    old = {}
    if out.exists():
        try:
            old = json.loads(out.read_text(encoding="utf-8"))
        except Exception:
            pass

    payload = {
        "team": old.get("team") or ("SpVgg Kaufbeuren Frauen" if kind=="frauen" else "SpVgg Kaufbeuren 1. Herren"),
        "competition": old.get("competition") or "",
        "updatedAt": datetime.now(ZoneInfo("Europe/Berlin")).isoformat(timespec="seconds"),
        "nextGame": parse("Nächstes Spiel") or old.get("nextGame"),
        "lastGame": parse("Letztes Spiel") or old.get("lastGame"),
        "source": "BFV",
        "sourceUrl": url
    }
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"{kind}: aktualisiert")

for kind in ("herren","frauen"):
    fetch_team(kind)
