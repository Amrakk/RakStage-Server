docker_compose_file ?= docker-compose.yml

server-control-server-restore-env:
	cd control_server && bash scripts/restore-env

server-interaction-server-restore-env:
	cd interaction_server && bash scripts/restore-env

server-restore-env:
	make server-control-server-restore-env
	make server-interaction-server-restore-env

server-bootstrap:
	cd control_server && bun i
	cd interaction_server && bun i
	docker-compose -f $(docker_compose_file) up -d --force-recreate --remove-orphans 

server-control-server-env-init:
	cd control_server && bash scripts/env-init $(ARGS)

server-interaction-server-env-init:
	cd interaction_server && bash scripts/env-init $(ARGS)

server-env-init: 
	make server-control-server-env-init
	make server-interaction-server-env-init

server-control-server-dev:
	cd control_server && bun run dev

server-interaction-server-dev:
	cd interaction_server && bun run dev