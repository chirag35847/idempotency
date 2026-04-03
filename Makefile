.PHONY: create-topic

create-topic:
	docker compose exec kafka kafka-topics --create --topic application-logs --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 --if-not-exists
