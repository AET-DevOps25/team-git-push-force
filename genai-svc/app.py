import os
import connexion
import atexit
import pathlib
from flask import jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from prometheus_flask_exporter import PrometheusMetrics
from prometheus_client import Gauge

# Load environment variables first
load_dotenv()

# Import controllers
from controllers.chat_controller import chat_with_ai_assistant, initialize_chat_for_concept
from controllers.document_controller import upload_and_process_documents, get_documents_for_concept, delete_document
from controllers.health_controller import get_gen_ai_service_health
from services.vector_store import vector_store_service
from genai_models.encoder import JSONEncoder

# Initialize Connexion app
app = connexion.App(__name__, specification_dir='./genai_models/openapi/')
app.add_api('openapi.yaml', arguments={'title': 'AI Event Concepter - GenAI Service'}, pythonic_params=True)

# Get the underlying Flask app
flask_app = app.app

# Set up metrics endpoint
metrics = PrometheusMetrics(flask_app)

# Set custom JSON encoder
flask_app.json_encoder = JSONEncoder

# Enable CORS
CORS(flask_app)

# Register shutdown handler to close Weaviate client connection
@atexit.register
def shutdown_handler():
    """Close connections when the application shuts down"""
    print("Shutting down GenAI service, closing connections...")
    vector_store_service.close()

# Add home route
@flask_app.route('/')
def home():
    """Standard status page for the GenAI service."""
    return jsonify({
        "status": "healthy",
        "service": "GenAI Service",
        "version": "1.0.0",
        "description": "Document ingestion, RAG pipeline, and content creation service"
    })

# Add health endpoint
@flask_app.route('/health')
def health():
    """Health check endpoint for the GenAI service."""
    return jsonify(get_gen_ai_service_health())

# Add LangChain test route
@flask_app.route('/api/genai/langchain-test')
def langchain_test():
    """Test endpoint to demonstrate LangChain integration."""
    from services.llm_service import llm_service
    result = llm_service.llm("Is LangChain integrated?")
    return jsonify({
        "result": result,
        "status": "success"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8083)
