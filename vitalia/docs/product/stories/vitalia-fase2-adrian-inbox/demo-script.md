# Demo Script — vitalia-fase2-adrian-inbox

> **Critical Rule #37 §5 · `definition-of-done-live-verify.md`.** Guion de **product demo** para que Chris valide manualmente la story, paso a paso, contra el MISMO `dev-app` que usó el dev en la live-verify. Lenguaje de usuario (sin curl/tokens/URLs internas). `demo_required: true` por ser UI user-reachable.
>
> Derivado de SC-1..SC-10 de `01-spec.md § Gherkin scenarios`.

## SETUP (estado inicial)

- **Entorno:** `make dev-app-vitalia` → `https://dev-app.vitalialat.com` (o `localhost:3002` fallback si el túnel no está activo)
- **Usuario de prueba:** `dr.demo@vitalialat.com` (rol `owner`, tenant Sanaré MX)
- **Datos previos a tener:**
  - Al menos 3 conversaciones activas en el inbox: una en modo "Adrián decide" (canal WhatsApp), otra en "Adrián consulta" (canal Instagram), y una más en "Yo escribo" (canal email).
  - Una conversación "estancada" (sin respuesta del paciente hace >24h) para el nudge.
  - Un segundo tenant (tenant B) para la prueba de cross-tenant.
- **Cómo llegar:** Iniciar sesión → clic en **Adrián** en el Ribbon → clic en **Inbox** en la barra de sub-tabs.

---

## HAPPY PATH

### Parte A — Inbox y conversaciones

1. Iniciar sesión con `dr.demo@vitalialat.com` y navegar a Adrián → Inbox.
   **Esperado:** la pantalla muestra el inbox real (no el placeholder gris), con la lista de conversaciones a la izquierda (320px), el thread en el centro y el panel de contacto a la derecha.

2. Observar la lista de conversaciones.
   **Esperado:** cada conversación muestra el nombre enmascarado del paciente (ej. "P.H."), el ícono de canal (WhatsApp 🟢 / Instagram 📷 / Email 📧 / Web 🌐), el badge de modo (🤖 / 🤝 / 👤) y el punto de no-leído si corresponde.

3. Hacer clic en la conversación de "P.H." (WhatsApp, modo 🤖 Adrián decide).
   **Esperado:** el thread central carga el historial de mensajes; la URL cambia a `?conv={uuid}` sin mostrar nombre ni datos del paciente; Valeria reacciona en el panel lateral izquierdo con contexto del lead y 1-2 acciones sugeridas.

4. En el thread, observar un tool-call de Adrián.
   **Esperado:** hay un bloque colapsable "🤖 Adrián verificó disponibilidad → 3 turnos" visible inline entre los mensajes; el Activity stream (parte inferior del thread) registra la tool-call cronológicamente.

### Parte B — Cambio de modos

5. Con la conversación de P.H. abierta (modo 🤖), pulsar **"Tomar control"** (botón visible en el banner de autonomía).
   **Esperado:** el modo pasa a 👤 "Yo escribo"; el banner cambia a "Tú tienes el control de esta conversación"; el composer (área de texto) se habilita para escribir; el Activity stream registra "Cambio de modo: decide → manual".

6. Escribir un mensaje en el composer y pulsar enviar.
   **Esperado:** el mensaje sale firmado por el humano (no como Adrián); aparece en el thread inmediatamente.

7. Pulsar el toggle de modo y seleccionar **"🤝 Adrián consulta"**.
   **Esperado:** Adrián prepara un borrador de respuesta visible en el composer con el banner "✨ Adrián sugiere esta respuesta"; hay tres botones: [Aprobar y enviar], [Editar], [Descartar]. Ningún mensaje sale aún.

8. Editar el borrador (cambiar "sábado" por "lunes") y pulsar **[Aprobar y enviar]**.
   **Esperado:** el mensaje sale con el texto editado, firmado por el humano; el Activity stream registra "Humano editó propuesta de Adrián".

9. Volver al modo **"🤖 Adrián decide"**.
   **Esperado:** el badge del toggle muestra 🤖 Adrián decide; el banner de autonomía vuelve ("Adrián está atendiendo esta conversación · Tomar control").

### Parte C — Modo conversación (full canvas)

10. Con el inbox abierto y Valeria en estado "rail" (columna estrecha), pulsar el botón **"⛶ Modo conversación"** en la barra del thread.
    **Esperado:** Valeria se colapsa completamente; el inbox ocupa el 100% del lienzo (Ribbon y SubTabs siguen visibles pero el área de Valeria desaparece).

11. Pulsar el mismo botón nuevamente.
    **Esperado:** Valeria vuelve al estado anterior ("rail"), sin que el inbox pierda la conversación activa ni el historial.

### Parte D — Nudge (empujón)

12. Seleccionar la conversación "estancada" (sin respuesta >24h).
    **Esperado:** la conversación aparece en la lista con badge indicando inactividad.

13. Pulsar el botón **"Dar empujón"** visible en el ThreadHeader.
    **Esperado:** aparece un modal de confirmación; al confirmar, el toast dice "Empujón enviado"; el Activity stream registra el nudge; NO se crea una conversación nueva.

---

## EDGE CASES (reglas de negocio negativas)

### SC-3 — PHI bloqueada por canal no-encriptado

- **Acción:** en una conversación activa de WhatsApp (tier free), esperar a que el paciente pregunte "¿Cuál fue mi diagnóstico de la semana pasada?" y observar la respuesta automática de Adrián.
  **Esperado:** Adrián NO devuelve datos clínicos; responde con "Por seguridad, tus resultados están en tu portal: {link}"; el Activity stream registra "ComplianceService bloqueó PHI outbound".

### SC-4 — Cambio de modo concurrente

- **Acción:** en una conversación en modo "Adrián decide" mientras aparece el indicador de escritura ("Adrián está respondiendo…"), pulsar inmediatamente "Tomar control".
  **Esperado:** el modo pasa a manual de forma transaccional; el mensaje en vuelo de Adrián NO se envía; si el backend devuelve 409, el toast indica el error y el modo revierte.

### SC-7 — Empty state

- **Acción:** aplicar el filtro "Sin leer" cuando todas las conversaciones ya fueron leídas.
  **Esperado:** empty state con avatar gradiente + heading "Sin resultados" + botón "Limpiar filtros".

### SC-8 — Error de red en el thread

- **Acción:** abrir una conversación y simular un error de red (DevTools → Network → Offline).
  **Esperado:** banner "No pudimos cargar esta conversación. Intenta de nuevo." + botón Reintentar; la lista de la izquierda sigue operativa.

### SC-9 — Navegación por teclado

- **Acción:** desde la barra de búsqueda, navegar la UI completa solo con Tab.
  **Esperado:** orden secuencial: búsqueda → filtros → primera conversación → toggle de modo → composer; la conversación activa tiene `aria-current`; el modo activo tiene `aria-selected`; presionar Esc en el composer devuelve el foco al thread.

### SC-10 — Cross-tenant bloqueado

- **Acción:** siendo usuario del tenant A, modificar el UUID de `?conv=` en la URL para intentar acceder a una conversación del tenant B.
  **Esperado:** la API responde 404 sin revelar ningún dato del tenant B; la UI muestra el estado de error del thread.

---

## TEARDOWN

- Las conversaciones de prueba del HAPPY PATH no requieren limpieza (son datos de desarrollo).
- Si se probó SC-3 activando el patient asking for results, el chat queda en el estado de redirección al portal — es el comportamiento esperado.
- El inbox queda en el estado natural del tenant Sanaré MX.

---

## Resultado (lo firma Chris)

```yaml
demo_signoff:
  signed_by: Chris
  date: <YYYY-MM-DD>
  result: APPROVED | APPROVED_WITH_NOTES | REJECTED
  notes: ""
  open_items: []
```

<!-- voseo-allowed: template de proceso interno -->
