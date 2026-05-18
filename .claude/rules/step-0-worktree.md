---
description: "Step 0 obligatorio (mec. N) — detection worktree + manifest + enforcement skills /pm-{brand} y /pm-luana. SSoT D13."
---

# Step 0 — Worktree detection + enforcement (mec. N)

**Consumed by:** `/pm-{brand}` (×4 brands activas + 6 futuras) y `/pm-luana` via `@.claude/rules/step-0-worktree.md` en frontmatter o body.

**SSoT model:** `docs/process/parallel-sessions-protocol.md` § D13 (+ D8 detection, D10 sync, D12 core).

## Logic (10 pasos, ejecuta al bootstrap de cada invocación)

```text
1. Detect worktree TYPE via path regex (sobre `git rev-parse --show-toplevel`):
     ends with /luana-platform/?$            → PRINCIPAL
     ends with /luana-{brand}/?$              → CANÓNICO brand={brand}
     ends with /luana-{brand}-{slug}/?$       → EFÍMERO brand={brand}
     ends with /luana-core-{slug}/?$          → EFÍMERO type=core (D12)
     otherwise                                 → UNKNOWN

   Brands válidas: vitalia, nicolify, comunify, lupulo (+ futuras: saasora,
   inmoflow, retailly, fixia, guestly, fitflow). `core` reservado.

2. Read manifest `.session.yaml` si existe (ausente en PRINCIPAL por diseño).

3. Verify cross-coherence: brand/type del manifest matches path regex.
   - Match → context OK
   - Mismatch → ERROR escalate Chris ("manifest brand=X pero path dice brand=Y")

4. Manifest ausente + path UNKNOWN → STOP, escalate

5. Manifest ausente + path conocido (no PRINCIPAL) → advisory:
   "manifest ausente — regenerar con scripts/git/regenerate-manifest.sh"

6. Aplicar enforcement matrix (ver tabla más abajo).

7. Run T2 sync logic (igual T1: scripts/git/check-sync.sh internamente o lógica equivalente):
   - fetch origin main
   - check tree clean + behind/ahead
   - auto-FF si CANÓNICO + clean + FF puro
   - advisory si merge real
   - banner LOUD si dirty + core changed
   - update .session.yaml.last_sync

8. List otros worktrees vivos de la misma brand:
   `git worktree list --porcelain | grep -B2 'branch refs/heads/(wip|hotfix|exp)/{brand}-'`

9. List cross-brand modifications en current diff (archivos de OTRA brand en wip propio):
   `git diff main..HEAD --name-only | grep -E '^(brand-A|brand-B|brand-C)/'`
   donde brand-{A,B,C} son brands ≠ brand del worktree. Match → advisory.

10. Output canonical block (compacto si OK, expandido si advisory/error).
```

## Enforcement matrix

| Skill | Worktree type / brand | Verdict |
|---|---|---|
| `/pm-{brand-X}` | CANÓNICO brand X | ✅ OK proceed |
| `/pm-{brand-X}` | EFÍMERO brand X | ✅ OK + leer story/lane manifest |
| `/pm-{brand-X}` | CANÓNICO/EFÍMERO brand Y (Y≠X) | ❌ **HARD REFUSE** — STOP + redirect |
| `/pm-{brand-X}` | PRINCIPAL | ❌ **HARD REFUSE** — "principal no edita código brand" |
| `/pm-{brand-X}` | EFÍMERO core | ❌ **HARD REFUSE** — "core lift es /pm-luana territory" |
| `/pm-{brand-X}` | UNKNOWN | ❌ **HARD REFUSE** — escalate Chris |
| `/pm-luana` | PRINCIPAL | ✅ OK (default) |
| `/pm-luana` | CANÓNICO brand X | ✅ OK (cross-brand desde brand context) |
| `/pm-luana` | EFÍMERO core | ✅ OK (lift work) |
| `/pm-luana` | EFÍMERO brand X | ⚠️ OK + soft warn "vista cross-brand desde efímero brand-specific puede sesgar" |
| `/pm-luana` | UNKNOWN | ❌ **HARD REFUSE** — escalate Chris |

## Output canonical

### Caso all-OK (compacto, 5-6 líneas)

```
[step 0 worktree]
  path:     ~/Proyectos/luana-vitalia/
  branch:   wip/vitalia-copilot-tools-impl
  type:     CANÓNICO vitalia
  manifest: brand=vitalia story=copilot-tools-impl lane=—
  sync:     ✓ 0 commits behind origin/main
  others:   1 efímero vivo brand vitalia (wip/vitalia-design-review)
[step 0 OK]
```

### Caso advisory (sync needed)

```
[step 0 worktree]
  path:     ~/Proyectos/luana-vitalia/
  branch:   wip/vitalia-copilot-tools-impl (tree clean)
  type:     CANÓNICO vitalia
  manifest: brand=vitalia story=copilot-tools-impl
  sync:     ↑ 3 commits behind origin/main (1 touches core/)
            → AUTO FF aplicado
            ↑ af8dfc3..b1c2d3e wip/vitalia-copilot-tools-impl
  others:   none
[step 0 OK]
```

### Caso advisory loud (dirty + core changed)

```
[step 0 worktree]
  path:     ~/Proyectos/luana-vitalia/
  branch:   wip/vitalia-copilot-tools-impl (tree dirty: 3 modified)
  type:     CANÓNICO vitalia
  sync:     5 commits behind origin/main

  ╔═══ CORE CHANGED while you worked ═══╗
  ║ commits: e5f6789 b1c2d3e             ║
  ║ affected: core/luana-core-observability/ ║
  ║ Recomendado: terminar WIP, push,     ║
  ║   fetch origin main && merge          ║
  ╚══════════════════════════════════════╝

[step 0 OK proceed with caution]
```

### Caso HARD REFUSE

```
[step 0 worktree]
  path:     ~/Proyectos/luana-comunify/  (manifest brand=comunify)
  skill:    /pm-vitalia
  verdict:  ✗ HARD REFUSE — brand mismatch

  Opciones:
  1. Cambiar Warp tab a worktree Vitalia (~/Proyectos/luana-vitalia/)
  2. Cross-brand visibility: /pm-luana

[step 0 STOP]
```

## Implementación práctica (skill body)

Cada skill `/pm-{brand}` o `/pm-luana` debe ejecutar al bootstrap (en orden):

```bash
# 1. Detection (script portable o lógica inline)
bash scripts/git/check-sync.sh --detect-only > /tmp/step-0-context.txt
# (alternativa inline si scripts no disponibles)

# 2. Parsear context + aplicar enforcement matrix per la skill invocada

# 3. Si OK: imprimir output canonical + proceder
# 4. Si REFUSE: imprimir output STOP + terminar skill
```

**Importante:** este step 0 ES bloqueante. Si verdict = HARD REFUSE, skill termina sin continuar. Si verdict = OK con advisory → continúa pero deja el advisory visible.

## Cuándo NO aplica

- Skills builders (`builder-backend`, `builder-frontend`, `builder-agentic`) — NO cargan step 0 (no son PM, no manejan SSoT cross-brand)
- Skills domain (`brand-expert`, `offer-expert`, `metrics-expert`, etc.) — NO cargan step 0 (read-only o contextual)
- Skills git/tooling (`commit-push`, `git-manager`, etc.) — NO cargan step 0

Step 0 es exclusivo a skills que manejan SSoT funcional brand-specific o cross-brand (`/pm-{brand}` + `/pm-luana`).

## Referencias

- `docs/process/parallel-sessions-protocol.md` § D8, D10, D12, D13
- `docs/architecture/luana-platform/ADR-005-worktree-policy.md`
- `.claude/rules/parallel-safety.md`
- `scripts/git/check-sync.sh` — T1/T2 sync logic portable
- `scripts/git/regenerate-manifest.sh` — recovery worktrees a mano
- `scripts/git/status-all.sh` — dashboard cross-worktree (mec. H)
