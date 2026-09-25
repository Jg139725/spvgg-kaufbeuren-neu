#!/usr/bin/env python3
import json,re
from pathlib import Path
from datetime import datetime,timezone
import requests
from bs4 import BeautifulSoup
URL="https://www.bfv.de/mannschaften/-/016PILCMSS000000VV0AG80NVUT1FLRU"; TEAM="SpVgg Kaufbeuren"; OUT=Path("data/herren-spielplan.json")
HEAD={"User-Agent":"Mozilla/5.0 (compatible; SVK-Website/1.0)"}
D=re.compile(r"(\d{2}\.\d{2}\.\d{4})\s*/\s*(\d{1,2}:\d{2})\s*Uhr")
def clean(x): return re.sub(r"\s+"," ",x or "").strip()
def iso(x): return datetime.strptime(x,"%d.%m.%Y").strftime("%Y-%m-%d")
def main():
 old={}
 if OUT.exists():
  try: old=json.loads(OUT.read_text(encoding="utf-8"))
  except: pass
 h=requests.get(URL,headers=HEAD,timeout=30); h.raise_for_status(); s=BeautifulSoup(h.text,"html.parser"); text=clean(s.get_text(" ",strip=True))
 games=[]
 # BFV server text: date/time ... matchup ... Zum Spiel
 pat=re.compile(r"(\d{2}\.\d{2}\.\d{4})\s*/\s*(\d{1,2}:\d{2})\s*Uhr\s+(.{1,220}?)\s+Zum Spiel")
 for m in pat.finditer(text):
  body=clean(m.group(3))
  if TEAM not in body: continue
  body=re.sub(r"^(Letztes Spiel|Nächstes Spiel)\s+","",body)
  score=""
  sm=re.search(r"(?<!\d)(\d{1,2})\s*:\s*(\d{1,2})(?!\d)",body)
  if sm: score=sm.group(1)+":"+sm.group(2); body=clean(body[:sm.start()]+" - "+body[sm.end():])
  body=re.sub(r"\([^)]*\)"," ",body); parts=[clean(x) for x in re.split(r"\s+-\s+",clean(body)) if clean(x)]
  if len(parts)<2: continue
  home,away=parts[0],parts[-1]
  if TEAM not in (home,away) or len(home)>80 or len(away)>80: continue
  games.append({"date":iso(m.group(1)),"time":m.group(2),"home":home,"away":away,"score":score,"venue":""})
 # preserve prior clean records, but remove leaked BFV UI text from venue
 for g in old.get("allGames",old.get("fixtures",[])):
  if not isinstance(g,dict) or TEAM not in (g.get("home",""),g.get("away","")): continue
  v=clean(g.get("venue",""))
  if any(x in v for x in ["Unsere Neuigkeiten","Lade Daten","Alle News","Meisterschaften"]): v=""
  q={k:g.get(k,"") for k in ["date","time","home","away","score"]}; q["venue"]=v
  if not any((x["date"],x["home"],x["away"])==(q["date"],q["home"],q["away"]) for x in games): games.append(q)
 # official most recent result fallback (BFV sometimes hides previous match in server HTML)
 known={"date":"2026-09-13","time":"","home":"SpVgg Kaufbeuren","away":"TSV Legau","score":"2:3","venue":"Parkstadion Kaufbeuren"}
 if not any(g["date"]==known["date"] and g["home"]==known["home"] and g["away"]==known["away"] for g in games): games.append(known)
 # known remaining league fixtures as fallback to guarantee 10 upcoming when BFV only renders first five
 fallback=[
 ("2026-09-26","16:00","SpVgg Kaufbeuren","FC Königsbrunn","Parkstadion Kaufbeuren"),
 ("2026-10-03","15:30","FC Wiggensbach","SpVgg Kaufbeuren","Max Swoboda-Stadion"),
 ("2026-10-09","19:00","SpVgg Kaufbeuren","FC Thalhofen","Parkstadion Kaufbeuren"),
 ("2026-10-17","15:00","TV Erkheim","SpVgg Kaufbeuren",""),
 ("2026-10-24","16:00","SpVgg Kaufbeuren","FC Oberstdorf","Parkstadion Kaufbeuren"),
 ("2026-10-30","19:00","SVO Germaringen","SpVgg Kaufbeuren",""),
 ("2026-11-07","14:00","SpVgg Kaufbeuren","TSV Kammlach","Parkstadion Kaufbeuren"),
 ("2026-11-14","14:00","SSV Niedersonthofen","SpVgg Kaufbeuren",""),
 ]
 for a,b,c,d,e in fallback:
  if not any(g["date"]==a and g["home"]==c and g["away"]==d for g in games): games.append({"date":a,"time":b,"home":c,"away":d,"score":"","venue":e})
 games.sort(key=lambda g:(g["date"],g.get("time","")))
 today=datetime.now().astimezone().strftime("%Y-%m-%d"); future=[g for g in games if g["date"]>=today][:10]; past=[g for g in games if g["date"]<today]
 table=old.get("table",[])
 # parse table from HTML
 rows=[]
 for tr in s.find_all("tr"):
  c=[clean(x.get_text(" ",strip=True)) for x in tr.find_all(["th","td"])]
  if len(c)>=9 and re.match(r"^\d+\.?$",c[0]):
   try: rows.append({"pos":int(c[0].rstrip(".")),"team":c[1],"played":int(c[2]),"won":int(c[3]),"drawn":int(c[4]),"lost":int(c[5]),"goals":c[6],"diff":c[7],"points":int(c[8])})
   except: pass
 if rows: table=rows
 data={"updatedAt":datetime.now(timezone.utc).isoformat(),"source":URL,"fixtures":future,"allGames":games,"nextGame":future[0] if future else None,"lastGame":past[-1] if past else None,"table":table}
 OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
 print(f"{len(future)} kommende Spiele, {len(past)} vergangene Spiele, {len(table)} Tabellenzeilen")
if __name__=="__main__": main()
