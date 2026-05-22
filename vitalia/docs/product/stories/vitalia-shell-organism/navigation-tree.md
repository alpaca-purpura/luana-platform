<!-- voseo-allowed: internal navigation tree editing instructions and architectural notes -->

# Vitalia — Navigation Tree (editable JSON)

> Árbol funcional total vitalia: presente (shipped) + Slice 1 (in-flight) + Slice 2 (planned) + Slice 3 + defer features.
> 6 padres máx · 6 hijos por nivel máx · profundidad 2-3 (un caso 4 documentado).
> Editá el JSON debajo a mano. Cuando termines, avisame y lo leo para entender la estructura final.

## Cómo editar

- **Reordenar:** mové bloques `{...}` arriba o abajo dentro de su array.
- **Renombrar:** cambiá `label` (lo que ve el user) o `id` (slug interno — solo letras/numeros/guiones).
- **Agregar hijo:** copiá un bloque hermano y modificá.
- **Borrar:** eliminá el bloque entero (con su coma final).
- **Mover padre↔hijo:** copiá el bloque y reubicalo dentro/fuera del array `children`.
- **Marcar deferred / planned:** ajustá `status` (`shipped` · `planned` · `deferred`).
- **Cambiar icono:** valores válidos = nombre lucide-icons (https://lucide.dev/icons) — preferir outline monochrome para Apple-feel.

## Campos del nodo

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | string | sí | slug kebab-case · único en todo el árbol |
| `label` | string | sí | nombre visible al usuario (Spanish neutro) |
| `icon` | string | sí (en padre) · opcional (hijo) | lucide icon name |
| `route` | string | sí en hojas · no en padre con hijos | URL relativa (ej. `/dashboard/patients`) |
| `children` | array | no | si presente, este nodo es padre |
| `status` | enum | no | `shipped` · `planned` · `deferred` (default: `planned`) |
| `slice` | string | no | `1` · `2` · `3` (mapping al outcome MVP UI) |
| `notes` | string | no | comentario interno, no se renderiza |

## Reglas de validación

- Padre top-level: máx 6
- Hijos por padre: máx 6
- Profundidad: 3 niveles ideal · 4 solo casos extremos (justificar en `notes`)
- Si nodo tiene `children` no-vacío → no necesita `route` (el click expande/navega al primer hijo)
- Si nodo es hoja (sin `children`) → `route` obligatorio

---

## Tree (editá esto)

```json
{
  "version": "draft-1",
  "brand": "vitalia",
  "last_updated": "2026-05-21",
  "owner": "/po-ux",
  "tree": [
    {
      "id": "inicio",
      "label": "Inicio",
      "icon": "house",
      "route": "/dashboard",
      "status": "shipped",
      "slice": "1",
      "notes": "Home adaptativo · operador ve sus tareas del día · owner ve KPIs"
    },
    {
      "id": "operar",
      "label": "Operar",
      "icon": "briefcase-business",
      "status": "planned",
      "slice": "1",
      "children": [
        { "id": "inbox", "label": "Inbox", "icon": "inbox", "route": "/inbox", "status": "planned", "slice": "1", "notes": "Conversaciones unificadas WhatsApp+IG+web+email · Adrián background" },
        { "id": "agenda", "label": "Agenda", "icon": "calendar-days", "route": "/dashboard/appointments", "status": "planned", "slice": "1", "notes": "Calendar + prepaid 30% · bloqueador payment-adapter + fiscal-emission" },
        { "id": "pipeline", "label": "Pipeline", "icon": "git-branch", "route": "/dashboard/pipeline", "status": "planned", "slice": "1", "notes": "Lead → reserva · bloqueador payment-adapter + copilot-tools" },
        { "id": "pacientes", "label": "Pacientes", "icon": "users", "route": "/dashboard/patients", "status": "shipped", "slice": "1", "notes": "CRM core · historia · consent" },
        { "id": "tratamientos-ejecucion", "label": "Tratamientos en curso", "icon": "stethoscope", "route": "/dashboard/treatments", "status": "shipped", "slice": "1", "notes": "Tratamientos en ejecución + seguimiento post" },
        { "id": "tareas", "label": "Tareas", "icon": "list-checks", "route": "/dashboard/tasks", "status": "planned", "slice": "1", "notes": "Fidelización pendiente del día · workflows post-tratamiento" }
      ]
    },
    {
      "id": "crecer",
      "label": "Crecer",
      "icon": "trending-up",
      "status": "planned",
      "slice": "1",
      "children": [
        {
          "id": "marketing",
          "label": "Marketing",
          "icon": "megaphone",
          "status": "shipped",
          "slice": "1",
          "children": [
            { "id": "marketing-campanas", "label": "Campañas activas", "icon": "rocket", "route": "/marketing/campaigns", "status": "planned", "slice": "1" },
            { "id": "marketing-atribucion", "label": "Atribución", "icon": "git-merge", "route": "/marketing/attribution", "status": "shipped", "slice": "1", "notes": "attribution-matrix-4-origins capability" },
            { "id": "marketing-bowtie", "label": "Embudo Bowtie", "icon": "git-pull-request", "route": "/marketing/funnel", "status": "shipped", "slice": "1", "notes": "bowtie-funnel-5-stages capability" },
            { "id": "marketing-inversion", "label": "Inversión publicitaria", "icon": "dollar-sign", "route": "/marketing/ad-spend", "status": "planned", "slice": "2" },
            { "id": "marketing-insights-lucas", "label": "Insights de Lucas", "icon": "sparkles", "route": "/marketing/insights", "status": "shipped", "slice": "1", "notes": "lucas-stage-recommendations capability" }
          ]
        },
        {
          "id": "fidelizacion",
          "label": "Fidelización",
          "icon": "heart-handshake",
          "status": "planned",
          "slice": "1",
          "children": [
            { "id": "fid-workflows", "label": "Workflows post-tratamiento", "icon": "workflow", "route": "/fidelizacion/workflows", "status": "planned", "slice": "1" },
            { "id": "fid-nps", "label": "NPS + reseñas Google", "icon": "star", "route": "/fidelizacion/nps", "status": "planned", "slice": "1" },
            { "id": "fid-reengagement", "label": "Re-engagement", "icon": "rotate-cw", "route": "/fidelizacion/reengagement", "status": "planned", "slice": "1" },
            { "id": "fid-referidos", "label": "Referidos", "icon": "trophy", "route": "/fidelizacion/referrals", "status": "shipped", "slice": "1", "notes": "referrals-leaderboard capability" }
          ]
        },
        { "id": "ofertas", "label": "Ofertas y promociones", "icon": "tag", "route": "/dashboard/offers", "status": "shipped", "slice": "1", "notes": "Consume Luana core offer-studio · promo comercial · NO catálogo permanente" }
      ]
    },
    {
      "id": "identidad",
      "label": "Identidad",
      "icon": "fingerprint",
      "status": "planned",
      "slice": "2",
      "children": [
        {
          "id": "brand-studio",
          "label": "Brand Studio",
          "icon": "palette",
          "status": "shipped",
          "slice": "2",
          "children": [
            { "id": "brand-voz", "label": "Voz de marca", "icon": "mic-vocal", "route": "/dashboard/brand-studio/voice", "status": "shipped", "slice": "2", "notes": "Compartida Adrián + Valeria · personality_profiles" },
            { "id": "brand-visual", "label": "Identidad visual", "icon": "swatch-book", "route": "/dashboard/brand-studio/visual", "status": "planned", "slice": "2", "notes": "Colores · logo · tokens" },
            { "id": "brand-equipo", "label": "Equipo", "icon": "users-round", "route": "/dashboard/brand-studio/team", "status": "planned", "slice": "2", "notes": "Médicos · staff · perfiles · testimonios" },
            { "id": "brand-autoridad", "label": "Autoridad", "icon": "badge-check", "route": "/dashboard/brand-studio/authority", "status": "planned", "slice": "2", "notes": "Testimonios · credenciales · social proof" }
          ]
        },
        { "id": "catalogo-tratamientos", "label": "Catálogo de tratamientos", "icon": "book-open", "route": "/dashboard/treatments/catalog", "status": "planned", "slice": "2", "notes": "Precios · variantes · paquetes · DIFERENTE de tratamientos en curso" },
        { "id": "landing-publica", "label": "Landing pública", "icon": "globe", "route": "/dashboard/landing", "status": "shipped", "slice": "1", "notes": "/public/[clinic-slug] · booking widget embed live · patient portal Slice 3+" },
        { "id": "contenido", "label": "Contenido & assets", "icon": "image", "route": "/dashboard/content", "status": "planned", "slice": "2", "notes": "Posts · banners · social proof assets" }
      ]
    },
    {
      "id": "analisis",
      "label": "Análisis",
      "icon": "chart-line",
      "status": "planned",
      "slice": "2",
      "children": [
        { "id": "dashboard-ejecutivo", "label": "Dashboard ejecutivo", "icon": "layout-dashboard", "route": "/dashboard/executive", "status": "planned", "slice": "2", "notes": "Owner KPIs view" },
        { "id": "kpis-clinicos", "label": "KPIs clínicos", "icon": "activity", "route": "/dashboard/kpis", "status": "planned", "slice": "2", "notes": "Turnos · conversion · ocupación · no-show rate" },
        { "id": "roi-publicidad", "label": "ROI publicidad", "icon": "percent", "route": "/dashboard/roi", "status": "planned", "slice": "2" },
        { "id": "cohortes", "label": "Cohortes & retención", "icon": "users-2", "route": "/dashboard/cohorts", "status": "planned", "slice": "3" },
        { "id": "reportes", "label": "Reportes", "icon": "file-text", "route": "/dashboard/reports", "status": "planned", "slice": "3", "notes": "Export CSV/PDF" }
      ]
    },
    {
      "id": "configurar",
      "label": "Configurar",
      "icon": "settings",
      "status": "planned",
      "slice": "2",
      "children": [
        {
          "id": "clinica",
          "label": "Clínica",
          "icon": "building-2",
          "status": "shipped",
          "slice": "1",
          "children": [
            { "id": "clinica-datos", "label": "Datos generales", "icon": "id-card", "route": "/configurar/clinica/info", "status": "shipped", "slice": "1", "notes": "Razón social · CUIT · horarios · clinics-brand-extension capability" },
            { "id": "clinica-sucursales", "label": "Sucursales", "icon": "map-pin", "route": "/configurar/clinica/branches", "status": "deferred", "slice": "3", "notes": "Multi-clinic switcher · defer hasta demanda" },
            { "id": "clinica-calendario", "label": "Calendario operativo", "icon": "calendar-clock", "route": "/configurar/clinica/calendar", "status": "planned", "slice": "2", "notes": "Días no laborables · feriados · turnos especiales" }
          ]
        },
        { "id": "equipo-roles", "label": "Equipo & roles", "icon": "user-cog", "route": "/configurar/team", "status": "shipped", "slice": "1", "notes": "users + RBAC doctor/nurse/admin · luana-core-iam consumer" },
        {
          "id": "integraciones",
          "label": "Integraciones",
          "icon": "plug",
          "status": "planned",
          "slice": "2",
          "children": [
            { "id": "integ-canales", "label": "Canales", "icon": "messages-square", "route": "/configurar/integrations/channels", "status": "planned", "slice": "1", "notes": "WhatsApp · IG · Email · ManyChat" },
            { "id": "integ-pagos", "label": "Pagos", "icon": "credit-card", "route": "/configurar/integrations/payments", "status": "planned", "slice": "1", "notes": "Mercado Pago · Stripe · Culqi · payment-adapter-mvp story" },
            { "id": "integ-publicidad", "label": "Publicidad", "icon": "target", "route": "/configurar/integrations/ads", "status": "planned", "slice": "2", "notes": "Meta Ads · Google Ads" },
            { "id": "integ-webhooks", "label": "Webhooks externos", "icon": "webhook", "route": "/configurar/integrations/webhooks", "status": "planned", "slice": "2" }
          ]
        },
        {
          "id": "compliance",
          "label": "Compliance",
          "icon": "shield-check",
          "status": "shipped",
          "slice": "1",
          "children": [
            { "id": "compliance-hipaa", "label": "HIPAA-lite framework", "icon": "lock", "route": "/dashboard/medical-compliance", "status": "shipped", "slice": "1", "notes": "hipaa-lite-defensive-stack capability" },
            { "id": "compliance-audit", "label": "Audit log viewer", "icon": "scroll-text", "route": "/configurar/compliance/audit", "status": "planned", "slice": "3" },
            { "id": "compliance-consents", "label": "Consents pacientes", "icon": "file-check", "route": "/configurar/compliance/consents", "status": "shipped", "slice": "1", "notes": "crm-consent-optout capability" }
          ]
        },
        { "id": "plan-billing", "label": "Plan & facturación", "icon": "wallet", "route": "/configurar/plan", "status": "planned", "slice": "2", "notes": "vitalia-pricing-decision story pendiente · tier model · billing" },
        {
          "id": "preferencias",
          "label": "Preferencias",
          "icon": "sliders-horizontal",
          "status": "planned",
          "slice": "2",
          "children": [
            { "id": "pref-idioma", "label": "Idioma & timezone", "icon": "languages", "route": "/configurar/prefs/locale", "status": "planned", "slice": "2" },
            { "id": "pref-voz", "label": "Voz & voice cloning", "icon": "audio-lines", "route": "/configurar/prefs/voice", "status": "deferred", "slice": "3", "notes": "Voice cloning premium · brand.yaml::voice_cloning currently false" },
            { "id": "pref-notificaciones", "label": "Notificaciones", "icon": "bell", "route": "/configurar/prefs/notifications", "status": "planned", "slice": "2" }
          ]
        }
      ]
    }
  ],
  "transversal_layer": {
    "notes": "NO son opciones del menú · viven en el shell siempre presente",
    "agents": [
      { "id": "valeria", "role": "copilot owner-facing", "surface": "chat rail right · siempre visible · mode-agent expands a 50%" },
      { "id": "adrian", "role": "sales agent paciente-facing", "surface": "background en Inbox · atribución agente inline visible" },
      { "id": "lucas", "role": "analyst", "surface": "insights inline dentro de Marketing/Análisis · daily analysis cron" }
    ],
    "global_actions": [
      { "id": "global-search", "label": "Buscar todo", "icon": "search", "shortcut": "cmd+k" },
      { "id": "global-notifications", "label": "Notificaciones", "icon": "bell" },
      { "id": "global-user-menu", "label": "Tu cuenta", "icon": "user-circle" }
    ]
  }
}
```

## Decisiones implícitas (señaladas para que cuestiones si querés)

1. **Valeria/Adrián/Lucas como `transversal_layer`** — NO opciones del menú · viven en el shell.
2. **Inicio = single route** sin hijos (home adaptativo).
3. **Tratamientos aparece 2 veces** semánticamente: `operar/tratamientos-ejecucion` (en curso con pacientes) vs `identidad/catalogo-tratamientos` (catálogo definición). Diferentes acciones.
4. **Ofertas en Crecer** (es promo comercial, no catálogo permanente).
5. **Patient portal** lo agrupé bajo `identidad/landing-publica` (es público-facing extension del clinic slug). Si lo querés como padre 7º, agregalo.
6. **Compliance como sub-nodo de Configurar** — si lo querés como padre 7º por ser diferenciador médico-legal, movelo a top-level.

Mockup Apple-style cargando en otro file (refresh `http://localhost:8888/dual-mode-shell.html` cuando lo avise).
