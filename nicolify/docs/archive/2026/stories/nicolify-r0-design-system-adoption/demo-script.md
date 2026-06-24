---
story_id: nicolify-r0-design-system-adoption
ticket: T-5
purpose: "Guía para que Chris ejercite el happy path en dev-app nicolify (gate G · chris_verify.signoff)"
created_at: 2026-06-15
---

# Demo Script — T-5 Design System Adoption (nicolify)

> **Nota:** el resultado de este ejercicio (SATISFIED / SATISFIED_WITH_FOLLOWUPS / REJECTED)
> va en `checkpoint.md::chris_verify.signoff`, NO aquí.
> Este archivo es la guía de pasos — el registro es el checkpoint.

---

## SETUP

### Entorno

- **URL:** `http://localhost:3001` (dev local) o `dev-app.nicolifylat.com` si el túnel está activo.
- **Usuario de prueba:** ver `nicolify/.env.dev` (variable `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`).
- **Datos previos:** al menos 1 ICP creado en el tenant de prueba. Si no hay, crear uno antes de empezar.

### Antes de comenzar

```bash
# Levantar el stack dev nicolify
cd ~/Proyectos/luana-nicolify
make dev-nicolify

# Verificar que el frontend responde
curl -s http://localhost:3001 | grep -c "nicolify" || echo "WARN: stack no responde"
```

---

## HAPPY PATH — Ejercitar abel / ICP master + detail + autosave write

### Parte 1: ICP Master List (tokens + kit primitives)

1. Navegar a `http://localhost:3001/{tenantId}/abel/icp`.
2. Verificar que la página carga sin errores de consola.
3. Verificar que el **Ribbon** muestra las 5 tabs: Mi Empresa · Atraer · Vender · Operar · Retener.
4. Verificar que la tab **Mi Empresa** (Abel) está activa y el contenido es la grilla de ICPs.
5. Si hay ICPs: la grilla muestra `EntityInfoCard` con avatar circular, nombre y sector.
6. Si no hay ICPs: verificar que aparece el **estado vacío** (EmptyState de kit) con el botón de acción.
7. Verificar que la tipografía usa **League Spartan** (display) y los colores base son **indigo nicolify**.

### Parte 2: ICP Detail — EntitySubNavBar + full-bleed

8. Hacer clic en un ICP existente.
9. Verificar que la URL cambia a `/{tenantId}/abel/icp/{icpId}/datos`.
10. Verificar que la **barra N3 EntitySubNavBar** aparece full-bleed (pegada al ancho, sin margen lateral).
11. Verificar que la barra muestra: `‹ ICPs | {avatar} {nombre ICP} | datos | buyers…`.
12. Verificar que la flecha `‹ ICPs` vuelve a la lista.
13. Verificar que la tipografía y los colores de la barra coinciden con el mockup ratificado.

### Parte 3: Autosave write (DoD gate #37)

14. Dentro del detalle del ICP, modificar el campo **Nombre del ICP** (o cualquier campo editable).
15. Esperar 600ms sin hacer clic en "Guardar" (autosave on-change).
16. Verificar que aparece el **indicador de autosave** (`FloatingAutosaveIndicator`) con estado "Guardando…" seguido de "Guardado".
17. **Recargar la página** (`F5` o `Ctrl+R`).
18. Verificar que el cambio persiste — el campo muestra el nuevo valor.
19. Verificar los logs del backend: buscar `PATCH /api/v1/abel/icp/{icpId}` con status 200.

### Parte 4: Navegación por teclado en EntitySubNavBar

20. Hacer foco en la primera tab de la barra N3 (Tab key desde cualquier elemento anterior).
21. Presionar `→` (ArrowRight) → verificar que el foco avanza a la siguiente tab.
22. Presionar `←` (ArrowLeft) → verificar que el foco retrocede.
23. Presionar `End` → foco va a la última tab.
24. Presionar `Home` → foco vuelve a la primera tab.

---

## EDGE CASES

### E1 — ICP sin datos completos

25. Abrir un ICP con campos vacíos.
26. Verificar que los campos vacíos muestran el placeholder correcto (sin errores de render).
27. Verificar que `FloatingAutosaveIndicator` NO aparece hasta que se edita algo.

### E2 — Estado de error de red

28. Con DevTools abierto, en la tab Network, bloquear `**/api/v1/abel/icp/**`.
29. Refrescar la página de detail del ICP.
30. Verificar que aparece el **ErrorState de kit** (no un crash de pantalla blanca).
31. Verificar que el ErrorState tiene el mensaje de error y opción de reintentar.

### E3 — Empty state en list

32. Si el tenant tiene ICPs: crear un tenant de prueba vacío (o borrar los ICPs temporalmente).
33. Navegar a `/{tenantId}/abel/icp`.
34. Verificar que el EmptyState (`ShellEmptyState`) muestra el ícono, título y descripción correctos.
35. Verificar que el botón de acción está presente y es accesible por teclado.

---

## TEARDOWN

- No hay datos a limpiar (los ICPs de prueba se pueden mantener para la siguiente sesión).
- Si se creó un ICP de prueba solo para el demo: eliminarlo manualmente si lo deseas.

---

## Qué verificar en los logs

```bash
# Logs backend nicolify (filtrar autosave)
docker logs luana-dev-nicolify_backend_dev-1 --tail 50 | grep -E "PATCH.*icp|200|422"

# Console del browser (no debe haber errores en rojo)
# DevTools → Console → filtrar por "error" (mayúsculas/minúsculas)
```

## Resultado

El resultado de este ejercicio (lo que observaste, si SATISFIED/REJECTED/FOLLOWUPS)
va en `checkpoint.md`:

```yaml
chris_verify:
  signoff:
    by: Chris
    date: YYYY-MM-DD
    result: SATISFIED  # o SATISFIED_WITH_FOLLOWUPS o REJECTED
    notes: ""
    open_items: []
```
