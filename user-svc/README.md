
# User Service

User management microservice providing authentication, JWT tokens, and user profile management.

## 🚀 Quick Start

### Prerequisites
- Java 21+
- PostgreSQL 15+
- Docker & Docker Compose

### Running with Docker
```bash
docker-compose up user-svc-db user-svc -d
curl http://localhost:8081/health
```

## 📋 API Documentation

See [OpenAPI Specification](../api/user-service.yaml) for complete API documentation.

#### Register User
```http
POST /api/users/register
Content-Type: application/json
```
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Get Profile
```http
GET /api/users/profile
Authorization: Bearer <jwt-token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Additional endpoints:** `/api/users/login` and `/api/users/logout` available but typically accessed via Gateway as `/api/auth/*`

## 🗄️ Database Schema

### `users` Table  
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
    lastLoginAt TIMESTAMP WITH TIME ZONE,
    -- preferences embedded as columns
    preferredEventFormat VARCHAR(50),
    industry VARCHAR(100),
    language VARCHAR(50),
    timezone VARCHAR(50)
);
```

## 🔐 Security Features

- **BCrypt password hashing**
- **JWT tokens** (HS256 algorithm)
- **Email validation** and uniqueness
- **Rate limiting** on auth endpoints
- **Session stateless** design

## 🧪 Testing

### Unit Tests
```bash
./gradlew test
```

### Integration Tests
```bash
# With test database
docker-compose up user-svc-db-test -d
./gradlew integrationTest
```

### Manual API Testing
```bash
# Register user
curl -X POST http://localhost:8081/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8081/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | \
  jq -r '.token')

# Get profile
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/users/profile
```

## 🔧 Configuration

### Environment Variables
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://user-svc-db:5432/eventdb
SPRING_DATASOURCE_USERNAME=postgres  
SPRING_DATASOURCE_PASSWORD=postgres
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400000  # 24 hours
```

## 🚀 Deployment

### Docker
```bash
docker build -t user-service .
docker run -p 8081:8080 user-service
```

### Health Checks
- `/health` - Service status and database connectivity verification
