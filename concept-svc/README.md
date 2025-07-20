
# Concept Service

The **Concept Service** is a core component of the AI Event Concepter platform that handles CRUD operations for event concepts, PDF generation, and AI-enhanced concept development.

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Docker & Docker Compose
- PostgreSQL 15+

### Running with Docker Compose (Recommended)

```bash
# Start concept service with database
docker-compose up concept-svc-db concept-svc -d

# Check service health
curl http://localhost:8082/health
```

### Local Development

```bash
# Build the service
./gradlew build

# Run with local PostgreSQL
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/conceptdb
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres
./gradlew bootRun
```

## 📋 API Documentation

### Authentication
All `/api/concepts/**` endpoints require JWT authentication:
```bash
Authorization: Bearer <jwt-token>
```

### Core Endpoints

#### Health Check
```http
GET /health
```
**Response:** `200 OK`
```json
{
  "status": "UP",
  "timestamp": "2025-07-11T09:10:09.435Z",
  "service": "concept-service"
}
```

#### List User Concepts
```http
GET /api/concepts?page=0&size=20&status=DRAFT
```
**Response:** `200 OK`
```json
{
  "content": [...],
  "totalElements": 1,
  "totalPages": 1
}
```

#### Create Concept
```http
POST /api/concepts
Content-Type: application/json
```
**Request Body:**
```json
{
  "title": "Tech Innovation Summit 2025",
  "description": "A cutting-edge conference exploring AI",
  "tags": ["technology", "innovation"],
  "initialRequirements": {
    "targetAudience": "Developers",
    "expectedCapacity": 200,
    "preferredFormat": "HYBRID",
    "duration": "2 days",
    "theme": "AI Innovation"
  }
}
```
**Response:** `201 Created`

#### Get Concept by ID
```http
GET /api/concepts/{conceptId}
```
**Response:** `200 OK` - Full concept details

#### Update Concept
```http
PUT /api/concepts/{conceptId}
Content-Type: application/json
```
**Request Body:** (Partial updates supported)
```json
{
  "title": "Updated Title",
  "status": "IN_PROGRESS",
  "notes": "Added more details"
}
```
**Response:** `200 OK`

#### Delete Concept
```http
DELETE /api/concepts/{conceptId}?permanent=false
```
**Response:** `204 No Content`
- Default: Soft delete (sets status to ARCHIVED)
- `permanent=true`: Hard delete

#### Download Professional PDF ✨
```http
GET /api/concepts/{conceptId}/pdf
```
**Response:** `200 OK` with **professional PDF attachment**
- **Professional Layout**: Clean typography and professional styling
- **Dynamic Content**: 2-3 pages based on available data
- **Comprehensive Sections**: Event details, agenda, speakers, pricing
- **Smart Formatting**: Tables, lists, and structured presentation

#### Apply AI Suggestion (Mock)
```http
POST /api/concepts/{conceptId}/apply-suggestion
Content-Type: application/json
```
**Request Body:**
```json
{
  "suggestion": {
    "title": "AI-Enhanced Event"
  },
  "applyMode": "MERGE"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content (Delete)
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

### Error Responses
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data provided",
  "path": "/api/concepts",
  "status": 400,
  "timestamp": "2025-07-11T09:10:09.435Z"
}
```

## 🗄️ Database Schema

### Main Entities

#### `concepts` Table
```sql
CREATE TABLE concepts (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    user_id UUID NOT NULL,
    notes TEXT,
    version INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_modified_by UUID NOT NULL,
    -- Embedded event details
    theme VARCHAR(255),
    format VARCHAR(20),
    capacity INTEGER,
    duration VARCHAR(100),
    start_date DATE,
    end_date DATE,
    target_audience TEXT,
    location VARCHAR(255),
    -- Embedded pricing
    currency VARCHAR(3) DEFAULT 'EUR',
    early_bird DECIMAL(10,2),
    regular DECIMAL(10,2),
    vip DECIMAL(10,2),
    student DECIMAL(10,2),
    group_price DECIMAL(10,2)
);
```

#### `agenda_items` Table
```sql
CREATE TABLE agenda_items (
    id UUID PRIMARY KEY,
    concept_id UUID NOT NULL REFERENCES concepts(id),
    time VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20),
    speaker VARCHAR(255),
    duration INTEGER
);
```

#### `speakers` Table
```sql
CREATE TABLE speakers (
    id UUID PRIMARY KEY,
    concept_id UUID NOT NULL REFERENCES concepts(id),
    name VARCHAR(255) NOT NULL,
    expertise VARCHAR(255),
    suggested_topic VARCHAR(255),
    bio TEXT,
    confirmed BOOLEAN DEFAULT FALSE
);
```

#### Supporting Tables
- `concept_tags` - Tag storage
- `event_objectives` - Event objectives

### Indexes
- `idx_concept_user_id` on `user_id`
- `idx_concept_status` on `status` 
- `idx_concept_updated_at` on `updated_at`
- Composite indexes for efficient querying

## 🔧 Configuration

### Environment Variables
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://concept-svc-db:5432/conceptdb
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
SPRING_JPA_HIBERNATE_DDL_AUTO=update
```

### Security Configuration
- JWT authentication with same secret as user service
- Stateless session management
- CORS enabled for frontend integration
- Rate limiting and security headers

## 🏗️ Architecture

### Key Components
- **Controllers**: REST API endpoints implementing OpenAPI specifications
- **Services**: Business logic and PDF generation
- **Repositories**: JPA data access with custom queries
- **Mappers**: Entity ↔ DTO conversion
- **Security**: JWT authentication and authorization

### Design Patterns
- **API-First**: OpenAPI specifications drive implementation
- **Microservice**: Independent service with own database
- **Event Sourcing**: Audit trails with version tracking
- **Repository Pattern**: Data access abstraction
- **Mapper Pattern**: Clean entity/DTO separation

## 🧪 Testing

### Unit Tests
```bash
./gradlew test
```

**Test Configuration:**
- **H2 In-Memory Database**: Tests use H2 instead of PostgreSQL for speed and isolation
- **Test Profile**: Automatic test configuration with `application.properties` in test resources
- **Repository Tests**: `@DataJpaTest` for JPA functionality verification
- **Controller Tests**: `@WebMvcTest` with security excluded for endpoint testing
- **PDF Tests**: Comprehensive PDF generation testing with text extraction verification
- **Context Loading**: `@SpringBootTest` for full application context verification

### Integration Tests
```bash
# Start test environment
docker-compose up concept-svc-db -d

# Run integration tests
./gradlew integrationTest
```

### Manual API Testing
```bash
# Get JWT token from user service
TOKEN=$(curl -s -X POST http://localhost:8081/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | \
  jq -r '.token')

# Test concept creation
curl -X POST http://localhost:8082/api/concepts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","description":"Test description"}'

# Download professional PDF
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8082/api/concepts/{conceptId}/pdf \
     -o professional_concept.pdf
```

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t concept-service .

# Run container
docker run -p 8082:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5433/conceptdb \
  concept-service
```

### Production Considerations
- Use external PostgreSQL database
- Configure proper JWT secrets
- Enable SSL/TLS
- Set up monitoring and logging
- Configure resource limits

## 📈 Monitoring

### Health Checks
- `/health` - Service health status
- Database connectivity verification
- JVM metrics available via Actuator

### Logging
- Structured JSON logging
- Request/response tracing
- Error tracking with stack traces
- Performance metrics
