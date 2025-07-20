# Testing Strategy & Coverage

## 🧪 Test Coverage Overview

- **Unit Tests**: Comprehensive coverage via JUnit (Java) & pytest (Python)
- **Integration Tests**: API endpoints, database operations, service interactions
- **E2E Tests**: Critical user flows via Cypress (frontend)
- **GenAI Tests**: LLM response parsing, conversation handling, document processing

## 🚀 Running Tests

### Individual Services
```bash
# Backend services (Spring Boot)
cd concept-svc && ./gradlew test
cd user-svc && ./gradlew test  
cd gateway && ./gradlew test

# GenAI service (Python)
cd genai-svc && python -m pytest

# Frontend (Angular)
cd client && npm test
```

## 🔄 CI/CD Automation

### GitHub Actions Pipeline
- **On PR**: Unit tests, linting
- **On merge**: Full test suite + deployment

### Test Stages
1. **Lint & Build**: Code quality checks
2. **Unit Tests**: Fast isolated tests
3. **Integration**: Database + API tests  

## 🤖 GenAI Testing Strategy

### LLM Response Testing
- **Mock responses** for consistent unit tests
- **Response parsing** validation (JSON extraction)
- **Conversation history** handling
- **Concept suggestion** accuracy

### RAG Pipeline Testing
- **Document ingestion** workflow
- **Vector embedding** verification
- **Similarity search** accuracy
- **Context retrieval** relevance

### Test Files
- `genai-svc/tests/test_conversation_history.py`
- `genai-svc/tests/test_concept_suggestions.py`
- `genai-svc/tests/test_app.py`
- `genai-svc/tests/test_health.py`

## 🛠️ Test Configuration

### Database Testing
- **H2 in-memory** for unit tests
- **PostgreSQL containers** for integration
- **Test data isolation** per test class

### Security Testing
- **JWT validation** edge cases
- **Authentication flows** validation
- **Authorization** boundary testing

## 🐛 Debugging Tests

```bash
# Verbose test output
./gradlew test --info

# Debug specific test
./gradlew test --tests "ConceptServiceTest.createConcept"

# Python debug mode
python -m pytest -v -s tests/
``` 