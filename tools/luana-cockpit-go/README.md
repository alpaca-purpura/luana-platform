# Luana Cockpit · POC Go

POC liviano del cockpit. Réplica del **board de 10 estados** leyendo el mismo
`filesystem-as-DB` (los `checkpoint.md` + capability YAMLs de cada marca) que el
cockpit Next, pero con **stdlib pura de Go** — cero deps externas, single binary.

**Objetivo:** validar que el board se sirve con ~15MB RAM en vez de los 0.4–1.1GB
del cockpit Next+Turbopack, sin perder lo esencial (board + selector de marca +
live-reload SSE). Para correr 3 marcas en paralelo eso es la diferencia entre
~45MB y ~3.3GB.

## Benchmark (medido 2026-06-11, mismo box, mismo workspace)

| | Go POC | Cockpit Next (next-server) |
|---|---|---|
| RSS idle | **14.6 MB** | 403 MB |
| RSS bajo carga (compile) | 14.6 MB (no compila) | ~1.1 GB |
| CPU idle | 0.2% | 3% (picos 800%+ en compile-loop) |
| Render `/board` | **4 ms** | 88–1192 ms |
| Binario / footprint | 11 MB static | node_modules + .next (cientos de MB) |
| Startup | instantáneo | 240ms–varios s (cold compile) |
| **× 3 marcas paralelo** | **~45 MB** | **~1.2 GB idle / 3.3 GB en uso** |

→ **27× más liviano idle · ~75× bajo carga.**

## Correr

```bash
~/sdk/go1.23/bin/go build -o cockpit-go .          # build (o `go run .`)
WORKSPACE_ROOT=$(git rev-parse --show-toplevel) DEFAULT_BRAND=vitalia PORT=4102 ./cockpit-go
# → http://localhost:4102/board
```

Env vars: `WORKSPACE_ROOT` (default `git rev-parse`), `DEFAULT_BRAND` (default `vitalia`), `PORT` (default `4102`).

## Qué SÍ tiene (paridad probada)

- Board de los 10 estados macro, color-coded, cards con `release` + `type` + `next_action`.
- Selector de marca (descubre dinámicamente las 11: 10 brands + `platform`).
- Conteo de stories + capabilities por marca.
- **Live-reload SSE** (`/events`) — push `reload` cuando cambia la firma mtime
  del dir de stories (poll 1.5s · cero deps vs chokidar).
- `/health`.

## Qué NO tiene todavía (gaps vs cockpit Next — si se promueve a build real)

Tabs `/map` `/roadmap` `/arquitectura` `/drift` `/learnings` `/harness` · vistas
de detalle de story/cap · edición (transitions, chris-input, refs upload) ·
sessions/locks overlay (🔨 lane) · bidirectional code↔cap · CIL 4 carriles.

El POC cubre **solo el board read-only** — la superficie más usada y la que prueba
el claim de RAM. La paridad completa es una story aparte si Chris ratifica el rewrite.

## Decisiones de diseño

- **Stdlib only** (no fsnotify, no yaml.v3): frontmatter parser propio + mtime-poll.
  Mantiene el binario offline-buildable y el footprint mínimo. Si la paridad real
  pide parse YAML robusto, se agrega `yaml.v3` (sigue siendo <20MB RAM).
- **html/template** auto-escapa (XSS-safe) · CSS inline · cero assets.
- Mismo SSoT filesystem → corre en paralelo al Next sin tocar datos.
