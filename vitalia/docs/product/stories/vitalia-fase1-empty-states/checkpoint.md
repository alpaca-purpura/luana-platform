---
story_id: vitalia-fase1-empty-states
outcome: vitalia-mvp-ui-foundation
phase: fase-1
type: ui-story
agent_owner: shell
module: shell-organism
capability: shell.empty-states
state: idea
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: false
priority: critical
estimated_dev_days: 2-3
dependencies:
  hard: [vitalia-fase1-routing-shell, vitalia-fase1-sub-tabs-line2]
  soft: []
blocks_hard: []                                    # último átomo Fase 1 — Fase 2 puede arrancar después
reuse_map_summary: "NEW EmptyState + PlaceholderCard componentes · 22 SubTabContent variants placeholder · special UI para Lisa Servicios, Adrián Embudo, Adrián Inbox, Camila Voz, Valeria Agenda, Config Conexiones (per mockup HTML)"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md"
---

# F1-S10 vitalia-fase1-empty-states — checkpoint

## Goal

Última story Fase 1: implementar `SubTabContent` que renderiza 22 sub-tab pages con empty-states navegables. Para 6 sub-tabs especiales del mockup HTML, replicar la UI placeholder rica (Lisa Servicios con toggle Catálogo|Escalera + cards · Adrián Embudo Kanban 6 cols · Adrián Inbox 3-modos + 3-column · Camila Voz 3-modos + 3 cards · Valeria Agenda grilla semana + slot states · Config Conexiones 6 categorías). Las otras 16 sub-tabs: empty-state genérico.

## Anti-objetivos

- NO contenido funcional real (eso es Fase 2 — cada sub-tab tiene su story dedicada)
- NO interactividad real Kanban DnD (Fase 2)
- NO data fetching real (mock hardcoded en components)

## Scope verbatim

### § 1 — `SubTabContent` dispatcher

`vitalia/frontend/src/components/shared/shell-organism/SubTabContent.tsx`:

```tsx
import { LisaMarcaPlaceholder, LisaDoctoresPlaceholder, LisaServiciosPlaceholder, LisaCompliancePlaceholder } from '@/features/lisa/components/placeholders'
// ... similar para todos agentes

const PLACEHOLDER_MAP = {
  'lisa.marca':           LisaMarcaPlaceholder,
  'lisa.doctores':        LisaDoctoresPlaceholder,
  'lisa.servicios':       LisaServiciosPlaceholder,    // special: toggle Catálogo|Escalera + cards
  'lisa.compliance':      LisaCompliancePlaceholder,
  'lucas.lanzar':         LucasLanzarPlaceholder,
  'lucas.envuelo':        LucasEnvueloPlaceholder,
  'lucas.recursos':       LucasRecursosPlaceholder,
  'lucas.resultados':     LucasResultadosPlaceholder,
  'lucas.mercado':        LucasMercadoPlaceholder,
  'adrian.inbox':         AdrianInboxPlaceholder,      // special: 3-modos + 3-column layout
  'adrian.embudo':        AdrianEmbudoPlaceholder,     // special: toggle Kanban|Lista + 6 cols
  'adrian.outbound':      AdrianOutboundPlaceholder,
  'adrian.propuestas':    AdrianPropuestasPlaceholder,
  'valeria.agenda':       ValeriaAgendaPlaceholder,    // special: grilla semana + slot states
  'valeria.pacientes':    ValeriaPacientesPlaceholder,
  'camila.voz':           CamilaVozPlaceholder,        // special: 3-modos + 3 cards (Entrante · Curaduría · Activos)
  'camila.reactivar':     CamilaReactivarPlaceholder,
  'camila.multiplicar':   CamilaMultiplicarPlaceholder,
  'camila.reputacion':    CamilaReputacionPlaceholder,
  'config.cuenta':        ConfigCuentaPlaceholder,
  'config.conexiones':    ConfigConexionesPlaceholder, // special: 6 categorías grid
  'config.avanzado':      ConfigAvanzadoPlaceholder,
}

export function SubTabContent({ agent, subtab }: { agent: AgentKey, subtab: string }) {
  const Placeholder = PLACEHOLDER_MAP[`${agent}.${subtab}` as keyof typeof PLACEHOLDER_MAP]
  if (!Placeholder) return <GenericEmptyState agent={agent} subtab={subtab} />

  return (
    <div className="p-7">
      <SubTabHeader agent={agent} subtab={subtab} />
      <Placeholder />
    </div>
  )
}
```

### § 2 — `EmptyState` molécula generic

`vitalia/frontend/src/components/shared/shell-organism/EmptyState.tsx`:

```tsx
interface Props {
  icon: string  // emoji
  title: string
  description: string
  action?: { label: string, onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <div className="text-5xl mb-3 opacity-50">{icon}</div>
      <div className="text-base font-semibold text-foreground mb-2">{title}</div>
      <div className="text-sm max-w-md">{description}</div>
      {action && <Button className="mt-4" onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
```

### § 3 — `PlaceholderCard` molécula

`vitalia/frontend/src/components/shared/shell-organism/PlaceholderCard.tsx`:

Card con icon + title + desc + status dot (shipped · planned · todo) per mockup HTML.

### § 4 — `SubTabHeader` molécula

Title (label sub-tab) + descripción (del AGENT_SUBTABS metadata) + opcional CTA.

### § 5 — Placeholders especiales (mockup parity)

#### § 5.1 — `LisaServiciosPlaceholder`

Toggle Catálogo|Escalera (Shadcn Tabs) + grid 4-5 PlaceholderCards (Limpieza · Blanqueamiento · Implante · Mantenimiento · Nuevo tratamiento) — verbatim mockup HTML.

#### § 5.2 — `AdrianEmbudoPlaceholder`

Toggle Kanban|Lista + 6 columnas Pipeline (Interesado · Calificando · Considerando · Listo · Reservado · Decidió no) con leads mock dummy (3 per column). Per mockup HTML pipeline section.

#### § 5.3 — `AdrianInboxPlaceholder`

Toggle 3-modos (decide · consulta · manual) + 3-column layout (ConversationList 240px · ConversationThread 1fr · ContactSidebar 220px) con mock data. Per mockup HTML inbox section.

#### § 5.4 — `CamilaVozPlaceholder`

Toggle 3-modos + 3 PlaceholderCards (Entrante 12 · En curaduría 4 · Activos vivos 47) con status dots. Per mockup HTML camila section.

#### § 5.5 — `ValeriaAgendaPlaceholder`

Botón "Crear cita" + legend 4 status (Pagado/Depósito/Sin pago/No-show) + grilla 5 días × 8 horas + slots mock (6 slots con status + origen icons) per mockup HTML agenda section.

#### § 5.6 — `ConfigConexionesPlaceholder`

Grid 6 categorías (Marketing/Mensajería/Pagos/Calendarios/Presencia/Técnicas) con icons + status. Per mockup HTML conexiones section.

### § 6 — Genéricos (16 restantes)

Para el resto: `<EmptyState>` con icon contextual + título "{subtab} próximamente" + descripción "Esta vista vive acá. Mockup navegable — el contenido real se diseña por historia."

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | 22 sub-tab pages navegables sin 404 |
| AC-2 | 6 sub-tabs especiales replican UI mockup HTML pixel-cercano |
| AC-3 | 16 sub-tabs genéricas usan EmptyState consistente |
| AC-4 | SubTabHeader visible con title + description |
| AC-5 | Visual goldens 22 sub-tabs (light + dark = 44 snapshots) |
| AC-6 | a11y: empty-states tienen heading hierarchy correcta (h2, h3) |
| AC-7 | Mobile responsive sub-tabs especiales (grid colapsa) |
| AC-8 | Playwright functional: visit todas las 22 URLs · cada renderiza sin error |
| AC-9 | Vitest unit por placeholder especial |
| AC-10 | Toggle Catálogo|Escalera + Kanban|Lista + 3-modos: cambia state local (no funcional Fase 1) |

## Gherkin scenarios

### Scenario 1 — happy navigation all sub-tabs

**Given:** Usuario en shell

**When:** Click ribbon agent → click cada sub-tab para los 6 agentes (22 combos)

**Then:** Cada sub-tab renderiza su placeholder · no console errors · no 404

### Scenario 2 — special placeholder Lisa Servicios

**Given:** URL `/{tenant}/lisa/servicios`

**When:** Página carga

**Then:**
- Toggle Catálogo|Escalera visible
- Grid 4-5 PlaceholderCards con treatments mock
- Click toggle "Escalera" cambia view (mock — placeholder canvas)

### Scenario 3 — special placeholder Adrián Embudo

**Given:** URL `/{tenant}/adrian/embudo`

**When:** Página carga

**Then:**
- Toggle Kanban|Lista visible (Kanban default)
- 6 columnas horizontal scroll
- Cada col: header con stage label + count + value mock
- 3 dummy leads per columna

### Scenario 4 — special placeholder Valeria Agenda

**Given:** URL `/{tenant}/valeria/agenda`

**When:** Página carga

**Then:**
- Botón "Crear cita" visible
- Legend 4 status visible
- Grilla 5 días × 8 horas
- 6 slots mock con border-left color status + icons origen

### Scenario 5 — visual parity con mockup

**Given:** Cualquier sub-tab especial

**When:** Playwright `toHaveScreenshot()`

**Then:** Pixel match (tolerance 0.001) con sección equivalente del mockup HTML

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/components/shared/shell-organism/SubTabContent.tsx` | NEW (dispatcher) |
| `vitalia/frontend/src/components/shared/shell-organism/SubTabHeader.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/EmptyState.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/PlaceholderCard.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/placeholders/{Marca,Doctores,Servicios,Compliance}Placeholder.tsx` | NEW (4 files) |
| `vitalia/frontend/src/features/lucas/components/placeholders/{Lanzar,Envuelo,Recursos,Resultados,Mercado}Placeholder.tsx` | NEW (5 files) |
| `vitalia/frontend/src/features/adrian/components/placeholders/{Inbox,Embudo,Outbound,Propuestas}Placeholder.tsx` | NEW (4 files) |
| `vitalia/frontend/src/features/valeria/components/placeholders/{Agenda,Pacientes}Placeholder.tsx` | NEW (2 files) |
| `vitalia/frontend/src/features/camila/components/placeholders/{Voz,Reactivar,Multiplicar,Reputacion}Placeholder.tsx` | NEW (4 files) |
| `vitalia/frontend/src/features/config/components/placeholders/{Cuenta,Conexiones,Avanzado}Placeholder.tsx` | NEW (3 files) |
| `vitalia/frontend/e2e/shell-organism/empty-states.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/shell/subtabs/{agent}-{subtab}-{light,dark}.png` | NEW (44 goldens) |

## Próximo paso post-done

**FASE 1 COMPLETA** — shell vacío navegable production-ready. Fase 2 puede arrancar. Prioridad sugerida: F2-S3 adrian-inbox (alto reuse de sales_agent+inbox shipped) o F2-S1 valeria-agenda (refactor desde slice-1-agenda).
