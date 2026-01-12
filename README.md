## Grippo Backend

NestJS API with PostgreSQL, packaged for local and production runs via Docker Compose.

### Stack
- Node.js 20 (Docker runtime)
- NestJS 10 + TypeScript
- PostgreSQL 15.5
- TypeORM, JWT auth
- Docker / Docker Compose

### Runtime model
- `docker-compose.yml` runs `db` (PostgreSQL) and `backend` (NestJS).
- Configuration is loaded from `.env`.
- Production image is built with the multi-stage `Dockerfile`.

### Environment variables
Template based on `.env` (sensitive values removed):
```env
# App Info
# development | staging | test | production
APP_ENV=production

# Backend Container Settings
BACKEND_PORT=3010
BACKEND_HOST=backend
BACKEND_CONTAINER=replace_me
BACKEND_BUILD_CONTEXT=.
BACKEND_DOCKERFILE=Dockerfile

# PostgreSQL (Database)
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USERNAME=replace_me
POSTGRES_PASSWORD=replace_me
POSTGRES_DATABASE=replace_me
POSTGRES_CONTAINER_NAME=replace_me

# JWT (Authentication Tokens)
JWT_SECRET_KEY=replace_me
JWT_EXPIRATION_TIME=1000m
JWT_REFRESH_EXPIRATION_TIME=10000m

# Google Authentication (Client IDs)
GOOGLE_CLIENT_ID_IOS=replace_me
GOOGLE_CLIENT_ID_ANDROID=replace_me
GOOGLE_CLIENT_ID_WEB=replace_me

# Database Initialization (Dump)
DB_DUMP_FILE=scripts/dump.sql
# set true to drop schema before import
DROP_SCHEMA_BEFORE_IMPORT=true

# Logging
LOG_MAX_SIZE=10m
LOG_MAX_FILE=3

# CI/CD & Scripts
DOCKER_COMPOSE_FILE=docker-compose.yml
```

### Modules
- `DatabaseModule` — TypeORM configuration, database providers, and shared connection setup.
- `I18nModule` — locale detection middleware and translation context wiring.
- `AuthModule` — JWT strategy, token issuance, and auth guards.
- `UsersModule` — user profiles, persistence, and domain logic.
- `TrainingsModule` — training plans, sessions, and related persistence logic.
- `ExerciseExampleModule` — reference catalog of exercises and metadata.
- `MusclesModule` — muscle groups dictionary and lookups.
- `WeightHistoryModule` — weight tracking records and aggregation helpers.
- `ExerciseMetricsModule` — metrics and stats for exercises (history, trends).
- `EquipmentsModule` — inventory of equipment and related metadata.
- `AdminModule` — admin-only workflows across users and exercise data.

### Scripts

#### `scripts/deploy.sh`
Cold-start setup via Docker Compose.
- Loads `.env` and validates required variables:  
  `BACKEND_HOST`, `BACKEND_PORT`, `POSTGRES_CONTAINER_NAME`, `POSTGRES_DATABASE`, `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`.
- Runs `docker compose down -v`, then `up -d --build`.
- Waits for PostgreSQL readiness (`pg_isready`).
- If a dump exists (default `scripts/dump.sql`, override with `DB_DUMP_FILE`), it imports it.
- If `DROP_SCHEMA_BEFORE_IMPORT=true` — recreates `public` before import.

#### `scripts/dump.sh`
Creates a SQL dump from the PostgreSQL container.
- Requires `POSTGRES_CONTAINER_NAME`, `POSTGRES_DATABASE`, `POSTGRES_USERNAME`, `POSTGRES_PASSWORD` in `.env`.
- Uses `pg_dump` inside the container, plain format with `INSERT`s.
- Stores snapshots in `backups/` and updates the latest `scripts/dump.sql`.

#### `scripts/cleanup.sh`
Linux host disk cleanup (requires `sudo`).
- Shows disk usage before/after.
- Cleans Docker: containers, images, networks, volumes, build cache.
- Cleans `apt` cache and unused packages.
- Trims `systemd-journald` logs.
- Clears `/tmp` and `/var/tmp`.
