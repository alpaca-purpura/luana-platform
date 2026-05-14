# Comunify — DNS Records (Story 12 T-deploy-1)

All records route through Cloudflare Tunnel. No direct IP exposure.

## Cloudflare Tunnel setup

```bash
# 1. Authenticate
cloudflared tunnel login

# 2. Create tunnel
cloudflared tunnel create comunify-prod
# Saves credentials JSON to ~/.cloudflared/<uuid>.json

# 3. Copy credentials to deploy directory
cp ~/.cloudflared/<uuid>.json deploy/cloudflared/<uuid>.json

# 4. Update deploy/cloudflared/config.yml — set `tunnel:` field to <uuid>

# 5. Create CNAME records in Cloudflare dashboard (or via CLI below)
cloudflared tunnel route dns comunify-prod comunify.lat
cloudflared tunnel route dns comunify-prod api.comunify.lat
cloudflared tunnel route dns comunify-prod widget.comunify.lat
```

## DNS records table

| Hostname | Type | Value | TTL | Proxy |
|---|---|---|---|---|
| `comunify.lat` | CNAME | `<tunnel-uuid>.cfargotunnel.com` | Auto | Yes (orange cloud) |
| `api.comunify.lat` | CNAME | `<tunnel-uuid>.cfargotunnel.com` | Auto | Yes |
| `widget.comunify.lat` | CNAME | `<tunnel-uuid>.cfargotunnel.com` | Auto | Yes |

## Cloudflare Zero Trust settings

In Cloudflare Zero Trust dashboard (one.dash.cloudflare.com):

1. **Access Policy** — `api.comunify.lat` requires Service Token for internal calls.
   Public routes (`/health`, `/api/v1/chat/widget`) are exempt.
2. **WAF Rules** — Enable OWASP Core Ruleset, set to Block mode.
3. **Rate Limiting** — `/api/v1/chat` endpoint: 60 req/min per IP.

## Environment variables for production

```bash
# Set in K8s secret (comunify-secrets) — see deploy/k8s/deployment.yaml
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql+asyncpg://user:pass@postgres-host:5432/comunify_prod
REDIS_URL=redis://redis-host:6379/0
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
```

## Verification

After DNS propagation (typically < 5 minutes via Cloudflare):

```bash
# Health check
curl https://api.comunify.lat/health

# Widget embed check
curl https://widget.comunify.lat/widget/embed?tenant=anabella-coaching-ar

# Frontend check
curl -I https://comunify.lat
```
