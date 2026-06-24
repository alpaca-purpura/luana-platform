# Prompt de continuación — Mockups de pitch Comunify (sesión nueva)

> Pegá TODO esto como primer mensaje de la sesión nueva.

---

Estoy armando **mockups HTML desechables** para una **reunión con un inversor** (HOY) que muestran la visión del producto **Comunify** (SaaS creator economy LatAm: el creator solo recibe un **equipo de empleados IA** sobre un solo motor). NO es código de producto — es desechable, vive en `pitch-mockups/` en la raíz del repo. NO corras Docker ni toques el frontend real; el mockup es HTML/CSS estático que abre directo en el navegador.

## Lo PRIMERO que tenés que hacer
1. Leé `pitch-mockups/index.html` y `pitch-mockups/pitch.css` completos — son la pantalla A ya terminada y aprobada. Reusá ese chrome y ese CSS, NO los rehagas.
2. Leé este archivo entero (estado + aprendizajes).
3. NO arranques a maquetar: primero presentá el **diseño funcional** de la pantalla que toca, esperá mis comentarios, y RECIÉN ahí mockeás. Una pantalla a la vez.

## Qué estamos construyendo (4 pantallas, mismo shell navegable)
El Ribbon ya enlaza a estos archivos. Cada pantalla = un HTML que comparte `pitch.css` y copia el chrome del shell desde `index.html`:

| Pantalla | Archivo | Estado | Origen del contenido |
|---|---|---|---|
| A · "Mi Día" (Inicio) | `index.html` | ✅ HECHA Y APROBADA | research (command center) |
| **D · Tomás · Contenido/replicar** | `tomas.html` | ⏳ SIGUIENTE | research (loop replicate-for-me) — abajo |
| B · Nina · Escalera de oferta | `nina.html` | ⏳ pendiente | COPIAR de vitalia, adaptar a creator |
| C · Sofía · Vende/Recupera | `sofia.html` | ⏳ pendiente | COPIAR de vitalia, adaptar a creator |

## El shell real (NO re-descubrir — ya está replicado en index.html)
Es una réplica estática fiel del organism shell real (`@luana/ui-kit::ShellLayout`). Estructura:
- **TopBar** (48px): logo isotipo real (`brand/Logo.png`) + "Comunify" + 🌙 + tenant switcher (Carla Méndez).
- **Luana = panel chat izquierdo** (550px, clase `.supervisor`) + seam de resize (`.seam`): header avatar + estado en línea + 🕘/＋, mensajes (`.msg .bubble`), quick-replies (`.quick .qp`), composer con **📎 adjuntar + 🎤 audio + enviar** (`.composer .cicon` / `.send`).
- **App panel derecho** (`.app`): **Ribbon** (`.ribbon` h-56px) = `🏠 Inicio` (pill neutro) + Nina/Tomás/Sofía/Bruno/Lucía + `⚙️ Plataforma` (a la derecha). Tab activo = pill soft del agente. Luana NO está en el ribbon (es supervisora).
- Debajo del Ribbon: **SubTabsBar** (`.subtabs` min-h-42, botones `.stab`) — solo en pantallas de agente. Opcional N3 (`.subsub`).
- **Contenido**: `.appcontent` > `.wrap` (full-width, padding, SIN max-width centrado).

Para una pantalla de agente (D/B/C): copiá de `index.html` el `<header class="topbar">`, el `<aside class="supervisor">…</aside>`, el `<div class="seam">` y el `<nav class="ribbon">`; marcá el tab del agente con `active` (sacá `active` de Inicio); agregá la SubTabsBar; cambiá el contenido. Luana puede quedar con un mensaje contextual al agente (no obligatorio cambiarla).

## Datos compartidos (úsalos idénticos en las 4 pantallas)
**Creator de ejemplo:** **Carla Méndez** — finanzas personales para freelancers/emprendedores LatAm. Modelo híbrido. Escalera de oferta:
- 🎁 Lead magnet (gratis): masterclass "3 errores que te mantienen en cero"
- 🪤 Tripwire ($27): "Ordená tus finanzas en 7 días"
- 📘 Core ($149): curso "Finanzas para Freelancers"
- 👑 VIP ($497): cohorte trimestral + mentoría grupal
- 🔄 Continuity ($19/mes): membresía "Club Finanzas"
- Canales: Instagram · TikTok · WhatsApp

**Cast + colores (tokens reales globals.css) + avatares (fotos de vitalia, ya en `pitch-mockups/agents/`, mapeados por género):**
| Comunify | rol (ribbon) | color | avatar (clase `.av-X` / `.rtab.X .rav`) |
|---|---|---|---|
| Luana (supervisora, sidebar) | — | `--luana #7B2FF7` | valeria.png |
| Nina | Estratega | `--nina #6A3CFF` | lisa.png |
| Tomás | Atraer | `--tomas #2D7FF9` | adrian.png |
| Sofía | Vender | `--sofia #16C784` | camila.png |
| Bruno | Operar | `--bruno #F59E0B` | mateo.png |
| Lucía | Retener | `--lucia #1246D6` | valeria.png (reuso) |

Las clases `.av md av-tomas` etc. ya cargan la foto por CSS. SubTabs de cada agente (de `shell-routes.ts`):
- **Tomás:** Referentes 🎯 (default) · Contenido ✍️ · Audiencia 👥 · Pauta 📢
- **Nina:** Marca 🏷️ · Ofertas 📦 (→ N3: Catálogo · Escalera) · Cohorts 🎓
- **Sofía:** Conversaciones 💬 · Pipeline 📊 · Recuperación 🔄

## D · Tomás · Contenido (lo que sigue) — diseño funcional propuesto (de la research)
**Dolor:** el creator solo pierde horas averiguando qué publicar, adaptándolo y escribiéndolo. **Filo (nadie lo tiene junto):** el loop completo en una acción — descubrir → juzgar fit → adaptar a MI marca → elegir formato → guion.

**Pantalla: Tomás → Referentes** (subtab activo Referentes), layout split:
1. **Descubrir:** Tomás vigila los referentes + tendencias del nicho → feed "3 cosas que funcionan esta semana". Cada tarjeta: post fuente (referente + thumbnail) + **por qué funciona** (tipo de hook + CTA + "+340% vs su promedio").
2. **Juzgar fit (decide el creator):** cada tarjeta con **Fit para tu audiencia: 91%** + botón `Replicar para mí`.
3. **Adaptar (IA):** reescribe la idea en la voz + audiencia de Carla.
4. **Elegir formato (IA recomienda, creator confirma):** "Mejor formato: Reel — tus carruseles ya rinden, pero este tema engancha más en video y tus reels tienen 2× alcance." (razón anclada en la performance propia).
5. **Producir:** si Reel → hook + guion beat-by-beat + shot list + audio sugerido; si Carrusel → copy slide-by-slide.

**Momento mágico = panel derecho que se despliega** al tocar `Replicar para mí`: muestra la transformación completa (reescrito en tu voz → razón del formato → guion listo) — la media tarde de trabajo en un tap.

**Mock recomendado (1 pantalla):** rail izq = referentes (avatares + handles) + filtro "tendencias de tu nicho"; centro = 3 tarjetas del feed; derecha = panel de transformación (tu versión en tu voz + badge "Mejor formato: Reel" con razón + guion hook/beats/CTA + shot list + "Aprobar y programar"). Datos de Carla (nicho finanzas). Opcional 2º wow: audio del reel en voz clonada (distintivo comunify) — preguntame antes de meterlo.

→ En la sesión: presentame este funcional, ajustá con mis comentarios, y después construí `tomas.html`.

## B · Nina · Escalera — cuando toque (COPIAR de vitalia)
Nina describe en lenguaje natural qué vende → escalera de 5 escalones con ejemplos + precios reales por tipo de creator. Engine ya trae los ejemplos (COACH_MENTOR / ACADEMIA_INFOPRODUCTOR). Escalones (canon engine → label creator): lead_magnet→Lead Magnet · activacion→Tripwire · transformacion→Curso Core · maximizacion→VIP/Upsell · corporativo→Membresía/Continuity. Barra de completitud + hueco detectado.
- **Copiar visual de:** `vitalia/frontend/src/features/lisa/components/servicios/EscaleraView.tsx` + el mockup `…/vitalia-*/mockups/escalera.html` (escalón 1 full-width arriba → 2-3-4 banda de 3 cols → 5 abajo).
- Comunify ya tiene `comunify/frontend/src/features/comunify/components/ladder-visualizer.tsx` como referencia.
- Engine SSoT (solo lectura, para datos reales): `core/luana-core-offer-studio/src/luana_core_offer_studio/domain/{value_level_catalog.py, offer_ladder_hints.py}`.

## C · Sofía · Vende/Recupera — cuando toque (COPIAR de vitalia)
Pipeline Kanban (interesado → llamada agendada → propuesta enviada → inscripto / no avanzó) + tarjeta de lead (badge 🤖 Sofía / 🙋 vos + valor + score donut 0-100 glass-box + señales de compra + canal IG/TikTok/WhatsApp) + sub-tab Recuperación (leads fríos + diagnóstico IA + Reactivar). NO PHI (sacar dual filter clinic).
- **Copiar visual de:** `vitalia/docs/archive/2026/stories/vitalia-fase2-adrian-embudo/mockups/embudo-v3.html` + `vitalia/frontend/src/features/adrian/components/embudo/{AdrianEmbudoView,KanbanBoard,PipelineColumn,LeadCard,EmbudoMetrics}.tsx` + tipos `embudo-schema.ts`.

## Aprendizajes de la sesión anterior (NO repetir errores)
1. **USAR EL ORGANISM SHELL REAL** — el primer intento inventó un shell genérico (Chris lo rebotó). El chrome de `index.html` ya es la réplica fiel; reusalo, no inventes layout nuevo.
2. **Contenido full-width** — cada hoja ocupa todo el ancho, aprovechado horizontalmente (grids de N columnas). Sin `max-width` centrado.
3. **Sin métricas vanidosas** — nada de "horas ahorradas / tareas hechas". El contenido se piensa desde la NECESIDAD real del creator (plata que entra / por entrar / en riesgo / qué decido). Pensá el contenido, no lo rellenes.
4. **Funcional PRIMERO, mockup DESPUÉS** — Chris revisa el diseño funcional de cada pantalla antes de maquetar. Una a la vez.
5. **Fidelidad de tokens/assets** — colores `--agent-*` de `globals.css`, avatares de vitalia por género (ya copiados), logo isotipo real. No inventar.
6. **Español neutro LatAm** en todo el copy user-facing.
7. Composer de Luana tiene 📎 + 🎤 (intuir que se le mandan archivos/audios como input).

## Paso a paso para cerrar todo
1. Leer `index.html` + `pitch.css` + este archivo.
2. **D:** presentar funcional de Tomás/Referentes → ajustar con Chris → construir `tomas.html` (copia chrome de index, Tomás activo en ribbon, SubTabsBar Tomás, contenido = loop replicate). → Chris revisa visual → iterar.
3. **B:** presentar funcional de Nina/Escalera → ajustar → construir `nina.html` (copiando visual de vitalia escalera). → revisar.
4. **C:** presentar funcional de Sofía/Pipeline+Recuperación → ajustar → construir `sofia.html` (copiando visual de vitalia embudo). → revisar.
5. Verificar navegación: Ribbon + tarjetas de A enlazan entre las 4 pantallas. Bruno/Lucía quedan como links muertos (fuera de scope) salvo que Chris pida pantalla mínima.

## Abrir / revisar
```
xdg-open pitch-mockups/index.html      # o file://… en el navegador
```
La reunión es HOY → moverse con foco, pero respetando funcional-antes-de-mockup.
