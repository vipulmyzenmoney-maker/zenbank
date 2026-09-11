# =============================================================================
# ZenBank Engine — Makefile
# =============================================================================

.PHONY: all help deploy stop restart logs status dev build seed clean

all: help

help:
	@echo "ZenBank Engine Commands:"
	@echo "  make deploy   - Deploy ZenBank with PostgreSQL via Docker"
	@echo "  make stop     - Stop ZenBank Docker container"
	@echo "  make restart  - Restart ZenBank container"
	@echo "  make logs     - Stream live logs from ZenBank container"
	@echo "  make status   - Check container status"
	@echo "  make dev      - Run Next.js locally in development mode (port 3001)"
	@echo "  make build    - Generate Prisma client and build Next.js for production"
	@echo "  make seed     - Seed the 100 verified curriculum questions and packs"
	@echo "  make clean    - Remove build cache and temp files"

deploy:
	@if [ ! -f .env ]; then \
		echo "⚙️  No .env file found. Copying from .env.example..."; \
		cp .env.example .env; \
	fi
	@echo "🚀 Deploying ZenBank via Docker Compose..."
	docker compose up -d --build
	@echo ""
	@echo "✅ ZenBank successfully deployed on http://localhost:3001"
	@echo "Run 'make logs' to view output or 'make stop' to shutdown."

stop:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

status:
	docker compose ps

dev:
	npm run dev

build:
	npx prisma generate
	npm run build

seed:
	node prisma/seed.js

clean:
	rm -rf .next
