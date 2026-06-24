---
story_id: nicolify-r0-storybook-inventory
brand: nicolify
surface: DOCS-contract
builder: builder-frontend            # mismo lane FE — el contrato deriva del output del inventario
auditor: auditor-frontend
production_code: false               # docs
---

# 03-arch-docs — Surface DOCS (SHELL-DESIGN-CONTRACT.md a 1:1)

> Sub-vista del consolidado `03-arch.md § Esquema del SHELL-DESIGN-CONTRACT.md`. Solo lo que el builder necesita para subir `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` a inventario descriptivo 1:1.

## Scope (path in scope)

- `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` — **extender** (NO reescribir las § normativas existentes; AGREGAR las § descriptivas).

**NEVER touch:** vitalia/comunify/lupulo contracts · cualquier `.tsx`/`.ts` de código (eso es el surface FE).

## Qué agregar (mirror vitalia § 1-8 + columnas nuevas)

Conservar las § actuales (1 Visión · 2 Tokens · 3 Átomos · 4-5 Moléculas/Navegación · 6 Catálogo agentes · 7 Gates · 8 Testing). **AGREGAR/EXTENDER:**

1. **§ Token-overrides nicolify** (RN-4) — tabla `átomo compartido · token · valor nicolify` (ej. `Input → --radius-control: pill`). Extiende § 2.
2. **§ Inventario exhaustivo por balde (★ NUEVO)** — la tabla 1:1: `Componente | Path | Capa | Balde | Props | Estados | Story | Token-overrides`. **TODOS** los componentes brand-local clasificados en balde (1)/(2)/(3) + categoría "wire/dispatcher no-storiable" (SubTabContent/ShellLayoutWire/_agent-tw-classes/types). Cero sin fila (RN-7). Filas de balde-3 linkean a la `.stories.tsx` por su `title` (ej. `nicolify: Abel/ICP/IcpCard`).
3. **§ Roster de agentes (★ NUEVO · RN-8)** — la tabla del spec: los 6 con `status: construido | pendiente`, pendientes con superficies anticipadas + slot Ribbon. Linkea a la story-doc `Agentes/Roster`.
4. **§ Modelo de divergencia por-marca (★ NUEVO · RN-4)** — la tabla token>variante>fork del spec.

## Fuente de las filas

El § Inventario exhaustivo se rellena con el output del ticket de clasificación (T-1) + las stories escritas (sus `title`). El builder copia la tabla de baldes que T-1 produce + linkea cada balde-3 a su story.

## Completitud (RN-7 · AC-3 · gate)

Check ejecutable: `find nicolify/frontend/src -name "*.tsx" | grep -vE "\.(test|spec|stories)\." | grep -E "components/|features/abel/components/"` → cada uno DEBE aparecer como fila en el § Inventario. 0 sin clasificar. Ver 04-validators `completeness_check`.

## Verificación REAL (demo técnica)

Abrir el contrato → el § Inventario lista todos los componentes con balde + path + story · el § Roster muestra los 6 con status · el § Modelo de divergencia documenta los token-overrides. El mapa 1:1 está completo y legible (no basta que exista — hay que poder leerlo y cruzarlo con el storybook).
