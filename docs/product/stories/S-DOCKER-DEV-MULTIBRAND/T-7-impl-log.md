---
ticket: T-7
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-7 impl log — .env templates × 4 + .gitignore update

## Deliverables completados

1. **NEW `nicolify/.env.dev.template`** — Redis DB 0, puerto 8001/3001
2. **NEW `nicolify/.env.prod.template`**
3. **NEW `vitalia/.env.dev.template`** — Redis DB 1, puerto 8002/3002
4. **NEW `vitalia/.env.prod.template`**
5. **NEW `comunify/.env.dev.template`** — Redis DB 2, puerto 8003/3003
6. **NEW `comunify/.env.prod.template`**
7. **NEW `lupulo/.env.dev.template`** — Redis DB 3, puerto 8004/3004
8. **NEW `lupulo/.env.prod.template`**
9. **MODIFY `.gitignore`** — agregados patrones `{brand}/.env.dev` y `{brand}/.env.prod` para 4 brands actuales + 6 futuros (10 total).

## Notas

- Todos los templates contienen `REPLACE_ME` — sin secrets reales.
- El .gitignore ya tenia `*.env.dev` y `*.env.prod` en la parte superior, PERO esos patterns de glob pueden no matchear paths con subdirectorio (depende de la implementacion de git). Los patterns explicitos por brand son mas seguros.
- Los templates estan dentro del scope de git (commiteables) — solo los .env.dev y .env.prod sin `.template` estan ignorados.
- Validator `gitignore_env_files` usa `git check-ignore -q vitalia/.env.dev` — verifica que git los ignoraria.
