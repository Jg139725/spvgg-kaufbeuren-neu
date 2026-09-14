#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import json, re, urllib.request, html

URL = "https://www.bfv.de/mannschaften/spvgg-kaufbeuren/016PA7VSOC000000VV0AG80NVV8OQVTB"
OUT = Path("data/frauen-spiele.json")

req = urllib.request.Request(
    URL,
    headers={
        "User-Agent": "Mozilla/5.0 (compatible; SVK-Spielplan-Updater/1.0)",
        "Accept-Language": "de-DE,de;q=0.9"
    }
)
with urllib.request.urlopen(req, timeout=30) as r:
    raw = r.read().decode("utf-8", "ignore")

# Flatten markup to text while preserving enough spacing.
text = re.sub(r"<script\b[^>]*>.*?</script>", " ", raw, flags=re.S|re.I)
text = re.sub(r"<style\b[^>]*>.*?</style>", " ", text, flags=re.S|re.I)
text = re.sub(r"<[^>]+>", " ", text)
text = html.unescape(text)
text = re.sub(r"\s+", " ", text).strip()

def normalize_date(d):
    # BFV: 19.09.2026
    return datetime.strptime(d, "%d.%m.%Y").strftime("%Y-%m-%d")

def parse_game(label):
    # Examples:
    # Letztes Spiel So.. 06.09.2026 /12:30 Uhr FC Augsburg 1 ... SpVgg Kaufbeuren Zum Spiel
    # Nächstes Spiel Sa.. 19.09.2026 /18:30 Uhr TSV Ottobeuren - : - SpVgg Kaufbeuren Zum Spiel
    start = text.find(label)
    if start < 0:
        return None
    chunk = text[start:start+850]

    dt = re.search(r"(\d{2}\.\d{2}\.\d{4})\s*/\s*(\d{1,2}:\d{2})\s*Uhr", chunk)
    if not dt:
        return None

    after = chunk[dt.end():]
    end = after.find("Zum Spiel")
    if end >= 0:
        after = after[:end]

    # Remove private-use/icon garbage BFV injects.
    after = re.sub(r"[\ue000-\uf8ff]", " ", after)
    after = re.sub(r"\s+", " ", after).strip()

    score = None

    # Prefer explicit upcoming separator.
    if " - : - " in after:
        home, away = after.split(" - : - ", 1)
    else:
        # For finished matches, look for score like 0 : 0 / 2 : 1.
        sm = re.search(r"\b(\d{1,2})\s*:\s*(\d{1,2})\b", after)
        if sm:
            score = f"{sm.group(1)}:{sm.group(2)}"
            home = after[:sm.start()].strip(" -")
            away = after[sm.end():].strip(" -")
        else:
            # BFV sometimes replaces score with icons in text extraction.
            # We can still recover teams by locating our club name.
            club = "SpVgg Kaufbeuren"
            pos = after.find(club)
            if pos >= 0:
                if pos < len(after)/2:
                    home = club
                    away = after[pos+len(club):].strip(" -")
                else:
                    home = after[:pos].strip(" -")
                    away = club
            else:
                return None

    home = re.sub(r"\s+", " ", home).strip()
    away = re.sub(r"\s+", " ", away).strip()

    # Trim unrelated text if parser caught the next section.
    for marker in ["Unsere Neuigkeiten", "Lade Daten", "Frauen BOL", "Spielberichte"]:
        home = home.split(marker)[0].strip()
        away = away.split(marker)[0].strip()

    return {
        "date": normalize_date(dt.group(1)),
        "time": dt.group(2),
        "home": home,
        "away": away,
        "score": score,
        "venue": ""
    }

last_game = parse_game("Letztes Spiel")
next_game = parse_game("Nächstes Spiel")

# Pull venue for next game from first listed fixture if possible.
if next_game:
    d_display = datetime.strptime(next_game["date"], "%Y-%m-%d").strftime("%d.%m.%Y")
    fixture_pos = text.find(d_display)
    if fixture_pos >= 0:
        frag = text[fixture_pos:fixture_pos+700]
        # Venue usually follows "Zum Spiel"
        z = frag.find("Zum Spiel")
        if z >= 0:
            venue = frag[z+len("Zum Spiel"):].strip()
            for stop in ["Frauen BOL", "Sa..", "So..", "Mo..", "Di..", "Mi..", "Do..", "Fr.."]:
                p = venue.find(stop)
                if p > 0:
                    venue = venue[:p].strip()
            next_game["venue"] = venue

existing = {}
if OUT.exists():
    try:
        existing = json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        pass

payload = {
    "team": "SpVgg Kaufbeuren Frauen",
    "competition": "Frauen BOL",
    "updatedAt": datetime.now(ZoneInfo("Europe/Berlin")).isoformat(timespec="seconds"),
    "lastGame": last_game or existing.get("lastGame"),
    "nextGame": next_game or existing.get("nextGame"),
    "source": "BFV",
    "sourceUrl": URL
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(payload, ensure_ascii=False, indent=2))
