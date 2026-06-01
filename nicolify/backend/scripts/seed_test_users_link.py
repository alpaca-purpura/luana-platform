"""Seed test users + tenants + user_tenants junction (nicolify-r0-dev-stack T-2).

Origin: port re-temizado de vitalia/backend/scripts/seed_test_users_link.py.
Multi-tenancy via tenants + users + user_tenants en engine luana-core-iam.
Nicolify NO usa Clerk Organizations (ratificado Chris 2026-05-20 en vitalia;
mismo principio aplica a nicolify — ver AD-2 nicolify-r0-dev-stack).

What this seed does:
  1. INSERT tenant "Agencia Demo" (slug=agencia-demo, PEN, PE)
     tenant_id determinístico UUIDv5 ("agencia-demo") — E2E reproducible
  2. INSERT user owner.demo@nicolify.com con clerk_id (de Clerk dev instance)
     user_id determinístico UUIDv5 ("user:owner.demo@nicolify.com")
  3. INSERT user_tenants junction:
     - owner.demo → Agencia Demo (rol owner)
  4. --clerk-sync: si CLERK_SECRET_KEY disponible, crea/actualiza el user Clerk
     con publicMetadata {role: "owner", tenant_id: <E2E_TENANT_ID>}

Idempotency: ON CONFLICT DO UPDATE en INSERT users (actualiza role+email),
             ON CONFLICT DO NOTHING en tenants,
             ON CONFLICT DO UPDATE en user_tenants.

Usage (nativo, host):
    python nicolify/backend/scripts/seed_test_users_link.py [--clerk-sync]
    POSTGRES_HOST=localhost POSTGRES_DB=nicolify_dev python ...

Usage (docker exec):
    docker exec luana-nicolify-backend-dev bash -c \\
      "cd /app && python scripts/seed_test_users_link.py --clerk-sync"

Pre-condition (--clerk-sync):
    CLERK_SECRET_KEY env var con la dev instance key de nicolify.
    El script crea el user en Clerk si no existe.

downstream-regression-na: brand-local seed script; no cross-brand consumers
"""

from __future__ import annotations

import argparse
import os
import sys
import uuid

# ── UUIDs determinísticos ───────────────────────────────────────────────────
# Namespace URL estándar (RFC 4122 §4.3) — misma convención que vitalia seed
NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")

# E2E_TENANT_ID = uuid5 de "agencia-demo" — coinicide con .env.dev.template
E2E_TENANT_ID = uuid.uuid5(NAMESPACE, "agencia-demo")

# user_id determinístico — idempotent across runs
E2E_USER_ID = uuid.uuid5(NAMESPACE, "user:owner.demo@nicolify.com")

# ── Fixtures ─────────────────────────────────────────────────────────────────
TENANT = {
    "id": E2E_TENANT_ID,
    "name": "Agencia Demo",
    "slug": "agencia-demo",
    "default_currency": "PEN",
    "timezone": "America/Lima",
    "location_country": "PE",
    "location_city": "Lima",
}

# E2E owner user — Clerk user creado via --clerk-sync
OWNER_EMAIL = "owner.demo@nicolify.com"
OWNER_ROLE = "owner"

# user_tenants links
USER_TENANT_LINKS = [
    (OWNER_EMAIL, E2E_TENANT_ID, OWNER_ROLE),
]


# ── DB connection ────────────────────────────────────────────────────────────
def _get_pg_conn():
    """Get psycopg2 connection — DATABASE_URL priority, POSTGRES_* fallback."""
    import psycopg2

    database_url = os.environ.get("DATABASE_URL", "")
    if database_url:
        # Strip asyncpg prefix if present (host usage may pass asyncpg DSN)
        dsn = database_url.replace("postgresql+asyncpg://", "postgresql://")
        return psycopg2.connect(dsn)

    return psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        dbname=os.environ.get("POSTGRES_DB", "nicolify_dev"),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", "password"),
    )


# ── Clerk sync ───────────────────────────────────────────────────────────────
def _clerk_create_or_update_user(email: str, tenant_id: uuid.UUID, role: str) -> str | None:
    """Create or update Clerk user + set publicMetadata.

    Returns clerk_id if successful, None otherwise.
    Requires CLERK_SECRET_KEY env var.
    """
    try:
        import httpx
    except ImportError:
        print("  [clerk] httpx not available — install with: pip install httpx", file=sys.stderr)
        return None

    clerk_secret = os.environ.get("CLERK_SECRET_KEY", "")
    if not clerk_secret:
        print("  [clerk] CLERK_SECRET_KEY not set — skipping Clerk sync", file=sys.stderr)
        return None

    headers = {
        "Authorization": f"Bearer {clerk_secret}",
        "Content-Type": "application/json",
    }
    base_url = "https://api.clerk.com/v1"

    # Check if user already exists
    with httpx.Client(timeout=15.0) as client:
        search_resp = client.get(
            f"{base_url}/users",
            headers=headers,
            params={"email_address": [email], "limit": 1},
        )
        if search_resp.status_code != 200:
            print(f"  [clerk] search failed {search_resp.status_code}: {search_resp.text[:200]}", file=sys.stderr)
            return None

        users = search_resp.json()
        existing = users[0] if users else None

        public_metadata = {
            "role": role,
            "tenant_id": str(tenant_id),
        }

        if existing:
            clerk_id = existing["id"]
            # Update publicMetadata
            update_resp = client.patch(
                f"{base_url}/users/{clerk_id}",
                headers=headers,
                json={"public_metadata": public_metadata},
            )
            if update_resp.status_code in (200, 204):
                print(f"  [clerk] updated {email} publicMetadata (clerk_id={clerk_id[:20]}...)")
                return clerk_id
            print(
                f"  [clerk] update failed {update_resp.status_code}: {update_resp.text[:200]}",
                file=sys.stderr,
            )
            return None
        # Create new Clerk user
        # NOTE: password must be set separately or via magic link
        # For dev/E2E we set a test password via env var
        test_password = os.environ.get("E2E_CLERK_USER_PASSWORD", "")
        payload: dict = {
            "email_address": [email],
            "first_name": "Owner",
            "last_name": "Demo",
            "public_metadata": public_metadata,
        }
        if test_password:
            payload["password"] = test_password

        create_resp = client.post(f"{base_url}/users", headers=headers, json=payload)
        if create_resp.status_code in (200, 201):
            clerk_id = create_resp.json()["id"]
            print(f"  [clerk] created {email} (clerk_id={clerk_id[:20]}...)")
            return clerk_id
        print(
            f"  [clerk] create failed {create_resp.status_code}: {create_resp.text[:200]}",
            file=sys.stderr,
        )
        return None


# ── Main seed ────────────────────────────────────────────────────────────────
def main(clerk_sync: bool = False) -> int:
    """Seed tenants + users + user_tenants for nicolify E2E fixture.

    Args:
        clerk_sync: If True, create/update Clerk user with publicMetadata.

    Returns:
        Exit code (0 = success, 1 = error).
    """
    conn = _get_pg_conn()
    cursor = conn.cursor()
    inserts_tenants = 0
    inserts_users = 0
    inserts_links = 0

    try:
        # ─── 1. Tenant ────────────────────────────────────────────────────────
        print(f"\n  Seeding tenant: {TENANT['slug']} (id={TENANT['id']})")
        cursor.execute(
            """
            INSERT INTO tenants
                (id, name, slug, default_currency, timezone,
                 location_country, location_city, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, true)
            ON CONFLICT (id) DO NOTHING
            """,
            (
                str(TENANT["id"]),
                TENANT["name"],
                TENANT["slug"],
                TENANT["default_currency"],
                TENANT["timezone"],
                TENANT["location_country"],
                TENANT["location_city"],
            ),
        )
        if cursor.rowcount > 0:
            inserts_tenants += 1
            print(f"  [tenant] {TENANT['slug']} insertado")
        else:
            print(f"  [tenant] {TENANT['slug']} ya existía (idempotente)")

        # ─── 2. Clerk sync (optional) ─────────────────────────────────────────
        clerk_id: str | None = None
        if clerk_sync:
            print(f"\n  [clerk] syncing {OWNER_EMAIL}...")
            clerk_id = _clerk_create_or_update_user(OWNER_EMAIL, E2E_TENANT_ID, OWNER_ROLE)
            if not clerk_id:
                print(
                    "  [clerk] WARNING: Clerk sync failed — user seeded without clerk_id. "
                    "E2E auth tests will fail until Clerk dev instance is configured.",
                    file=sys.stderr,
                )
        else:
            print("\n  [clerk] skipping Clerk sync (run with --clerk-sync to create Clerk user)")
            # Try to read from env (pre-set from previous --clerk-sync run)
            # If not available, seed user without clerk_id
            clerk_id = os.environ.get("E2E_CLERK_USER_ID")

        # ─── 3. User ─────────────────────────────────────────────────────────
        print(f"\n  Seeding user: {OWNER_EMAIL}")
        cursor.execute(
            """
            INSERT INTO users
                (id, email, clerk_id, full_name, role, is_active)
            VALUES (%s, %s, %s, %s, %s, true)
            ON CONFLICT (email) DO UPDATE SET
                clerk_id = COALESCE(EXCLUDED.clerk_id, users.clerk_id),
                role = EXCLUDED.role,
                is_active = true
            """,
            (
                str(E2E_USER_ID),
                OWNER_EMAIL,
                clerk_id,
                "Owner Demo",
                OWNER_ROLE,
            ),
        )
        inserts_users += 1
        print(f"  [user] {OWNER_EMAIL} upserted (clerk_id={'set' if clerk_id else 'pending Clerk setup'})")

        # ─── 4. user_tenants junction ─────────────────────────────────────────
        print("\n  Seeding user_tenants links...")
        for email, tenant_id, role in USER_TENANT_LINKS:
            user_id = E2E_USER_ID if email == OWNER_EMAIL else None
            if not user_id:
                print(f"  [link] SKIP {email} → unknown user_id", file=sys.stderr)
                continue

            cursor.execute(
                """
                INSERT INTO user_tenants
                    (user_id, tenant_id, role, is_active)
                VALUES (%s, %s, %s, true)
                ON CONFLICT (user_id, tenant_id) DO UPDATE SET
                    role = EXCLUDED.role,
                    is_active = true
                """,
                (str(user_id), str(tenant_id), role),
            )
            if cursor.rowcount > 0:
                inserts_links += 1
                print(f"  [link] {email} → {tenant_id} (role={role})")
            else:
                print(f"  [link] {email} → {tenant_id} ya existía (idempotente)")

        conn.commit()
        print(
            f"\n  Result: {inserts_tenants} tenants, {inserts_users} users upserted, {inserts_links} user_tenants links"
        )
        print(f"\n  E2E_TENANT_ID={E2E_TENANT_ID}")
        print(f"  E2E_USER_ID={E2E_USER_ID}")
        return 0

    except Exception as e:  # noqa: BLE001 — top-level catch
        conn.rollback()
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed test users/tenants for nicolify E2E fixture.")
    parser.add_argument(
        "--clerk-sync",
        action="store_true",
        help=("Create/update Clerk user with publicMetadata {role, tenant_id}. Requires CLERK_SECRET_KEY env var."),
    )
    args = parser.parse_args()
    sys.exit(main(clerk_sync=args.clerk_sync))
