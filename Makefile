ENV_FILE := .env
INIT_SCRIPT := ./init.sh

.PHONY: init-local init-prod stop logs

init-local:
	@chmod +x $(INIT_SCRIPT)
	@$(INIT_SCRIPT) local

init-prod:
	@chmod +x $(INIT_SCRIPT)
	@$(INIT_SCRIPT) prod

stop:
	docker compose down

logs:
	docker logs -f $$(grep BACKEND_CONTAINER=$(ENV_FILE) | cut -d '=' -f2)
