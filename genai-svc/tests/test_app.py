import pytest
from unittest.mock import patch
import json
from datetime import datetime

# Import the Flask app (already imported in conftest.py)
import app

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

    def test_health_endpoint(self, client):
        """Test the health endpoint returns the correct response."""
        response = client.get('/health')
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data['status'] == 'UP'
        assert data['service'] == 'genai-service'
        assert 'timestamp' in data
        assert 'models' in data
        assert 'vector_store' in data

    @patch('app.llm')
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
        assert data['result'] == "Yes, LangChain is integrated and working!"

        # Verify the LLM was called with the correct prompt
        mock_llm.assert_called_once_with("Is LangChain integrated?")

class TestControllerFunctions:
    """Test suite for the controller functions."""

    def test_get_gen_ai_service_health(self):
        """Test the get_gen_ai_service_health function."""
        # Call the function
        response = app.get_gen_ai_service_health()

        # Verify the response
        assert response.status == 'UP'
        assert response.service == 'genai-service'
        assert hasattr(response, 'timestamp')
        assert hasattr(response, 'models')
        assert hasattr(response, 'vector_store')

    @patch('app.conversation_chain')
    def test_chat_with_ai_assistant(self, mock_conversation_chain):
        """Test the chat_with_ai_assistant function."""
        # Mock the conversation chain response
        mock_response = {
            "answer": "This is a test response from the AI assistant.",
            "source_documents": []
        }
        mock_conversation_chain.return_value = mock_response

        # For the case where we use the run method (fallback to simple LLM)
        mock_conversation_chain.run.return_value = "This is a test response from the AI assistant."

        # Create a ChatRequest object
        chat_request = app.ChatRequest(
            message="Hello, AI assistant!",
            conversation_id="test-conversation-id"
        )

        # Call the process_chat_request function directly with the ChatRequest object
        response = app.process_chat_request(chat_request)

        # Verify the response
        assert response.response == "This is a test response from the AI assistant."
        assert hasattr(response, 'suggestions')
        assert hasattr(response, 'follow_up_questions')
        assert hasattr(response, 'sources')
        assert hasattr(response, 'confidence')
        assert hasattr(response, 'tokens')
