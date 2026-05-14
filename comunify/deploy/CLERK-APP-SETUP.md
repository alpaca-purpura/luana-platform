# Comunify — Clerk Application Setup (Story 12 T-deploy-1)

Clerk handles authentication for the Comunify multi-tenant app.
Each creator tenant (Anabella, Trini, Pablo) has their own Clerk organization.

## 1. Create Clerk application

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Click **Create application**
3. Name: `Comunify Production`
4. Auth methods: Enable **Email + Password** + **Google OAuth**
5. Click **Create application**

## 2. Configure allowed domains

In Clerk Dashboard → **Domains**:

```
comunify.lat
app.comunify.lat
widget.comunify.lat
api.comunify.lat
```

## 3. Configure Organizations (multi-tenant)

In Clerk Dashboard → **Organizations** → Enable Organizations:

1. **Enable organizations**: ON
2. **Maximum memberships**: 500 per org (creator economy communities)
3. **Creator admin role**: "admin" → can invite members, moderate content
4. **Member role**: "member" → can post, access community content

Create seed organizations (run `backend/scripts/seed_fixture_creators.py` for dev/staging):

| Organization | Slug | Creator | Locale |
|---|---|---|---|
| Anabella Coaching | `anabella-coaching-ar` | Anabella García | es-AR |
| Trini Nutrición | `trini-nutrition-cl` | Trinidad Fuentes | es-CL |
| Pablo Productividad | `pablo-productividad-mx` | Pablo Ramírez | es-MX |

## 4. Environment variables

Copy from Clerk Dashboard → **API Keys**:

```bash
# Backend (K8s secret or .env)
CLERK_SECRET_KEY=sk_live_<key>

# Frontend (Next.js NEXT_PUBLIC_*)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_<key>
```

## 5. JWT template for backend verification

In Clerk Dashboard → **JWT Templates** → **New template**:

```json
{
  "aud": "comunify-backend",
  "org_id": "{{org.id}}",
  "org_slug": "{{org.slug}}",
  "org_role": "{{org.role}}",
  "user_id": "{{user.id}}"
}
```

Template name: `comunify-backend`

Backend verifies JWTs using this template. The `org_slug` maps to `tenant_id` in all
LangGraph state objects and trace events (per tenant-isolation invariant).

## 6. Webhook configuration (for member lifecycle events)

In Clerk Dashboard → **Webhooks** → **Add endpoint**:

```
URL: https://api.comunify.lat/api/v1/webhooks/clerk
Events to listen:
  - user.created
  - user.deleted
  - organization.created
  - organizationMembership.created
  - organizationMembership.deleted
```

Signing secret → set as `CLERK_WEBHOOK_SECRET` in K8s secrets.

## 7. Testing with Clerk Testing Tokens

For E2E tests (Playwright):

```bash
# Set testing token (from Clerk dashboard → Testing → Tokens)
CLERK_TESTING_TOKEN=<token> npx playwright test --project=smoke
```

See `frontend/e2e/fixtures/auth.fixture.ts` for auth fixture implementation.

## 8. Social login (Google OAuth) — optional for launch

In Clerk Dashboard → **Social connections** → Google:

1. Create Google OAuth app in [Google Cloud Console](https://console.cloud.google.com)
2. Authorized redirect URI: `https://clerk.comunify.lat/v1/oauth_callback`
3. Add Client ID + Secret to Clerk dashboard

Not required for MVP — email auth is sufficient.
