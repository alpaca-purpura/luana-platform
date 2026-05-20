# Guía de Contribución — Luana Platform

Esta guía cubre el flujo completo de trabajo para contribuir al monorepo `luana-platform`.

## Conventional Commits

Todos los commits deben seguir el formato [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<scope>): <descripción corta>

[cuerpo opcional — explica el "por qué", no el "qué"]

[footer opcional — referencias a tickets/stories/outcomes]
```

### Tipos permitidos

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Refactorización sin cambio funcional |
| `docs` | Solo documentación |
| `test` | Agregar o modificar tests |
| `chore` | Tareas de mantenimiento (deps, config, CI) |
| `perf` | Mejoras de rendimiento |
| `ci` | Cambios en workflows de CI/CD |

### Scopes sugeridos

Usa el nombre del workspace member o área afectada:
`core`, `nicolify`, `vitalia`, `comunify`, `lupulo`, `ci`, `docs`, `repo`

### Ejemplos

```
feat(core): agregar abstracción BaseCallbackHandler para agentes AI
fix(nicolify): corregir filtro tenant_id en query de offers
docs: actualizar ARCHITECTURE con topología de subfolders
chore(ci): actualizar pnpm/action-setup a v4
```

## Flujo de trabajo con Pull Requests

1. Clonar el repositorio: `git clone https://github.com/alpacapurpura/luana-platform.git`
2. Crear rama desde `main`: `git checkout -b feat/mi-cambio`
3. Desarrollar con TDD (tests primero, implementación después)
4. Hacer commits frecuentes con Conventional Commits
5. Abrir PR hacia `main` con el template completo
6. Esperar CI verde (python-lint + python-test + ts-lint + ts-test)
7. Solicitar review (requerido: `required_approving_review_count=1`)
8. Merge squash (preserve clean history)

## Branch protection

La rama `main` tiene las siguientes protecciones:
- Review obligatorio (mínimo 1 aprobación)
- Sin force pushes permitidos
- CI debe pasar antes de merge

## Reglas ADR (Architecture Decision Records)

Cualquier cambio que toque `core/**` (nuevas abstracciones, cambios de contrato,
schema migrations con impacto cross-module) **requiere ADR** antes de abrir PR.

Ver el proceso completo en [docs/architecture/ADR/README.md](architecture/ADR/README.md).

### Cuándo es obligatorio un ADR

- Nuevo abstract en `core/shared/` consumido cross-brand
- Cambio de contrato API que rompe consumidores
- Schema migration con impacto cross-módulo
- Nueva abstracción cross-brand

### Cuándo NO se necesita ADR

- Bug fix con scope local (un módulo, sin contrato cambiado)
- Refactor interno sin cambio de contrato
- Documentación, config, o CI

## Workflow `.claude-shared/`

El directorio `.claude-shared/` contiene las reglas y skills de Claude Code
sincronizadas desde AISALESHT (fuente maestra).

- `.claude-shared/rules/`: reglas de codificación y arquitectura
- `.claude-shared/skills/`: skills del asistente de desarrollo
- `.claude-shared/agents/`: definiciones de agentes

`.claude/` es una copia de `.claude-shared/` (no symlink, para compatibilidad Windows).

Para actualizar estas reglas en futuras versiones, copiar manualmente desde AISALESHT:
```bash
cp -r /path/to/AISALESHT/.claude/rules .claude-shared/
cp -r /path/to/AISALESHT/.claude/skills .claude-shared/
cp -r /path/to/AISALESHT/.claude/agents .claude-shared/
cp -r .claude-shared .claude
```

## Español neutro LatAm

Todo texto user-facing en esta plataforma usa **español neutro latinoamericano**:
- Tuteo (`tú`, `tienes`, `puedes`) — sin voseo
- Sin regionalismos marcados
- Ortografía correcta con tildes y ñ

Ver `.claude/rules/spanish-text.md` para el glosario completo.

## Quality gates

Antes de abrir PR, verificar localmente:

```bash
# Python lint
uv run ruff check core nicolify vitalia comunify lupulo

# Python tests
uv run pytest -x -q --tb=short

# TS lint
pnpm lint

# TS tests
pnpm test
```

## Licencia

Este software es propietario. Ver [LICENSE](../LICENSE) para más detalles.
