#!/usr/bin/env bash
# Luana Cockpit daemon · {start|stop|status|restart} con TRUE detach.
#
# POR QUÉ EXISTE (HB-55): `scripts/cockpit-up.sh` corre `exec pnpm dev` en FOREGROUND.
# Muere al cerrar la terminal/task. Cuando Claude lo lanza via Bash backgrounded, el
# harness lo REAPEA al cerrar la task. Resultado: "el cockpit se cae a cada rato".
# Este daemon despega el proceso de la sesión (setsid + nohup + pidfile) → sobrevive
# el cierre de terminal Y el reaping de Claude. Idempotente.
#
# Footgun cazado: el port-check de cockpit-up.sh usa `lsof -i :PORT` que matchea sockets
# ESTABLISHED (ej. una pestaña Chrome abierta retiene bind aparente). Acá usamos
# `lsof -ti :PORT -sTCP:LISTEN` → SOLO el listener real.
#
# Health real ≠ proceso vivo: `/api/watch` es un stream SSE (colgaría curl). Probamos
# un endpoint JSON liviano con timeout → cualquier HTTP code = server responde = sano.
#
# Paths (gitignored): tools/luana-cockpit/.cockpit-{PORT}.{pid,log}
# Override puerto: PORT=4099 bash scripts/cockpit-daemon.sh start
# Doc: tools/luana-cockpit/README.md · CLAUDE.md § Tools operativas.

set -euo pipefail

# ── Resolución de entorno (worktree → brand → puerto) ───────────────────────────
WS="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [[ -z "$WS" ]]; then
  echo "❌ No estás dentro de un repo git." >&2
  exit 1
fi

COCKPIT="$WS/tools/luana-cockpit"
if [[ ! -d "$COCKPIT" ]]; then
  echo "❌ No existe $COCKPIT" >&2
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

PORT="${PORT:-$DEFAULT_PORT}"
PIDFILE="$COCKPIT/.cockpit-${PORT}.pid"
LOGFILE="$COCKPIT/.cockpit-${PORT}.log"
HEALTH_PATH="/api/sessions"   # JSON liviano · no SSE · responde rápido

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

require_toolchain() {
  command -v node >/dev/null 2>&1 || { echo "❌ Falta Node 20 (nvm install 20)." >&2; exit 1; }
  local maj; maj="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
  [[ "$maj" -ge 20 ]] || { echo "❌ Necesitás Node 20+. Tenés $(node -v)." >&2; exit 1; }
  command -v pnpm >/dev/null 2>&1 || { echo "❌ Falta pnpm (corepack enable)." >&2; exit 1; }
}

# ── Acciones ────────────────────────────────────────────────────────────────────

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

  require_toolchain
  cd "$COCKPIT"
  if [[ ! -d node_modules ]]; then
    echo "📦 Primera vez en este worktree · instalando deps (~2 min)..."
    pnpm install --ignore-workspace
  fi

  echo "🚀 Arrancando Luana Cockpit (daemon) · $WORKTREE_NAME · brand=$BRAND · :$PORT"
  # TRUE detach: setsid = nueva sesión (PID == PGID) → kill del grupo entero después.
  # </dev/null + nohup + redirect = sin tty, sobrevive cierre de terminal y reaping.
  # NODE_OPTIONS heap bump: el dev server de Next moría con V8 heap OOM en recompiles
  # HMR pesados (workspace grande + chokidar) = "se cae a cada rato". 4GB lo evita.
  WORKSPACE_ROOT="$WS" DEFAULT_BRAND="$BRAND" \
  NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}" \
    setsid nohup pnpm dev --port "$PORT" >"$LOGFILE" 2>&1 </dev/null &
  local pid=$!
  echo "$pid" >"$PIDFILE"
  disown "$pid" 2>/dev/null || true

  # Esperar a que el listener aparezca (dev server compila al arrancar).
  local i
  for i in $(seq 1 60); do
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
    sleep 1
  done
  echo "⚠️  Timeout (60s) esperando el listener en :$PORT. Revisá $LOGFILE" >&2
  exit 1
}

do_stop() {
  local stopped=0
  if [[ -f "$PIDFILE" ]]; then
    local pid; pid="$(cat "$PIDFILE" 2>/dev/null || echo "")"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      # Matar el process-group entero (pnpm + node child). setsid → PGID == PID.
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

  echo "[cockpit-status] worktree=$WORKTREE_NAME brand=$BRAND port=$PORT"
  echo "  process(pidfile): $proc_up (pid $pid)"
  echo "  listener(LISTEN): $listen_up"
  echo "  http(health):     $http_up"
  if [[ "$listen_up" == yes && "$http_up" == yes ]]; then
    echo "  → ✅ UP · http://localhost:$PORT"
    return 0
  elif [[ "$listen_up" == yes ]]; then
    echo "  → 🟠 listener vivo pero health no responde (¿compilando?). log: $LOGFILE"
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
