from pathlib import Path
from html.parser import HTMLParser
import re
import json
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1] / 'site'

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.resources = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag in ('script', 'link'):
            target = attrs.get('src') or attrs.get('href')
            if target:
                self.resources.append(target)

page = Page()
page.feed((root / 'index.html').read_text())
assert len(page.ids) == len(set(page.ids)), 'Duplicate HTML IDs'
for target in page.resources:
    assert not target.startswith('/'), f'Absolute asset path breaks project Pages: {target}'
    assert (root / target).is_file(), f'Missing asset: {target}'

for path in root.rglob('*.js'):
    code = re.sub(r'/\*[\s\S]*?\*/', '', path.read_text())
    for target in re.findall(r"(?:from\s*|import\s*)['\"]([^'\"]+)['\"]", code):
        if target.startswith('.'):
            assert (path.parent / target).is_file(), f'Missing module: {path}: {target}'
        else:
            assert target == 'three', f'Unexpected external module: {target}'

for target in re.findall(r"assets/[a-z0-9-]+\.svg", (root / 'story.js').read_text()):
    assert (root / target).is_file(), f'Missing story image: {target}'
for path in (root / 'assets').glob('*.svg'):
    ET.parse(path)
assert len(json.loads((root / 'vendor/helvetiker_regular.typeface.json').read_text())['glyphs']) > 10
assert not (root / '.openai').exists(), 'Hosting-specific files must not be published'
print('PASS: HTML, project-relative assets, JS imports, SVGs and local font')
