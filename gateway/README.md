
# Gateway Service

API Gateway providing unified entry point, JWT authentication, request routing, and service aggregation for the AI Event Concepter platform.

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Docker & Docker Compose

### Running with Docker
```bash
docker-compose up gateway -d
curl http://localhost:8080/health
```

## 🔐 Security Features

### JWT Authentication
- **Token validation** for all `/api/**` endpoints
- **User context extraction** from JWT claims
- **Automatic token refresh** handling
- **Stateless session** management

### CORS Configuration
- **Frontend origins** whitelisted
- **Preflight requests** handled
- **Credentials support** enabled

## 🛣️ API Routing

### Service Mapping
```yaml
/api/users/**     → user-svc:8081
/api/concepts/**  → concept-svc:8082  
/api/genai/**     → genai-svc:8083
/health           → gateway health check
```

### Load Balancing
- **Round-robin** distribution
- **Health checks** for service discovery
- **Circuit breaker** for fault tolerance

## 📋 API Aggregation

See [OpenAPI Specification](../api/gateway.yaml) for complete API documentation.

### Unified OpenAPI Documentation
- **Combined specs** from all services  
- **Interactive testing** interface via Swagger UI
- **API versioning** support across all services
- **Centralized documentation** for all microservices

### Request/Response Processing
- **Request logging** and metrics
- **Response transformation** when needed
- **Error standardization** across services
- **Rate limiting** per endpoint

## 🔧 Configuration

### Environment Variables
```env
# Service URLs
USER_SERVICE_URL=http://user-svc:8081
CONCEPT_SERVICE_URL=http://concept-svc:8082
GENAI_SERVICE_URL=http://genai-svc:8083

# Security
JWT_SECRET=your-jwt-secret
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Profiles
SPRING_PROFILES_ACTIVE=docker  # or 'local'
```

### Profile-based Configuration
- **Docker profile**: Service discovery via container names
- **Local profile**: localhost-based service URLs
- **Production profile**: External service endpoints

## 🧪 Testing

### Unit Tests
```bash
./gradlew test
```


### Manual API Testing
```bash
# Health check
curl http://localhost:8080/health

# Get JWT token
TOKEN=$(curl -s -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | \
  jq -r '.token')

# Test routing to concept service
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/api/concepts
```

## 📊 Monitoring

### Health Checks
- **Gateway status** at `/health`
- **Downstream services** connectivity
- **Database connections** verification
- **Circuit breaker** status

### Metrics
- **Request rate** per service
- **Response times** and latencies  
- **Error rates** by endpoint
- **Circuit breaker** events

## 🚀 Deployment

### Docker
```bash
docker build -t gateway-service .
docker run -p 8080:8080 gateway-service
```

### Production Considerations
- **SSL/TLS termination** at gateway
- **Rate limiting** configuration
- **Service mesh** integration
- **API versioning** strategy
