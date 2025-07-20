#!/bin/bash
# File: start-dev.sh

# Run code generation
./api/scripts/gen-all.sh

# Start Docker Compose with development configuration (default)
docker-compose up --build
