# =============================================================================
# ZenBank Engine — Makefile
# =============================================================================

.PHONY: all help deploy deploy-all stop restart logs status dev build seed clean

all: help

help:
	@echo "ZenBank Commands:"
	@echo "  make deploy     - One-click deploy (auto-detects full platform if myzenlearning is present)"
	@echo "  make deploy-all - Deploy full platform (ZenBank + MyZenLearning + Postgres)"
	@echo "  make stop       - Stop Docker containers"
	@echo "  make restart    - Restart containers"
	@echo "  make logs       - Stream live container logs"
	@echo "  make status     - Check running containers"
	@echo "  make dev        - Run Next.js in development mode (port 3001)"
	@echo "  make build      - Generate Prisma client and build Next.js for production"
	@echo "  make seed       - Seed 100 verified curriculum questions and packs"
	@echo "  make clean      - Remove build cache and temp files"

deploy:
	@if [ ! -f .env ]; then \
		echo "⚙️  No .env file found. Copying from .env.example..."; \
		cp .env.example .env; \
	fi
	@if [ -d "../myzenlearning" ]; then \
		echo "🚀 Detected sibling myzenlearning repo! Deploying full Zen Platform..."; \
		docker compose -f docker-compose.full.yml up -d --build; \
		echo ""; \
		echo "========================================================"; \
		echo "  ✅ Zen Platform Successfully Deployed!"; \
		echo "========================================================"; \
		echo "  🎓 My Zen Learning: http://localhost:3000"; \
		echo "  🏦 ZenBank Studio:  http://localhost:3001"; \
		echo "  🗄️  PostgreSQL:      localhost:5432"; \
		echo "========================================================"; \
	else \
		echo "🚀 Deploying ZenBank standalone..."; \
		docker compose up -d --build; \
		echo ""; \
		echo "✅ ZenBank deployed on http://localhost:3001"; \
	fi

deploy-all:
	@if [ ! -f .env ]; then \
		echo "⚙️  No .env file found. Copying from .env.example..."; \
		cp .env.example .env; \
	fi
	@echo "🚀 Deploying full Zen Platform..."
	docker compose -f docker-compose.full.yml up -d --build
	@echo ""
	@echo "✅ Full Platform Deployed: http://localhost:3000 & http://localhost:3001"

stop:
	@if [ -d "../myzenlearning" ]; then \
		docker compose -f docker-compose.full.yml down; \
	else \
		docker compose down; \
	fi

restart:
	@if [ -d "../myzenlearning" ]; then \
		docker compose -f docker-compose.full.yml restart; \
	else \
		docker compose restart; \
	fi

logs:
	@if [ -d "../myzenlearning" ]; then \
		docker compose -f docker-compose.full.yml logs -f; \
	else \
		docker compose logs -f; \
	fi

status:
	@if [ -d "../myzenlearning" ]; then \
		docker compose -f docker-compose.full.yml ps; \
	else \
		docker compose ps; \
	fi

dev:
	npm run dev

build:
	npx prisma generate
	npm run build

seed:
	node prisma/seed.js

clean:
	rm -rf .next
