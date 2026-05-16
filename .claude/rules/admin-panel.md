---
globs: "**/backend/src/modules/*/admin/**/*.py"
description: Stub — invoca backend-expert skill
---

# Admin Panel (Streamlit)

Admin panel es **opcional per brand**. Cada brand que necesite admin lo hostea en `{brand}/backend/src/modules/{brand}/admin/`.

Registry-based `st.navigation`. Cada sidebar option = 1 `PageSpec` + 1 `pages/{slug}.py` wrapper + 1 `modules/{name}.py::render_*()`. Lógica solo en `modules/`.

Paths per brand:

```
{brand}/backend/src/modules/{brand}/admin/
├── app.py                 # entry, st.set_page_config único
├── pages/{slug}.py        # wrappers thin
├── modules/{name}.py      # render_*() lógica
└── _shared/               # utilidades cross-module dentro de la admin
```

Detalle (estructura, agregar opción, contract tests, smoke tests, Docker limits) en `backend-expert` skill → `references/admin-panel.md`.

**Prohibido:** lógica en `pages/*.py`, `st.set_page_config` fuera `app.py`, import cruzado `modules/A → modules/B` (excepto `_shared`), slug duplicado, import cross-brand (cada admin es brand-aislado).

## Multibrand awareness (post reorg 2026-05-15)

- Cada brand decide si bootstrap admin panel o no (no es obligatorio).
- Lógica admin común a todas las brands → candidate para `core/luana-core-platform/src/luana_core_platform/admin/` (requiere `/pm-luana` promotion gate).
