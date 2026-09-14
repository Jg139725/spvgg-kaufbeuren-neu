#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, re, urllib.request, html

URL = "https://www.bfv.de/mannschaften/spvgg-kaufbeuren/016PA7VSOC000000VV0AG80NVV8OQVTB"
OUT = Path("data/frauen-spiele.json")

req = urllib.request.Request(URL, headers={
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
if OUT.exists():
    try:
        old = json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        pass

payload = {
    "team": "SpVgg Kaufbeuren Frauen",
    "competition": "Frauen BOL",
    "updatedAt": datetime.now(ZoneInfo("Europe/Berlin")).isoformat(timespec="seconds"),
    "nextGame": parse("Nächstes Spiel") or old.get("nextGame"),
    "lastGame": parse("Letztes Spiel") or old.get("lastGame"),
    "source": "BFV",
    "sourceUrl": URL
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(payload, ensure_ascii=False, indent=2))
