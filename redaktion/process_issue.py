#!/usr/bin/env python3
"""Apply a GitHub Issue Form to the public news feed after collaborator verification."""
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

FEED = Path(__file__).resolve().parents[1] / 'data/editor-news.json'
EDITORS = Path(__file__).resolve().parent / 'editors.json'


def api(path, token):
    request = Request('https://api.github.com' + path, headers={
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'svk-news-editor',
    })
    with urlopen(request, timeout=20) as response:
        return json.load(response)


def fields(body):
    return {key.strip(): value.strip() for key, value in re.findall(
        r'^### (.+?)\s*\n(.*?)(?=^### |\Z)', body, flags=re.M | re.S)}


def apply(feed, issue):
    data = fields(issue['body'] or '')
    if issue['title'].startswith('[SVK-News entfernen]'):
        article_id = data.get('Meldungs-ID', '')
        if not re.fullmatch(r'\d+', article_id):
            raise ValueError('Ungültige Meldungs-ID')
        updated = [item for item in feed if item['id'] != article_id]
        if len(updated) == len(feed):
            raise ValueError('Meldung nicht gefunden')
        return updated
    if not issue['title'].startswith('[SVK-News]'):
        raise ValueError('Unbekannter Redaktionsauftrag')
    headline, summary, article = (data.get(key, '') for key in ('Überschrift', 'Kurztext', 'Artikel'))
    category = data.get('Bereich', '')
    if not all([headline, summary, article]) or any(len(v) > limit for v, limit in
          ((headline, 140), (summary, 400), (article, 12000))):
        raise ValueError('Text fehlt oder ist zu lang')
    if category not in ('Herren', 'Jugend', 'Verein', 'Frauen', 'Veranstaltungen'):
        raise ValueError('Ungültiger Bereich')
    image = data.get('Bild-URL (optional)', '')
    if image == '_No response_':
        image = ''
    if image:
        parsed = urlsplit(image)
        if parsed.scheme != 'https' or not parsed.hostname or parsed.username or len(image) > 1000:
            raise ValueError('Bild benötigt eine gültige HTTPS-Adresse')
    item = dict(id=str(issue['number']), date=datetime.now(timezone.utc).date().isoformat(),
                title=headline, summary=summary, body=article, category=category, image=image)
    if any(old['id'] == item['id'] for old in feed):
        raise ValueError('Meldung wurde bereits veröffentlicht')
    return [item] + feed


def main():
    token = os.environ['GH_TOKEN']
    repo = os.environ['GH_REPOSITORY']
    issue = api('/repos/' + repo + '/issues/' + os.environ['ISSUE_NUMBER'], token)
    user = issue['user']['login']
    editors = {name.lower() for name in json.loads(EDITORS.read_text())}
    if user.lower() not in editors:
        raise PermissionError('Dieser GitHub-Benutzer ist nicht für SVK-News freigeschaltet')
    feed = json.loads(FEED.read_text())
    updated = apply(feed, issue)
    FEED.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + '\n')
    print('Meldungen:', len(updated), 'Redaktion:', user)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, PermissionError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
