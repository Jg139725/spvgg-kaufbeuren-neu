#!/usr/bin/env python3
import json,re
from pathlib import Path
from datetime import datetime,timezone
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

URL="https://www.bfv.de/mannschaften/-/016PILCMSS000000VV0AG80NVUT1FLRU"
TEAM="SpVgg Kaufbeuren"
OUT=Path("data/herren-spielplan.json")
HEAD={"User-Agent":"Mozilla/5.0 (compatible; SVK-Website/1.0)"}

def clean(x): return re.sub(r"\s+"," ",x or "").strip()
def iso(x): return datetime.strptime(x,"%d.%m.%Y").strftime("%Y-%m-%d")
def key(g): return (g.get("date",""),g.get("home",""),g.get("away",""))
def valid_score(v): return bool(re.fullmatch(r"\d{1,2}:\d{1,2}",str(v or "")))

def add_game(games,g):
    if not g.get("date") or TEAM not in (g.get("home",""),g.get("away","")): return
    for old in games:
        if key(old)==key(g):
            if valid_score(g.get("score")): old["score"]=g["score"]
            if g.get("time"): old["time"]=g["time"]
            if g.get("venue"): old["venue"]=g["venue"]
            return
    games.append(g)

def parse_schedule(soup,games):
    text=clean(soup.get_text(" ",strip=True))
    # Termine/Teams werden aus der Mannschaftsseite gelesen. BFV verschleiert Ergebnisziffern teilweise per Webfont,
    # deshalb werden fertige Ergebnisse zusätzlich aus den BFV-Spielberichten gelesen.
    pat=re.compile(r"(?:Letztes Spiel\s+|Nächstes Spiel\s+)?(?:Mo|Di|Mi|Do|Fr|Sa|So)\.\.\s*(\d{2}\.\d{2}\.\d{4})\s*/\s*(\d{1,2}:\d{2})\s*Uhr\s+(.{1,180}?)\s+Zum Spiel")
    for m in pat.finditer(text):
        body=clean(m.group(3))
        if TEAM not in body: continue
        # Noch nicht gespielte Partien enthalten sichtbar "- : -"; Ergebnis-Glyphen werden entfernt.
        body=re.sub(r"\([^)]*\)"," ",body)
        # Teamnamen anhand typischer Trennung bestimmen; bei verschleiertem Ergebnis liegen Glyphen dazwischen.
        known_split=re.split(r"\s+(?:-|[^\w\s]{1,8})\s*:\s*(?:-|[^\w\s]{1,8})\s+",body,maxsplit=1)
        if len(known_split)==2:
            home,away=map(clean,known_split)
        else:
            # Fallback: bekannte SVK-Position nutzen und störende Glyphen am Rand entfernen.
            p=body.find(TEAM)
            if p==0:
                home=TEAM; away=clean(body[len(TEAM):]); away=re.sub(r"^[^A-Za-zÄÖÜäöü0-9]+","",away)
            elif p>0:
                home=clean(body[:p]); away=TEAM; home=re.sub(r"[^A-Za-zÄÖÜäöü0-9.)]+$","",home)
            else: continue
        if not home or not away or len(home)>90 or len(away)>90: continue
        add_game(games,{"date":iso(m.group(1)),"time":m.group(2),"home":home,"away":away,"score":"","venue":""})

def parse_reports(session,soup,games,raw_html=""):
    links=[]
    # BFV legt Spielbericht-Links teils nicht als normale <a>-Tags ab, sondern in
    # eingebetteten Daten. Deshalb durchsuchen wir zusätzlich den kompletten HTML-Quelltext.
    for match in re.findall(r"(?:https?:\/\/www\.bfv\.de)?\/spiele\/spielbericht\/[A-Za-z0-9_-]+", raw_html or ""):
        u=urljoin(URL, match.replace("\\/", "/"))
        if u not in links: links.append(u)

    # Aktueller verifizierter Bericht dient nur als Startanker. Das Ergebnis selbst wird NICHT
    # fest einprogrammiert, sondern jedes Mal aus der BFV-Berichtsseite gelesen.
    seed="https://www.bfv.de/spiele/spielbericht/0324UVF6CG000000VS5489BVVU7OHUMA"
    if seed not in links: links.append(seed)
    for a in soup.find_all("a",href=True):
        href=a.get("href","")
        if "/spiele/spielbericht/" in href:
            u=urljoin(URL,href)
            if u not in links: links.append(u)
    # Die jüngsten BFV-Spielberichte liefern Ergebnisziffern als normalen Text.
    for u in links[:16]:
        try:
            r=session.get(u,headers=HEAD,timeout=20); r.raise_for_status()
            t=clean(BeautifulSoup(r.text,"html.parser").get_text(" ",strip=True))
            if TEAM not in t: continue
            dm=re.search(r"Veröffentlichungsdatum\s+(\d{2}\.\d{2}\.\d{4})",t)
            if not dm: dm=re.search(r"(\d{2}\.\d{2}\.\d{4})",t)
            if not dm: continue
            date=iso(dm.group(1))
            # z.B. "BZL Schwaben Süd: TSV 1892 Haunstetten – SpVgg Kaufbeuren, 2:3 (1:2), Augsburg"
            candidates=re.finditer(r"([^:]{2,100}?)\s+[–-]\s+([^,]{2,100}?),\s*(\d{1,2})\s*:\s*(\d{1,2})",t)
            for m in candidates:
                home=clean(m.group(1)); away=clean(m.group(2))
                home=re.sub(r"^.*?:\s*","",home)
                if TEAM not in (home,away): continue
                add_game(games,{"date":date,"time":"","home":home,"away":away,"score":f"{m.group(3)}:{m.group(4)}","venue":""})
                break
        except Exception as e:
            print("Spielbericht übersprungen:",u,type(e).__name__)

def main():
    old={}
    if OUT.exists():
        try: old=json.loads(OUT.read_text(encoding="utf-8"))
        except Exception: pass
    session=requests.Session()
    r=session.get(URL,headers=HEAD,timeout=30); r.raise_for_status()
    soup=BeautifulSoup(r.text,"html.parser")
    games=[]
    parse_schedule(soup,games)
    parse_reports(session,soup,games,r.text)

    # Vorhandene saubere Datensätze bleiben als Historie erhalten, werden aber von frisch gelesenen BFV-Daten überschrieben.
    for g in old.get("allGames",old.get("fixtures",[])):
        if not isinstance(g,dict): continue
        v=clean(g.get("venue",""))
        if any(x in v for x in ["Unsere Neuigkeiten","Lade Daten","Alle News","Meisterschaften"]): v=""
        add_game(games,{"date":g.get("date",""),"time":g.get("time",""),"home":g.get("home",""),"away":g.get("away",""),"score":g.get("score",""),"venue":v})

    # Bekannte künftige Ligatermine dienen nur als Termin-Fallback; Ergebnisse sind NICHT fest hinterlegt.
    fallback=[
      ("2026-09-26","16:00","SpVgg Kaufbeuren","FC Königsbrunn","Parkstadion Kaufbeuren"),
      ("2026-10-03","15:30","FC Wiggensbach","SpVgg Kaufbeuren","Max Swoboda-Stadion"),
      ("2026-10-09","19:00","SpVgg Kaufbeuren","FC Thalhofen","Parkstadion Kaufbeuren"),
      ("2026-10-17","15:00","TV Erkheim","SpVgg Kaufbeuren",""),
      ("2026-10-24","16:00","SpVgg Kaufbeuren","FC Oberstdorf","Parkstadion Kaufbeuren"),
      ("2026-10-30","19:00","SVO Germaringen","SpVgg Kaufbeuren",""),
      ("2026-11-07","14:00","SpVgg Kaufbeuren","TSV Kammlach","Parkstadion Kaufbeuren"),
      ("2026-11-14","14:00","SSV Niedersonthofen","SpVgg Kaufbeuren","")]
    for a,b,c,d,e in fallback: add_game(games,{"date":a,"time":b,"home":c,"away":d,"score":"","venue":e})

    games.sort(key=lambda g:(g.get("date",""),g.get("time","")))
    today=datetime.now().astimezone().strftime("%Y-%m-%d")
    # Nur Spiele mit Ergebnis gelten als "letztes Spiel". So verdrängt ein alter Fallback nie ein neueres echtes Resultat.
    completed=[g for g in games if g.get("date","")<=today and valid_score(g.get("score"))]
    future=[g for g in games if g.get("date","")>=today and not valid_score(g.get("score"))][:10]

    table=old.get("table",[]); rows=[]
    for tr in soup.find_all("tr"):
        c=[clean(x.get_text(" ",strip=True)) for x in tr.find_all(["th","td"])]
        if len(c)>=9 and re.match(r"^\d+\.?$",c[0]):
            try: rows.append({"pos":int(c[0].rstrip(".")),"team":c[1],"played":int(c[2]),"won":int(c[3]),"drawn":int(c[4]),"lost":int(c[5]),"goals":c[6],"diff":c[7],"points":int(c[8])})
            except Exception: pass
    if rows: table=rows
    data={"updatedAt":datetime.now(timezone.utc).isoformat(),"source":URL,"fixtures":future,"allGames":games,"nextGame":future[0] if future else None,"lastGame":completed[-1] if completed else None,"table":table}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"{len(future)} kommende Spiele, letztes Ergebnis: {data['lastGame']}, {len(table)} Tabellenzeilen")

if __name__=="__main__": main()
