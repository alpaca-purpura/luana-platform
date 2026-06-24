#!/usr/bin/env python3
"""Ensambla las 4 pantallas + pitch.css + imágenes en un único HTML portable.
Salida: comunify-pitch.html (autocontenido, offline, doble-clic). Desechable."""
import base64
import re
from pathlib import Path

HERE = Path(__file__).parent
SCREENS = ["index", "tomas", "nina", "sofia"]  # orden A · D · B · C
IMGS = {
    "brand/Logo.png": "brand/Logo.png",
    "agents/valeria.png": "agents/valeria.png",
    "agents/lisa.png": "agents/lisa.png",
    "agents/adrian.png": "agents/adrian.png",
    "agents/camila.png": "agents/camila.png",
    "agents/mateo.png": "agents/mateo.png",
}


def data_uri(rel: str) -> str:
    b = (HERE / rel).read_bytes()
    return f"data:image/png;base64,{base64.b64encode(b).decode()}"


URIS = {rel: data_uri(rel) for rel in IMGS}

# ── fuentes embebidas (100% offline) ──
fonts = (HERE / "fonts-embed.css").read_text()

# ── CSS: embebido + refs url(agents/*.png) → data URI ──
css = (HERE / "pitch.css").read_text()
for rel, uri in URIS.items():
    css = css.replace(f"url({rel})", f"url({uri})")

# ── extraer cada shell + el <script> de sofía ──
bodies, scripts = [], []
for key in SCREENS:
    html = (HERE / f"{key}.html").read_text()
    body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    # sacar el demo-flag por-pantalla (queda uno global)
    body = re.sub(r'<div class="demo-flag">.*?</div>', "", body, flags=re.S)
    # extraer <script> (sofía) para correrlo después del DOM
    for m in re.finditer(r"<script>(.*?)</script>", body, re.S):
        scripts.append(m.group(1))
    body = re.sub(r"<script>.*?</script>", "", body, flags=re.S)
    # logo <img src="brand/Logo.png"> → data URI
    body = body.replace('src="brand/Logo.png"', f'src="{URIS["brand/Logo.png"]}"')
    # nav inter-archivo → router JS
    body = re.sub(
        r'href="(index|tomas|nina|sofia)\.html"',
        lambda m: f'href="javascript:void(0)" onclick="go(\'{m.group(1)}\')"',
        body,
    )
    display = "" if key == "index" else ' style="display:none"'
    bodies.append(f'<div class="screen" id="s-{key}"{display}>{body}</div>')

router = """
function go(k){
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById('s-' + k).style.display = '';
  window.scrollTo(0, 0);
}
"""

out = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Comunify · Pitch — visión del producto</title>
<style>
{fonts}
{css}
</style>
</head>
<body>
{''.join(bodies)}
<div class="demo-flag">Mockup de visión · Comunify · organism shell real</div>
<script>{router}</script>
<script>{''.join(scripts)}</script>
</body>
</html>
"""

# barrido final: cualquier ref residual a imágenes (ej. background-image inline en el body) → data URI
for rel, uri in URIS.items():
    out = out.replace(f"url({rel})", f"url({uri})")
    out = out.replace(f'src="{rel}"', f'src="{uri}"')

dest = HERE / "comunify-pitch.html"
dest.write_text(out)
kb = dest.stat().st_size / 1024
print(f"OK → {dest.name} · {kb:.0f} KB · {len(bodies)} pantallas · {len(URIS)} imágenes inline")
