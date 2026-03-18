#!/bin/bash
echo "Attempt to stop running superset containers..."
docker compose -f docker-compose-image-tag.yml down
echo "Pulling latest image..."
docker compose -f docker-compose-image-tag.yml pull
echo "Starting containers with docker compose..."
docker compose -f docker-compose-image-tag.yml up -d
