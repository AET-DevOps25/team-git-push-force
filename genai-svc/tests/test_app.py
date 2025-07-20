import pytest
from unittest.mock import patch, MagicMock
import json
from datetime import datetime

# Import the Flask app (already imported in conftest.py)
import app
from controllers import health_controller
from services.llm_service import llm_service, process_chat_request, generate_welcome_message
from genai_models.models.chat_request import ChatRequest
from genai_models.models.initialize_chat_for_concept_request import InitializeChatForConceptRequest
import os

# Mock classes to replace missing imports
class EventDetails:
    def __init__(self, theme=None, format=None, capacity=None, duration=None, targetAudience=None, location=None):
        self.theme = theme
        self.format = format
        self.capacity = capacity
        self.duration = duration
        self.targetAudience = targetAudience
        self.location = location

class Concept:
    def __init__(self, id=None, title=None, description=None, event_details=None):
        self.id = id
        self.title = title
        self.description = description
        self.event_details = event_details

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
        assert 'vectorStore' in data

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
        assert 'vectorStore' in response

    @patch('services.llm_service.ConversationalRetrievalChain')
    def test_chat_with_ai_assistant(self, mock_chain_constructor):
        """Test the chat_with_ai_assistant function."""
        # Create a mock chain instance
        mock_chain = MagicMock()
        mock_chain.invoke.return_value = {
            "answer": "This is a test response from the AI assistant.",
            "source_documents": []
        }
        mock_chain_constructor.return_value = mock_chain

        # Create a ChatRequest object
        chat_request = ChatRequest(
            message="Hello, AI assistant!",
            conversation_id="test-conversation-id"
        )

        # Import the llm_service instance
        from services.llm_service import llm_service

        # Call the process_chat_request method on the llm_service instance
        response = llm_service.process_chat_request(chat_request)

        # Verify the response has the expected attributes
        assert hasattr(response, 'response')
        assert hasattr(response, 'suggestions')
        assert hasattr(response, 'follow_up_questions')
        assert hasattr(response, 'sources')
        assert hasattr(response, 'confidence')
        assert hasattr(response, 'tokens')

class TestLLMService:
    """Test suite for the LLM service."""

    def setup_method(self):
        """Set up test environment before each test method."""
        # Ensure environment variables are set for testing
        os.environ["SKIP_WEAVIATE"] = "true"
        os.environ["SKIP_MINIO"] = "true"
        os.environ["SKIP_OPENWEBUI"] = "true"
        
        # Create a mock concept for testing
        self.mock_concept = Concept(
            id="test-concept-123",
            title="Test Concept",
            description="A test concept for unit testing",
            event_details=EventDetails(
                theme="Test Theme",
                format="HYBRID",
                capacity=100,
                duration="1 day",
                targetAudience="Test audience",
                location="Test location"
            )
        )

    @pytest.mark.skipif(
        os.environ.get("SKIP_WEAVIATE") == "true" and 
        os.environ.get("SKIP_MINIO") == "true" and 
        os.environ.get("SKIP_OPENWEBUI") == "true",
        reason="Skipping test when external services are skipped"
    )
    @patch('services.llm_service.welcome_generator')
    def test_generate_welcome_message(self, mock_welcome_generator):
        """Test the generate_welcome_message function."""
        # Mock the welcome generator
        mock_welcome_generator.generate_welcome_message.return_value = "Welcome to the test concept!"
        
        # Create an initialization request
        init_request = InitializeChatForConceptRequest(
            concept_id="test-concept-123",
            concept=self.mock_concept
        )
        
        # Generate a welcome message
        welcome_message = generate_welcome_message(init_request)
        
        # Verify the welcome message
        assert welcome_message == "Welcome to the test concept!"
        
        # Verify that the welcome generator was called
        mock_welcome_generator.generate_welcome_message.assert_called_once_with(init_request)

    @patch('services.llm_service.response_generator')
    @patch('services.llm_service.llm_service.llm')
    def test_process_chat_request_with_concept(self, mock_llm, mock_response_generator):
        """Test chat request processing with a concept."""
        # Mock the LLM response
        mock_llm.return_value = "This is a test response with concept context."
        
        # Mock the response generator
        mock_response = MagicMock()
        mock_response.response = "This is a test response with concept context."
        mock_response.suggestions = ["Suggestion 1", "Suggestion 2"]
        mock_response.follow_up_questions = ["Question 1?", "Question 2?"]
        mock_response.sources = []
        mock_response.confidence = 0.9
        mock_response.tokens = {"prompt": 100, "response": 150, "total": 250}
        mock_response_generator.create_response.return_value = mock_response
        
        # Create a chat request with a concept
        chat_request = ChatRequest(
            message="Tell me about this concept.",
            conversation_id="test-conversation-id",
            concept=self.mock_concept
        )
        
        # Process the chat request
        response = process_chat_request(chat_request)
        
        # Verify the response
        assert response is not None
        assert response.response == "This is a test response with concept context."
        assert len(response.suggestions) == 2
        assert len(response.follow_up_questions) == 2
        
        # Verify that the response generator was called
        mock_response_generator.create_response.assert_called_once()

    @patch('services.llm_service.conversation_history_service')
    @patch('services.llm_service.response_generator')
    @patch('services.llm_service.llm_service.llm')
    def test_process_chat_request_with_history(self, mock_llm, mock_response_generator, mock_history_service):
        """Test chat request processing with conversation history."""
        # Mock the LLM response
        mock_llm.return_value = "This is a test response with history."
        
        # Mock the response generator
        mock_response = MagicMock()
        mock_response.response = "This is a test response with history."
        mock_response.suggestions = ["Suggestion 1", "Suggestion 2"]
        mock_response.follow_up_questions = ["Question 1?", "Question 2?"]
        mock_response.sources = []
        mock_response.confidence = 0.9
        mock_response.tokens = {"prompt": 100, "response": 150, "total": 250}
        mock_response_generator.create_response.return_value = mock_response
        
        # Mock the conversation history service
        mock_history_service.get_formatted_history.return_value = (
            "User: Previous message\nAssistant: Previous response",
            [("Previous message", "Previous response")]
        )
        
        # Create a chat request with conversation ID
        chat_request = ChatRequest(
            message="Tell me more.",
            conversation_id="test-conversation-id"
        )
        
        # Process the chat request
        response = process_chat_request(chat_request)
        
        # Verify the response
        assert response is not None
        assert response.response == "This is a test response with history."
        assert len(response.suggestions) == 2
        assert len(response.follow_up_questions) == 2
        
        # Verify that the conversation history service was called
        mock_history_service.get_formatted_history.assert_called_once_with("test-conversation-id")
        
        # Verify that the response generator was called
        mock_response_generator.create_response.assert_called_once()
