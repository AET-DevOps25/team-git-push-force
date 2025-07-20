#!/bin/bash

# Start PostgreSQL container if not already running
if ! docker ps --format '{{.Names}}' | grep -q '^eventdb$'; then
  echo "Starting PostgreSQL container..."
  docker run --name eventdb \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=eventdb \
    -p 5432:5432 \
    -d postgres:15
else
  echo "PostgreSQL container 'eventdb' is already running."
fi