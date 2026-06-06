# Demo Script — nicolify-r1-abel-icp-buyer

> Derivado de los scenarios Gherkin de `04-validators.yaml` + `01-spec.md § Business rules`.
> Lenguaje de usuario (no técnico). Ejecutar contra el mismo entorno que usó el dev para verificar.
>
> T-E2E-1 · story-origin: nicolify-r1-abel-icp-buyer

> **★ Estado 2026-06-04 (continuación):** todo el HAPPY PATH fue **verificado LIVE por Claude** como Chris (slug `alpaca-purpura`) con el LLM real (DeepSeek): empty → modal → Texto → Analizar → analizando → navega al borrador → ProposalBanner. 0 errores de consola/página, anti-burbuja CLEAN. Evidencia: `dod-evidence-screens/ff-{1..4}.png` + `fullflow-findings.json`. Esta demo es tu **confirmación con tus propios ojos**, no debugging.
> **3 bugs reales se cazaron + repararon en el camino** (estaban enmascarados por el "verde" previo): (A) el modal "Abel te arma un borrador" no abría (componente sin montar); (B) el submit daba 422 (contrato FE↔BE desalineado); (C) burbuja en URLs 404. Todos fixed + re-verificados.
> **Recomendación (HB-33):** hacé la demo con **tu propia cuenta `hola@alpacapurpura.lat`** (URL con slug `alpaca-purpura`, no UUID) — es el routing exacto del usuario real. Tu tenant quedó **vacío** (0 ICPs) para arrancar desde el empty-state.

---

## SETUP

**Prerrequisitos (verifica antes de empezar):**

1. Stack nicolify corriendo: `make dev-nicolify` (FE :3001, BE :8001)
2. Migración 002 aplicada: el BE arranca con las tablas `abel_icps` y `abel_buyers`
3. URL de acceso: `http://localhost:3001` (o `dev-app.nicolify.com` si el túnel Cloudflare está UP)
4. Credenciales de prueba (de `nicolify/.env.dev`, gitignored):
   - Email: `owner.demo@nicolify.com` (rol owner, tenant_id `7f464ab7…`)
   - Password: ver `DEV_APP_TEST_PASSWORD` en `nicolify/.env.dev`
5. (Opcional) Para verificar cross-check: login también con `hola@alpacapurpura.lat` (Chris)

**Tenant en estado "demo limpio":**
- El tenant de prueba tiene 0 ICPs (para verificar SC-empty) o al menos 1 ICP en borrador (para verificar SC-happy).
- Para el happy path completo, se necesita un tenant con 0 ICPs inicialmente.

---

## HAPPY PATH (lenguaje de usuario)

Ejecutar en orden. Cada paso numerado es una acción del usuario.

### Flujo 1: onboarding empty → primer ICP via Abel

1. Abre `http://localhost:3001` en Chrome — se autentica como `owner.demo@nicolify.com`.
2. El shell carga. Haz clic en **Abel** en el Ribbon lateral (ícono/tab del agente).
3. El SubTab **"ICP & buyer"** debe estar seleccionado por defecto (o haz clic en él).
4. **Resultado esperado:** ves la pantalla de `DraftFirstStarter` — dos botones:
   - "Generar con Abel" (acción principal)
   - "En blanco" (secundario)
   - ✅ NO hay formularios, NO hay EntitySubNavBar, NO hay lista de ICPs.

5. Haz clic en **"Generar con Abel"**.
6. **Resultado esperado:** aparece el `UniversalIntakeModal` con 4 pestañas:
   - URL | Archivo | Texto | Conectar
   - La pestaña "Conectar" está visualmente deshabilitada (aparece como placeholder con CTA "Ir a Configuración → Conexiones").

7. Selecciona la pestaña **"Texto"** (o "URL").
8. Pega una descripción breve de un cliente ideal (ejemplo: "Agencias de marketing digital medianas de CDMX que gestionan más de 10 cuentas de marca y buscan escalar su equipo sin contratar")
9. Haz clic en **"Analizar"**.
10. **Resultado esperado durante la extracción:**
    - Aparece un estado "Analizando…" (loading indicator)
    - Abel procesa la semilla y genera un borrador de ICP
    - (si hay timeout): aparece un fallback amigable — "Abel no pudo procesar la fuente. Puedes crear el ICP en blanco." ✅ NO hay spinner infinito, NO hay error overlay de Next.

11. **Resultado esperado post-extracción (happy path):**
    - El modal se cierra.
    - La vista navega al detalle del ICP recién creado: `/{tenantId}/abel/icp/{icpId}/datos`.
    - Aparece el **`ProposalBanner`** en la parte superior del formulario:
      - Texto: "Abel preparó este borrador con la información que compartiste. Revisa los datos y ratifica para activar el ICP."
      - Botones: **"Ratificar"** (primario) y **"Descartar"** (secundario)
    - El `EntitySubNavBar` superior muestra: [← ICPs] | [Nombre del ICP] | [datos] | [+ buyer]

### Flujo 2: editar un campo y verificar autosave

12. En el formulario `IcpDatosForm`, modifica el campo **"Dolor principal"** (o cualquier campo de texto).
13. **Resultado esperado:**
    - Después de ~600ms sin escribir, el cambio se guarda automáticamente.
    - No hay botón "Guardar" que debas presionar.
    - Un indicador sutil confirma "Guardado." (toast o inline).

14. Recarga la página (F5 / Cmd+R).
15. **Resultado esperado:** el valor modificado persiste — no se perdió.

### Flujo 3: ratificar el borrador

16. Haz clic en **"Ratificar"** en el ProposalBanner.
17. **Resultado esperado:**
    - El ProposalBanner desaparece.
    - El ICP cambia de `status: borrador` a `status: listo`.
    - El formulario sigue visible y editable.
    - Un toast confirma la acción.

### Flujo 4: agregar un buyer

18. En el `EntitySubNavBar`, haz clic en **"+ buyer"** (el affordance de agregar al final de las hojas).
19. **Resultado esperado:**
    - Se crea un buyer hijo ligado al ICP.
    - El EntitySubNavBar agrega una nueva hoja (con el nombre del buyer o un placeholder).
    - La URL cambia a `/{tenantId}/abel/icp/{icpId}/{buyerId}`.
    - Aparece el `BuyerLeafForm` con los campos del buyer.

20. Llena el campo **"Nombre"** y **"Rol"** del buyer.
21. **Resultado esperado:** autosave funciona igual que para el ICP (600ms debounce, sin botón Guardar).

### Flujo 5: establecer buyer como principal

22. Haz clic en **"Establecer como principal"** en el BuyerLeafForm.
23. **Resultado esperado:**
    - Este buyer queda marcado como `is_primary = true`.
    - Si había otro buyer principal antes, ahora tiene `is_primary = false`.
    - ✅ Exactamente 1 buyer tiene `is_primary = true` para este ICP (RN-6).

---

## EDGE CASES (reglas de negocio negativas)

### EC-1: mark-ready sin mínimo requerido (RN-8)

1. Navega a un ICP recién creado (sin buyers).
2. Intenta marcarlo como listo (si hay un control para eso — puede ser automático o vía menú).
3. **Resultado esperado:**
   - El backend responde `422 Unprocessable Entity` con `missing: ["buyer_required"]`.
   - La UI muestra el mensaje de error inline (bajo el control o como toast de error).
   - El ICP sigue en `status: borrador` — no cambió de estado.
   - ✅ NO hay barra de progreso de completitud (RN-8 la eliminó — el mockup tenía CSS residual que NO se implementó).

### EC-2: cross-tenant (RN-1)

1. Abre la consola del browser (DevTools → Console) y anota el tenant_id actual.
2. Modifica la URL directamente a un `icpId` que sabes que pertenece a otro tenant (o usa un UUID ficticio).
3. **Resultado esperado:**
   - La respuesta del backend es `404 Not Found`.
   - La UI no muestra datos del ICP ajeno (ni un formulario vacío que revele la existencia).
   - ✅ En los logs del backend: `GET /api/v1/abel/icp/{id} 404` — sin traceback.

### EC-3: intentar hacer algo con el modo "Conectar" deshabilitado

1. Abre el `UniversalIntakeModal` ("Generar con Abel").
2. Haz clic en la pestaña **"Conectar"**.
3. **Resultado esperado:**
   - La pestaña muestra un placeholder con texto explicativo.
   - Aparece un CTA: "Ir a Configuración → Conexiones" (navega pero no abre un form funcional).
   - ✅ No hay error, no hay formulario de conexión (depende de Config→Conexiones, no construido en esta story).

---

## TEARDOWN

1. Cierra sesión (logout) o simplemente cierra el tab.
2. (Opcional) Si quieres dejar el tenant limpio para la próxima demo:
   - Descarta los ICPs creados via "Descartar" en el ProposalBanner.
   - O usa la API directamente: `DELETE /api/v1/abel/icp/{id}` (soft-delete).
3. Verifica que los logs del backend no tienen tracebacks:
   ```bash
   docker logs luana-dev-nicolify_backend_dev-1 --tail 50 | grep -E 'ERROR|Traceback|Exception'
   # Resultado esperado: vacío (0 líneas)
   ```

---

## Signoff

```yaml
demo_required: true
demo_signoff:
  signed_by: ""         # Chris completa: "Chris"
  date: ""              # Chris completa: YYYY-MM-DD
  result: ""            # Chris completa: APPROVED | APPROVED_WITH_NOTES | REJECTED
  notes: ""             # Chris completa si aplica
  open_items: []        # Chris completa: [{item, severity, disposition}]
```

> Instrucciones para Chris: ejecuta los flujos del HAPPY PATH y al menos los 3 EDGE CASES.
> Completa el bloque `demo_signoff` arriba y notifica al equipo.
> Sin `result: APPROVED` o `APPROVED_WITH_NOTES` (severity ≤ medium), el PR no cierra a `done`.
