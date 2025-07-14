import pytest
from unittest.mock import patch, MagicMock
import json
from datetime import datetime

# Import the Flask app (already imported in conftest.py)
import app
from controllers import health_controller
from services.llm_service import llm_service, process_chat_request
from genai_models.models.chat_request import ChatRequest

class TestAppEndpoints:
    """Test suite for the Flask app endpoints."""

    def test_home_endpoint(self, client):
        """Test the home endpoint returns the correct response."""
        response = client.get('/')
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data['status'] == 'healthy'
        assert data['service'] == 'GenAI Service'
        assert 'version' in data
        assert 'description' in data

    @patch('controllers.health_controller.get_gen_ai_service_health')
    def test_health_endpoint(self, mock_health, client):
        """Test the health endpoint returns the correct response."""
        # Mock the health controller response
        mock_response = {
            "status": "UP",
            "service": "genai-service",
            "timestamp": datetime.now().isoformat(),
            "models": {
                "llm": "test-model",
                "embedding": "test-embedding"
            },
            "vector_store": {
                "status": "connected",
                "collections": 0
            }
        }
        mock_health.return_value = mock_response

        # Call the endpoint
        response = client.get('/health')
        data = json.loads(response.data)

        # Verify the response
        assert response.status_code == 200
        assert data['status'] == 'UP'
        assert data['service'] == 'genai-service'
        assert 'timestamp' in data
        assert 'models' in data
        assert 'vector_store' in data

    @patch('services.llm_service.llm_service.llm')
    def test_langchain_test_endpoint(self, mock_llm, client):
        """Test the LangChain test endpoint."""
        # Mock the LLM response
        mock_llm.return_value = "Yes, LangChain is integrated and working!"

        # Call the endpoint
        response = client.get('/api/genai/langchain-test')
        data = json.loads(response.data)

        # Verify the response
        assert response.status_code == 200
        assert data['status'] == 'success'
        assert 'result' in data

class TestControllerFunctions:
    """Test suite for the controller functions."""

    def test_get_gen_ai_service_health(self):
        """Test the get_gen_ai_service_health function."""
        # Call the function directly from the controller
        response = health_controller.get_gen_ai_service_health()

        # Verify the response
        assert response['status'] == 'UP'
        assert response['service'] == 'genai-service'
        assert 'timestamp' in response
        assert 'models' in response
        assert 'vector_store' in response

    @patch('services.llm_service.ConversationalRetrievalChain.from_llm')
    def test_chat_with_ai_assistant(self, mock_chain_constructor):
        """Test the chat_with_ai_assistant function."""
        # Create a mock chain instance
        mock_chain = MagicMock()
        mock_chain.return_value = {
            "answer": "This is a test response from the AI assistant.",
            "source_documents": []
        }
        mock_chain_constructor.return_value = mock_chain

        # Create a ChatRequest object
        chat_request = ChatRequest(
            message="Hello, AI assistant!",
            conversation_id="test-conversation-id"
        )

        # Call the process_chat_request function directly
        response = process_chat_request(chat_request)

        # Verify the response has the expected attributes
        assert hasattr(response, 'response')
        assert hasattr(response, 'suggestions')
        assert hasattr(response, 'follow_up_questions')
        assert hasattr(response, 'sources')
        assert hasattr(response, 'confidence')
        assert hasattr(response, 'tokens')
