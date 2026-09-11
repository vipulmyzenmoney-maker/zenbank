# =============================================================================
# ZenBank Engine — Makefile
# =============================================================================

.PHONY: all help deploy dev build seed stop logs clean

all: help

help:
	@echo "ZenBank Engine Commands:"
	@echo "  make deploy   - Deploy ZenBank (uses root docker-compose if present, or native)"
	@echo "  make dev      - Run Next.js in development mode on port 3001"
	@echo "  make build    - Generate Prisma client and build Next.js for production"
	@echo "  make seed     - Seed the 100 verified curriculum questions and packs"
	@echo "  make clean    - Remove build cache and temp files"

deploy:
	@if [ -f "../docker-compose.yml" ]; then \
		echo "🚀 Running full platform deployment from root docker-compose..."; \
		$(MAKE) -C .. deploy; \
	else \
		echo "🚀 Deploying ZenBank natively..."; \
		npm install && npx prisma db push && npm run build && npm run start; \
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
