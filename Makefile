# luana-platform Makefile — cross-brand CI parity gate
#
# Decisión 8 (Story 10 Phase 0 ratificada 2026-05-12):
# ci-parity location = luana-platform root (cross-brand pattern).
# Stories 11-13 (vitalia, comunify, lupulo) heredan automático.
#
# Per-brand ownership (Sesion 10 Q2 Chris framework):
# cada marca su propio deploy. Brand-specific docker-compose + Dockerfile +
# deploy workflow eventually move to brand-specific repos. For now,
# Nicolify lives in luana-platform/nicolify/ until T-14 archive.

# ════════════════════════════════════════════════════════════════
# BRANDS — append future brand slugs as their migration stories close
# ════════════════════════════════════════════════════════════════
BRANDS := nicolify
# Story 11 will append: BRANDS += vitalia
# Story 12 will append: BRANDS += comunify
# Story 13 will append: BRANDS += lupulo

.PHONY: ci-parity $(BRANDS:%=ci-parity-%) portfolio portfolio-check scan-promotables help

help:
	@echo "luana-platform Makefile targets:"
	@echo ""
	@echo "  make ci-parity              Run CI parity sweep ALL brands ($(BRANDS))"
	@echo "  make ci-parity-nicolify     Run CI parity sweep Nicolify only"
	@echo "  make ci-parity-BRAND        Run CI parity sweep for specific brand"
	@echo ""
	@echo "  make portfolio              Regen docs/portfolio/ (11 universos)"
	@echo "  make portfolio-check        Check portfolio fresh (exit 1 if stale)"
	@echo "  make scan-promotables       Scan brand learnings for cross-brand patterns"
	@echo ""
	@echo "Brands enabled: $(BRANDS)"

# ════════════════════════════════════════════════════════════════
# Cross-brand orchestrator — runs ci-parity sweep per brand
# ════════════════════════════════════════════════════════════════
ci-parity: $(BRANDS:%=ci-parity-%)
	@printf "\033[32m✓ ci-parity all brands GREEN: $(BRANDS)\033[0m\n"

# ════════════════════════════════════════════════════════════════
# Per-brand targets — delegate to scripts/ci-parity.sh with --brand=X
# ════════════════════════════════════════════════════════════════
ci-parity-%: scripts/ci-parity.sh
	@printf "\033[34m── Running ci-parity for brand: $* ──\033[0m\n"
	bash scripts/ci-parity.sh --brand=$*

# ════════════════════════════════════════════════════════════════
# Skip-flags wrappers (mirror AISALESHT/Makefile pattern)
# ════════════════════════════════════════════════════════════════
ci-parity-be:
	@for brand in $(BRANDS); do \
		bash scripts/ci-parity.sh --brand=$$brand --skip-fe; \
	done

ci-parity-fe:
	@for brand in $(BRANDS); do \
		bash scripts/ci-parity.sh --brand=$$brand --skip-be; \
	done

# ════════════════════════════════════════════════════════════════
# Portfolio + promotion scan (multibrand SSoT auto-gen)
# ════════════════════════════════════════════════════════════════
portfolio:
	python3 scripts/generate_portfolio.py

portfolio-check:
	python3 scripts/generate_portfolio.py --check

scan-promotables:
	python3 scripts/scan_promotables.py
