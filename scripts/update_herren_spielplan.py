#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json, re, urllib.request, html as htmlmod

from bs4 import BeautifulSoup

TEAM_URL = "https://www.bfv.de/mannschaften/-/016PILCMSS000000VV0AG80NVUT1FLRU"
LEAGUE_URL = "https://www.fussball.de/spieltag/bzl-schwaben-sued-bezirk-schwaben-bezirksliga-herren-saison2627-bayern/-/spieldatum/{date}/staffel/03151UJ1C4000006VS5489BUVSBBVPEU-G"
OUT = Path("data/herren-spielplan.json")

HEADERS = {
    "User-Agent":"Mozilla/5.0 (compatible; SVK-Spielplan-Updater/1.0)",
    "Accept-Language":"de-DE,de;q=0.9"
}

def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8","ignore")

def clean_text(raw):
    soup = BeautifulSoup(raw, "html.parser")
    for tag in soup(["script","style"]):
        tag.decompose()
    txt = htmlmod.unescape(soup.get_text(" ", strip=True))
    return re.sub(r"\s+"," ",txt)

def parse_fixtures(raw):
    txt = clean_text(raw)
    pat = re.compile(r'(\d{2}\.\d{2}\.\d{4})\s*/\s*(\d{1,2}:\d{2})\s*Uhr\s+(.{3,180}?)\s+Zum Spiel')
    now = datetime.now(ZoneInfo("Europe/Berlin"))
    out = []

    for m in pat.finditer(txt):
        date_de, tm, match = m.groups()
        date_obj = datetime.strptime(date_de, "%d.%m.%Y").replace(tzinfo=ZoneInfo("Europe/Berlin"))
        if date_obj.date() < now.date():
            continue

        # Upcoming BFV games are separated by "- : -"
        if " - : - " not in match:
            continue
        home, away = [x.strip() for x in match.split(" - : - ",1)]

        # Only 1st team, never SpVgg Kaufbeuren 2
        if home == "SpVgg Kaufbeuren 2" or away == "SpVgg Kaufbeuren 2":
            continue
        if home != "SpVgg Kaufbeuren" and away != "SpVgg Kaufbeuren":
            continue

        venue = ""
        tail = txt[m.end():m.end()+260]
        stop = re.search(r'(?:BZL Schwaben Süd|[A-Z][a-z]{1,2}\.\.?\s+\d{2}\.\d{2}\.\d{4})', tail)
        if stop:
            tail = tail[:stop.start()]
        venue = re.sub(r'\s+',' ',tail).strip(" |")

        item = {
            "date": datetime.strptime(date_de,"%d.%m.%Y").strftime("%Y-%m-%d"),
            "time": tm,
            "home": home,
            "away": away,
            "venue": venue
        }
        if not any(x["date"]==item["date"] and x["time"]==item["time"] and x["home"]==item["home"] for x in out):
            out.append(item)

    out.sort(key=lambda x:(x["date"],x["time"]))
    return out[:10]

def parse_table(raw):
    soup = BeautifulSoup(raw, "html.parser")
    best = []

    for table in soup.find_all("table"):
        rows = []
        for tr in table.find_all("tr"):
            cells = [re.sub(r"\s+"," ",c.get_text(" ",strip=True)) for c in tr.find_all(["td","th"])]
            if len(cells) < 8:
                continue

            joined = " | ".join(cells)
            # Find a row containing a league position and team name.
            pos = None
            for c in cells[:2]:
                mm = re.match(r"^\s*(\d{1,2})\.\s*$", c)
                if mm:
                    pos = int(mm.group(1)); break
            if pos is None:
                mm = re.search(r"\b(\d{1,2})\.\b", cells[0] if cells else "")
                if mm:
                    pos = int(mm.group(1))
            if pos is None:
                continue

            # Team is usually the textual cell after position.
            team = ""
            for c in cells:
                if any(key in c for key in ["SpVgg","FC ","TSV ","SV ","SSV ","TV ","VfL "]):
                    team = c.replace("Image: ","").strip()
                    # remove duplicated logo/name text
                    half = len(team)//2
                    if len(team)>10 and team[:half].strip()==team[half:].strip():
                        team=team[:half].strip()
                    break
            if not team:
                continue

            nums = []
            goals = ""
            for c in cells:
                if re.fullmatch(r"\d+\s*:\s*\d+", c):
                    goals = c.replace(" ","")
                elif re.fullmatch(r"-?\d+", c):
                    nums.append(int(c))
            # Expected numeric sequence includes position plus: played,w,d,l,diff,points
            if len(nums) < 6 or not goals:
                continue

            # remove position if duplicated in numeric sequence
            if nums and nums[0] == pos:
                nums = nums[1:]
            if len(nums) < 6:
                continue

            played, won, drawn, lost = nums[0:4]
            diff, points = nums[-2], nums[-1]
            rows.append({
                "pos":pos,"team":team,"played":played,"won":won,"drawn":drawn,"lost":lost,
                "goals":goals,"diff":("+"+str(diff) if diff>0 else str(diff)),"points":points
            })

        if len(rows) > len(best):
            best = rows

    # Deduplicate positions and require our team.
    dedup = {}
    for row in best:
        dedup[row["pos"]] = row
    rows = [dedup[k] for k in sorted(dedup)]
    if len(rows) >= 10 and any(r["team"]=="SpVgg Kaufbeuren" for r in rows):
        return rows
    return []

old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}

try:
    team_raw = get(TEAM_URL)
    fixtures = parse_fixtures(team_raw)
except Exception as e:
    print("Fixtures fallback:", e)
    fixtures = old.get("fixtures", [])

try:
    league_raw = get(LEAGUE_URL.format(date=datetime.now(ZoneInfo("Europe/Berlin")).strftime("%Y-%m-%d")))
    table = parse_table(league_raw)
except Exception as e:
    print("Table fallback:", e)
    table = old.get("table", [])

payload = {
    "updatedAt": datetime.now(ZoneInfo("Europe/Berlin")).isoformat(timespec="seconds"),
    "competition":"BZL Schwaben Süd",
    "fixtures": fixtures or old.get("fixtures", []),
    "table": table or old.get("table", [])
}
OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"{len(payload['fixtures'])} Spiele, {len(payload['table'])} Tabellenzeilen")
