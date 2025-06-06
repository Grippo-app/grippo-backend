#!/bin/bash

ENV_FILE="../.env"
LOG_TAG="[INIT]"
APP_PORT=3010
DUMP_FILE="./dump.sql"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

divider() {
  echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
}

section() {
  echo -e "${CYAN}"
  echo "╔══════════════════════════════════════════════════════╗"
  printf "║ %-50s     ║\n" "$1"
  echo "╚══════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

section "🚀 STARTING FULL PROJECT SETUP (COLD START)"

# Проверка утилит
divider
echo -e "${YELLOW}$LOG_TAG Checking required tools...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}$LOG_TAG ❌ Docker is not installed or not in PATH.${NC}"
  echo -e "${RED}🛠️ Install Docker: https://docs.docker.com/get-docker/${NC}"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}$LOG_TAG ❌ docker-compose is not installed.${NC}"
  echo -e "${RED}🛠️ Install docker-compose: https://docs.docker.com/compose/install/${NC}"
  exit 1
fi

if ! command -v lsof &> /dev/null; then
  echo -e "${RED}$LOG_TAG ❌ lsof is not installed.${NC}"
  echo -e "${RED}🛠️ Install lsof (brew install lsof / apt install lsof)${NC}"
  exit 1
fi

# Проверка .env
divider
echo -e "${YELLOW}$LOG_TAG Checking .env file...${NC}"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}$LOG_TAG ❌ .env file not found at $ENV_FILE${NC}"
  echo -e "${RED}Please create one before running this script.${NC}"
  exit 1
fi

export $(grep -v '^#' "$ENV_FILE" | xargs)

echo -e "${GREEN}$LOG_TAG ✅ Loaded environment variables:${NC}"
echo "  POSTGRES_HOST=$POSTGRES_HOST"
echo "  POSTGRES_PORT=$POSTGRES_PORT"
echo "  POSTGRES_USERNAME=$POSTGRES_USERNAME"
echo "  POSTGRES_DATABASE=$POSTGRES_DATABASE"
echo "  POSTGRES_CONTAINER_NAME=$POSTGRES_CONTAINER_NAME"

divider
echo -e "${YELLOW}$LOG_TAG Validating environment variables...${NC}"
if [[ -z "$POSTGRES_HOST" || -z "$POSTGRES_PORT" || -z "$POSTGRES_USERNAME" || -z "$POSTGRES_PASSWORD" || -z "$POSTGRES_DATABASE" || -z "$POSTGRES_CONTAINER_NAME" ]]; then
  echo -e "${RED}$LOG_TAG ❌ Missing required environment variables${NC}"
  exit 1
fi

# Проверка node_modules
divider
echo -e "${YELLOW}$LOG_TAG Checking npm dependencies...${NC}"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Installing npm packages...${NC}"
  npm install && echo -e "${GREEN}✅ npm install complete${NC}" || {
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
  }
else
  echo -e "${GREEN}✅ node_modules already present${NC}"
fi

# Остановка всех backend контейнеров
divider
echo -e "${YELLOW}$LOG_TAG Stopping backend containers...${NC}"
docker ps --format '{{.Names}}' | grep -i 'backend' | while read -r name; do
  echo -e "${BLUE}⛔ Stopping: $name${NC}"
  docker stop "$name"
done

# PostgreSQL: пересоздание
divider
echo -e "${YELLOW}$LOG_TAG Preparing PostgreSQL container...${NC}"
CONTAINER_EXISTS=$(docker ps -a --filter "name=${POSTGRES_CONTAINER_NAME}" --format "{{.Names}}")

if [ -n "$CONTAINER_EXISTS" ]; then
  echo -e "${YELLOW}⚠️ Removing old container: $POSTGRES_CONTAINER_NAME${NC}"
  docker stop "$POSTGRES_CONTAINER_NAME"
  docker rm "$POSTGRES_CONTAINER_NAME"
else
  echo -e "${GREEN}✅ No existing PostgreSQL container found${NC}"
fi

echo -e "${YELLOW}🐳 Starting PostgreSQL via docker-compose...${NC}"
docker-compose -f docker-compose.yml up -d

echo -e "${CYAN}⏳ Waiting 10s for PostgreSQL to initialize...${NC}"
sleep 10

# Проверка контейнера
divider
echo -e "${YELLOW}$LOG_TAG Checking PostgreSQL container status...${NC}"
RUNNING=$(docker inspect -f '{{.State.Running}}' "$POSTGRES_CONTAINER_NAME")
if [ "$RUNNING" != "true" ]; then
  echo -e "${RED}❌ PostgreSQL container failed to start${NC}"
  exit 1
fi
echo -e "${GREEN}✅ PostgreSQL container is running${NC}"

# Очистка базы
divider
echo -e "${YELLOW}$LOG_TAG Resetting database schema...${NC}"
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD "$POSTGRES_CONTAINER_NAME" \
  psql -U "$POSTGRES_USERNAME" -d "$POSTGRES_DATABASE" \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" && \
  echo -e "${GREEN}✅ Schema reset complete${NC}" || \
  echo -e "${RED}❌ Failed to reset schema${NC}"

# Импорт дампа
divider
if [ -f "$DUMP_FILE" ]; then
  echo -e "${YELLOW}$LOG_TAG Importing dump.sql...${NC}"
  docker exec -i "$POSTGRES_CONTAINER_NAME" \
    psql -U "$POSTGRES_USERNAME" -d "$POSTGRES_DATABASE" < "$DUMP_FILE" > /dev/null && \
    echo -e "${GREEN}✅ dump.sql imported successfully${NC}" || \
    echo -e "${RED}❌ Failed to import dump.sql${NC}"
else
  echo -e "${RED}❌ $DUMP_FILE not found — skipping import${NC}"
fi

# Проверка и освобождение порта
divider
echo -e "${YELLOW}$LOG_TAG Checking if port $APP_PORT is in use...${NC}"
PID_ON_PORT=$(lsof -ti tcp:$APP_PORT)
if [ -n "$PID_ON_PORT" ]; then
  echo -e "${RED}❗ Port $APP_PORT is in use by PID $PID_ON_PORT. Killing...${NC}"
  kill -9 "$PID_ON_PORT"
  echo -e "${GREEN}✅ Port $APP_PORT is now free${NC}"
else
  echo -e "${GREEN}✅ Port $APP_PORT is free${NC}"
fi

# Запуск проекта
divider
echo -e "${YELLOW}$LOG_TAG Starting npm project...${NC}"
npm start && \
  echo -e "${GREEN}✅ Project is running on port $APP_PORT${NC}" || \
  echo -e "${RED}❌ npm start failed${NC}"

# Конец
section "✅ SETUP COMPLETE"
echo -e "${CYAN}🔗 Open: http://localhost:$APP_PORT${NC}"
echo -e "${CYAN}📘 Run tests: npm run test (if available)${NC}"
echo -e "${CYAN}🧪 Seed DB (optional): npm run seed${NC}"
