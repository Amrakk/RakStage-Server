docker_compose_file ?= docker-compose.yml

bootstrap:
	bun i
	docker-compose -f $(docker_compose_file) up -d --force-recreate --remove-orphans 
	
control-server-dev:
	cd control_server && bun run dev

interaction-server-dev:
	cd interaction_server && bun run dev