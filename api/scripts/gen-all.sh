#!/bin/bash
set -euo pipefail

# Code generation script for API specifications
# This script generates code from the OpenAPI specifications

echo "Generating code from OpenAPI specifications..."

# Check if required tools are installed
check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "Error: $1 is not installed or not in PATH"
    echo "Please install $1 and try again"
    exit 1
  fi
}

# Create output directories if they don't exist
create_dir() {
  if [ ! -d "$1" ]; then
    echo "Creating directory: $1"
    mkdir -p "$1"
  fi
}

# Java (Spring Boot) code generation
generate_java() {
  echo "Generating Java code..."
  check_command openapi-generator-cli

openapi-generator-cli generate \
  -i api/gateway.yaml \
  -g spring \
  -o gateway \
  --skip-validate-spec \
  --api-package de.tum.aet.devops25.api.generated.controller \
  --model-package de.tum.aet.devops25.api.generated.model \
  --additional-properties=useTags=true,useSpringBoot3=true,interfaceOnly=true,reactive=true \
  --library spring-boot

  # Generate for user-svc
  openapi-generator-cli generate \
    -i api/user-service.yaml \
    -g spring \
    -o user-svc \
    --skip-validate-spec \
    --api-package de.tum.aet.devops25.api.generated.controller \
    --model-package de.tum.aet.devops25.api.generated.model \
    --additional-properties=useTags=true,useSpringBoot3=true,interfaceOnly=true

  # Generate for concept-svc
  openapi-generator-cli generate \
    -i api/concept-service.yaml \
    -g spring \
    -o concept-svc \
    --skip-validate-spec \
    --api-package de.tum.aet.devops25.api.generated.controller \
    --model-package de.tum.aet.devops25.api.generated.model \
    --additional-properties=useTags=true,useSpringBoot3=true,interfaceOnly=true

  echo "Java code generation complete!"
}

# Python server generation
generate_python() {
  echo "Generating Python client and server..."
  check_command openapi-generator-cli

  # Create output directories
  create_dir "genai-svc"

  # Generate server stubs for GenAI service
  openapi-generator-cli generate \
    -i api/genai-service.yaml \
    -g python-flask \
    -o genai-svc \
    --skip-validate-spec \
    --additional-properties=packageName=genai_models,serverPort=8083

  echo "Python server generation complete!"
}

# TypeScript SDK generation
generate_typescript() {
  echo "Generating TypeScript SDK..."

  # Create output directories
  create_dir "client/src/api"

  # Generate TypeScript SDK for API Gateway
  npx openapi-typescript api/gateway.yaml -o client/src/api/generated.ts

  echo "TypeScript SDK generation complete!"
}

# Main execution
if [ "$#" -eq 0 ]; then
  # No arguments, generate all
  generate_java
  generate_python
  generate_typescript
else
  # Generate specific language
  for lang in "$@"; do
    case "$lang" in
      java)
        generate_java
        ;;
      python)
        generate_python
        ;;
      typescript)
        generate_typescript
        ;;
      *)
        echo "Unknown language: $lang"
        echo "Usage: $0 [java|python|typescript]"
        exit 1
        ;;
    esac
  done
fi

echo "Code generation complete!"
