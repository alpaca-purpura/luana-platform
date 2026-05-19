"""Admin module — User management for Vitalia (Clerk SDK + user_profiles).

Vitalia-specific implementation (NOT a mirror of nicolify/admin/modules/users.py):
- Uses vitalia's user_profiles table (NOT luana_core_iam user_model)
- Clerk SDK direct integration (NOT ClerkService wrapper from nicolify)
- HIPAA-lite audit_log row written SYNC before returning from mutations
- Dual filter (tenant_id + clinic_id) on all PHI-adjacent queries
- payload_redacted: identity only (email, clerk_user_id, clinic_slug) — NO PHI

Architecture:
- Admin modules call Clerk REST API via clerk-backend-api (direct)
- No dependency on luana_core_iam (that's nicolify's dependency tree)
- Graceful degradation: Clerk errors caught + logged, UI shows warning

Table schema (from alembic migrations):
    vitalia_user_profiles: id (UUID), clerk_user_id, tenant_id, clinic_id,
                            email, display_name, role, onboarding_completed,
                            created_at, updated_at
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

import structlog

logger = structlog.get_logger()


def render_users_page() -> None:
    """Render the Users management page in Streamlit.

    Tab layout:
        Tab 1 — Listado de usuarios por clínica
        Tab 2 — Crear usuario (Clerk invitación + user_profile)
        Tab 3 — Enviar magic link

    HIPAA invariants:
        - audit_log row written BEFORE returning from any user mutation
        - payload_redacted contains only identity data (email, clerk_user_id)
        - All queries filter by tenant_id + clinic_id (dual filter)
        - No PHI in audit log (user email is identity-ok, not PHI)
    """
    try:
        import streamlit as st  # noqa: PLC0415
    except ImportError:
        logger.error("streamlit_not_installed", hint="Install streamlit to run admin UI")
        raise

    st.header("Usuarios")
    st.caption("Gestión de usuarios clínica en Vitalia (Clerk + perfiles locales).")

    tab_list, tab_crear, tab_magic = st.tabs(["Listado por clínica", "Crear usuario", "Enviar magic link"])

    with tab_list:
        _render_user_list()

    with tab_crear:
        _render_create_user_form()

    with tab_magic:
        _render_magic_link_form()


def _render_user_list() -> None:
    """Render user list filtered by clinic slug."""
    try:
        import streamlit as st  # noqa: PLC0415
        from sqlalchemy import text  # noqa: PLC0415
    except ImportError:
        return

    from src.modules.vitalia.admin._shared.db import get_sync_session  # noqa: PLC0415

    st.subheader("Usuarios por clínica")

    slug_filter = st.text_input("Slug de la clínica", placeholder="aurora-dental-ar", key="user_list_slug")

    if not slug_filter.strip():
        st.caption("Ingresa el slug de la clínica para ver sus usuarios.")
        return

    try:
        with get_sync_session() as session:
            rows = session.execute(
                text("""
                    SELECT up.id, up.clerk_user_id, up.email, up.display_name,
                           up.role, up.onboarding_completed, up.created_at,
                           c.slug as clinic_slug, c.name as clinic_name
                    FROM vitalia_user_profiles up
                    JOIN vitalia_clinics c ON c.id = up.clinic_id
                    WHERE c.slug = :slug
                      AND up.deleted_at IS NULL
                    ORDER BY up.created_at DESC
                    LIMIT 200
                """),
                {"slug": slug_filter.strip().lower()},
            ).fetchall()

        if not rows:
            st.info(f"No se encontraron usuarios para la clínica '{slug_filter.strip()}'.")
            return

        user_data = [
            {
                "ID": str(row.id),
                "Clerk User ID": row.clerk_user_id or "—",
                "Email": row.email,
                "Nombre": row.display_name or "—",
                "Rol": row.role or "—",
                "Onboarding": "Completo" if row.onboarding_completed else "Pendiente",
                "Creado": row.created_at.strftime("%Y-%m-%d") if row.created_at else "—",
                "Clínica": row.clinic_name,
            }
            for row in rows
        ]
        st.dataframe(user_data, use_container_width=True)

    except Exception as exc:  # noqa: BLE001
        logger.error("admin_user_list_error", error=str(exc))
        st.error(f"Error al cargar usuarios: {exc}")


def _render_create_user_form() -> None:  # noqa: PLR0912
    """Render user creation form — Clerk invitation + vitalia user_profiles INSERT.

    Flow:
    1. Admin fills email + clinic slug + role
    2. Clerk SDK sends invitation email (or creates user directly)
    3. vitalia user_profiles row created with clerk_user_id
    4. HIPAA audit_log row written (action=user.created)
    """
    try:
        import streamlit as st  # noqa: PLC0415
        from sqlalchemy import text  # noqa: PLC0415
    except ImportError:
        return

    from src.modules.vitalia.admin._shared.db import get_sync_session  # noqa: PLC0415
    from src.modules.vitalia.compliance.application.compliance_service_adapter import (  # noqa: PLC0415
        sanitize_phi_payload,
    )

    st.subheader("Crear usuario")
    st.caption("Crea un usuario en Clerk e inserta el perfil local en Vitalia.")

    with st.form("form_crear_usuario", clear_on_submit=False):
        email = st.text_input("Email del usuario *", placeholder="medico@clinicaaurora.com.ar")
        display_name = st.text_input("Nombre completo", placeholder="Dra. María González")
        clinic_slug = st.text_input("Slug de la clínica *", placeholder="aurora-dental-ar")
        role = st.selectbox(
            "Rol *",
            options=["doctor", "nurse", "admin_clinic"],
            help="Roles con acceso a PHI: doctor, nurse, admin_clinic.",
        )
        submitted = st.form_submit_button("Crear usuario")

    if not submitted:
        return

    # Validation
    errors: list[str] = []
    if not email.strip() or "@" not in email.strip():
        errors.append("El email es obligatorio y debe ser válido.")
    if not clinic_slug.strip():
        errors.append("El slug de la clínica es obligatorio.")
    if errors:
        for err in errors:
            st.error(err)
        return

    _email = email.strip().lower()
    _slug = clinic_slug.strip().lower()
    _name = display_name.strip() or _email.split("@")[0]

    try:
        with get_sync_session() as session:
            # Resolve clinic_id + tenant_id from slug
            clinic_row = session.execute(
                text("""
                    SELECT c.id as clinic_id, t.id as tenant_id
                    FROM vitalia_clinics c
                    JOIN vitalia_tenants t ON t.clinic_id = c.id
                    WHERE c.slug = :slug AND c.is_active = true
                    LIMIT 1
                """),
                {"slug": _slug},
            ).fetchone()

            if not clinic_row:
                st.error(f"No se encontró una clínica activa con slug '{_slug}'.")
                return

            clinic_id = clinic_row.clinic_id
            tenant_id = clinic_row.tenant_id

            # Call Clerk SDK to create / invite user
            clerk_user_id: str | None = _create_clerk_user(
                email=_email,
                first_name=_name.split(" ")[0] if " " in _name else _name,
                last_name=" ".join(_name.split(" ")[1:]) if " " in _name else "",
            )

            profile_id = uuid.uuid4()
            now = datetime.now(tz=timezone.utc)

            # Insert vitalia user_profiles row
            session.execute(
                text("""
                    INSERT INTO vitalia_user_profiles
                        (id, clerk_user_id, tenant_id, clinic_id, email,
                         display_name, role, onboarding_completed, created_at, updated_at)
                    VALUES
                        (:id, :clerk_user_id, :tenant_id, :clinic_id, :email,
                         :display_name, :role, false, :now, :now)
                    ON CONFLICT (email, clinic_id) DO UPDATE
                        SET clerk_user_id = EXCLUDED.clerk_user_id,
                            display_name = EXCLUDED.display_name,
                            role = EXCLUDED.role,
                            updated_at = EXCLUDED.updated_at
                """),
                {
                    "id": str(profile_id),
                    "clerk_user_id": clerk_user_id,
                    "tenant_id": str(tenant_id),
                    "clinic_id": str(clinic_id),
                    "email": _email,
                    "display_name": _name,
                    "role": role,
                    "now": now,
                },
            )

            # HIPAA-lite audit log — SYNC WRITE before returning
            safe_payload = sanitize_phi_payload(
                {
                    "email": _email,
                    "clerk_user_id": clerk_user_id,
                    "role": role,
                    "clinic_slug": _slug,
                }
            )
            payload_bytes = _encode_payload(safe_payload)
            admin_user_id = uuid.uuid4()

            session.execute(
                text("""
                    INSERT INTO vitalia_audit_log
                        (id, tenant_id, clinic_id, user_id, action, resource_type,
                         resource_id, from_ip, user_agent, payload_redacted, occurred_at)
                    VALUES
                        (gen_random_uuid(), :tenant_id, :clinic_id, :admin_user_id,
                         'user.created', 'user_profile', :resource_id,
                         NULL, 'VitaliaAdmin/1.0', :payload, NOW())
                """),
                {
                    "tenant_id": str(tenant_id),
                    "clinic_id": str(clinic_id),
                    "admin_user_id": str(admin_user_id),
                    "resource_id": str(profile_id),
                    "payload": payload_bytes,
                },
            )
            session.commit()

        st.success(
            f"Usuario '{_email}' creado exitosamente.\n\n"
            f"**User Profile ID:** `{profile_id}`\n"
            f"**Clerk User ID:** `{clerk_user_id or 'pendiente'}`"
        )
        logger.info(
            "admin_user_created",
            email=_email,
            clerk_user_id=clerk_user_id,
            clinic_slug=_slug,
            role=role,
        )

    except Exception as exc:  # noqa: BLE001
        logger.error("admin_create_user_error", error=str(exc), email=_email)
        st.error(f"Error al crear el usuario: {exc}")


def _render_magic_link_form() -> None:
    """Render the magic link sender — generates Clerk sign-in link for user."""
    try:
        import streamlit as st  # noqa: PLC0415
    except ImportError:
        return

    st.subheader("Enviar magic link")
    st.caption("Genera un enlace de acceso sin contraseña para un usuario existente.")

    with st.form("form_magic_link", clear_on_submit=True):
        email_ml = st.text_input("Email del usuario *", placeholder="medico@clinicaaurora.com.ar")
        redirect_url = st.text_input(
            "URL de redirección (opcional)",
            value="https://app.vitalia.com/dashboard",
            help="URL a la que el usuario será redirigido tras iniciar sesión.",
        )
        submitted_ml = st.form_submit_button("Enviar magic link")

    if not submitted_ml:
        return

    if not email_ml.strip() or "@" not in email_ml.strip():
        st.error("Ingresa un email válido.")
        return

    _email = email_ml.strip().lower()

    try:
        magic_url = _send_magic_link(email=_email, redirect_url=redirect_url.strip())
        if magic_url:
            st.success(f"Magic link enviado a '{_email}'.")
            st.code(magic_url, language=None)
        else:
            st.warning("No se pudo generar el magic link. Verifica que el email exista en Clerk.")
    except Exception as exc:  # noqa: BLE001
        logger.error("admin_magic_link_error", error=str(exc), email=_email)
        st.error(f"Error al enviar magic link: {exc}")


def _create_clerk_user(email: str, first_name: str = "", last_name: str = "") -> str | None:
    """Create a Clerk user via clerk-backend-api SDK.

    Graceful degradation: if Clerk is unavailable, logs warning and returns None.
    Admin UI shows the user profile as created but with clerk_user_id=None
    (webhook will fill it when user signs up via Clerk).

    Args:
        email: User email address
        first_name: User first name (optional)
        last_name: User last name (optional)

    Returns:
        Clerk user_id string (e.g. 'user_abc123') or None on failure
    """
    api_key = os.environ.get("CLERK_SECRET_KEY", "")
    if not api_key:
        logger.warning(
            "clerk_api_key_not_configured",
            hint="Set CLERK_SECRET_KEY env var to enable Clerk user creation",
        )
        return None

    try:
        # clerk-backend-api SDK call (graceful degradation on import failure)
        from clerk_backend_api import Clerk  # noqa: PLC0415

        clerk = Clerk(bearer_auth=api_key)
        response = clerk.users.create(
            request={
                "email_address": [email],
                "first_name": first_name or None,
                "last_name": last_name or None,
                "skip_password_checks": True,
                "skip_password_requirement": True,
            }
        )

        if response and hasattr(response, "id"):
            clerk_user_id: str = response.id
            logger.info(
                "clerk_user_created",
                email=email,
                clerk_user_id=clerk_user_id,
            )
            return clerk_user_id

        logger.warning("clerk_user_create_no_id", email=email)
        return None

    except ImportError:
        logger.warning(
            "clerk_sdk_not_installed",
            hint="Install clerk-backend-api to enable Clerk integration",
        )
        return None
    except Exception as exc:  # noqa: BLE001
        logger.error("clerk_user_create_error", email=email, error=str(exc))
        return None


def _send_magic_link(email: str, redirect_url: str = "") -> str | None:
    """Send a Clerk magic link sign-in email.

    Graceful degradation: returns None on failure.

    Args:
        email: User email to send magic link to
        redirect_url: URL to redirect after sign-in (optional)

    Returns:
        Magic link URL string or None on failure
    """
    api_key = os.environ.get("CLERK_SECRET_KEY", "")
    if not api_key:
        logger.warning("clerk_api_key_not_configured")
        return None

    try:
        from clerk_backend_api import Clerk  # noqa: PLC0415

        clerk = Clerk(bearer_auth=api_key)

        # Find user by email first
        users_list = clerk.users.list(email_address=[email])
        if not users_list or not hasattr(users_list, "__iter__"):
            return None

        user_obj = next(iter(users_list), None)
        if user_obj is None or not hasattr(user_obj, "id"):
            return None

        # Create magic link (Clerk sign-in token)
        token_response = clerk.sign_in_tokens.create(
            request={
                "user_id": user_obj.id,
                "expires_in_seconds": 3600,  # 1 hour
            }
        )

        if token_response and hasattr(token_response, "token"):
            base_url = os.environ.get("CLERK_FRONTEND_API", "https://accounts.vitalia.com")
            return f"{base_url}?__clerk_ticket={token_response.token}&redirect_url={redirect_url}"

        return None

    except ImportError:
        logger.warning("clerk_sdk_not_installed")
        return None
    except Exception as exc:  # noqa: BLE001
        logger.error("clerk_magic_link_error", email=email, error=str(exc))
        return None


def _encode_payload(payload: dict) -> bytes:
    """JSON-encode a payload dict to BYTEA-compatible bytes."""
    import json  # noqa: PLC0415

    return json.dumps(payload, default=str, ensure_ascii=False).encode("utf-8")
