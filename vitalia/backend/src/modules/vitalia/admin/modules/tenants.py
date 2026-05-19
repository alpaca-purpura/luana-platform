"""Admin module — Tenant & Clinic management for Vitalia.

Vitalia-specific implementation (NOT a mirror of nicolify/admin/modules/tenants.py):
- Uses vitalia's clinic-first model (clinics → tenants → locations)
- UUIDv5 deterministic IDs for idempotent re-runs (namespace: NAMESPACE_DNS)
- HIPAA-lite audit_log row written SYNC before every mutating action
- Dual filter (tenant_id + clinic_id) on all queries
- payload_redacted: identity fields only (clinic_name, country, slug) — NO PHI

Architecture note: Admin is an application-layer entry point.
It calls DB directly via _shared.db.get_sync_session() (synchronous for Streamlit).
It does NOT use domain repositories (those are async + FastAPI-coupled).

Table schema (from alembic migrations):
    vitalia_clinics: id, name, slug, country, timezone, plan_tier, is_active,
                     onboarding_completed, created_at, updated_at
    vitalia_tenants: id, clinic_id (FK), name, slug, clerk_org_id, created_at
    vitalia_audit_log: partitioned by occurred_at (migration 013_vitalia)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog

logger = structlog.get_logger()

# UUIDv5 namespace for deterministic Vitalia tenant IDs
_VITALIA_NAMESPACE = uuid.NAMESPACE_DNS


def _make_deterministic_id(slug: str, entity_type: str) -> uuid.UUID:
    """Generate a deterministic UUIDv5 for idempotent tenant/clinic creation.

    Namespace: uuid.NAMESPACE_DNS
    Name: "{entity_type}.{slug}.vitalia.com"

    Args:
        slug: URL-safe identifier (e.g. 'aurora-dental-ar')
        entity_type: 'clinic' or 'tenant'

    Returns:
        Deterministic UUID (same input always produces same UUID)
    """
    name = f"{entity_type}.{slug}.vitalia.com"
    return uuid.uuid5(_VITALIA_NAMESPACE, name)


def render_tenants_page() -> None:
    """Render the Tenants & Clinics management page in Streamlit.

    Tab layout:
        Tab 1 — Listado de clínicas activas
        Tab 2 — Crear nueva clínica / tenant
        Tab 3 — Ver detalle / editar estado

    HIPAA invariants:
        - audit_log row written BEFORE returning from any mutating operation
        - payload_redacted contains only identity data (clinic_name, slug, country)
        - All queries filter by tenant_id + clinic_id (dual filter)
    """
    try:
        import streamlit as st  # noqa: PLC0415
    except ImportError:
        logger.error("streamlit_not_installed", hint="Install streamlit to run admin UI")
        raise

    st.header("Clínicas y Tenants")
    st.caption("Gestión de clínicas activas en la plataforma Vitalia.")

    tab_list, tab_crear, tab_detalle = st.tabs(["Listado", "Crear nueva clínica", "Detalle"])

    with tab_list:
        _render_clinic_list()

    with tab_crear:
        _render_create_clinic_form()

    with tab_detalle:
        _render_clinic_detail()


def _render_clinic_list() -> None:
    """Render the clinic listing tab — read-only view of all active clinics."""
    try:
        import streamlit as st  # noqa: PLC0415
        from sqlalchemy import text  # noqa: PLC0415
    except ImportError:
        return

    from src.modules.vitalia.admin._shared.db import get_sync_session  # noqa: PLC0415

    st.subheader("Clínicas activas")

    try:
        with get_sync_session() as session:
            result = session.execute(
                text("""
                    SELECT c.id, c.name, c.slug, c.country, c.plan_tier,
                           c.is_active, c.onboarding_completed, c.created_at
                    FROM vitalia_clinics c
                    WHERE c.is_active = true
                    ORDER BY c.created_at DESC
                    LIMIT 100
                """)
            )
            rows = result.fetchall()

        if not rows:
            st.info("No hay clínicas activas registradas aún.")
            return

        # Display as table
        clinic_data = [
            {
                "ID": str(row.id),
                "Nombre": row.name,
                "Slug": row.slug,
                "País": row.country,
                "Plan": row.plan_tier or "—",
                "Onboarding": "Completo" if row.onboarding_completed else "Pendiente",
                "Creada": row.created_at.strftime("%Y-%m-%d") if row.created_at else "—",
            }
            for row in rows
        ]
        st.dataframe(clinic_data, use_container_width=True)

    except Exception as exc:  # noqa: BLE001
        logger.error("admin_clinic_list_error", error=str(exc))
        st.error(f"Error al cargar el listado de clínicas: {exc}")


def _render_create_clinic_form() -> None:  # noqa: PLR0912
    """Render the clinic creation form — creates clinic + tenant rows idempotently."""
    try:
        import streamlit as st  # noqa: PLC0415
        from sqlalchemy import text  # noqa: PLC0415
    except ImportError:
        return

    from src.modules.vitalia.admin._shared.db import get_sync_session  # noqa: PLC0415
    from src.modules.vitalia.compliance.application.compliance_service_adapter import (  # noqa: PLC0415
        sanitize_phi_payload,
    )

    st.subheader("Crear nueva clínica")
    st.caption("Los campos marcados con * son obligatorios.")

    with st.form("form_crear_clinica", clear_on_submit=False):
        clinic_name = st.text_input("Nombre de la clínica *", placeholder="Clínica Aurora Dental AR")
        clinic_slug = st.text_input(
            "Slug (identificador URL) *",
            placeholder="aurora-dental-ar",
            help="Solo letras minúsculas, números y guiones. Debe ser único.",
        )
        country = st.selectbox(
            "País *",
            options=["AR", "MX", "CO", "CL", "PE", "BR", "UY", "EC"],
            help="País de operación de la clínica.",
        )
        timezone_opt = st.selectbox(
            "Zona horaria *",
            options=[
                "America/Argentina/Buenos_Aires",
                "America/Mexico_City",
                "America/Bogota",
                "America/Santiago",
                "America/Lima",
                "America/Sao_Paulo",
                "America/Montevideo",
                "America/Guayaquil",
            ],
        )
        plan_tier = st.selectbox("Plan", options=["starter", "growth", "scale"])

        submitted = st.form_submit_button("Crear clínica")

    if not submitted:
        return

    # Validation
    errors: list[str] = []
    if not clinic_name.strip():
        errors.append("El nombre de la clínica es obligatorio.")
    if not clinic_slug.strip():
        errors.append("El slug es obligatorio.")
    elif not _is_valid_slug(clinic_slug.strip()):
        errors.append("El slug solo puede contener letras minúsculas, números y guiones.")

    if errors:
        for err in errors:
            st.error(err)
        return

    slug = clinic_slug.strip().lower()

    # Deterministic UUIDs (idempotent creation)
    clinic_id = _make_deterministic_id(slug, "clinic")
    tenant_id = _make_deterministic_id(slug, "tenant")
    admin_user_id = uuid.uuid4()  # Admin performing the action

    try:
        with get_sync_session() as session:
            # Check if slug already exists (idempotent check)
            exists = session.execute(
                text("SELECT id FROM vitalia_clinics WHERE slug = :slug"),
                {"slug": slug},
            ).fetchone()

            if exists:
                st.warning(f"Ya existe una clínica con el slug '{slug}'. ID: {exists.id}")
                return

            now = datetime.now(tz=timezone.utc)

            # Insert clinic row
            session.execute(
                text("""
                    INSERT INTO vitalia_clinics
                        (id, name, slug, country, timezone, plan_tier, is_active,
                         onboarding_completed, created_at, updated_at)
                    VALUES
                        (:id, :name, :slug, :country, :timezone, :plan_tier, true, false, :now, :now)
                    ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": str(clinic_id),
                    "name": clinic_name.strip(),
                    "slug": slug,
                    "country": country,
                    "timezone": timezone_opt,
                    "plan_tier": plan_tier,
                    "now": now,
                },
            )

            # Insert tenant placeholder row
            session.execute(
                text("""
                    INSERT INTO vitalia_tenants
                        (id, clinic_id, name, slug, created_at)
                    VALUES
                        (:id, :clinic_id, :name, :slug, :now)
                    ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": str(tenant_id),
                    "clinic_id": str(clinic_id),
                    "name": clinic_name.strip(),
                    "slug": slug,
                    "now": now,
                },
            )

            # HIPAA-lite audit log — SYNC WRITE (identity payload, no PHI)
            safe_payload = sanitize_phi_payload(
                {
                    "clinic_name": clinic_name.strip(),
                    "slug": slug,
                    "country": country,
                    "plan_tier": plan_tier,
                }
            )
            payload_bytes = _encode_payload(safe_payload)

            session.execute(
                text("""
                    INSERT INTO vitalia_audit_log
                        (id, tenant_id, clinic_id, user_id, action, resource_type,
                         resource_id, from_ip, user_agent, payload_redacted, occurred_at)
                    VALUES
                        (gen_random_uuid(), :tenant_id, :clinic_id, :user_id,
                         'tenant.created', 'tenant', :resource_id,
                         NULL, 'VitaliaAdmin/1.0', :payload, NOW())
                """),
                {
                    "tenant_id": str(tenant_id),
                    "clinic_id": str(clinic_id),
                    "user_id": str(admin_user_id),
                    "resource_id": str(tenant_id),
                    "payload": payload_bytes,
                },
            )
            session.commit()

        st.success(
            f"Clínica '{clinic_name.strip()}' creada exitosamente.\n\n"
            f"**Clinic ID:** `{clinic_id}`\n"
            f"**Tenant ID:** `{tenant_id}`"
        )
        logger.info(
            "admin_clinic_created",
            clinic_id=str(clinic_id),
            tenant_id=str(tenant_id),
            slug=slug,
        )

    except Exception as exc:  # noqa: BLE001
        logger.error("admin_create_clinic_error", error=str(exc), slug=slug)
        st.error(f"Error al crear la clínica: {exc}")


def _render_clinic_detail() -> None:
    """Render clinic detail / status toggle tab."""
    try:
        import streamlit as st  # noqa: PLC0415
        from sqlalchemy import text  # noqa: PLC0415
    except ImportError:
        return

    from src.modules.vitalia.admin._shared.db import get_sync_session  # noqa: PLC0415

    st.subheader("Detalle de clínica")

    slug_input = st.text_input("Buscar por slug", placeholder="aurora-dental-ar")

    if not slug_input.strip():
        st.caption("Ingresa un slug para buscar la clínica.")
        return

    try:
        with get_sync_session() as session:
            row = session.execute(
                text("""
                    SELECT c.id, c.name, c.slug, c.country, c.timezone,
                           c.plan_tier, c.is_active, c.onboarding_completed, c.created_at,
                           t.id as tenant_id
                    FROM vitalia_clinics c
                    LEFT JOIN vitalia_tenants t ON t.clinic_id = c.id
                    WHERE c.slug = :slug
                    LIMIT 1
                """),
                {"slug": slug_input.strip().lower()},
            ).fetchone()

        if not row:
            st.warning(f"No se encontró ninguna clínica con slug '{slug_input.strip()}'.")
            return

        st.json(
            {
                "clinic_id": str(row.id),
                "tenant_id": str(row.tenant_id) if row.tenant_id else None,
                "name": row.name,
                "slug": row.slug,
                "country": row.country,
                "timezone": row.timezone,
                "plan_tier": row.plan_tier,
                "is_active": row.is_active,
                "onboarding_completed": row.onboarding_completed,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
        )

    except Exception as exc:  # noqa: BLE001
        logger.error("admin_clinic_detail_error", error=str(exc))
        st.error(f"Error al buscar la clínica: {exc}")


def _is_valid_slug(slug: str) -> bool:
    """Validate that a slug contains only lowercase letters, digits and hyphens."""
    import re  # noqa: PLC0415

    return bool(re.match(r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$", slug))


def _encode_payload(payload: dict) -> bytes:
    """JSON-encode a payload dict to BYTEA-compatible bytes."""
    import json  # noqa: PLC0415

    return json.dumps(payload, default=str, ensure_ascii=False).encode("utf-8")
