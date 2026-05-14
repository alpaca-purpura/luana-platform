"""Seed fixture creators for Comunify dev/staging (Story 12 T-docs-1).

Creates 3 LATAM creator tenants with pre-configured brand voice profiles:
  - Anabella García (es-AR, coaching, voseo)
  - Trinidad Fuentes (es-CL, nutrition, tuteo)
  - Pablo Ramírez (es-MX, productivity, tuteo)

Idempotent: safe to run multiple times. Uses upsert (insert-or-ignore) semantics.

Usage:
    cd /home/chris/luana-platform/comunify/backend
    uv run python scripts/seed_fixture_creators.py

    # Or with custom database URL:
    DATABASE_URL=postgresql+asyncpg://... uv run python scripts/seed_fixture_creators.py

    # Dry-run (print SQL, no execute):
    DRY_RUN=1 uv run python scripts/seed_fixture_creators.py
"""

from __future__ import annotations

import asyncio
import os
import sys
from dataclasses import dataclass, field
from typing import Any

# ---------------------------------------------------------------------------
# Fixture data
# ---------------------------------------------------------------------------

@dataclass
class CreatorFixture:
    """Single creator tenant fixture."""

    tenant_slug: str
    display_name: str
    creator_name: str
    locale: str
    vertical: str
    brand_voice: dict[str, Any]
    personality_system_instruction: str
    plan: str = "growth"


_FIXTURES: list[CreatorFixture] = [
    CreatorFixture(
        tenant_slug="anabella-coaching-ar",
        display_name="Anabella Coaching",
        creator_name="Anabella García",
        locale="es-AR",
        vertical="coaching",
        brand_voice={
            "tone": "warmly_assertive",
            "formality": "informal_voseo",
            "emoji_density": "moderate",
            "vocabulary_anchors": [
                "te acompaño",
                "vamos juntas",
                "desde el amor",
                "paso a paso",
                "confiá en el proceso",
            ],
            "forbidden_phrases": [
                "oferta limitada",
                "no podés perderte esto",
                "solo quedan cupos",
            ],
            "closing_style": "warm_invitation",
            "escalation_warmth": 0.95,
        },
        personality_system_instruction=(
            "Sos el asistente de Anabella García, coach de vida y negocios en Argentina. "
            "Comunicate con calidez genuina usando voseo rioplatense natural: 'vos sabés que', "
            "'te entiendo', 'vamos juntas'. Nunca presiones con urgencia artificial. "
            "Si alguien menciona dificultades emocionales profundas, escucha con empatía "
            "y derivá a recursos profesionales. El precio de la membresía no se discute "
            "con culpa ni presión — se presenta con claridad y confianza."
        ),
        plan="growth",
    ),
    CreatorFixture(
        tenant_slug="trini-nutrition-cl",
        display_name="Trini Nutrición",
        creator_name="Trinidad Fuentes",
        locale="es-CL",
        vertical="nutrition",
        brand_voice={
            "tone": "professional_warm",
            "formality": "informal_tuteo",
            "emoji_density": "low",
            "vocabulary_anchors": [
                "te acompaño",
                "desde la ciencia",
                "sin dietas restrictivas",
                "hábitos sostenibles",
                "bienestar real",
            ],
            "forbidden_phrases": [
                "dieta milagro",
                "resultados en 7 días",
                "pierde peso rápido",
                "sin esfuerzo",
            ],
            "closing_style": "professional_invitation",
            "escalation_warmth": 0.90,
        },
        personality_system_instruction=(
            "Eres el asistente de Trinidad Fuentes, nutricionista clínica en Chile. "
            "Comunica con profesionalismo y calidez. Usa tuteo chileno natural: 'tú', 'puedes', 'tienes'. "
            "Nunca hagas diagnósticos clínicos ni planes de alimentación sin consulta profesional. "
            "Si alguien menciona relación problemática con la comida, trastornos alimentarios, "
            "o señales de angustia emocional, responde con empatía, valida su experiencia, "
            "y proporciona recursos de ayuda profesional (ACHS Salud Mental: 600 600 7777). "
            "La membresía se comunica como una inversión en salud sostenible, nunca como solución rápida."
        ),
        plan="starter",
    ),
    CreatorFixture(
        tenant_slug="pablo-productividad-mx",
        display_name="Pablo Productividad",
        creator_name="Pablo Ramírez",
        locale="es-MX",
        vertical="productivity",
        brand_voice={
            "tone": "energetic_friendly",
            "formality": "informal_tuteo",
            "emoji_density": "moderate",
            "vocabulary_anchors": [
                "enfoque claro",
                "sistemas que funcionan",
                "sin complicarte la vida",
                "resultados reales",
                "te tengo",
            ],
            "forbidden_phrases": [
                "hazte millonario",
                "trabaja menos gana más sin esfuerzo",
                "el secreto que nadie te cuenta",
            ],
            "closing_style": "action_oriented",
            "escalation_warmth": 0.85,
        },
        personality_system_instruction=(
            "Eres el asistente de Pablo Ramírez, coach de productividad y enfoque en México. "
            "Comunica con energía positiva y tuteo mexicano natural: 'tú', 'puedes', 'tienes'. "
            "Sé directo y práctico — ofrece claridad, no promesas vacías. "
            "Nunca uses lenguaje de 'guru' o promesas de riqueza fácil. "
            "Si alguien menciona agotamiento extremo, crisis de ansiedad, o señales de burnout severo, "
            "valida su experiencia y proporciona recursos (SAPTEL: 55 5259-8121). "
            "La membresía se presenta como herramienta de sistemas, no como solución mágica."
        ),
        plan="growth",
    ),
]


# ---------------------------------------------------------------------------
# Seed logic (idempotent)
# ---------------------------------------------------------------------------

async def seed_creators(dry_run: bool = False) -> None:
    """Seed creator tenants into the database. Idempotent (upsert semantics)."""
    database_url = os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://comunify:comunify@localhost:5432/comunify_dev",
    )

    print(f"Seeding {len(_FIXTURES)} creator fixtures...")
    if dry_run:
        print("DRY RUN — no database writes.")
        print()

    for fixture in _FIXTURES:
        if dry_run:
            print(f"  [DRY] Would upsert tenant: {fixture.tenant_slug} ({fixture.creator_name})")
            print(f"        locale={fixture.locale}, vertical={fixture.vertical}, plan={fixture.plan}")
            continue

        # Real upsert — requires SQLAlchemy async session from comunify src
        # This is a lightweight script; import inline to avoid circular import risk
        try:
            from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
            from sqlalchemy.orm import sessionmaker
            from sqlalchemy import text

            engine = create_async_engine(database_url, echo=False)
            async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

            async with async_session() as session:
                # Upsert tenant
                await session.execute(
                    text("""
                        INSERT INTO tenants (slug, display_name, locale, plan, vertical, created_at)
                        VALUES (:slug, :display_name, :locale, :plan, :vertical, NOW())
                        ON CONFLICT (slug) DO UPDATE SET
                            display_name = EXCLUDED.display_name,
                            locale = EXCLUDED.locale,
                            plan = EXCLUDED.plan,
                            vertical = EXCLUDED.vertical
                    """),
                    {
                        "slug": fixture.tenant_slug,
                        "display_name": fixture.display_name,
                        "locale": fixture.locale,
                        "plan": fixture.plan,
                        "vertical": fixture.vertical,
                    },
                )

                # Upsert personality profile
                import json
                await session.execute(
                    text("""
                        INSERT INTO personality_profiles
                            (tenant_slug, creator_name, system_instruction, brand_voice_json, updated_at)
                        VALUES (:tenant_slug, :creator_name, :system_instruction, :brand_voice_json, NOW())
                        ON CONFLICT (tenant_slug) DO UPDATE SET
                            creator_name = EXCLUDED.creator_name,
                            system_instruction = EXCLUDED.system_instruction,
                            brand_voice_json = EXCLUDED.brand_voice_json,
                            updated_at = NOW()
                    """),
                    {
                        "tenant_slug": fixture.tenant_slug,
                        "creator_name": fixture.creator_name,
                        "system_instruction": fixture.personality_system_instruction,
                        "brand_voice_json": json.dumps(fixture.brand_voice, ensure_ascii=False),
                    },
                )

                await session.commit()
                print(f"  OK: {fixture.tenant_slug} ({fixture.creator_name})")

            await engine.dispose()

        except ImportError as e:
            print(f"  WARN: SQLAlchemy not available ({e}). Run inside comunify backend venv.")
            print(f"  [SKIP] {fixture.tenant_slug}")
        except Exception as e:
            print(f"  ERROR: {fixture.tenant_slug} — {e}")

    print()
    print("Seed complete.")
    if not dry_run:
        print("Tenants seeded:")
        for f in _FIXTURES:
            print(f"  - {f.tenant_slug} ({f.locale})")


def main() -> None:
    dry_run = os.environ.get("DRY_RUN", "0") == "1"
    asyncio.run(seed_creators(dry_run=dry_run))


if __name__ == "__main__":
    main()
