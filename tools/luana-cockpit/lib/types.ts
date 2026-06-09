/**
 * Tipos compartidos del cockpit.
 *
 * Cementación: docs/process/{capability,release,chris-input}-protocol.md + cockpit-permissions.md.
 * Schema v2 (2026-05-27).
 */

// ────────────────────────────────────────────────────────────────────────────
// State machine
// ────────────────────────────────────────────────────────────────────────────

export type StoryState =
  | 'idea'
  | 'refining'
  | 'refined'
  | 'ready'
  | 'developing'
  | 'developed'
  | 'reviewing'
  | 'done'
  | 'parked'
  | 'dropped';

export type ReleaseStatus =
  | 'planning'
  | 'in_progress'
  | 'ready_to_merge'
  | 'shipped'
  | 'backlog';

/**
 * Eje de DESPLIEGUE (separado del eje de integración `ReleaseStatus`).
 * Un release `shipped` (base sólida en main + staging) puede pasarse a producción
 * cuando Chris lo decida. FUTURO: hoy todo queda `not_deployed` · la mecánica real
 * (merge a `release/{brand}-vX.Y.Z` → GH Actions) está deferred hasta servidor real.
 * Ver `.claude/rules/github-actions-deferred.md` + `docs/process/release-protocol.md` § 8.
 */
export type ProductionStatus = 'not_deployed' | 'scheduled' | 'in_production';

export type CapChangeType = 'new' | 'fix' | 'extend' | 'derive';
export type CapStatus = 'live' | 'beta' | 'deprecated' | 'sunset';
export type CapLicense = 'brand-local' | 'core-shared' | 'proprietary';

// ────────────────────────────────────────────────────────────────────────────
// Computed status — state-machine del cockpit (§ B decisions doc)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Estado computado por `scripts/compute_capability_status.py`.
 * NO es el declared status del YAML — es derivado del conjunto de scenarios
 * + verification cross-check.
 */
export type ComputedStatus =
  | 'verified-live'
  | 'declared-live'
  | 'partial'
  | 'wip'
  | 'stub'
  | 'drift'
  | 'deprecated'
  | 'sunset';

export interface CapStatusComputed {
  declared_status: CapStatus;
  computed_status: ComputedStatus;
  scenarios_total: number;
  scenarios_verified: number;
  verification_total: number;
  verification_pass: number;
  drift_reasons: string[];
}

export interface ComputedStatusReport {
  computed_at: string;
  brand: string;
  capabilities: Record<string, CapStatusComputed>; // key = capability slug
  summary: {
    total_caps: number;
    verified_live: number;
    declared_live: number;
    partial: number;
    wip: number;
    stub: number;
    drift: number;
    deprecated: number;
    sunset: number;
  };
}

/** Devuelve emoji + label + color para pintar el badge de computed_status */
export function getStatusBadge(s: ComputedStatus): {
  emoji: string;
  label: string;
  color: string;
} {
  switch (s) {
    case 'verified-live':
      return { emoji: '🟢', label: 'verificado', color: 'green' };
    case 'declared-live':
      return { emoji: '🟡', label: 'declarado', color: 'yellow' };
    case 'partial':
      return { emoji: '🟠', label: 'parcial', color: 'orange' };
    case 'wip':
      return { emoji: '🔵', label: 'wip', color: 'blue' };
    case 'stub':
      return { emoji: '⚪', label: 'stub', color: 'gray' };
    case 'drift':
      return { emoji: '🔴', label: 'drift', color: 'red' };
    case 'deprecated':
      return { emoji: '⚫', label: 'deprecated', color: 'gray' };
    case 'sunset':
      return { emoji: '⚫', label: 'sunset', color: 'gray' };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// v3 cement 2026-05-27 — 4 dimensiones + dev_preview (ADR-vitalia-005)
// ────────────────────────────────────────────────────────────────────────────

// ── Taxonomía de cajas/zonas (SYSTEM-MAP v2.0 · cement 2026-05-30) ──────────
// La caja (`agent_owner` / `map_box`) pertenece a una zona; la zona se DERIVA
// del registro SYSTEM-MAP.yaml (`zones`), nunca se escribe a mano por cap.
export type ZoneId = 'agentes' | 'plataforma' | 'infraestructura';
export type ZoneTier = 'core' | 'supporting' | 'enabling';

/** 5 especialistas con caja de valor en el Ribbon (zona Agentes). */
export type SpecialistAgentId = 'lisa' | 'mateo' | 'adrian' | 'lucas' | 'camila';
/** Cajas transversales user-facing (zona Plataforma). */
export type PlatformBoxId = 'acceso' | 'onboarding' | 'configuracion';
/** Cajas no-funcionales (zona Infraestructura). */
export type InfraBoxId =
  | 'seguridad-cumplimiento'
  | 'observabilidad'
  | 'plataforma-tecnica'
  | 'motor-agentico';
/** Toda caja real del mapa v2.0 (12 cajas). */
export type MapBoxId = SpecialistAgentId | PlatformBoxId | InfraBoxId;

// `valeria` = supervisora (sidebar · runtime motor-agentico, no es caja de valor).
// `config`/`infra` = pseudo-agentes DEPRECATED v2.0 (back-compat lectura caps/stories viejas).
export type AgentOwner = MapBoxId | 'valeria' | 'config' | 'infra';

export type CapNature = 'feature' | 'scaffold' | 'extension-point';

export interface DevPreview {
  route: string | null;
  how_to_navigate: string | null;
  main_component: string | null;
  api_endpoints: string[];
  e2e_test: string | null;
  fixtures_required: string[];
  storybook_url: string | null;
  loom_demo: string | null;
}

// Story types (PROCESS-MODEL §3 · 5 canonical: ui-story · service-story ·
// agentic-story · bugfix · technical-story). Cockpit slugs: 'tech' = technical-story,
// 'bugfix' = WT4. 'func' = legacy alias (pre-W0.5; coexiste durante migración).
export type StoryType = 'ui' | 'service' | 'agentic' | 'bugfix' | 'tech' | 'func';
export type Surface = 'BE' | 'FE' | 'AGENTIC';

// ────────────────────────────────────────────────────────────────────────────
// v5 spine gate fields (PROCESS-MODEL §1,§7 D6① · SSoT story-closure-gate.md +
// definition-of-done-live-verify.md). El read-schema DEBE declararlos: el parser
// (app/api/stories/route.ts) ya los pasa via `...(fm as Story)`, pero sin estos
// tipos los consumidores no los ven type-safe. Producidos por /dev-team + Chris (G).
// ────────────────────────────────────────────────────────────────────────────

/** Resultado de la verificación live de Chris en la fase G (AWAIT_CHRIS_VERIFY). */
export interface ChrisSignoff {
  by?: string;
  date?: string | null;
  /** SATISFIED | SATISFIED_WITH_FOLLOWUPS | REJECTED */
  result?: 'SATISFIED' | 'SATISFIED_WITH_FOLLOWUPS' | 'REJECTED' | null;
  notes?: string | null;
  open_items?: string[] | null;
}

export interface ChrisVerify {
  required?: boolean;
  signoff?: ChrisSignoff | null;
  /** allowlist de scope ratificado: cada corrección anotada + cómo se resolvió. */
  rounds?: unknown[];
}

/** Una acción ejercida live contra el stack dev real + su efecto observado (DoD #37). */
export interface DodEvidenceItem {
  action?: string;
  observed?: string | null;
  backend_log?: string | null;
}

/** Evidencia de reproducción de bug (WT4 · canonical key · repro=local OR trace, D4). */
export interface ReproEvidence {
  repro_verified?: boolean;
  reproduced_local?: boolean;
  trace_evidence?: {
    /** docker-logs | sentry | copilot_trace_event | conversation-log */
    source?: string;
    ref?: string;
  } | null;
}

// ────────────────────────────────────────────────────────────────────────────
// Story (checkpoint.md frontmatter)
// ────────────────────────────────────────────────────────────────────────────

export interface Story {
  story_id: string;
  /** Path absoluto al directorio que contiene checkpoint.md */
  path: string;
  brand: string;

  // Release entity v2
  release: string | null;
  // Legacy outcome (DEPRECATED · 4-ejes purgó outcomes; coexiste durante migración)
  outcome?: string | null;
  /**
   * v5 named-phase (NO legacy) — vive bajo `developed` como `checkpoint.md::phase`,
   * NO es un estado nuevo. Valores: AWAIT_CHRIS_VERIFY (G) · AUTONOMOUS · R · C · D.
   * SSoT: story-closure-gate.md. (Las letras A-F + phase_workflow están RETIRADAS, X6.)
   */
  phase?: string | null;

  // Capability lineage v2
  cap_target: string | null;
  cap_change_type: CapChangeType | null;
  parent_story: string | null;

  // State
  state: StoryState;
  /** @deprecated RETIRED por X6 (W0.5) — plegado en `phase` named-phases. Solo legacy. */
  phase_workflow?: string | null;
  last_artifact?: string | null;
  last_modified?: string | null;
  next_action?: string | null;
  ratified_by_chris?: boolean;
  spawned_at?: string | null;
  spawned_by?: string | null;
  parallel_safe?: boolean;
  blocked_reason?: string | null;
  audit_iterations?: number;
  defer_audit?: boolean;
  defer_audit_reason?: string | null;
  parked_reason?: string | null;
  dropped_reason?: string | null;

  // v5 spine gate fields (PROCESS-MODEL §1,§7 D6① — fluyen via spread, ver ChrisVerify arriba)
  /** salta la fase G (pausa-y-ofrece) y corre directo a /auditor. */
  autonomous_mode?: boolean;
  /** fase G — verificación live de Chris ANTES del auditor (chris_verify.signoff). */
  chris_verify?: ChrisVerify | null;
  /** fase R — /pm-{brand} alineó spec/arch/validators/cap a la realidad construida. */
  reconciled?: boolean;
  /** DoD #37 — Claude ejerció la acción real contra el stack dev + leyó logs + confirmó efecto. */
  dod_live_verified?: boolean;
  dod_env?: string | null;
  dod_evidence?: DodEvidenceItem[] | null;
  verified_at?: string | null;
  /** WT4 bugfix — canonical key (reemplaza hotfix_metadata; repro=local OR trace, D4). */
  repro_evidence?: ReproEvidence | null;

  /**
   * Si el frontmatter del checkpoint.md NO parsea (ej. key duplicada → YAML
   * inválido), el reader NO silencia: rescata `state` via regex para ubicar la
   * card y setea este campo con el mensaje del error. El board muestra badge rojo.
   */
  parse_error?: string | null;

  /**
   * `true` si este story_id existe en MÁS de un lugar (ej. una copia live en
   * `product/stories/` y otra `done` en `archive/`). El API deduplica (prefiere la
   * archivada/canónica) y marca este flag → la UI pinta un badge de advertencia
   * para que se resuelva la colisión (rename/borrar el stub) vía `/pm-{brand}`.
   */
  dup_collision?: boolean | null;

  // Metadata cockpit (derivada o pre-seed)
  owner?: string | null;
  agent_owner?: string | null;
  type?: StoryType | null;
  module?: string | null;
  surfaces?: Surface[] | null;
  goal?: string | null;
  anti?: string | null;
  reuse?: string | null;
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | null;

  // Hot-fix metadata (R26)
  hotfix_metadata?: {
    repro_verified?: boolean;
    repro_command?: string | null;
    diagnosis_validates_handoff?: boolean | null;
  } | null;

  /** Markdown body después del frontmatter */
  body?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Capability (YAML ledger v2)
// ────────────────────────────────────────────────────────────────────────────

export interface ChangeLogEntry {
  story_id: string;
  date: string;
  type: CapChangeType;
  summary: string;
  scenarios_added: string[];
  merge_sha?: string | null;
  status?: 'in-progress' | 'done';
}

export interface Capability {
  capability_id: string;
  module: string;
  slug: string;
  status: CapStatus;
  license: CapLicense;

  // Ledger fields v2
  created_in_story: string;
  created_date: string;
  last_modified: string;
  package_version?: string | null;
  package_path?: string | null;

  // Architecture
  architecture_pattern?: string | null;
  hipaa_lite_overlay?: boolean;

  // Lineage
  parent_cap: string | null;
  derives_capabilities: string[];

  // Ledger
  change_log: ChangeLogEntry[];

  // Legacy v1 fields (mantener durante migración)
  date_introduced?: string | null;
  story_introduced?: string | null;
  date_updated?: string | null;
  extends_capability?: string | null;

  // v3 cement 2026-05-27
  tech_module?: string | null;            // alias de module · path canónico
  agent_owner?: AgentOwner | null;
  functional_area?: string | null;
  user_visible?: boolean;
  nature?: CapNature | null;
  user_facing_name?: string | null;
  user_facing_description?: string | null;
  dev_preview?: DevPreview | null;
  superseded_by?: string | null;

  // v3.2 cement 2026-05-28 — 4 bloques aditivos opcionales
  access?: CapAccess | null;
  scenarios?: CapScenario[] | null;
  business_rules?: CapBusinessRule[] | null;
  related_capabilities?: CapRelated | null;

  /** Body markdown opcional (después del frontmatter) */
  body?: string;
  /** Path absoluto al YAML */
  path?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Release (YAML)
// ────────────────────────────────────────────────────────────────────────────

export interface Release {
  release_id: string;
  brand: string;
  name: string;
  description: string;
  status: ReleaseStatus;
  target_date: string | null;
  shipped_date: string | null;
  order: number;
  created_at: string;
  created_by: string;
  stories: string[];

  // Gate de shipped (eje integración) — "prueba de comportamiento verde" registrada
  // por Chris al cerrar el release. Ver release-protocol.md § 5.
  verified_by?: string | null;       // 'chris' cuando confirmó el check de integración
  verified_at?: string | null;       // ISO timestamp del check verde
  verification_note?: string | null; // nota libre (qué corrió, resultado, gotchas)

  // Eje DESPLIEGUE (FUTURO · placeholder reservado) — ver release-protocol.md § 8.
  production_status?: ProductionStatus | null;  // not_deployed | scheduled | in_production
  production_version?: string | null;           // semver del pase a prod, ej "v0.3.0"
  production_scheduled_at?: string | null;       // ISO · inmediato (now) o fecha-hora futura
  deployed_at?: string | null;                   // ISO · cuándo se completó el deploy real
  release_branch?: string | null;                // ej "release/vitalia-v0.3.0"

  maps_legacy_outcome?: string | null;
  maps_legacy_phase?: string | null;

  /** Body markdown opcional */
  body?: string;
  /** Path absoluto al YAML */
  path?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// chris-input.md
// ────────────────────────────────────────────────────────────────────────────

export interface Note {
  timestamp: string; // formato "YYYY-MM-DD HH:MM"
  text: string;
}

export type RefType = 'link' | 'img' | 'text' | 'story-ref' | 'learning-ref' | 'doc';

export const REF_TYPE_TO_EMOJI: Record<RefType, string> = {
  link: '🔗',
  img: '🖼',
  text: '💬',
  'story-ref': '📖',
  'learning-ref': '📚',
  doc: '📄',
};

export const EMOJI_TO_REF_TYPE: Record<string, RefType> = {
  '🔗': 'link',
  '🖼': 'img',
  '💬': 'text',
  '📖': 'story-ref',
  '📚': 'learning-ref',
  '📄': 'doc',
};

export interface Ref {
  type: RefType;
  value: string;
  comment?: string;
}

export type ConvVerdict = 'applied' | 'doubt' | 'refuted' | 'proposed';

export const VERDICT_TO_LABEL: Record<ConvVerdict, { emoji: string; label: string }> = {
  applied: { emoji: '✓', label: 'APLICADO' },
  doubt: { emoji: '⚠️', label: 'DUDA' },
  refuted: { emoji: '❌', label: 'REFUTADO' },
  proposed: { emoji: '💡', label: 'PROPONE' },
};

export const LABEL_TO_VERDICT: Record<string, ConvVerdict> = {
  APLICADO: 'applied',
  DUDA: 'doubt',
  REFUTADO: 'refuted',
  PROPONE: 'proposed',
};

export interface ConvEntry {
  timestamp: string;
  author: 'chris' | 'claude';
  skill?: string;
  verdict?: ConvVerdict;
  text: string;
}

export interface ChrisInputFrontmatter {
  story_id: string;
  created_at: string;
  last_modified: string;
  notes_count: number;
  refs_count: number;
  conversation_count: number;
  /** Campos opcionales adicionales que el archivo pueda tener */
  [key: string]: unknown;
}

export interface ChrisInput {
  frontmatter: ChrisInputFrontmatter;
  notes: Note[];
  refs: Ref[];
  conversation: ConvEntry[];
  /** Preámbulo opcional entre el frontmatter y la primera sección (## 💭 Notas) */
  preamble?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Cockpit transitions (whitelist)
// ────────────────────────────────────────────────────────────────────────────

export interface AllowedTransition {
  from: StoryState;
  to: StoryState;
  verb: string;
  requiresReason: boolean;
}

export const CHRIS_ALLOWED_TRANSITIONS: ReadonlyArray<AllowedTransition> = [
  { from: 'idea', to: 'refining', verb: 'Empezar a refinar', requiresReason: false },
  { from: 'idea', to: 'parked', verb: 'Parquear', requiresReason: true },
  { from: 'idea', to: 'dropped', verb: 'Descartar', requiresReason: true },
  { from: 'refining', to: 'idea', verb: 'Volver a backlog', requiresReason: false },
  { from: 'refining', to: 'parked', verb: 'Parquear', requiresReason: true },
  { from: 'refining', to: 'dropped', verb: 'Descartar', requiresReason: true },
  { from: 'parked', to: 'idea', verb: 'Reactivar', requiresReason: false },
];

export function isChrisAllowed(from: StoryState, to: StoryState): AllowedTransition | null {
  return (
    CHRIS_ALLOWED_TRANSITIONS.find((t) => t.from === from && t.to === to) ?? null
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SYSTEM-MAP — arquitectura "madre" (v3 cement 2026-05-27 · ADR-vitalia-005)
// ────────────────────────────────────────────────────────────────────────────

export type AreaStatus = 'live' | 'beta' | 'planned' | 'deprecated';

export interface FunctionalArea {
  id: string;                    // kebab dentro del agente (NO incluye prefijo "<agent>.")
  name: string;                  // Spanish neutro human-readable
  status: AreaStatus;
  description?: string;
  target_release?: string | null;
  notes?: string;
}

export interface AgentDefinition {
  id: AgentOwner;
  emoji: string;
  name: string;
  subtitle: string;
  description?: string;
  /** v2.0: valeria es supervisora (role/status `supervisor`, functional_areas: []). */
  role?: string;
  status?: string;
  functional_areas: FunctionalArea[];
}

// ── Zonas v2.0 (SYSTEM-MAP `zones`) ─────────────────────────────────────────
/** Caja transversal definida inline en plataforma/infraestructura (trae sus propias áreas). */
export interface SystemMapBoxObject {
  id: MapBoxId | string;
  name: string;
  description?: string;
  absorbs?: string[];
  functional_areas: FunctionalArea[];
}

export interface SystemMapZone {
  id: ZoneId;
  name: string;
  tier: ZoneTier;
  user_visible: boolean;
  description?: string;
  notes?: string;
  legacy_home?: string;
  /**
   * Heterogéneo por diseño:
   *  - zona `agentes`: `string[]` (ids que referencian `agents[]`)
   *  - zonas `plataforma`/`infraestructura`: `SystemMapBoxObject[]` (cajas con áreas inline)
   */
  boxes: Array<string | SystemMapBoxObject>;
}

export type FlowMechanism = 'domain_event' | 'api_call' | 'webhook' | 'shared_db';

export interface CrossAgentFlow {
  id: string;
  trigger: {
    agent: AgentOwner;
    area: string;                  // id sin prefijo
    condition: string;
  };
  actions: Array<{
    agent: AgentOwner;
    area: string;
    what: string;
  }>;
  mechanism: FlowMechanism;
  event_name?: string;
  endpoint?: string;
  table?: string;
  status: AreaStatus;
  target_release?: string | null;
}

export interface DataEntityOwnership {
  owner_module: string;
  owner_agent: AgentOwner;
  consumed_by: AgentOwner[];
  phi: boolean;
  description: string;
}

// ────────────────────────────────────────────────────────────────────────────
// v3.2 cement 2026-05-28 — Code↔cap mapping types
// ────────────────────────────────────────────────────────────────────────────

export interface CodeIndexReport {
  generated_at: string;
  brand: string;
  /** Map file_path → cap_id (or list if multi-cap) */
  code_to_cap: Record<string, string | string[]>;
  /** Reverse map: cap_id → list of file paths */
  cap_to_files: Record<string, string[]>;
  orphans: string[];
  shared_files: string[];
  multi_cap_files: Array<{ path: string; caps: string[] }>;
  no_header: string[];
  summary: {
    total_files_scanned: number;
    files_with_header: number;
    files_no_header: number;
    orphans: number;
    shared_files: number;
    multi_cap_files: number;
    caps_with_files: number;
  };
}

export type BidirectionalVerdict = 'CLEAN' | 'SOFT_DRIFT' | 'HARD_FAIL';

export interface CrossCheckResult {
  total: number;
  pass: number;
  drift: number;
  details: Array<Record<string, unknown>>;
}

export interface BidirectionalValidationReport {
  validated_at: string;
  brand: string;
  schema_version: string;
  hard_checks: number[];
  // cross_check_1/2 (atomics↔headers) eliminados 2026-05-28 (atomics killed · lifecycle.md)
  cross_check_3: CrossCheckResult;
  cross_check_4: CrossCheckResult;
  summary: {
    total_caps: number;
    drift_total: number;
    drift_in_hard: number;
    verdict: BidirectionalVerdict;
  };
}

// v3.2 cap blocks (access + scenarios + business_rules + related_capabilities)

export interface AccessEntryPoint {
  path: string;
  navigation?: string;
  requires_role?: string[];
  requires_clinic_scope?: boolean;
  entry_type?: 'ui' | 'api' | 'webhook' | 'event' | 'cli';
}

export interface CapAccess {
  entry_points: AccessEntryPoint[];
  forbidden_roles?: string[];
  authentication?: 'required' | 'optional' | 'none';
}

/**
 * Evidencia de live-verify de un scenario (HB-58 · DoD #37). Se setea SOLO cuando
 * la verificación live de ese caso de uso quedó registrada (`at` = cuándo, `how` =
 * qué se ejerció + qué se observó · derivado de `dod_evidence`/`dev_app_verified`).
 * Lo leen: `cap_doctor.py --accuracy` (mide la deuda) + el badge de verdad del
 * cap-drawer (N1). Booleano admitido por compat legacy (`verified_real: true`).
 */
export interface CapScenarioVerifiedReal {
  at: string;
  how: string;
}

export interface CapScenario {
  id: string;
  name: string;
  actor: string;
  status: 'live' | 'wip' | 'deprecated';
  given: string;
  when: string;
  then: string;
  e2e_test?: string | null;
  /** HB-58: evidencia de live-verify (no decorativo · leído por badge N1 + cap_doctor --accuracy). */
  verified_real?: CapScenarioVerifiedReal | boolean | null;
  story_spec_ref?: string | null;
  atomic_ref?: string | null;
  edge_cases?: string[];
  added_in_story: string;
  added_date: string;
  deprecated_in_story?: string | null;
  deprecated_date?: string | null;
}

export interface CapBusinessRule {
  id: string;
  rule: string;
  enforcement: string[];
  code_ref?: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  audit_trail?: boolean;
}

export interface CapRelated {
  depends_on?: string[];
  enables?: string[];
  similar?: string[];
  obsoletes?: string[];
}

export interface SystemMap {
  brand: string;
  version: string;
  cement_date: string;
  /** v2.0 (cement 2026-05-30) · taxonomía de 3 zonas. Ausente en SYSTEM-MAP v1.x. */
  zones?: SystemMapZone[];
  agents: AgentDefinition[];
  cross_agent_flows: CrossAgentFlow[];
  data_ownership: Record<string, DataEntityOwnership>;
  agent_orchestration: unknown[];
  metadata: {
    last_modified: string;
    modified_by: string;
    schema_version: string;
    total_agents: number;
    total_functional_areas: number;
    total_cross_agent_flows: number;
    total_data_entities: number;
    // v2.0 opcionales
    total_zones?: number;
    total_boxes?: number;
    total_specialist_agents?: number;
  };
  /** Opcional · populated por API route */
  _path?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Active sessions — build-claims vivos (ADR-009 single-hub worktree)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Una sesión Claude/opencode trabajando sobre el hub, leída de `.session-locks/`.
 * El board pinta "🔨 {lane}" sobre la story que esta sesión construye.
 */
export interface ActiveSession {
  /** Bucket declarado por session-lock.sh (`code:scheduling`, `docs`, `tests`, …). */
  bucket: string;
  pid: number;
  skill: string;
  /** ISO timestamp del acquire. */
  startedAt: string | null;
  /** Story en construcción (build-claim). `null` si el lock no es un build. */
  storyId: string | null;
  /** Etiqueta humana (`$LUANA_LANE` o `pid<PID>`). */
  lane: string | null;
}
