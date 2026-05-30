<!-- voseo-allowed: buzón conversacional Chris↔Claude, no user-facing -->
# chris-input — vitalia-paradigm-map-zones

> Buzón de inputs de Chris (lo que desea y/o cree que necesita), desde la idea.
> Claude puede rebatir (❌ REFUTADO) o proponer (💡 PROPONE). Se refina en conjunto.

## 🎯 Lo que Chris pidió (origen)

Arrancar como story dedicada la **migración del mapa al nuevo paradigma** (3 zonas) + **re-planificar** dándole una **propuesta de organización que cumpla la nueva visión de producto** (trabajadores digitales sobre un sistema GTM). Revisar si el split de cajas del `SYSTEM-MAP.yaml` es el correcto o se mejora.

Scope que mencionó:
1. Migrar ~71 caps `config/infra` → cajas nuevas por zona.
2. Cockpit MapView render por zona + lentes.
3. Reasignar Valeria→supervisora / Mateo→Operar.
4. Índice de acciones (Plano 2) sin grep.

## 💬 Conversación

### 2026-05-30 · 🤖 claude · `/pm-vitalia` · 💡 PROPONE
Creé la story `vitalia-paradigm-map-zones` (state=idea) + escribí la propuesta de organización refinada en `00-research.md`. Hallazgo clave del prior-art scan: **todo el backlog Fase 2 (~20 idea-stories) está organizado por la taxonomía vieja** (`config-*` + Valeria como agente) → reorganizar el mapa reorganiza el backlog.

**Mejora principal sobre el draft del SYSTEM-MAP:** Valeria **no es una caja de valor** — es la **supervisora** (el chat sidebar, el conductor). La zona Agentes son 5 cajas de especialistas: **Lisa · Mateo · Adrián · Lucas · Camila**. "Mi Día" (agenda/bookings) pasa de Valeria a **Mateo (Operar)**. Esto alinea con el shell-organism ya shipped (Ribbon = especialistas, Valeria = chat sidebar).

Necesito que ratifiques (00-research.md § 5):
1. Valeria=supervisora (no caja) + Mateo=Operar — ¿confirmás?
2. `valeria-pacientes`: "pacientes del día"→Mateo vs caja clínica propia.
3. `lisa-compliance`: vista al cliente→Plataforma + enforcement→Infra, ¿OK?
4. ¿Renombramos las stories `config-*` a su caja nueva, o solo re-tag?
5. Cockpit (F3) es tool cross-brand: ¿misma tanda o tarea tool-scope aparte?

Tras tu ratificación → state=refining → `/architect` para el plan de migración (06-tickets).
