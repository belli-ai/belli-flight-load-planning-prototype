.PHONY: help db-generate db-migrate db-push db-seed db-studio db-test dev build start lint

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

# Combined database workflow commands
db-setup: db-migrate db-seed
	@echo "✅ Database setup complete (migrated + seeded)"

db-reset: db-push db-seed
	@echo "✅ Database reset complete (schema pushed + seeded)"

# Development commands
dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

lint:
	pnpm lint

