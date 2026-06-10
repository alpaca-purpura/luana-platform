---
ticket: T-8
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-8 impl log — generate_infra_matrix.py + INFRA-MATRIX.md

## Deliverables completados

1. **NEW `scripts/generate_infra_matrix.py`** — lee {brand}/config/brand.yaml::infra de las 4 brands, genera tabla markdown, escribe docs/portfolio/INFRA-MATRIX.md con header AUTO-GENERATED. exit code 0 + mensaje "4 brands updated".

2. **NEW `docs/portfolio/INFRA-MATRIX.md`** — primera version auto-generada con datos reales de los 4 brand.yaml (T-3 done). Contiene: tabla dev (puertos, DB, redis, qdrant, dominio) + tabla prod + tabla shared infra.

3. **MODIFY `tests/scripts/test_generate_infra_matrix.py`** — tests completos implementados:
   - `test_generate_matrix_returns_string` — funcion basica
   - `test_header_present` — AUTO-GENERATED en linea 1
   - `test_all_brands_present` — 4 brands en tabla
   - `test_ports_correct` — puertos D6 cementados
   - `test_missing_infra_section` — brand sin infra → n/a sin crash
   - `test_output_file_created` — archivo creado/sobreescrito
   - `test_load_brand_infra_reads_real_files` — lee vitalia brand.yaml real
   - `test_load_brand_infra_comunify` — lee comunify brand.yaml real
   - `test_load_brand_infra_missing_file` — brand inexistente → {}
   - `test_golden_snapshot` — snapshot con datos reales 4 brands
   - `test_main_creates_output_file` — main() end-to-end
   - `test_pre_commit_triggers_regen` — T-9 pre-condition test
   - `test_script_exits_zero` — subprocess exit code 0

## Acceptance criteria verificados

- A1: `.venv/bin/python scripts/generate_infra_matrix.py` → exit 0 + INFRA-MATRIX.md creado
- A2: `head -1 docs/portfolio/INFRA-MATRIX.md | grep AUTO-GENERATED` → PASS
- A3: INFRA-MATRIX.md contiene vitalia/comunify/nicolify/lupulo
- A4: INFRA-MATRIX.md contiene puerto 8002 para vitalia
