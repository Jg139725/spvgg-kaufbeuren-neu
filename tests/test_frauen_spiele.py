import importlib.util
from datetime import datetime
import unittest
from unittest.mock import patch, Mock
from pathlib import Path
import tempfile
import json

spec = importlib.util.spec_from_file_location('updater', Path(__file__).parents[1] / 'scripts/update_frauen_spiele.py')
u = importlib.util.module_from_spec(spec)
spec.loader.exec_module(u)

TABLE = '<table><tr class="bfv-table-entry--data">' + ''.join('<td>'+s+'</td>' for s in ['2.','SpVgg Kaufbeuren','6','4','1','1','13:3','10','13']) + '</tr></table>'
def game(date='31.10.2026', label='', score=('-', '-'), venue='Parkstadion'):
    return f'''<div class="bfv-spieltag-eintrag"><div class="bfv-result-tile__title">{label}</div>
    <a href="/ergebnisse/spiel/-/game1"><div class="bfv-matchday-date-time">{date} /13:00 Uhr</div>
    <div class="bfv-matchdata-result__team-name--team0">SpVgg Kaufbeuren</div>
    <div class="bfv-matchdata-result__team-name--team1">TSV Sielenbach</div>
    <div class="bfv-matchdata-result__goals--team0">{score[0]}</div><div class="bfv-matchdata-result__goals--team1">{score[1]}</div></a>
    <div class="bfv-spieltag-eintrag__location">{venue}</div></div>'''

class UpdateTests(unittest.TestCase):
    now = datetime(2026, 10, 28, 12, tzinfo=u.BERLIN)
    def test_relocated_game_has_one_identity(self):
        _, data = u.parse_page(game('30.10.2026') + game() + TABLE, self.now)
        self.assertEqual(len(data['fixtures']), 1)
        self.assertEqual(data['nextGame']['date'], '2026-10-31')
        self.assertEqual(data['nextGame']['venue'], 'Parkstadion')
    def test_past_game_is_not_next_and_glyphs_are_not_a_score(self):
        _, data = u.parse_page(game('25.10.2026', 'Letztes Spiel', ('\ue69c','\ue683')) + TABLE, self.now)
        self.assertIsNone(data['nextGame'])
        self.assertIsNone(data['lastGame']['score'])
    def test_missing_table_fails_without_writing(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / 'data.json'
            out.write_text('{"preserved":true}')
            session = Mock()
            session.get.return_value.text = game()
            with patch.object(u, 'OUT', out), patch.object(u.requests, 'Session', return_value=session):
                with self.assertRaises(ValueError): u.main()
            self.assertEqual(out.read_text(), '{"preserved":true}')
    def test_unchanged_payload_does_not_change_timestamp(self):
        raw = game('31.10.2099') + TABLE
        _, data = u.parse_page(raw, self.now)
        data['updatedAt'] = '2026-10-28T00:00:00+00:00'
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / 'data.json'
            original = json.dumps(data)
            out.write_text(original)
            session = Mock()
            session.get.return_value.text = raw
            with patch.object(u, 'OUT', out), patch.object(u.requests, 'Session', return_value=session): u.main()
            self.assertEqual(out.read_text(), original)

if __name__ == '__main__': unittest.main()
