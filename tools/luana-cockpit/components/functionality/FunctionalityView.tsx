'use client';

/**
 * FunctionalityView — fuente verificable y narrada del producto vitalia.
 *
 * Cement 2026-05-28 · Fase C bidirectional code↔cap mapping.
 *
 * Lee capabilities + code-index + bidirectional validator + status computed
 * y muestra cada cap en lenguaje humano (Spanish neutro) con:
 *   - "Qué puedo hacer" (user_facing_description + scenarios)
 *   - "Cómo accedo" (access.entry_points con roles narrados)
 *   - "Reglas de negocio" (business_rules + severity)
 *   - "Casos borde" (scenarios edge_cases)
 *   - Drill-down técnico (atomics + files + e2e tests)
 *
 * Modo Onboarding rol: filtra caps por requires_role específico.
 * Search natural: matchea scenarios.when/then + business_rules.rule + user_facing_*.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Spinner, ErrorBanner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Badge';
import { useBrand } from '@/components/providers/BrandProvider';
import { useFileWatchEvents } from '@/components/providers/FileWatchProvider';
import {
  listCapabilities,
  getCapabilityStatus,
  getCodeIndex,
  getBidirectionalValidation,
} from '@/lib/api-client';
import type {
  Capability,
  AgentOwner,
  ComputedStatusReport,
  CodeIndexReport,
  BidirectionalValidationReport,
  CapScenario,
  AccessEntryPoint,
} from '@/lib/types';

// Roles canónicos vitalia (per HIPAA-lite + IAM)
const VITALIA_ROLES = [
  'doctor',
  'nurse',
  'admin_clinic',
  'marketing',
  'receptionist',
  'patient',
  'staff_vitalia',
] as const;

type VitaliaRole = (typeof VITALIA_ROLES)[number];

// Agent display config (mismo orden que SYSTEM-MAP)
const AGENT_DISPLAY: Record<
  AgentOwner,
  { emoji: string; name: string; subtitle: string }
> = {
  lisa: { emoji: '🏥', name: 'Lisa', subtitle: 'Mi Clínica' },
  valeria: { emoji: '🗓', name: 'Valeria', subtitle: 'Mi Día' },
  adrian: { emoji: '💼', name: 'Adrián', subtitle: 'Vender' },
  lucas: { emoji: '📣', name: 'Lucas', subtitle: 'Marketing' },
  camila: { emoji: '🌟', name: 'Camila', subtitle: 'Reputación + cohortes' },
  config: { emoji: '⚙', name: 'Configurar', subtitle: 'tenant · iam · auth · compliance' },
  infra: { emoji: '🔧', name: 'Infra Vitalia', subtitle: 'observability · platform · scaffolding' },
};

const SEVERITY_CLS: Record<string, string> = {
  critical: 'bg-[#450a0a] text-[#fca5a5]',
  high: 'bg-[#713f12] text-[#fbbf24]',
  medium: 'bg-[#1e3a5f] text-[#93c5fd]',
  low: 'bg-[#27272a] text-[#a1a1aa]',
};

export function FunctionalityView() {
  const { brand } = useBrand();
  const [caps, setCaps] = useState<Capability[]>([]);
  const [statusReport, setStatusReport] = useState<ComputedStatusReport | null>(null);
  const [codeIndex, setCodeIndex] = useState<CodeIndexReport | null>(null);
  const [bidirValidation, setBidirValidation] =
    useState<BidirectionalValidationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<VitaliaRole | 'all'>('all');
  const [showInfra, setShowInfra] = useState(false);
  const [showOnlyPopulated, setShowOnlyPopulated] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      listCapabilities(brand),
      getCapabilityStatus(brand).catch(() => ({ status: null })),
      getCodeIndex(brand).catch(() => ({ index: null })),
      getBidirectionalValidation(brand).catch(() => ({ validation: null })),
    ])
      .then(([capsData, statusData, codeData, bidirData]) => {
        setCaps(capsData);
        setStatusReport(statusData.status);
        setCodeIndex(codeData.index);
        setBidirValidation(bidirData.validation);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [brand]);

  useEffect(() => {
    load();
  }, [load]);

  useFileWatchEvents((event) => {
    if (event.brand && event.brand !== brand) return;
    if (event.docType === 'capability') load();
  });

  // Filter caps
  const filtered = useMemo(() => {
    return caps.filter((c) => {
      if (c.superseded_by) return false;
      if (c.user_visible === false && !showInfra) return false;
      if (showOnlyPopulated && !(c.scenarios && c.scenarios.length > 0)) return false;

      if (roleFilter !== 'all') {
        const entryPoints = c.access?.entry_points ?? [];
        const requiresRole = entryPoints.some((ep) =>
          (ep.requires_role ?? []).includes(roleFilter)
        );
        if (!requiresRole) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const haystacks: string[] = [
          c.user_facing_name ?? '',
          c.user_facing_description ?? '',
          c.module ?? '',
          c.slug ?? '',
          c.functional_area ?? '',
          ...(c.scenarios ?? []).flatMap((s) => [
            s.name ?? '',
            s.given ?? '',
            s.when ?? '',
            s.then ?? '',
            ...(s.edge_cases ?? []),
          ]),
          ...(c.business_rules ?? []).map((r) => r.rule ?? ''),
        ];
        if (!haystacks.some((h) => h.toLowerCase().includes(term))) {
          return false;
        }
      }
      return true;
    });
  }, [caps, searchTerm, roleFilter, showInfra, showOnlyPopulated]);

  // Group by agent_owner
  const byAgent = useMemo(() => {
    const map = new Map<AgentOwner, Capability[]>();
    const order: AgentOwner[] = ['lisa', 'valeria', 'adrian', 'lucas', 'camila', 'config', 'infra'];
    order.forEach((a) => map.set(a, []));
    for (const c of filtered) {
      if (!c.agent_owner) continue;
      const bucket = map.get(c.agent_owner);
      if (bucket) bucket.push(c);
    }
    return map;
  }, [filtered]);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Spinner /> Cargando funcionalidad…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6">
        <ErrorBanner message={error} />
      </div>
    );
  }

  const populatedCount = caps.filter((c) => (c.scenarios?.length ?? 0) > 0).length;

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-lg font-semibold">📖 Funcionalidad · qué hace Vitalia hoy</h1>
        <p className="text-[11px] text-[var(--color-muted)] mt-1">
          Vista narrada del producto. Para cada capability mostramos qué se puede hacer, cómo
          entrar, con qué rol, qué reglas aplican y qué casos borde existen.
        </p>
        {bidirValidation && (
          <div className="text-[10px] text-[var(--color-muted)] mt-1">
            Validador bidireccional:{' '}
            <Pill className={cn(SEVERITY_CLS[bidirValidation.summary.verdict === 'CLEAN' ? 'low' : 'medium'], 'text-[9px]')}>
              {bidirValidation.summary.verdict}
            </Pill>{' '}
            · drift total: {bidirValidation.summary.drift_total} · hard:{' '}
            {bidirValidation.summary.drift_in_hard}
          </div>
        )}
        <div className="text-[10px] text-[var(--color-muted)] mt-1">
          Capabilities con scenarios poblados (v3.2): {populatedCount} de {caps.length} ·
          migración orgánica via Fase F.3 en cada story que las toca
        </div>
      </header>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-3 items-center text-xs">
        <input
          type="text"
          placeholder="Buscar por scenarios, reglas, descripción…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)] flex-1 min-w-[200px] max-w-[400px]"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as VitaliaRole | 'all')}
          className="px-3 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)]"
        >
          <option value="all">Todos los roles</option>
          {VITALIA_ROLES.map((r) => (
            <option key={r} value={r}>
              Modo onboarding: {r}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            className="!w-auto"
            checked={showInfra}
            onChange={(e) => setShowInfra(e.target.checked)}
          />
          mostrar infra 🔧
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            className="!w-auto"
            checked={showOnlyPopulated}
            onChange={(e) => setShowOnlyPopulated(e.target.checked)}
          />
          solo con scenarios
        </label>
        <span className="ml-auto text-[var(--color-muted)]">
          {filtered.length} de {caps.length} caps
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card className="!p-6 text-center">
          <div className="text-[var(--color-muted)] text-sm">
            Sin capabilities que cumplan los filtros.
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(byAgent.entries())
            .filter(([agent, caps]) => caps.length > 0 && (agent !== 'infra' || showInfra))
            .map(([agent, agentCaps]) => (
              <AgentSection
                key={agent}
                agent={agent}
                caps={agentCaps}
                codeIndex={codeIndex}
                statusReport={statusReport}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function AgentSection({
  agent,
  caps,
  codeIndex,
  statusReport,
}: {
  agent: AgentOwner;
  caps: Capability[];
  codeIndex: CodeIndexReport | null;
  statusReport: ComputedStatusReport | null;
}) {
  const display = AGENT_DISPLAY[agent];
  return (
    <section>
      <header className="flex items-baseline gap-2 mb-3 pb-2 border-b border-[var(--color-border)]">
        <span aria-hidden="true" className="text-2xl">
          {display.emoji}
        </span>
        <div>
          <h2 className="text-base font-semibold">{display.name}</h2>
          <p className="text-[10px] text-[var(--color-muted)]">{display.subtitle}</p>
        </div>
        <span className="ml-auto text-[10px] text-[var(--color-muted)]">
          {caps.length} cap{caps.length !== 1 ? 's' : ''}
        </span>
      </header>
      <div className="space-y-4">
        {caps.map((c) => (
          <CapCard
            key={`${c.module}/${c.slug}`}
            cap={c}
            codeIndex={codeIndex}
            statusReport={statusReport}
          />
        ))}
      </div>
    </section>
  );
}

function CapCard({
  cap,
  codeIndex,
  statusReport: _statusReport,
}: {
  cap: Capability;
  codeIndex: CodeIndexReport | null;
  statusReport: ComputedStatusReport | null;
}) {
  const [expandTech, setExpandTech] = useState(false);
  const capId = `${cap.module}.${cap.slug}`;
  const filesCount = codeIndex?.cap_to_files[capId]?.length ?? 0;
  const populated = (cap.scenarios?.length ?? 0) > 0;

  return (
    <Card className="!p-4">
      <header className="mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold">
            {cap.user_facing_name ?? `${cap.module}/${cap.slug}`}
          </h3>
          {!populated && (
            <Pill className="bg-[#27272a] text-[#a1a1aa] text-[9px]">
              v3.1 · migración pendiente
            </Pill>
          )}
          {cap.user_visible === false && (
            <Pill className="bg-[#1f2937] text-[#94a3b8] text-[9px]">infra</Pill>
          )}
          {filesCount > 0 && (
            <Pill className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[10px] py-0">
              {filesCount} archivo{filesCount !== 1 ? 's' : ''} de código
            </Pill>
          )}
        </div>
        {cap.user_facing_description && (
          <p className="text-[11px] text-[var(--color-muted)] mt-1 leading-relaxed">
            {cap.user_facing_description}
          </p>
        )}
      </header>

      {/* Cómo accedo */}
      {cap.access?.entry_points && cap.access.entry_points.length > 0 && (
        <AccessSection access={cap.access} />
      )}

      {/* Qué puedo hacer */}
      {populated && (
        <ScenariosSection scenarios={cap.scenarios ?? []} />
      )}

      {/* Reglas */}
      {cap.business_rules && cap.business_rules.length > 0 && (
        <BusinessRulesSection rules={cap.business_rules} />
      )}

      {/* Drill-down técnico */}
      <button
        type="button"
        onClick={() => setExpandTech((v) => !v)}
        className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-text)] mt-2"
      >
        {expandTech ? '▲' : '▼'} Detalle técnico (atomics + archivos + tests)
      </button>
      {expandTech && (
        <div className="mt-2 pt-2 border-t border-[var(--color-border)] text-[10px] text-[var(--color-muted)] space-y-1">
          <div className="font-mono">
            cap_id: {capId} · {cap.functional_area && <>functional_area: {cap.functional_area}</>}
          </div>
          {cap.atomics && cap.atomics.length > 0 && (
            <div>
              Atomics ({cap.atomics.length}):{' '}
              {cap.atomics
                .map((a) => (a as unknown as { id?: string }).id ?? a.label ?? '?')
                .join(', ')}
            </div>
          )}
          {filesCount > 0 && codeIndex && (
            <div>
              Archivos código (top 5):{' '}
              {codeIndex.cap_to_files[capId].slice(0, 5).map((f, i) => (
                <div key={i} className="font-mono text-[9px] truncate ml-2">
                  {f}
                </div>
              ))}
              {codeIndex.cap_to_files[capId].length > 5 && (
                <div className="ml-2">… y {codeIndex.cap_to_files[capId].length - 5} más</div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function AccessSection({ access }: { access: NonNullable<Capability['access']> }) {
  return (
    <section className="mt-3">
      <h4 className="text-[11px] font-semibold text-[var(--color-text)] mb-1">
        🔑 Cómo accedo
      </h4>
      <div className="space-y-1.5">
        {access.entry_points.map((ep, i) => (
          <AccessEntryRow key={i} entry={ep} />
        ))}
        {access.forbidden_roles && access.forbidden_roles.length > 0 && (
          <div className="text-[10px] text-red-400">
            ❌ Roles prohibidos: {access.forbidden_roles.join(', ')}
          </div>
        )}
      </div>
    </section>
  );
}

function AccessEntryRow({ entry }: { entry: AccessEntryPoint }) {
  return (
    <div className="text-[11px] text-[var(--color-text)] pl-2 border-l-2 border-[var(--color-accent)]">
      <div className="font-mono">{entry.path}</div>
      {entry.navigation && (
        <div className="text-[10px] text-[var(--color-muted)] italic mt-0.5">
          {entry.navigation}
        </div>
      )}
      {entry.requires_role && entry.requires_role.length > 0 && (
        <div className="text-[10px] mt-0.5">
          Roles requeridos:{' '}
          {entry.requires_role.map((r) => (
            <Pill
              key={r}
              className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[9px] py-0 ml-0.5"
            >
              {r}
            </Pill>
          ))}
        </div>
      )}
      {entry.requires_clinic_scope && (
        <div className="text-[9px] text-yellow-400 mt-0.5">⚠ requiere clinic_scope (HIPAA dual filter)</div>
      )}
    </div>
  );
}

function ScenariosSection({ scenarios }: { scenarios: CapScenario[] }) {
  return (
    <section className="mt-3">
      <h4 className="text-[11px] font-semibold text-[var(--color-text)] mb-1">
        ✨ Qué puedo hacer ({scenarios.length})
      </h4>
      <div className="space-y-2">
        {scenarios.map((s) => (
          <ScenarioRow key={s.id} scenario={s} />
        ))}
      </div>
    </section>
  );
}

function ScenarioRow({ scenario: s }: { scenario: CapScenario }) {
  return (
    <div className="text-[11px] pl-2 border-l-2 border-green-700 bg-[var(--color-panel2)] p-2 rounded">
      <div className="font-semibold flex items-center gap-1.5">
        <span>{s.name}</span>
        <Pill className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[9px] py-0">
          {s.actor}
        </Pill>
        {s.status !== 'live' && (
          <Pill className="bg-[#27272a] text-[#a1a1aa] text-[9px]">{s.status}</Pill>
        )}
      </div>
      <div className="mt-1 text-[10px] space-y-0.5">
        <div>
          <span className="text-[var(--color-muted)]">Dado que </span>
          {s.given}
        </div>
        <div>
          <span className="text-[var(--color-muted)]">Cuando </span>
          {s.when}
        </div>
        <div>
          <span className="text-[var(--color-muted)]">Entonces </span>
          {s.then}
        </div>
      </div>
      {s.edge_cases && s.edge_cases.length > 0 && (
        <div className="mt-1.5">
          <div className="text-[10px] text-[var(--color-muted)] font-semibold">Casos borde:</div>
          <ul className="list-disc list-inside text-[10px] text-[var(--color-muted)] space-y-0.5 ml-1">
            {s.edge_cases.map((ec, i) => (
              <li key={i}>{ec}</li>
            ))}
          </ul>
        </div>
      )}
      {(s.e2e_test || s.story_spec_ref) && (
        <div className="mt-1 text-[9px] text-[var(--color-muted)] font-mono space-y-0.5">
          {s.e2e_test && <div>test: {s.e2e_test}</div>}
          {s.story_spec_ref && <div>spec: {s.story_spec_ref}</div>}
        </div>
      )}
    </div>
  );
}

function BusinessRulesSection({
  rules,
}: {
  rules: NonNullable<Capability['business_rules']>;
}) {
  return (
    <section className="mt-3">
      <h4 className="text-[11px] font-semibold text-[var(--color-text)] mb-1">
        📋 Reglas de negocio ({rules.length})
      </h4>
      <div className="space-y-1.5">
        {rules.map((r) => (
          <div key={r.id} className="text-[11px] pl-2 border-l-2 border-yellow-700">
            <div className="flex items-baseline gap-1.5">
              <Pill className={cn(SEVERITY_CLS[r.severity] ?? SEVERITY_CLS['medium'], 'text-[9px] py-0')}>
                {r.severity}
              </Pill>
              <span>{r.rule}</span>
              {r.audit_trail && (
                <Pill className="bg-[#1e3a5f] text-[#93c5fd] text-[9px] py-0">audit</Pill>
              )}
            </div>
            {r.enforcement && r.enforcement.length > 0 && (
              <div className="text-[9px] text-[var(--color-muted)] mt-0.5 font-mono">
                ↗ {r.enforcement.join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
