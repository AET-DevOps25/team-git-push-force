# AI Event Concepter Helm Chart

This Helm chart deploys the AI Event Concepter application with all its components.

## Architecture Overview

The application consists of several services:

1. **Frontend Layer**:
   - `client`: Angular frontend application

2. **API Layer**:
   - `gateway`: Spring Boot API Gateway that routes requests to the appropriate services

3. **Service Layer**:
   - `user-svc`: User management service
   - `concept-svc`: Concept management service
   - `genai-svc`: GenAI service for AI-powered features

4. **Database Layer**:
   - `user-svc-db`: PostgreSQL database for user service
   - `concept-svc-db`: PostgreSQL database for concept service
   - `genai-svc-weaviate`: Vector database for GenAI service
   - `genai-svc-minio`: Object storage for document management
   - `genai-svc-t2v-transformers`: Text-to-vector transformer service for Weaviate

## Network Isolation

The services are organized with proper network isolation:

- Frontend can only communicate with the gateway
- Gateway can only communicate with the service layer
- Each service can only communicate with its own databases and dependencies
- Databases are only accessible from their corresponding services

This isolation is implemented using Kubernetes NetworkPolicies.

## Environment Variables for GenAI Service

The GenAI service uses environment variables for configuration. These are now managed through Kubernetes resources:

> **Note:** The application now uses MinIO for document storage instead of AWS S3. All AWS-related configurations have been removed.

### Non-sensitive Environment Variables

Non-sensitive environment variables are defined in the `values.yaml` file under the `genaisvc.env` section:

```yaml
genaisvc:
  env:
    - name: FLASK_ENV
      value: production
    - name: WEAVIATE_URL
      value: http://genai-svc-weaviate:8080
    - name: MINIO_URL
      value: http://genai-svc-minio:9000
    - name: MINIO_BUCKET
      value: concepts
    # ... other non-sensitive variables
```

### Sensitive Environment Variables

Sensitive environment variables (API tokens, credentials) are stored in a Kubernetes Secret. Instead of defining these in the `values.yaml` file (which would require committing sensitive information to git), you should create the secret directly using kubectl:

```bash
# Create the secret with your sensitive values
kubectl create secret generic genai-svc-secret \
  --from-literal=OPENWEBUI_API_TOKEN="your-openwebui-api-token" \
  --from-literal=MINIO_ACCESS_KEY="your-minio-access-key" \
  --from-literal=MINIO_SECRET_KEY="your-minio-secret-key"
```

This approach is similar to how the GitHub Container Registry credentials are managed with the `ghcr` secret.

## GenAI Service Components

The GenAI service now includes several components with the `genai-svc` prefix for clarity:

### Weaviate Vector Database

Weaviate is used for storing and retrieving vector embeddings for the RAG (Retrieval-Augmented Generation) pipeline:

```yaml
genaisvcweaviate:
  image:
    repository: semitechnologies/weaviate
    tag: "1.24.1"
  service:
    port: 8080
    grpcPort: 8081
  # ... other configuration options
```

### Text2Vec Transformers

The Text2Vec Transformers service provides embedding capabilities for Weaviate:

```yaml
genaisvct2vtransformers:
  image:
    repository: semitechnologies/transformers-inference
    tag: "sentence-transformers-all-MiniLM-L6-v2"
  # ... other configuration options
```

### MinIO Object Storage

MinIO is used for document storage:

```yaml
genaisvcminio:
  image:
    repository: minio/minio
    tag: "latest"
  service:
    port: 9000
    consolePort: 9001
  # ... other configuration options
```

## Deployment

To deploy the application:

1. Create the necessary secrets (if they don't already exist):

```bash
# Create the GitHub Container Registry credentials secret (if not already created)
kubectl create secret docker-registry ghcr \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN

# Create the GenAI service secrets
kubectl create secret generic genai-svc-secret \
  --from-literal=OPENWEBUI_API_TOKEN="your-openwebui-api-token" \
  --from-literal=MINIO_ACCESS_KEY="your-minio-access-key" \
  --from-literal=MINIO_SECRET_KEY="your-minio-secret-key"
```

2. Update the `values.yaml` file with your non-sensitive configuration values

3. Deploy the Helm chart:

```bash
helm upgrade --install ai-event-concepter ./helm/ai-event-concepter
```

## Local Development vs. Kubernetes Deployment

For local development, you can still use a `.env` file and docker-compose. When deploying to Kubernetes, the environment variables will be taken from the Helm chart values and Secret.

## Notes on Secret Management

The `genai-svc-secret.yaml` template is designed as a placeholder that only creates a secret if one doesn't already exist. This approach allows you to:

1. Create the secret manually with real values using kubectl before deployment
2. Have the Helm chart respect your existing secret during upgrades
3. Avoid storing sensitive information in the Helm chart values

This is the recommended approach for managing secrets in Kubernetes.
