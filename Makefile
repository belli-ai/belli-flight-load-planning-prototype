.PHONY: help db-generate db-migrate db-push db-seed db-studio db-test db-drop dev build start lint

# Default target
help:
	@echo "Flight Load Planning - Available Commands"
	@echo "=========================================="
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-generate  - Generate migration files from schema"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-push      - Push schema changes directly to database"
	@echo "  make db-seed      - Seed the database with initial data"
	@echo "  make db-studio    - Open Drizzle Studio"
	@echo "  make db-test      - Test database connection"
	@echo "  make db-drop      - ⚠️  DROP ALL TABLES (reset to 0 tables)"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"
	@echo "  make lint         - Run ESLint"
	@echo ""
	@echo "Workflow Commands:"
	@echo "  make db-setup     - Full database setup (migrate + seed)"
	@echo "  make db-reset     - Reset database (push schema + seed)"
	@echo "  make db-nuke      - ⚠️  Drop all tables + recreate + seed"

# Database commands
db-generate:
	pnpm db:generate

db-migrate:
	pnpm db:migrate

db-push:
	pnpm db:push

db-seed:
	pnpm db:seed

db-studio:
	pnpm db:studio

db-test:
	pnpm db:test

db-drop:
	@echo "⚠️  WARNING: This will DROP ALL TABLES in the database!"
	@echo "   Press Ctrl+C to cancel, or wait 3 seconds to continue..."
	@sleep 3
	pnpm db:drop

# Combined database workflow commands
db-setup: db-migrate db-seed
	@echo "✅ Database setup complete (migrated + seeded)"

db-reset: db-push db-seed
	@echo "✅ Database reset complete (schema pushed + seeded)"

db-nuke:
	@echo "⚠️  WARNING: This will DROP ALL TABLES and recreate from scratch!"
	@echo "   Press Ctrl+C to cancel, or wait 3 seconds to continue..."
	@sleep 3
	pnpm db:drop
	$(MAKE) db-push
	$(MAKE) db-seed
	@echo "✅ Database nuked and rebuilt from scratch!"

# Development commands
dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

lint:
	pnpm lint

