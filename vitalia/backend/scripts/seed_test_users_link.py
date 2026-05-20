"""Seed test users + tenants + user_tenants junction (Slice 1 pre-flight gate).

Origin: pre-flight gate Slice 1 vitalia (Chris ratificó 2026-05-20 NO Clerk Organizations).
Multi-tenancy via tenants + users + user_tenants en engine luana-core-iam.

Pre-condition: Clerk users dr.demo+recepcion+admin@vitalialat.com ya creados via
`npx clerk users create` (sin Organizations, con publicMetadata vitalia_role).

What this seed does:
  1. INSERT tenants rows (3 fixture clinics — Aurora AR · Mindful CL · Sanaré MX)
     tenant_ids deterministic UUIDv5 matching seed_fixture_clinics.py
  2. INSERT users rows con clerk_id link (3 test users from Clerk API)
  3. INSERT user_tenants junction:
     - dr.demo → Sanaré MX (rol owner — tenant primario per Chris 2026-05-20)
     - recepcion → Sanaré MX (rol recepcion)
     - admin → 3 tenants (rol super_admin todos)

Idempotency: ON CONFLICT DO NOTHING en toda INSERT.

Usage:
    docker exec -e POSTGRES_HOST=luana_postgres_dev \\
                -e POSTGRES_PORT=5432 \\
                -e POSTGRES_DB=vitalia_dev \\
                -e POSTGRES_USER=postgres \\
                -e POSTGRES_PASSWORD=password \\
                -e CLERK_SECRET_KEY=<sk_test_...> \\
                luana-dev-vitalia_backend_dev-1 \\
                bash -c "cd /workspace/vitalia/backend && uv run python scripts/seed_test_users_link.py"

downstream-regression-na: brand-local seed script; no cross-brand consumers
"""

from __future__ import annotations

import os
import sys
import uuid

# 3 tenants fixture deterministic UUIDs (matching seed_fixture_clinics.py NAMESPACE_URL)
NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # uuid5 namespace URL (matching seed_fixture_clinics)
TENANT_AURORA = uuid.uuid5(NAMESPACE, "aurora-dental-ar")
TENANT_MINDFUL = uuid.uuid5(NAMESPACE, "mindful-santiago-cl")
TENANT_SANARE = uuid.uuid5(NAMESPACE, "sanare-latam-mx")

# Hardcoded Clerk IDs (resolved manually 2026-05-20 — script fetch hit 403)
CLERK_IDS = {
    "dr.demo@vitalialat.com": "user_3DyTTJQK0ZQLE5XGSi5BMjKEjrR",
    "recepcion@vitalialat.com": "user_3DyTUqjKVwnb0n7Tf89OdKTAGpK",
    "admin@vitalialat.com": "user_3DyTVEiMRRHoaszcY5vQ2BuPsFx",
}

TENANTS = [
    {
        "id": TENANT_AURORA,
        "name": "Clínica Dental Aurora",
        "slug": "aurora-dental-ar",
        "default_currency": "ARS",
        "timezone": "America/Argentina/Buenos_Aires",
        "location_country": "AR",
        "location_city": "Buenos Aires",
    },
    {
        "id": TENANT_MINDFUL,
        "name": "Centro Mindful Santiago",
        "slug": "mindful-santiago-cl",
        "default_currency": "CLP",
        "timezone": "America/Santiago",
        "location_country": "CL",
        "location_city": "Santiago",
    },
    {
        "id": TENANT_SANARE,
        "name": "Sanaré LATAM",
        "slug": "sanare-latam-mx",
        "default_currency": "MXN",
        "timezone": "America/Mexico_City",
        "location_country": "MX",
        "location_city": "Ciudad de México",
    },
]

# Test users via Clerk API
TEST_USERS_EMAIL_TO_ROLE = {
    "dr.demo@vitalialat.com": "doctor",
    "recepcion@vitalialat.com": "recepcion",
    "admin@vitalialat.com": "super_admin",
}

# user_tenants associations (Chris ratificó 2026-05-20 — Sanaré MX = tenant primario tests)
USER_TENANT_LINKS = [
    # dr.demo → Sanaré (rol owner — tenant primario)
    ("dr.demo@vitalialat.com", TENANT_SANARE, "owner"),
    # recepcion → Sanaré (rol recepcion)
    ("recepcion@vitalialat.com", TENANT_SANARE, "recepcion"),
    # admin → 3 tenants (super_admin todos)
    ("admin@vitalialat.com", TENANT_AURORA, "super_admin"),
    ("admin@vitalialat.com", TENANT_MINDFUL, "super_admin"),
    ("admin@vitalialat.com", TENANT_SANARE, "super_admin"),
]


def _get_pg_conn():
    """Get psycopg2 connection from env vars."""
    import psycopg2

    return psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        dbname=os.environ.get("POSTGRES_DB", "vitalia_dev"),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", "password"),
    )


def _fetch_clerk_users() -> dict[str, str]:
    """Return hardcoded Clerk IDs (resolved manually 2026-05-20).

    Original implementation fetched live Clerk API but containers without
    HTTPS egress (or restricted CIDR allowlists) hit 403 Forbidden. Hardcoded
    mapping is OK for fixture stability — re-run requires updating CLERK_IDS
    when users are recreated.
    """
    return dict(CLERK_IDS)


def main() -> int:
    conn = _get_pg_conn()
    cursor = conn.cursor()
    inserts_tenants = 0
    inserts_users = 0
    inserts_links = 0

    try:
        # ─── 1. Tenants ──────────────────────────────────────────────────────
        for t in TENANTS:
            cursor.execute(
                """
                INSERT INTO tenants
                    (id, name, slug, default_currency, timezone,
                     location_country, location_city, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, true)
                ON CONFLICT (id) DO NOTHING
                """,
                (
                    str(t["id"]),
                    t["name"],
                    t["slug"],
                    t["default_currency"],
                    t["timezone"],
                    t["location_country"],
                    t["location_city"],
                ),
            )
            if cursor.rowcount > 0:
                inserts_tenants += 1
                print(f"  [tenant] {t['slug']} insertado (id={t['id']})")
            else:
                print(f"  [tenant] {t['slug']} ya existía")

        # ─── 2. Users (linked Clerk IDs) ─────────────────────────────────────
        print("\n  [users] fetching Clerk IDs...")
        email_to_clerk_id = _fetch_clerk_users()

        if len(email_to_clerk_id) < len(TEST_USERS_EMAIL_TO_ROLE):
            missing = set(TEST_USERS_EMAIL_TO_ROLE) - set(email_to_clerk_id)
            print(f"  WARNING: Clerk users missing: {missing}", file=sys.stderr)

        email_to_user_id: dict[str, uuid.UUID] = {}
        for email, role in TEST_USERS_EMAIL_TO_ROLE.items():
            clerk_id = email_to_clerk_id.get(email)
            if not clerk_id:
                print(f"  [user] SKIP {email} (no Clerk record)")
                continue

            # Deterministic UUID from email (idempotency)
            user_id = uuid.uuid5(NAMESPACE, f"user:{email}")
            email_to_user_id[email] = user_id

            full_name = email.split("@")[0].replace(".", " ").title()
            cursor.execute(
                """
                INSERT INTO users
                    (id, email, clerk_id, full_name, role, is_active)
                VALUES (%s, %s, %s, %s, %s, true)
                ON CONFLICT (clerk_id) DO UPDATE SET
                    email = EXCLUDED.email,
                    role = EXCLUDED.role
                """,
                (str(user_id), email, clerk_id, full_name, role),
            )
            inserts_users += 1
            print(f"  [user] {email} (role={role}, clerk_id={clerk_id[:20]}...)")

        # ─── 3. user_tenants junction ────────────────────────────────────────
        for email, tenant_id, role in USER_TENANT_LINKS:
            user_id = email_to_user_id.get(email)
            if not user_id:
                print(f"  [link] SKIP {email} → {tenant_id} (user not seeded)")
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

        conn.commit()
        print(f"\n  Result: {inserts_tenants} tenants, {inserts_users} users, {inserts_links} user_tenants links")
        return 0
    except Exception as e:  # noqa: BLE001 — top-level catch
        conn.rollback()
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
