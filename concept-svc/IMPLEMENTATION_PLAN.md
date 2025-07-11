# Concept Service Implementation Plan

## Overview
Implementation of the Concept Service following patterns established by the User Service. The service will handle event concept CRUD operations, PDF generation, and integrate with AI suggestions through the standard update endpoint.

## Phase 1: Database & Infrastructure Setup

### 1.1 Dependencies
- [x] Add JPA dependency to `build.gradle`
- [x] Add PostgreSQL driver to `build.gradle`
- [x] Add Spring Security dependency to `build.gradle`
- [x] Add JWT dependencies (jjwt-api, jjwt-impl, jjwt-jackson) to `build.gradle`
- [x] Add iText7 PDF generation dependency to `build.gradle`

### 1.2 Database Configuration
- [x] Update `application.properties` with PostgreSQL connection settings
- [x] Configure JPA/Hibernate settings (ddl-auto, show-sql, etc.)
- [x] Set application name to "concept-service"

### 1.3 Infrastructure Updates
- [x] Add `concept-svc-db` service to `docker-compose.yml`
- [x] Add `concept-svc-db` service to `compose.aws.yml`
- [x] Update concept-svc environment variables in Docker Compose files
- [x] Create `concept-svc-db-deployment.yaml` in Helm templates
- [x] Create `concept-svc-db-service.yaml` in Helm templates
- [x] Update `values.yaml` with concept database configuration
- [x] Update concept-svc deployment environment variables in Helm

## Phase 2: JPA Entity Implementation

### 2.1 Main Concept Entity
- [x] Create `ConceptEntity.java` with:
  - [x] UUID id (primary key)
  - [x] Basic fields (title, description, status)
  - [x] User relationship (userId as UUID, no JPA relationship)
  - [x] Timestamps (createdAt, updatedAt)
  - [x] Version field for optimistic locking
  - [x] Notes and tags fields
  - [x] Embedded EventDetails
  - [x] OneToMany relationships for agenda and speakers
  - [x] Embedded Pricing

### 2.2 Related Entities
- [x] Create `EventDetailsEntity.java` as `@Embeddable`
  - [x] Theme, format, capacity, duration
  - [x] Start/end dates, target audience
  - [x] Objectives, location
- [x] Create `AgendaItemEntity.java` with:
  - [x] UUID id, time, title, description
  - [x] Type (enum), speaker, duration
  - [x] ManyToOne relationship to ConceptEntity
- [x] Create `SpeakerEntity.java` with:
  - [x] UUID id, name, expertise, bio
  - [x] Suggested topic, confirmed status
  - [x] ManyToOne relationship to ConceptEntity
- [x] Create `PricingEntity.java` as `@Embeddable`
  - [x] Currency, earlyBird, regular, vip, student, group prices

## Phase 3: Repository Layer

### 3.1 Repository Interface
- [x] Create `ConceptRepository.java` extending `JpaRepository<ConceptEntity, UUID>`
- [x] Add method `findByUserIdOrderByUpdatedAtDesc(UUID userId)`
- [x] Add method `findByUserIdAndStatus(UUID userId, String status)`
- [x] Add method for paginated queries if needed

## Phase 4: Mapper Classes

### 4.1 Core Mappers
- [x] Create `ConceptMapper.java` with:
  - [x] `toEntity(Concept dto)` method
  - [x] `toDto(ConceptEntity entity)` method
  - [x] Handle null values and collections properly
- [x] Create `EventDetailsMapper.java` for embedded entity conversion
- [x] Create `AgendaItemMapper.java` for agenda item conversion
- [x] Create `SpeakerMapper.java` for speaker conversion
- [x] Create `PricingMapper.java` for pricing conversion

## Phase 5: Security Configuration

### 5.1 Security Setup
- [x] Copy `SecurityConfig.java` from user service and adapt
- [x] Copy `JwtAuthenticationFilter.java` from user service and adapt
- [x] Copy `CustomAuthenticationEntryPoint.java` from user service
- [x] Use same JWT secret as user service for token compatibility
- [x] Configure security to protect all `/api/concepts/**` endpoints

## Phase 6: Controller Implementation

### 6.1 Health Controller
- [ ] Create `HealthController.java` with `/health` endpoint
- [ ] Return service status, timestamp, and database connectivity

### 6.2 Main Controller
- [ ] Create `ConceptController.java` implementing generated `ConceptsApi`
- [ ] Implement `getUserConcepts()` with pagination and filtering
- [ ] Implement `createConcept()` with user validation
- [ ] Implement `getConceptById()` with ownership verification
- [ ] Implement `updateConcept()` with ownership verification
- [ ] Implement `deleteConcept()` (soft delete to ARCHIVED status)
- [ ] Implement `downloadConceptPdf()` (basic implementation)

### 6.3 Authorization Logic
- [ ] Extract user ID from JWT token in all endpoints
- [ ] Filter all operations by authenticated user
- [ ] Return 403 Forbidden for concepts not owned by user
- [ ] Return 404 Not Found for non-existent concepts

## Phase 7: PDF Generation Service

### 7.1 Basic PDF Service
- [ ] Create `PdfService.java` for PDF generation
- [ ] Implement basic text-based PDF with concept details
- [ ] Include concept title, description, agenda items
- [ ] Include speaker information and pricing
- [ ] Return PDF as byte array for download

## Phase 8: Error Handling & Validation

### 8.1 Exception Handling
- [ ] Copy `GlobalExceptionHandler.java` from user service and adapt
- [ ] Handle concept-specific exceptions
- [ ] Return proper `ErrorResponse` objects matching OpenAPI spec
- [ ] Handle validation errors, not found errors, access denied errors

### 8.2 Custom Exceptions
- [ ] Create `ConceptNotFoundException.java`
- [ ] Create `ConceptAccessDeniedException.java` if needed
- [ ] Follow same patterns as user service exceptions

## Phase 9: Testing & Validation

### 9.1 Basic Testing
- [ ] Test all CRUD endpoints with Postman/curl
- [ ] Test JWT authentication integration
- [ ] Test user isolation (users can only see their concepts)
- [ ] Test PDF generation functionality
- [ ] Test error scenarios (invalid IDs, unauthorized access)

### 9.2 Integration Testing
- [ ] Test with Docker Compose setup
- [ ] Verify database connectivity and data persistence
- [ ] Test frontend integration with concept service
- [ ] Verify suggestion workflow through update endpoint

## Phase 10: Deployment & Documentation

### 10.1 Deployment
- [ ] Test Docker build process
- [ ] Test Kubernetes deployment with Helm
- [ ] Verify service discovery and networking
- [ ] Test with complete application stack

### 10.2 Documentation
- [ ] Update service README with setup instructions
- [ ] Document API endpoints and authentication requirements
- [ ] Document database schema and relationships
- [ ] Update main project README with concept service information

## Notes

### Key Implementation Decisions
- **No apply-suggestion endpoint**: All AI suggestions handled through standard update endpoint
- **No separate repositories**: Agenda and Speaker entities managed through ConceptRepository
- **Same JWT secret**: For compatibility with user service tokens
- **Separate database**: `conceptdb` for service isolation
- **User ID only**: No JPA relationships between services
- **Soft delete**: ARCHIVED status instead of hard deletion

### Architecture Patterns
- Follow exact patterns from user service implementation
- Use OpenAPI generated interfaces for type safety
- Implement mapper pattern for entity/DTO conversion
- Use embedded entities for complex value objects
- Cascade operations for dependent entities

### Future Enhancements (Not in Current Scope)
- Advanced PDF templating and styling
- Complex suggestion parsing and merging
- Concept sharing and collaboration features
- Advanced search and filtering capabilities
- Audit logging and change tracking 