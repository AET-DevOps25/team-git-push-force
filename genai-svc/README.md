# GenAI Service

AI-powered microservice providing document ingestion, RAG pipeline, and intelligent concept generation using LangChain and Weaviate.

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Weaviate (vector database)
- MinIO (object storage)
- OpenWebUI API access

### Running with Docker
```bash
docker-compose up genai-svc-weaviate genai-svc-minio genai-svc -d
curl http://localhost:8083/
```

### Local Development
```bash
pip install -r requirements.txt
python app.py
```

## 🤖 AI Features

### RAG Pipeline Workflow
1. **Document Upload** → MinIO storage
2. **Text Extraction** → Chunking & preprocessing  
3. **Vector Embedding** → Weaviate storage
4. **Query Processing** → Similarity search
5. **Context Retrieval** → LLM prompt enhancement
6. **Response Generation** → Structured concept output

### LangChain Integration
- **Document Loaders**: PDF, DOCX, TXT processing
- **Text Splitters**: Smart chunking for optimal embeddings
- **Vector Store**: Weaviate backend with semantic search
- **Prompt Templates**: Structured concept generation
- **Output Parsers**: JSON extraction from LLM responses

## 📋 API Endpoints

See [OpenAPI Specification](../api/genai-service.yaml) for complete API documentation.

### Chat Interface
```http
POST /api/genai/chat/initialize
Authorization: Bearer <jwt-token>
Content-Type: application/json
```
**Initialize chat for new concept** with personalized welcome message.

```http
POST /api/genai/chat
Authorization: Bearer <jwt-token>
Content-Type: application/json
```
```json
{
  "message": "Create a tech conference concept",
  "concept": {"id": "uuid", "title": "AI Summit"},
  "conversationId": "uuid",
  "context": {
    "previousMessages": [...]
  }
}
```

### Document Management
```http
POST /api/genai/documents?conceptId={conceptId}
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

```http
GET /api/genai/concepts/{conceptId}/documents
Authorization: Bearer <jwt-token>
```

```http
DELETE /api/genai/documents/{documentId}
Authorization: Bearer <jwt-token>
```

## 🧠 AI Architecture

### Vector Database (Weaviate)
- **Embeddings**: sentence-transformers/all-MiniLM-L6-v2
- **Schema**: Document chunks with metadata
- **Search**: Semantic similarity with hybrid scoring
- **Indexing**: Real-time document processing

### Prompt Engineering
```python
# Concept generation template
CONCEPT_PROMPT = """
Based on: {context}
Requirements: {requirements}
Previous conversation: {history}

Generate a structured event concept with:
- Theme and format suggestions
- Target audience analysis
- Agenda outline
- Speaker recommendations
"""
```

### Response Processing
- **JSON Extraction**: Structured concept data
- **Fallback Parsing**: Text-based extraction
- **Validation**: Schema compliance checking
- **Error Handling**: Graceful degradation

## 🗄️ Data Storage

### MinIO Object Storage
```python
# Document storage structure
/concepts/{concept_id}/documents/{file_id}
/concepts/{concept_id}/generated/{timestamp}.pdf
```

### Weaviate Schema
```python
{
  "class": "Document",
  "properties": [
    {"name": "content", "dataType": ["text"]},
    {"name": "conceptId", "dataType": ["string"]}, 
    {"name": "filename", "dataType": ["string"]},
    {"name": "uploadedAt", "dataType": ["date"]}
  ]
}
```

## 🧪 Testing

### Unit Tests
```bash
python -m pytest tests/
```

### AI Testing Strategy
- **Mock LLM responses** for consistent testing
- **Response parsing** validation
- **RAG pipeline** component testing
- **Conversation handling** edge cases

### Test Coverage
```bash
# Run with coverage
python -m pytest --cov=services tests/

# Key test files
tests/test_conversation_history.py
tests/test_concept_suggestions.py
tests/test_rag_pipeline.py
```

## 🔧 Configuration

### Environment Variables
```env
# LLM Configuration
OPENWEBUI_API_TOKEN=your-token
OPENWEBUI_API_BASE_URL=http://your-llm-server

# Vector Database
WEAVIATE_URL=http://genai-svc-weaviate:8080

# Object Storage  
MINIO_URL=http://genai-svc-minio:9000
MINIO_ACCESS_KEY=your-key
MINIO_SECRET_KEY=your-secret
MINIO_BUCKET=concepts
```

## 🚀 Deployment

### Docker
```bash
docker build -t genai-service .
docker run -p 8083:8083 genai-service
```

### Health Monitoring
- `/` - Service status with AI component health
- `/health` - Detailed health checks
- `/metrics` - Prometheus metrics
- Weaviate connectivity verification
- MinIO storage health