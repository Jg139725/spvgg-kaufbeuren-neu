"""Lädt FuPa-Spielerfotos auf die eigene Website herunter (DSGVO: keine direkte Verbindung zu FuPa beim Seitenaufruf).
Aufruf: python3 scripts/fupa_bilder_lokal.py  – ersetzt alle image.fupa.net-Links in HTML/JS/JSON durch lokale Kopien."""
import os, re, subprocess, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, "assets", "images", "fupa")
FAILED = []
PAT = re.compile(r"https://image\.fupa\.net/(?:player|team-image)/([A-Za-z0-9_-]+)/(\d+x\d+)\.(webp|jpe?g|png)")

def local_url(m):
    pid, size, ext = m.groups()
    name = f"{pid}-{size}.{ext}"
    path = os.path.join(DEST, name)
    if not os.path.exists(path):
        os.makedirs(DEST, exist_ok=True)
        req = urllib.request.Request(m.group(0), headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
        except Exception as e:
            FAILED.append(m.group(0)); return m.group(0)
        with open(path, "wb") as f:
            f.write(data)
    return "/assets/images/fupa/" + name

def localize_text(text):
    return PAT.sub(local_url, text)

if __name__ == "__main__":
    files = subprocess.run(["git", "ls-files", "*.html", "*.js", "*.json"], cwd=ROOT, capture_output=True, text=True).stdout.split()
    changed = 0
    for rel in files:
        p = os.path.join(ROOT, rel)
        t = open(p, encoding="utf-8").read()
        if "image.fupa.net" not in t:
            continue
        n = localize_text(t)
        if n != t:
            open(p, "w", encoding="utf-8").write(n); changed += 1
    for u in FAILED: print("nicht ladbar (bleibt extern):", u)
    print(f"{changed} Dateien angepasst, {len(os.listdir(DEST)) if os.path.isdir(DEST) else 0} Bilder lokal")
