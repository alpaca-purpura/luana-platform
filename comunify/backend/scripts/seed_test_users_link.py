"""Seed test users + tenant + user_tenants for comunify (IAM foundation · T-iam-be).

Origin: comunify-shell-organism story T-iam-be (2026-06-17).
Multi-tenancy via tenants + users + user_tenants in engine luana-core-iam.

comunify has NO PHI — stripped all vitalia-specific bits:
    * No VITALIA_PHI_KEK requirement
    * No clinic_branches table
    * No pgp_sym_encrypt patient/lead rows
    * Single creator role per tenant (single-user brand)

What this seed does (idempotent — ON CONFLICT DO NOTHING/UPDATE everywhere):
  1. INSERT tenants row (1 comunify demo tenant — creator economy themed)
  2. (optional --clerk-sync) create/update Clerk user + publicMetadata.{role,tenant_id}
     so FE (reads publicMetadata.tenant_id) and BE engine (reads user_tenants) AGREE.
  3. INSERT users row with clerk_id link
  4. INSERT user_tenants junction (user→tenant, role "owner")

Prints tenant_id + clerk_id at the end (NEVER secrets).

Usage:
    # Full sync (host — has Clerk egress + secret). Recommended.
    CLERK_SECRET_KEY=sk_test_... \\
    POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=5435 POSTGRES_DB=comunify_dev \\
    POSTGRES_USER=postgres POSTGRES_PASSWORD=password \\
    .venv/bin/python comunify/backend/scripts/seed_test_users_link.py --clerk-sync

    # DB-only (in-container, no Clerk egress — uses hardcoded CLERK_ID_PLACEHOLDER):
    docker exec luana-dev-comunify_backend_dev-1 \\
      bash -c "cd /workspace/comunify/backend && uv run python scripts/seed_test_users_link.py"

downstream-regression-na: brand-local seed script; no cross-brand consumers
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
import uuid

# ─── Deterministic UUID fixtures ───────────────────────────────────────────
NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # uuid5 namespace URL

# comunify demo tenant — creator economy themed (deterministic)
TENANT_COMUNIFY_DEMO = uuid.uuid5(NAMESPACE, "comunify-demo-creator")

# Test user: hola@alpacapurpura.lat (Chris' dev account, comunify-scoped)
DEMO_USER_EMAIL = "hola@alpacapurpura.lat"
DEMO_USER_ID = uuid.uuid5(NAMESPACE, f"user:{DEMO_USER_EMAIL}")

CLERK_API = "https://api.clerk.com/v1"

# ─────────────────────────────────────────────────────────────────────────────
# CLERK_ID_PLACEHOLDER: fill this with the real Clerk user ID for
# hola@alpacapurpura.lat once resolved (via --clerk-sync or Clerk dashboard).
# Used as fallback for DB-only in-container runs without Clerk egress.
# ─────────────────────────────────────────────────────────────────────────────
CLERK_ID_COMUNIFY_DEMO = "PLACEHOLDER_FILL_WITH_REAL_CLERK_ID"  # noqa: S105 — placeholder, not a secret

TENANT_DATA = {
    "id": TENANT_COMUNIFY_DEMO,
    "name": "Comunify Demo (Creator Economy)",
    "slug": "comunify-demo",
    "default_currency": "USD",
    "timezone": "America/Mexico_City",
    "location_country": "MX",
    "location_city": "Ciudad de México",
}


def _get_pg_conn():  # type: ignore[no-untyped-def]
    """Get psycopg2 connection from env vars."""
    import psycopg2  # type: ignore[import-untyped]

    return psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        dbname=os.environ.get("POSTGRES_DB", "comunify_dev"),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", "password"),
    )


# ─── Clerk sync (stdlib urllib — no extra deps) ─────────────────────────────
def _clerk_request(method: str, path: str, secret: str, body: dict | None = None) -> tuple[int, object]:
    """Perform a Clerk Backend API request. Returns (status, parsed_json).

    Uses a non-default User-Agent to avoid Cloudflare CF error 1010
    (default Python-urllib UA is 403'd by Clerk's CF front).
    Verbatim copy from vitalia/backend/scripts/seed_test_users_link.py.
    """
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(  # noqa: S310 — fixed https Clerk host
        f"{CLERK_API}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
            # Clerk fronts the API with Cloudflare; the default Python-urllib UA is 403'd
            # (CF error 1010). A non-default UA is required.
            "User-Agent": "comunify-seed/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:  # noqa: S310
            return resp.status, json.loads(resp.read() or "null")
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read() or "null")
        except Exception:  # noqa: BLE001
            payload = {}
        return e.code, payload


def _clerk_sync(secret: str) -> str | None:
    """Create/update Clerk user for hola@alpacapurpura.lat with comunify publicMetadata.

    Returns the resolved Clerk user ID, or None on failure.
    """
    email = DEMO_USER_EMAIL
    meta = {"role": "owner", "tenant_id": str(TENANT_COMUNIFY_DEMO)}

    _, found = _clerk_request("GET", f"/users?email_address={email}", secret)
    uid = found[0]["id"] if isinstance(found, list) and found else None

    if uid:
        _clerk_request("PATCH", f"/users/{uid}/metadata", secret, {"public_metadata": meta})
        print(f"  [clerk] {email} UPDATED (role=owner, tenant_id={TENANT_COMUNIFY_DEMO}, id={uid})")
    else:
        status, created = _clerk_request(
            "POST",
            "/users",
            secret,
            {
                "email_address": [email],
                "skip_password_checks": True,
                "public_metadata": meta,
            },
        )
        uid = created.get("id") if isinstance(created, dict) else None
        if not uid:
            print(f"  [clerk] {email} CREATE FAILED (status={status}) — fallback placeholder", file=sys.stderr)
            return None
        print(f"  [clerk] {email} CREATED (role=owner, id={uid})")

    return uid


def main() -> int:
    do_clerk = "--clerk-sync" in sys.argv and not os.environ.get("NO_CLERK")
    secret = os.environ.get("CLERK_SECRET_KEY", "")

    # Resolve clerk_id: live sync (if requested + secret) else placeholder fallback.
    clerk_id = CLERK_ID_COMUNIFY_DEMO
    if do_clerk and secret:
        print("  [clerk] syncing user hola@alpacapurpura.lat (create/update + publicMetadata)...")
        try:
            resolved = _clerk_sync(secret)
            if resolved:
                clerk_id = resolved
        except Exception as e:  # noqa: BLE001
            print(f"  WARNING: Clerk sync failed ({e}) — using CLERK_ID_COMUNIFY_DEMO placeholder", file=sys.stderr)
    elif do_clerk and not secret:
        print("  WARNING: --clerk-sync requested but CLERK_SECRET_KEY unset — using placeholder", file=sys.stderr)

    conn = _get_pg_conn()
    cursor = conn.cursor()
    n_tenants = n_users = n_links = 0

    try:
        # ─── 1. Tenant ───────────────────────────────────────────────────────
        t = TENANT_DATA
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
        n_tenants += int(cursor.rowcount > 0)

        # ─── 2. User (hola@alpacapurpura.lat) ────────────────────────────────
        if clerk_id and clerk_id != CLERK_ID_COMUNIFY_DEMO:
            # Live clerk_id resolved — insert/upsert with real ID
            full_name = "Demo Creator"
            cursor.execute(
                """
                INSERT INTO users
                    (id, email, clerk_id, full_name, role, is_active)
                VALUES (%s, %s, %s, %s, %s, true)
                ON CONFLICT (clerk_id) DO UPDATE SET
                    email = EXCLUDED.email,
                    role = EXCLUDED.role
                """,
                (str(DEMO_USER_ID), DEMO_USER_EMAIL, clerk_id, full_name, "owner"),
            )
            n_users += 1
        else:
            print(
                f"  [user] SKIP DB insert for {DEMO_USER_EMAIL}: "
                f"clerk_id is still placeholder ({CLERK_ID_COMUNIFY_DEMO!r}). "
                "Run with --clerk-sync or fill CLERK_ID_COMUNIFY_DEMO in this script.",
            )

        # ─── 3. user_tenants junction ────────────────────────────────────────
        if clerk_id and clerk_id != CLERK_ID_COMUNIFY_DEMO:
            cursor.execute(
                """
                INSERT INTO user_tenants
                    (user_id, tenant_id, role, is_active)
                VALUES (%s, %s, %s, true)
                ON CONFLICT (user_id, tenant_id) DO UPDATE SET
                    role = EXCLUDED.role,
                    is_active = true
                """,
                (str(DEMO_USER_ID), str(TENANT_COMUNIFY_DEMO), "owner"),
            )
            n_links += int(cursor.rowcount > 0)

        conn.commit()
        print(f"\n  Result: {n_tenants} tenants, {n_users} users upserted, {n_links} user_tenants links")
        print("\n  Seeded IDs:")
        print(f"    TENANT_COMUNIFY_DEMO = {TENANT_COMUNIFY_DEMO}")
        print(f"    DEMO_USER_ID         = {DEMO_USER_ID}")
        print(f"    clerk_id             = {clerk_id}")
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
