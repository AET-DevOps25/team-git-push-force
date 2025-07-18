#!/bin/bash
# File: start-dev.sh

# Run code generation
./api/scripts/gen-all.sh

# Start Docker Compose with local development configuration
docker-compose -f docker-compose.local.yml up --build
