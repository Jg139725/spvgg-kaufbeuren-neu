#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, re, urllib.request, html as htmlmod
from bs4 import BeautifulSoup

TEAM_URL = "https://www.bfv.de/mannschaften/-/016PILCMSS000000VV0AG80NVUT1FLRU"
OUT = Path("data/herren-spielplan.json")
TZ = ZoneInfo("Europe/Berlin")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SVK-Spielplan-Updater/2.0; +https://jg139725.github.io/spvgg-kaufbeuren-neu/)",
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
    "Cache-Control": "no-cache",
}

def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "ignore")

def clean_text(raw):
    soup = BeautifulSoup(raw, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return re.sub(r"\s+", " ", htmlmod.unescape(soup.get_text(" ", strip=True)))

def parse_fixtures(raw):
    txt = clean_text(raw)
    now = datetime.now(TZ)
    # BFV text: "Sa.. 26.09.2026 /16:00 Uhr SpVgg Kaufbeuren - : - FC Königsbrunn Zum Spiel"
    pat = re.compile(
        r'(\d{2}\.\d{2}\.\d{4})\s*/\s*(\d{1,2}:\d{2})\s*Uhr\s+(.{3,220}?)\s+Zum Spiel'
    )
    items = []
    for m in pat.finditer(txt):
        date_de, tm, match = m.groups()
        try:
            dt = datetime.strptime(date_de + " " + tm, "%d.%m.%Y %H:%M").replace(tzinfo=TZ)
        except ValueError:
            continue
        if dt < now:
            continue
        if " - : - " not in match:
            continue
        home, away = [re.sub(r"\s+", " ", x).strip() for x in match.split(" - : - ", 1)]
        if home == "SpVgg Kaufbeuren 2" or away == "SpVgg Kaufbeuren 2":
            continue
        if home != "SpVgg Kaufbeuren" and away != "SpVgg Kaufbeuren":
            continue

        tail = txt[m.end():m.end()+320]
        # Venue normally ends before next competition/date/news block.
        cuts = []
        for p in [
            r'\s+BZL Schwaben Süd\s+',
            r'\s+(?:Mo|Di|Mi|Do|Fr|Sa|So)\.\.?\s+\d{2}\.\d{2}\.\d{4}',
            r'\s+Spielberichte\s+',
            r'\s+Tabellen\s+'
        ]:
            mm = re.search(p, tail)
            if mm:
                cuts.append(mm.start())
        if cuts:
            tail = tail[:min(cuts)]
        venue = re.sub(r"\s+", " ", tail).strip(" |")

        item = {
            "date": dt.strftime("%Y-%m-%d"),
            "time": tm,
            "home": home,
            "away": away,
            "venue": venue
        }
        key = (item["date"], item["time"], item["home"], item["away"])
        if not any((x["date"],x["time"],x["home"],x["away"]) == key for x in items):
            items.append(item)

    items.sort(key=lambda x: (x["date"], x["time"]))
    return items[:10]

def team_name(cell):
    s = re.sub(r"\s+", " ", cell.get_text(" ", strip=True))
    s = re.sub(r"^Image:\s*(?:Vereinslogo\s*)?", "", s, flags=re.I).strip()
    return s

def parse_table(raw):
    soup = BeautifulSoup(raw, "html.parser")
    candidates = []
    for table in soup.find_all("table"):
        rows = []
        for tr in table.find_all("tr"):
            cells = tr.find_all(["td","th"])
            vals = [re.sub(r"\s+", " ", c.get_text(" ", strip=True)).strip() for c in cells]
            if len(vals) < 8:
                continue
            posm = re.match(r"^\s*(\d{1,2})\.\s*$", vals[0])
            if not posm:
                continue
            pos = int(posm.group(1))
            team = team_name(cells[1])
            if not team:
                continue

            # Standard BFV columns: Pl., Verein, Sp., G, U, V, Torv., Tordiff., Pkt.
            try:
                played = int(re.search(r"-?\d+", vals[2]).group())
                won = int(re.search(r"-?\d+", vals[3]).group())
                drawn = int(re.search(r"-?\d+", vals[4]).group())
                lost = int(re.search(r"-?\d+", vals[5]).group())
                goalsm = re.search(r"\d+\s*:\s*\d+", vals[6])
                diff = int(re.search(r"-?\d+", vals[7]).group())
                points = int(re.search(r"-?\d+", vals[8]).group()) if len(vals) > 8 else None
                if not goalsm or points is None:
                    continue
            except (AttributeError, ValueError, IndexError):
                continue

            rows.append({
                "pos": pos, "team": team, "played": played, "won": won,
                "drawn": drawn, "lost": lost, "goals": goalsm.group().replace(" ",""),
                "diff": ("+" + str(diff) if diff > 0 else str(diff)), "points": points
            })
        if len(rows) > len(candidates):
            candidates = rows

    # BFV fallback: parse the flattened table text if HTML structure changes.
    if len(candidates) < 10:
        txt = clean_text(raw)
        block = re.search(r'Pl\.\s+Verein\s+Sp\.\s+G\s+U\s+V\s+Torv\..{0,80}?Pkt\.(.*?)(?:Legende|Wettbewerbe)', txt)
        if block:
            rowpat = re.compile(
                r'(\d{1,2})\.\s+(?:Image:\s*Vereinslogo\s*)?(.+?)\s+'
                r'(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+\s*:\s*\d+)\s+(-?\d+)\s+(\d+)'
            )
            parsed = []
            for m in rowpat.finditer(block.group(1)):
                pos, team, sp, g, u, v, goals, diff, pts = m.groups()
                diffi = int(diff)
                parsed.append({
                    "pos": int(pos), "team": team.strip(), "played": int(sp),
                    "won": int(g), "drawn": int(u), "lost": int(v),
                    "goals": goals.replace(" ",""),
                    "diff": ("+"+str(diffi) if diffi > 0 else str(diffi)),
                    "points": int(pts)
                })
            if len(parsed) >= 10:
                candidates = parsed

    dedup = {r["pos"]: r for r in candidates}
    rows = [dedup[k] for k in sorted(dedup)]
    return rows if len(rows) >= 10 and any("SpVgg Kaufbeuren" == r["team"] for r in rows) else []

def load_old():
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        return {}

old = load_old()
raw = get(TEAM_URL)

fixtures = parse_fixtures(raw)
table = parse_table(raw)

if not fixtures:
    raise RuntimeError("BFV lieferte keine zukünftigen Spiele. Alte JSON bleibt unverändert.")
if not table:
    raise RuntimeError("BFV-Tabelle konnte nicht gelesen werden. Alte JSON bleibt unverändert.")

payload = {
    "updatedAt": datetime.now(TZ).isoformat(timespec="seconds"),
    "competition": "BZL Schwaben Süd",
    "fixtures": fixtures,
    "table": table
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"OK: {len(fixtures)} kommende Spiele, {len(table)} Tabellenzeilen")
print("Nächstes Spiel:", fixtures[0]["date"], fixtures[0]["time"], fixtures[0]["home"], "-", fixtures[0]["away"])
