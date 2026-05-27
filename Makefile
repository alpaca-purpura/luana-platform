# Makefile — luana-platform monorepo
# Wrappers Docker dev + CI parity + portfolio + infra management.
#
# S-DOCKER-DEV-MULTIBRAND T-6 — 2026-05-15
# Decisions: D2 (brand-autocontenida), D6 (port allocation cementada)
#
# Decisión 8 (Story 10 Phase 0 ratificada 2026-05-12):
# ci-parity location = luana-platform root (cross-brand pattern).
# Stories 11-13 (vitalia, comunify, lupulo) heredan automatico.

# ════════════════════════════════════════════════════════════════
# Workspace root (used by Phase 4b targets — schema v2 ledger + releases)
# ════════════════════════════════════════════════════════════════
WS := $(shell git rev-parse --show-toplevel)

# Python venv resolver: prefer worktree-local .venv, fallback a luana-platform principal
# (worktrees efímeros como protocol-* no tienen .venv propio)
PYTHON := $(shell test -x $(WS)/.venv/bin/python && echo $(WS)/.venv/bin/python || echo /home/chalreme/Proyectos/luana-platform/.venv/bin/python)

# ════════════════════════════════════════════════════════════════
# BRANDS — append future brand slugs as their migration stories close
# ════════════════════════════════════════════════════════════════
BRANDS := nicolify vitalia comunify lupulo

.PHONY: dev-nicolify dev-vitalia dev-comunify dev-lupulo
.PHONY: dev-vitalia-admin dev-vitalia-admin-down
.PHONY: dev-nicolify-tunnel dev-vitalia-tunnel dev-comunify-tunnel dev-lupulo-tunnel
.PHONY: dev-all dev-all-vector dev-all-cache
.PHONY: dev-down-nicolify dev-down-vitalia dev-down-comunify dev-down-lupulo dev-down-all
.PHONY: dev-clean-nicolify dev-clean-vitalia dev-clean-comunify dev-clean-lupulo dev-clean-all
.PHONY: infra-matrix portfolio portfolio-check scan-promotables
.PHONY: ci-parity $(BRANDS:%=ci-parity-%) ci-parity-be ci-parity-fe
.PHONY: releases-vitalia capability-ledger-check migrate-vitalia-schema
.PHONY: install-hooks help

COMPOSE_BASE := docker compose -f docker-compose.dev.yml

# ── dev targets ──────────────────────────────────────────────────────────────
# dev-{brand} pre-condition: scripts/dev-lock-check.sh enforces D5 (max 1 stack docker per brand)
dev-nicolify:
	@bash scripts/dev-lock-check.sh nicolify
	$(COMPOSE_BASE) -f nicolify/docker-compose.dev.yml up -d

dev-vitalia:
	@bash scripts/dev-lock-check.sh vitalia
	$(COMPOSE_BASE) -f vitalia/docker-compose.dev.yml up -d

dev-comunify:
	@bash scripts/dev-lock-check.sh comunify
	$(COMPOSE_BASE) -f comunify/docker-compose.dev.yml up -d

dev-lupulo:
	@bash scripts/dev-lock-check.sh lupulo
	$(COMPOSE_BASE) -f lupulo/docker-compose.dev.yml up -d

# ── vitalia admin panel (Streamlit port 8502) ───────────────────────────────
# Requires VITALIA_ADMIN_PASSWORD in vitalia/.env.dev
# Access: http://127.0.0.1:8502
dev-vitalia-admin:
	@bash scripts/dev-lock-check.sh vitalia
	$(COMPOSE_BASE) -f vitalia/docker-compose.dev.yml --profile admin up -d

dev-vitalia-admin-down:
	$(COMPOSE_BASE) -f vitalia/docker-compose.dev.yml --profile admin stop vitalia_admin_dev

# ── tunnel targets (cloudflared profile) ────────────────────────────────────
dev-nicolify-tunnel:
	$(COMPOSE_BASE) -f nicolify/docker-compose.dev.yml --profile tunnel up -d

dev-vitalia-tunnel:
	$(COMPOSE_BASE) -f vitalia/docker-compose.dev.yml --profile tunnel up -d

dev-comunify-tunnel:
	$(COMPOSE_BASE) -f comunify/docker-compose.dev.yml --profile tunnel up -d

dev-lupulo-tunnel:
	$(COMPOSE_BASE) -f lupulo/docker-compose.dev.yml --profile tunnel up -d

# ── all-brands targets ───────────────────────────────────────────────────────
dev-all:
	$(COMPOSE_BASE) \
		-f nicolify/docker-compose.dev.yml \
		-f vitalia/docker-compose.dev.yml \
		-f comunify/docker-compose.dev.yml \
		-f lupulo/docker-compose.dev.yml \
		up -d

dev-all-vector:
	$(COMPOSE_BASE) \
		-f nicolify/docker-compose.dev.yml \
		-f vitalia/docker-compose.dev.yml \
		-f comunify/docker-compose.dev.yml \
		-f lupulo/docker-compose.dev.yml \
		--profile vector up -d

dev-all-cache:
	$(COMPOSE_BASE) \
		-f nicolify/docker-compose.dev.yml \
		-f vitalia/docker-compose.dev.yml \
		-f comunify/docker-compose.dev.yml \
		-f lupulo/docker-compose.dev.yml \
		--profile cache up -d

# ── down targets ─────────────────────────────────────────────────────────────
dev-down-nicolify:
	$(COMPOSE_BASE) -f nicolify/docker-compose.dev.yml down

dev-down-vitalia:
	$(COMPOSE_BASE) -f vitalia/docker-compose.dev.yml down

dev-down-comunify:
	$(COMPOSE_BASE) -f comunify/docker-compose.dev.yml down

dev-down-lupulo:
	$(COMPOSE_BASE) -f lupulo/docker-compose.dev.yml down

dev-down-all:
	$(COMPOSE_BASE) \
		-f nicolify/docker-compose.dev.yml \
		-f vitalia/docker-compose.dev.yml \
		-f comunify/docker-compose.dev.yml \
		-f lupulo/docker-compose.dev.yml \
		down

# ── clean targets (volumes incluidos) ───────────────────────────────────────
dev-clean-nicolify:
	$(COMPOSE_BASE) -f nicolify/docker-compose.dev.yml down -v --remove-orphans

dev-clean-vitalia:
	$(COMPOSE_BASE) -f vitalia/docker-compose.dev.yml down -v --remove-orphans

dev-clean-comunify:
	$(COMPOSE_BASE) -f comunify/docker-compose.dev.yml down -v --remove-orphans

dev-clean-lupulo:
	$(COMPOSE_BASE) -f lupulo/docker-compose.dev.yml down -v --remove-orphans

dev-clean-all:
	$(COMPOSE_BASE) \
		-f nicolify/docker-compose.dev.yml \
		-f vitalia/docker-compose.dev.yml \
		-f comunify/docker-compose.dev.yml \
		-f lupulo/docker-compose.dev.yml \
		down -v --remove-orphans

# ── infra management ─────────────────────────────────────────────────────────
infra-matrix:
	.venv/bin/python scripts/generate_infra_matrix.py

# ════════════════════════════════════════════════════════════════
# Portfolio + promotion scan (multibrand SSoT auto-gen)
# ════════════════════════════════════════════════════════════════
portfolio:
	python3 scripts/generate_portfolio.py

portfolio-check:
	python3 scripts/generate_portfolio.py --check

scan-promotables:
	python3 scripts/scan_promotables.py

# ════════════════════════════════════════════════════════════════
# CI parity gate (cross-brand)
# ════════════════════════════════════════════════════════════════
ci-parity: $(BRANDS:%=ci-parity-%)
	@printf "\033[32mci-parity all brands GREEN: $(BRANDS)\033[0m\n"

ci-parity-%: scripts/ci-parity.sh
	@printf "\033[34m-- Running ci-parity for brand: $* --\033[0m\n"
	bash scripts/ci-parity.sh --brand=$*

ci-parity-be:
	@for brand in $(BRANDS); do \
		bash scripts/ci-parity.sh --brand=$$brand --skip-fe; \
	done

ci-parity-fe:
	@for brand in $(BRANDS); do \
		bash scripts/ci-parity.sh --brand=$$brand --skip-be; \
	done

# ════════════════════════════════════════════════════════════════
# Phase 4b — Release schema v2 + capability ledger (cement 2026-05-27)
# ════════════════════════════════════════════════════════════════

releases-vitalia:  ## Generate BACKLOG by release for vitalia + show stats
	$(PYTHON) scripts/generate_backlog.py --brand vitalia
	@echo ""
	@echo "=== Vitalia releases status ==="
	@for f in vitalia/docs/product/releases/F*.yaml; do \
		release_id=$$(basename $$f .yaml); \
		status=$$(grep -E "^status:" $$f | awk '{print $$2}'); \
		stories_count=$$(grep -cE "^  - " $$f || echo 0); \
		echo "$$release_id · status=$$status · stories=$$stories_count"; \
	done

capability-ledger-check:  ## Run reconcile --validate-ledger across all active brands
	@for b in vitalia nicolify comunify lupulo; do \
		echo "=== $$b cap ledger check ==="; \
		$(PYTHON) scripts/reconcile_capabilities.py --brand $$b --validate-ledger || exit 1; \
	done

migrate-vitalia-schema:  ## One-shot · migrate vitalia to schema v2 (releases + cap ledger) · idempotent
	$(PYTHON) scripts/migrate_to_release_schema.py --brand vitalia
	$(PYTHON) scripts/migrate_capability_ledger.py --brand vitalia

# ── hooks ────────────────────────────────────────────────────────────────────
install-hooks:
	@mkdir -p .git/hooks
	@ln -sf ../../scripts/git-hooks/pre-commit .git/hooks/pre-commit
	@echo "pre-commit hook installed."

# ── help ─────────────────────────────────────────────────────────────────────
help:
	@echo "luana-platform Makefile targets:"
	@echo ""
	@echo "  Dev environment:"
	@echo "  make dev-{brand}              Start {brand} dev environment (brand=nicolify|vitalia|comunify|lupulo)"
	@echo "  make dev-{brand}-tunnel       Start {brand} + cloudflared tunnel (profile=tunnel)"
	@echo "  make dev-all                  Start all 4 brands simultaneously"
	@echo "  make dev-all-vector           Start all brands + qdrant (profile=vector)"
	@echo "  make dev-all-cache            Start all brands + redis (profile=cache)"
	@echo "  make dev-down-{brand}         Stop {brand} containers"
	@echo "  make dev-down-all             Stop all brand containers"
	@echo "  make dev-clean-{brand}        Stop + remove volumes for {brand}"
	@echo "  make dev-clean-all            Stop + remove all volumes"
	@echo ""
	@echo "  Infra management:"
	@echo "  make infra-matrix             Regenerate docs/portfolio/INFRA-MATRIX.md"
	@echo ""
	@echo "  Portfolio + promotables:"
	@echo "  make portfolio                Regen docs/portfolio/ (11 universos)"
	@echo "  make portfolio-check          Check portfolio fresh (exit 1 if stale)"
	@echo "  make scan-promotables         Scan brand learnings for cross-brand patterns"
	@echo ""
	@echo "  CI parity:"
	@echo "  make ci-parity                Run CI parity sweep ALL brands ($(BRANDS))"
	@echo "  make ci-parity-{brand}        Run CI parity sweep for specific brand"
	@echo ""
	@echo "  Hooks:"
	@echo "  make install-hooks            Install git hooks (pre-commit)"
	@echo ""
	@echo "Brands enabled: $(BRANDS)"
	@echo "Postgres shared: 127.0.0.1:5435"
	@echo "Ports: nicolify=8001/3001, vitalia=8002/3002, comunify=8003/3003, lupulo=8004/3004"
