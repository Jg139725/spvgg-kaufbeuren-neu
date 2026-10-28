#!/usr/bin/env python3
"""Refresh women's fixtures and standings from BFV; fail without overwriting on invalid data."""
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from urllib.parse import urljoin
import json
import re
import requests
from bs4 import BeautifulSoup

URL = 'https://www.bfv.de/mannschaften/-/016PA7VSOC000000VV0AG80NVV8OQVTB'
OUT = Path('data/frauen-spiele.json')
TEAM = 'SpVgg Kaufbeuren'
BERLIN = ZoneInfo('Europe/Berlin')
HEADERS = {'User-Agent': 'Mozilla/5.0 (SVK Website Updater)'}


def clean(node):
    return re.sub(r'\s+', ' ', node.get_text(' ', strip=True)).strip() if node else ''


def parse_game(node):
    dt = re.search(r'(\d{2}\.\d{2}\.\d{4})\s*/\s*(\d{1,2}:\d{2})', clean(node.select_one('.bfv-matchday-date-time')))
    teams = [clean(node.select_one('.bfv-matchdata-result__team-name--team' + str(i))) for i in range(2)]
    if not dt or TEAM not in teams or not all(teams):
        return None
    link = node.select_one('a[href*="/ergebnisse/spiel/"]')
    goals = [clean(node.select_one('.bfv-matchdata-result__goals--team' + str(i))) for i in range(2)]
    # BFV obfuscates some scores using fonts. Never interpret those glyphs as digits.
    score = ':'.join(goals) if all(re.fullmatch(r'\d{1,2}', g) for g in goals) else None
    status = ' '.join(filter(None, [clean(node.select_one('.bfv-matchdata-result__header')), clean(node.select_one('.bfv-matchdata-result__score-wrapper'))]))
    cancelled = bool(re.search(r'abgesagt|ausgefallen|verlegt|abgesetzt|abgebrochen', status, re.I))
    return {'id': link['href'].rsplit('/', 1)[-1] if link else '',
            'date': datetime.strptime(dt[1], '%d.%m.%Y').date().isoformat(),
            'time': dt[2].zfill(5), 'home': teams[0], 'away': teams[1], 'score': score,
            'venue': clean(node.select_one('.bfv-spieltag-eintrag__location')),
            'status': status if cancelled else '', 'cancelled': cancelled,
            'url': urljoin(URL, link['href']) if link else URL}


def kickoff(game):
    return datetime.fromisoformat(game['date'] + 'T' + game['time']).replace(tzinfo=BERLIN)


def parse_page(raw, now):
    soup = BeautifulSoup(raw, 'html.parser')
    games = {}
    last_game = None
    for node in soup.select('.bfv-result-tile, .bfv-spieltag-eintrag'):
        game = parse_game(node)
        if not game:
            continue
        identity = game['id'] or (game['date'], game['home'], game['away'])
        games[identity] = game  # Schedule entry also supplies the venue.
        if clean(node.select_one('.bfv-result-tile__title')) == 'Letztes Spiel':
            last_game = game
    table = []
    for tr in soup.select('tr.bfv-table-entry--data'):
        cells = [clean(td) for td in tr.select('td')]
        if len(cells) != 9:
            raise ValueError('Unexpected BFV standings columns')
        table.append(dict(zip(('pos','team','played','won','drawn','lost','goals','diff','points'),
            (int(cells[0].rstrip('.')), cells[1], *map(int, cells[2:6]), cells[6], cells[7], int(cells[8])))))
    if not games or not table or not any(r['team'] == TEAM for r in table):
        raise ValueError('Missing BFV games or women’s standings; keeping previous file')
    fixtures = sorted((g for g in games.values() if kickoff(g) > now and not g['score'] and not g['cancelled']), key=kickoff)
    if last_game and (kickoff(last_game) > now or last_game['cancelled']):
        last_game = None
    return soup, {'team': TEAM + ' Frauen', 'competition': 'Frauen BOL', 'source': 'BFV',
                  'sourceUrl': URL, 'fixtures': fixtures, 'nextGame': fixtures[0] if fixtures else None,
                  'lastGame': last_game, 'table': table}


def add_report_score(session, soup, game):
    if not game or game['score']:
        return
    # Match the exact pairing and a nearby publication date, but retain the real kickoff date.
    for a in soup.select('a[href*="/spiele/spielbericht/"]')[:6]:
        try:
            response = session.get(urljoin(URL, a['href']), headers=HEADERS, timeout=25)
            response.raise_for_status()
            report = BeautifulSoup(response.text, 'html.parser')
            text = clean(report)
            pub = re.search(r'Veröffentlichungsdatum\s+(\d{2}\.\d{2}\.\d{4})', text)
            if not pub:
                continue
            delta = (datetime.strptime(pub[1], '%d.%m.%Y').date() - kickoff(game).date()).days
            if not 0 <= delta <= 7:
                continue
            match = re.search(re.escape(game['home']) + r'\s*[–—-]\s*' + re.escape(game['away']) + r'\s*,\s*(\d{1,2})\s*:\s*(\d{1,2})', text)
            if match:
                game['score'] = match[1] + ':' + match[2]
                return
        except requests.RequestException as exc:
            print('Report unavailable:', exc)
    # A current fixture with an unknown result is preferable to an old result labelled current.


def main():
    session = requests.Session()
    response = session.get(URL, headers=HEADERS, timeout=30)
    response.raise_for_status()
    soup, data = parse_page(response.text, datetime.now(BERLIN))
    add_report_score(session, soup, data['lastGame'])
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    previous = old.get('lastGame') or {}
    latest = data['lastGame']
    if latest and not latest['score'] and latest['id'] and latest['id'] == previous.get('id'):
        latest['score'] = previous.get('score')
    # Stand means content changed, not merely that an HTTP request succeeded.
    if {k:v for k,v in old.items() if k != 'updatedAt'} == data:
        print('No changes to women’s fixtures or standings')
        return
    data['updatedAt'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUT.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(OUT)
    print(f"Updated {len(data['fixtures'])} fixtures and {len(data['table'])} standings rows")


if __name__ == '__main__':
    main()
