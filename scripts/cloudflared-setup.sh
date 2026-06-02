#!/usr/bin/env bash
set -uo pipefail
# cloudflared-setup.sh — Provisión ONE-TIME del Cloudflare Tunnel de dev de una
# marca. Deja la credencial gitignored que `make dev-{brand}-tunnel` monta.
#
# SSoT: .claude/rules/definition-of-done-live-verify.md § "Provisión del túnel"
#
# Usage:
#   scripts/cloudflared-setup.sh <vitalia|nicolify|comunify|lupulo>
#
# ⚠️ INTERACTIVO — requiere login Cloudflare de Chris (abre navegador). NO es
# automatizable headless. Corré esto vos (Chris) una sola vez por marca; después
# `make dev-app-{brand}` ya funciona contra el dominio público.
#
# Qué hace:
#   1. cloudflared tunnel login            (auth interactiva en el navegador)
#   2. Resuelve/crea el tunnel             (usa el id de dev-config.yml si ya existe)
#   3. cloudflared tunnel route dns        (CNAME hostname → tunnel)
#   4. Copia la credencial json → {brand}/deploy/cloudflared/.credentials/dev-tunnel.json (gitignored)
#   5. Si dev-config.yml tiene <TUNNEL_ID> placeholder → lo resuelve

WS="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
BRAND="${1:?Usage: cloudflared-setup.sh <vitalia|nicolify|comunify|lupulo>}"

CF_DIR="${WS}/${BRAND}/deploy/cloudflared"
CF_CONFIG="${CF_DIR}/dev-config.yml"
CF_CREDS_DIR="${CF_DIR}/.credentials"
CF_CREDS="${CF_CREDS_DIR}/dev-tunnel.json"

if [[ ! -f "${CF_CONFIG}" ]]; then
  echo "✗ No existe ${CF_CONFIG}." >&2
  echo "  Esta marca aún no tiene config de tunnel. Creala primero (mirá vitalia/deploy/cloudflared/dev-config.yml como referencia)." >&2
  exit 2
fi

if ! command -v cloudflared &>/dev/null; then
  echo "✗ binario 'cloudflared' no encontrado en el host." >&2
  echo "  Instalalo: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" >&2
  echo "  (Debian/Ubuntu: descargá el .deb de cloudflared y \`sudo dpkg -i\`.)" >&2
  exit 1
fi

HOSTNAME="$(grep -oE 'hostname:[[:space:]]*dev-app[^[:space:]]+' "${CF_CONFIG}" | head -1 | sed -E 's/hostname:[[:space:]]*//')"
TUNNEL_ID="$(grep -oE '^tunnel:[[:space:]]*[^[:space:]]+' "${CF_CONFIG}" | head -1 | sed -E 's/^tunnel:[[:space:]]*//')"

echo "── cloudflared-setup :: ${BRAND} ──────────────────────────────────────"
echo "  config:   ${CF_CONFIG}"
echo "  hostname: ${HOSTNAME:-<no encontrado>}"
echo "  tunnel:   ${TUNNEL_ID:-<no encontrado>}"
echo

if [[ -z "${HOSTNAME}" ]]; then
  echo "✗ No pude leer 'hostname:' del dev-config.yml." >&2
  exit 2
fi

# ── 1. Login (idempotente: si ya hay cert.pem, cloudflared no re-pide) ───────
echo "▸ Paso 1/5 — login Cloudflare (abre navegador; elegí la zona de ${BRAND}) …"
cloudflared tunnel login || { echo "✗ login falló." >&2; exit 1; }

# ── 2. Resolver o crear el tunnel ────────────────────────────────────────────
TUNNEL_NAME="luana-${BRAND}-dev"
echo
echo "▸ Paso 2/5 — resolver tunnel '${TUNNEL_NAME}' …"
EXISTING_ID="$(cloudflared tunnel list 2>/dev/null | awk -v n="${TUNNEL_NAME}" '$2==n {print $1}' | head -1)"

if [[ -n "${EXISTING_ID}" ]]; then
  echo "  ✓ Ya existe: ${EXISTING_ID}"
  TUNNEL_ID="${EXISTING_ID}"
elif [[ -n "${TUNNEL_ID}" && "${TUNNEL_ID}" != "<TUNNEL_ID>" ]] && cloudflared tunnel info "${TUNNEL_ID}" &>/dev/null; then
  echo "  ✓ El id de dev-config.yml existe en la cuenta: ${TUNNEL_ID}"
else
  echo "  ▸ Creando tunnel nuevo …"
  cloudflared tunnel create "${TUNNEL_NAME}" || { echo "✗ create falló." >&2; exit 1; }
  TUNNEL_ID="$(cloudflared tunnel list 2>/dev/null | awk -v n="${TUNNEL_NAME}" '$2==n {print $1}' | head -1)"
  echo "  ✓ Creado: ${TUNNEL_ID}"
fi

# ── 3. Route DNS (CNAME hostname → tunnel) ───────────────────────────────────
echo
echo "▸ Paso 3/5 — route DNS ${HOSTNAME} → ${TUNNEL_ID} …"
cloudflared tunnel route dns "${TUNNEL_ID}" "${HOSTNAME}" \
  || echo "  ⚠ route dns devolvió error (puede ser que el CNAME ya exista — ok)."

# ── 4. Copiar la credencial al dir gitignored ────────────────────────────────
echo
echo "▸ Paso 4/5 — instalar credencial gitignored …"
SRC_CRED="${HOME}/.cloudflared/${TUNNEL_ID}.json"
if [[ ! -f "${SRC_CRED}" ]]; then
  echo "✗ No encuentro la credencial generada en ${SRC_CRED}." >&2
  echo "  Revisá ~/.cloudflared/ — copiá el <tunnel-id>.json a:" >&2
  echo "    ${CF_CREDS}" >&2
  exit 1
fi
mkdir -p "${CF_CREDS_DIR}"
cp "${SRC_CRED}" "${CF_CREDS}"
echo "  ✓ ${CF_CREDS}"

# ── 5. Resolver placeholder <TUNNEL_ID> en dev-config.yml si aplica ──────────
echo
echo "▸ Paso 5/5 — sincronizar tunnel id en dev-config.yml …"
if grep -q '<TUNNEL_ID>' "${CF_CONFIG}"; then
  sed -i "s/<TUNNEL_ID>/${TUNNEL_ID}/g" "${CF_CONFIG}"
  echo "  ✓ Placeholder reemplazado por ${TUNNEL_ID} (revisá el diff + commiteá)."
else
  echo "  ✓ dev-config.yml ya tiene un id concreto (${TUNNEL_ID}) — sin cambios."
fi

echo
echo "═══════════════════════════════════════════════════════════════════════"
echo "  Tunnel de ${BRAND} provisto. Próximo paso:"
echo "    make dev-app-${BRAND}        # levanta stack + tunnel + verifica"
echo "  La credencial (${CF_CREDS}) está gitignored — NO la commitees."
echo "═══════════════════════════════════════════════════════════════════════"
