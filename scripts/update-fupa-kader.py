#!/usr/bin/env python3
"""Refresh the first team's roster from FuPa's public team page.

Only the marked roster section is replaced. A failed or incomplete upstream
response leaves the published page untouched.
"""
import html
import re
import sys
import unicodedata
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "herren/erste.html"
SOURCE = "https://www.fupa.net/team/spvgg-kaufbeuren-m1-2026-27"
START = "<!-- FUPA-KADER-START -->"
END = "<!-- FUPA-KADER-END -->"
POSITIONS = ("Torwart", "Abwehr", "Mittelfeld", "Angriff")


def slug(name):
    name = name.lower().replace("ü", "u").replace("ö", "o").replace("ä", "a").replace("ß", "ss")
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", name).strip("-")


def roster(markup):
    sections = {}
    for position in POSITIONS:
        match = re.search(r"<h3[^>]*>" + position + r"</h3>(.*?)(?=<h3|</main>)", markup, re.S)
        if not match:
            raise ValueError("FuPa-Bereich fehlt: " + position)
        entries = []
        for path, card in re.findall(r'<a\b[^>]*href="(/player/[^" ]+)"[^>]*>(.*?)</a>', match.group(1), re.S):
            names = re.findall(r'class="sc-26zsra-8 [^"]+">([^<]+)', card)
            if len(names) < 2:
                continue
            name = html.unescape(" ".join(names[:2]))
            source = re.search(r'<source srcSet="(https://image\.fupa\.net/player/[^" ,]+)', card)
            image = html.unescape(source.group(1)) if source else None
            number = re.search(r'class="sc-26zsra-4 [^"]+">(\d+)</div>', card)
            entries.append((name, path, image, number.group(1) if number else None))
        sections[position] = entries
    if sum(map(len, sections.values())) < 20 or not sections["Torwart"]:
        raise ValueError("FuPa-Kader ist unvollständig; bestehende Seite bleibt erhalten")
    return sections


def render(sections):
    result = ['<section class="fupa-section" id="kader"><div class="fupa-wrap">',
              '<div class="fupa-section-head"><div><span>Bezirksliga Schwaben Süd 2026/27</span><h2>Die erste Mannschaft</h2></div>',
              '<p>Kader und Spielerfotos: <a href="' + SOURCE + '" rel="noopener noreferrer">FuPa</a>. Stand: Saison 2026/27.</p></div>']
    for position, entries in sections.items():
        result.append('<section class="position-group"><div class="position-group-title"><span>Kaderbereich</span><h2>' + position + '</h2></div><div class="fupa-player-grid">')
        for name, path, image, number in entries:
            local = ROOT / 'herren/spieler' / (slug(name) + '.html')
            href = 'spieler/' + local.name if local.exists() else 'https://www.fupa.net' + path
            extra = ' rel="noopener noreferrer"' if href.startswith('https:') else ''
            media = ('<img src="' + html.escape(image, quote=True) + '" alt="' + html.escape(name, quote=True) + '" loading="lazy" referrerpolicy="no-referrer">') if image else '<div class="fupa-player-placeholder">' + ''.join(part[0] for part in name.split()[:2]) + '</div>'
            if number:
                media += '<span class="fupa-bg-number">' + number + '</span><span class="fupa-shirt-number">#' + number + '</span>'
            result.append('<a class="fupa-player-card" href="' + html.escape(href, quote=True) + '"' + extra + '><div class="fupa-player-media">' + media + '</div><div class="fupa-player-info"><span class="fupa-position">' + position + '</span><h3>' + html.escape(name) + '</h3></div></a>')
        result.append('</div></section>')
    result.append('</div></section>')
    return '\n'.join(result)


def main():
    with urlopen(Request(SOURCE, headers={'User-Agent': 'Mozilla/5.0 (compatible; SVK-Kader-Update/1.0)'}), timeout=35) as response:
        sections = roster(response.read().decode('utf-8'))
    page = PAGE.read_text()
    if page.count(START) != 1 or page.count(END) != 1:
        raise ValueError('Kader-Markierungen fehlen oder sind doppelt')
    updated = re.sub(re.escape(START) + r'.*?' + re.escape(END), START + '\n' + render(sections) + '\n' + END, page, count=1, flags=re.S)
    if updated != page:
        PAGE.write_text(updated)
    print('FuPa-Kader:', sum(map(len, sections.values())), 'Spieler;', 'aktualisiert' if updated != page else 'unverändert')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(error, file=sys.stderr)
        sys.exit(1)
