---
story_id: empleados-ia-auto-extension
created_at: 2026-06-01T16:00:00-05:00
last_modified: 2026-06-01T17:30:00-05:00
notes_count: 1
refs_count: 4
conversation_count: 2
---

<!-- voseo-allowed: cocina conversacional interna Chris↔Claude (no user-facing); registro coloquial + citas de pedidos de usuario -->

# chris-input.md · empleados-ia-auto-extension

> Cocina de la story (conversación + verdicts), separada de los outputs (`00-research.md` / `00-story.md`).
> Doc canónico: `docs/process/chris-input-protocol.md`.

## 💭 Notas

### 2026-06-01 (sesión 2026-05-31 → 06-01)

Visión de Chris, en sus palabras (resumen de la sesión):

- Software agentic donde **si el usuario pide algo que el sistema no hace, lo creamos** — el agente actúa como analista de sistemas + UX, propone, y tras confirmación construye; notifica y aparece funcional.
- El software es **usable sin el agente** (determinista) — el agente extiende, no es requisito.
- **Cada módulo = un puesto de trabajo orientado a proceso, con su "agente"** dueño de su área (Adrián=ventas/sales agent, Lucas=growth/marketing, etc.). Llevarlo a "vender empleados-IA".
- Base obligatoria = "Mi Clínica" (Lisa) + Configuración. Cadena de valor vendible: Atraer (Lucas) · Vender (Adrián) · Operar (Mateo) · Retener (Camila). Vendibles sueltos / combinados / packs.
- Cada agente hace cualquiera de las acciones (los tiers) sobre sus capacidades y/o las extiende; coordina con otros directo o vía la supervisora (lo que funcione mejor calidad/precio).
- La supervisora (Valeria/Luana) interpreta, conoce qué hace cada trabajador, organiza, y cada uno entrega; labores automatizables.
- Cross-brand: Nicolify vs Vitalia comparten ~60% de procesos, ~40% difiere (esperado).
- Disciplina: **principios SOLID** en el manejo del trabajo de los agentes.
- Esto **complementa** el paradigma previo (3 planos), no lo contradice. Sobre un **core con la lógica de negocio**.

## 📎 Referencias

- **📄 doc** · `docs/architecture/luana-platform/PARADIGM.md` (3 planos — doctrina que esto evoluciona)
- **📄 doc** · `docs/architecture/luana-platform/ADR-010-orquestacion-agentica.md`
- **📄 doc** · `vitalia/docs/architecture/SYSTEM-MAP.yaml` + `ADR-vitalia-005` (primera instancia: 3 zonas/12 cajas)
- **📚 learning-ref** · MEMORY `luana-empleados-ia-vision` (índice pointer-first del avance de esta sesión)

## 💬 Conversación

> Append-only · Verdict labels: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-06-01 16:00 · 🤖 claude · `/pm-luana` · ✓ APLICADO
Story platform creada en `state: idea` bundleando toda la investigación + decisiones de la sesión 2026-05-31→06-01. Artefactos: `00-research.md` (SSoT: panorama en capas + estado del arte 2026 citado + 12 primitivas × tiers + router 2-niveles + flujo durable 1ª clase + coordinación 3-modos + SOLID + 4 casos borde como tests + grounding vitalia/HIPAA + trayectoria B→A), `00-story.md` (JTBD), `checkpoint.md`.

Decisiones cementadas y registradas: metáfora maestra (empleados-IA por puesto sobre un motor) · cross-brand 60/40 (Liskov) · coordinación 3-modos (coreografía espina / supervisora orquesta / handoff directo medido) · SOLID con ownership de construcción en el dueño (la supervisora reenvía intención, no construye) · flujo = unidad durable de 1ª clase · 4 refinamientos del estrés-test (read/write split · techo de core · verbos-sobre-objetos + T0 inteligente · separación de poderes).

**Falta tu decisión (§14 del research):** ¿promovemos a **ADR-platform** (evolución PARADIGM.md/ADR-010) + outcome + stories derivadas por marca [vía recomendada — el "reset" que pediste], o **refining directo**? Luego `/architect` arranca la implementación B→A por el spike del **motor de flujos durables** (cornerstone). NO toqué PARADIGM.md/ADR-010 ni nada de implementación todavía — eso es el siguiente paso que vos gatillás.

### 2026-06-01 17:30 · 🤖 claude · `/pm-luana` · ✓ APLICADO
Ratificaste vía **(a)**. Promoví el paradigma a nivel plataforma:
- **`ADR-013-empleados-ia-auto-extension.md`** (accepted) — cementa D1 motor auto-extensión (12 primitivas × 5 tiers + router 2-niveles + flywheel) · D2 flujo durable 1ª clase · D3 coordinación 3-modos · D4 SOLID + ownership · D5 producto-empleados-por-puesto + cross-brand 60/40 · D6 techo de core + separación de poderes. Extiende ADR-010 (no lo reescribe).
- **`docs/product/outcomes/empleados-ia-auto-extension-platform.md`** — outcome platform con el trabajo derivado como **handoffs** (spike flujos durables → /architect; stories por marca → /pm-vitalia + /pm-nicolify; read-models; entitlement).
- **`PARADIGM.md` §5b** + puntero en ADR-010 (Extended by ADR-013).

NO escribí stories de marca (eso es de los `/pm-{brand}` — anti-creep) ni nada de implementación. Próximo gatillo tuyo: `/architect` para el spike, o `/pm-{brand}` para instanciar. Ahora: commit por pathspec + reporte de sync con main.
