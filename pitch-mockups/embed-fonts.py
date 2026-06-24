#!/usr/bin/env python3
"""Descarga los woff2 (latin + latin-ext) de gfonts.css y los embebe en base64.
Salida: fonts-embed.css (@font-face autocontenidos). Desechable."""
import base64
import re
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
KEEP = {"latin", "latin-ext"}
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

raw = (HERE / "gfonts.css").read_text()

# cada @font-face viene precedido por /* subset */
blocks = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{.*?\})", raw, re.S)

out, kept, total = [], 0, 0
for subset, block in blocks:
    if subset not in KEEP:
        continue
    url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    data = urllib.request.urlopen(req, timeout=30).read()
    total += len(data)
    b64 = base64.b64encode(data).decode()
    block = re.sub(
        r"src:\s*url\([^)]+\)\s*format\('woff2'\);",
        f"src: url(data:font/woff2;base64,{b64}) format('woff2');",
        block,
    )
    out.append(f"/* {subset} */\n{block}")
    kept += 1

dest = HERE / "fonts-embed.css"
dest.write_text("\n".join(out) + "\n")
print(f"OK → {dest.name} · {kept} font-faces · {total/1024:.0f} KB woff2 → {dest.stat().st_size/1024:.0f} KB css")
