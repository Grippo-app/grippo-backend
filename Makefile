ENV_FILE := .env
INIT_SCRIPT := ./init.sh

.PHONY: init stop restart logs logs-db logs-nginx logs-certbot

# 🚀 Start all containers and run init logic, then show backend logs
init:
	@chmod +x $(INIT_SCRIPT)
	@$(INIT_SCRIPT)
	@echo "\n[LOGS] Attaching to backend logs:\n"
	@docker logs -f $$(grep BACKEND_CONTAINER=$(ENV_FILE) | cut -d '=' -f2)

# 🛑 Stop and remove all containers
stop:
	docker compose --env-file $(ENV_FILE) down

# 🔁 Restart all containers from scratch
restart: stop init

# 📋 Follow logs from all main containers
logs:
	docker compose logs -f

# 📋 Follow logs from specific containers
logs-backend:
	docker logs -f $$(grep BACKEND_CONTAINER=$(ENV_FILE) | cut -d '=' -f2)

logs-db:
	docker logs -f $$(grep POSTGRES_CONTAINER_NAME=$(ENV_FILE) | cut -d '=' -f2)

logs-nginx:
	docker logs -f grippo_nginx

logs-certbot:
	docker logs -f grippo_certbot
