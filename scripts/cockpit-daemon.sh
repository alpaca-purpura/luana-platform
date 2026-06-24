#!/usr/bin/env bash
# Luana Cockpit daemon · {start|stop|status|restart} con TRUE detach.
#
# COCKPIT = binario ALPACA desde 2026-06-11 (pivote ratificado por Chris):
# ~/Proyectos/alpaca-harness/products/cockpit-go/cockpit — Go + UI Next.js embebida
# (go:embed), proceso v5 (tab Proceso · gate G signoff · DoD · gates G1-G9).
# Los cockpits anteriores (Go-templates y Next) fueron ELIMINADOS del repo.
#
# POR QUÉ EXISTE (HB-55): el launcher foreground muere al cerrar la terminal/task. Cuando
# Claude lo lanza via Bash backgrounded, el harness lo REAPEA al cerrar la task. Resultado:
# "el cockpit se cae a cada rato". Este daemon despega el proceso de la sesión (setsid +
# nohup + pidfile) → sobrevive el cierre de terminal Y el reaping de Claude. Idempotente.
#
# Footgun cazado: el port-check via `lsof -i :PORT` matchea sockets ESTABLISHED (ej. una
# pestaña Chrome retiene bind aparente). Acá usamos `ss -ltn` → SOLO el listener real.
#
# Health real: /api/brands (JSON liviano · no SSE). Cualquier HTTP code = sano.
#
# Paths (gitignored): $WS/.cockpit/cockpit-{PORT}.{pid,log}
# Override puerto: PORT=4099 bash scripts/cockpit-daemon.sh start
# Override binario: ALPACA_COCKPIT_BIN=/otro/path
# Doc: CLAUDE.md § Tools operativas.

set -euo pipefail

# ── Resolución de entorno (worktree → brand → puerto) ───────────────────────────
WS="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [[ -z "$WS" ]]; then
  echo "❌ No estás dentro de un repo git." >&2
  exit 1
fi

ALPACA_BIN="${ALPACA_COCKPIT_BIN:-$HOME/Proyectos/alpaca-harness/products/cockpit-go/cockpit}"
if [[ ! -x "$ALPACA_BIN" ]]; then
  echo "❌ No existe el binario del cockpit: $ALPACA_BIN" >&2
  echo "   Build: cd ~/Proyectos/alpaca-harness/products/cockpit-go && ./build-ui.sh && go build -o cockpit ." >&2
  exit 1
fi

WORKTREE_NAME="$(basename "$WS")"
case "$WORKTREE_NAME" in
  luana-platform)            BRAND="cross-brand"; DEFAULT_PORT=4000 ;;
  luana-vitalia|luana-vitalia-*)   BRAND="vitalia";  DEFAULT_PORT=4002 ;;
  luana-nicolify|luana-nicolify-*) BRAND="nicolify"; DEFAULT_PORT=4001 ;;
  luana-comunify|luana-comunify-*) BRAND="comunify"; DEFAULT_PORT=4003 ;;
  luana-lupulo|luana-lupulo-*)     BRAND="lupulo";   DEFAULT_PORT=4004 ;;
  luana-protocol-*|luana-core-*)   BRAND="cross-brand"; DEFAULT_PORT=4000 ;;
  *)                         BRAND="cross-brand"; DEFAULT_PORT=4000 ;;
esac

# Multi-workspace mode: UN cockpit ve TODOS los worktrees del registry ~/.cockpit/cockpit.yaml
# (el dropdown de marca se vuelve selector global {proyecto}/{brand}, cada uno leyendo SU worktree
# vivo). Se activa con `COCKPIT_MULTI=1` (target `make cockpit-multi`). Puerto fijo 4000.
# Doctrina del límite: el binario es alpaca · .claude/rules/cockpit-alpaca-boundary.md
MULTI="${COCKPIT_MULTI:-0}"
if [[ "$MULTI" == "1" ]]; then
  BRAND="multi"
  DEFAULT_PORT=4000
fi

PORT="${PORT:-$DEFAULT_PORT}"
RUNDIR="$WS/.cockpit"
mkdir -p "$RUNDIR"
PIDFILE="$RUNDIR/cockpit-${PORT}.pid"
LOGFILE="$RUNDIR/cockpit-${PORT}.log"
HEALTH_PATH="/api/brands"   # JSON liviano · no SSE · responde rápido

# ── Helpers ─────────────────────────────────────────────────────────────────────

# ¿Hay un LISTENER real en el puerto? (SOLO LISTEN, no ESTABLISHED).
# `ss` es confiable acá; `lsof` quedó ciego en este entorno (devuelve vacío aunque
# el socket exista) → ss primario, lsof fallback de portabilidad.
listener_present() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :$PORT" 2>/dev/null | grep -q LISTEN && return 0
  fi
  lsof -ti ":$PORT" -sTCP:LISTEN >/dev/null 2>&1
}

# PID del listener (best-effort · puede venir vacío si ss no tiene permiso -p).
listener_pid() {
  local pid=""
  if command -v ss >/dev/null 2>&1; then
    pid="$(ss -ltnp "sport = :$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1)"
  fi
  [[ -z "$pid" ]] && pid="$(lsof -ti ":$PORT" -sTCP:LISTEN 2>/dev/null | head -1 || true)"
  echo "$pid"
}

# Proceso vivo según pidfile (process-group leader gracias a setsid).
pidfile_alive() {
  [[ -f "$PIDFILE" ]] || return 1
  local pid; pid="$(cat "$PIDFILE" 2>/dev/null || echo "")"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

# Health HTTP real: cualquier código (200/404/500) = server responde = sano.
http_healthy() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 \
            "http://localhost:${PORT}${HEALTH_PATH}" 2>/dev/null || echo "000")"
  [[ "$code" != "000" ]]
}

# ── Acciones ────────────────────────────────────────────────────────────────────

# Version pin: avisa (NO bloquea) si el repo alpaca local difiere de la release que probó luana.
# ponytail: alpaca no expone -version → uso el git tag del repo alpaca como proxy. Si el binario no
# vive en un repo git (cliente con binario distribuido) → skip silencioso. Pin en project.config.yaml.
# Boundary doctrine: .claude/rules/cockpit-alpaca-boundary.md
check_cockpit_version() {
  local pin repo have oldest
  pin="$(grep -oP 'cockpit_min_version:\s*"?\K[0-9]+\.[0-9]+\.[0-9]+' "$WS/project.config.yaml" 2>/dev/null | head -1)"
  [[ -z "$pin" ]] && return 0
  repo="$(cd "$(dirname "$ALPACA_BIN")" 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null || true)"
  [[ -z "$repo" ]] && return 0
  have="$(git -C "$repo" describe --tags --abbrev=0 2>/dev/null | sed 's/^v//')"
  [[ -z "$have" ]] && return 0
  [[ "$have" == "$pin" ]] && return 0
  oldest="$(printf '%s\n%s\n' "$have" "$pin" | sort -V | head -1)"
  if [[ "$oldest" == "$have" ]]; then
    echo "⚠️  alpaca v$have < pin v$pin (luana probó contra v$pin). Rebuild alpaca o ajustá el pin tras testear." >&2
  else
    echo "ℹ️  alpaca v$have > pin v$pin. Si validaste, subí cockpit_min_version en project.config.yaml." >&2
  fi
  echo "    (boundary: .claude/rules/cockpit-alpaca-boundary.md)" >&2
}

do_start() {
  # Idempotente: si ya corre sano, no-op.
  if pidfile_alive && listener_present; then
    echo "✅ Cockpit ya corre (PID $(cat "$PIDFILE")) en :$PORT · no-op."
    echo "   URL: http://localhost:$PORT"
    return 0
  fi

  # Puerto ocupado por OTRO proceso (sin pidfile nuestro vivo) → no pisar.
  if listener_present && ! pidfile_alive; then
    local other; other="$(listener_pid)"
    echo "⚠️  Puerto $PORT ya tiene un LISTENER (PID ${other:-?}) sin pidfile nuestro." >&2
    echo "    ps -p ${other:-?} -o cmd=  ·  kill ${other:-?}  ·  o PORT=4099 ..." >&2
    exit 1
  fi

  check_cockpit_version
  echo "🚀 Arrancando Luana Cockpit (alpaca · daemon) · $WORKTREE_NAME · brand=$BRAND · :$PORT"
  # TRUE detach: setsid = nueva sesión (PID == PGID) → kill del grupo entero después.
  # </dev/null + nohup + redirect = sin tty, sobrevive cierre de terminal y reaping.
  if [[ "$MULTI" == "1" ]]; then
    # Multi: SIN -workspace y SIN WORKSPACE_ROOT → serve() entra en multi-mode (lee el registry).
    # `env -u` garantiza que no se herede un WORKSPACE_ROOT del entorno (forzaría single-mode).
    env -u WORKSPACE_ROOT setsid nohup "$ALPACA_BIN" -port "$PORT" >"$LOGFILE" 2>&1 </dev/null &
  else
    WORKSPACE_ROOT="$WS" DEFAULT_BRAND="$BRAND" \
      setsid nohup "$ALPACA_BIN" -workspace "$WS" -port "$PORT" >"$LOGFILE" 2>&1 </dev/null &
  fi
  local pid=$!
  echo "$pid" >"$PIDFILE"
  disown "$pid" 2>/dev/null || true

  # Go arranca instantáneo (sin compile-on-start) · esperar el listener.
  local i
  for i in $(seq 1 20); do
    if listener_present; then
      echo "✅ Cockpit UP · PID $pid · http://localhost:$PORT"
      echo "   log: $LOGFILE"
      return 0
    fi
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "❌ El proceso murió al arrancar. Últimas líneas del log:" >&2
      tail -20 "$LOGFILE" >&2 || true
      rm -f "$PIDFILE"
      exit 1
    fi
    sleep 0.5
  done
  echo "⚠️  Timeout esperando el listener en :$PORT. Revisá $LOGFILE" >&2
  exit 1
}

do_stop() {
  local stopped=0
  if [[ -f "$PIDFILE" ]]; then
    local pid; pid="$(cat "$PIDFILE" 2>/dev/null || echo "")"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      # Matar el process-group entero. setsid → PGID == PID.
      kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
      local i
      for i in $(seq 1 10); do
        kill -0 "$pid" 2>/dev/null || { stopped=1; break; }
        sleep 0.5
      done
      kill -0 "$pid" 2>/dev/null && kill -KILL "-$pid" 2>/dev/null || true
      stopped=1
    fi
    rm -f "$PIDFILE"
  fi
  # Cinturón: matar cualquier listener huérfano en el puerto.
  if listener_present; then
    local lp; lp="$(listener_pid)"
    [[ -n "$lp" ]] && kill -TERM "$lp" 2>/dev/null || true
    stopped=1
  fi
  [[ "$stopped" == 1 ]] && echo "🛑 Cockpit detenido (:$PORT)." || echo "ℹ️  Cockpit no estaba corriendo (:$PORT)."
}

do_status() {
  local proc_up=no listen_up=no http_up=no pid="—"
  if pidfile_alive; then proc_up=yes; pid="$(cat "$PIDFILE")"; fi
  listener_present && listen_up=yes
  if [[ "$listen_up" == yes ]] && http_healthy; then http_up=yes; fi

  echo "[cockpit-status] worktree=$WORKTREE_NAME brand=$BRAND port=$PORT (alpaca)"
  echo "  process(pidfile): $proc_up (pid $pid)"
  echo "  listener(LISTEN): $listen_up"
  echo "  http(health):     $http_up"
  if [[ "$listen_up" == yes && "$http_up" == yes ]]; then
    echo "  → ✅ UP · http://localhost:$PORT"
    return 0
  elif [[ "$listen_up" == yes ]]; then
    echo "  → 🟠 listener vivo pero health no responde. log: $LOGFILE"
    return 0
  else
    echo "  → ⚪ DOWN. Levantá: make cockpit-up"
    return 1
  fi
}

# ── Dispatch ────────────────────────────────────────────────────────────────────
case "${1:-status}" in
  start)   do_start ;;
  stop)    do_stop ;;
  restart) do_stop; do_start ;;
  status)  do_status ;;
  *)
    echo "uso: $0 {start|stop|status|restart}" >&2
    exit 2
    ;;
esac
