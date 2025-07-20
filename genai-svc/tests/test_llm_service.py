import os
import pytest
from unittest.mock import patch, MagicMock
import json
import sys

# Skip all tests in this file when SKIP_WEAVIATE, SKIP_MINIO, and SKIP_OPENWEBUI are set to true
pytestmark = pytest.mark.skipif(
    os.environ.get("SKIP_WEAVIATE") == "true" and 
    os.environ.get("SKIP_MINIO") == "true" and 
    os.environ.get("SKIP_OPENWEBUI") == "true",
    reason="Skipping LLM service tests when external services are skipped"
)

# Add the parent directory to the Python path if not already added
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Import the llm_service singleton and related models
from services.llm_service import llm_service, process_chat_request, generate_welcome_message
from genai_models.models.chat_request import ChatRequest
from genai_models.models.chat_response import ChatResponse
from genai_models.models.initialize_chat_for_concept_request import InitializeChatForConceptRequest

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

class TestLLMService:
    """Test suite for the LLMService class."""

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

    @patch('services.llm_service.OpenWebUILLM')
    def test_initialization(self, mock_openwebui_llm):
        """Test that the LLMService class can be initialized properly."""
        # Mock the OpenWebUILLM constructor
        mock_llm_instance = MagicMock()
        mock_openwebui_llm.return_value = mock_llm_instance
        
        # Initialize a new LLMService
        service = LLMService()
        
        # Verify that the LLM was initialized
        assert service.llm is not None
        # Verify that the prompt templates were initialized
        assert service.chat_prompt is not None
        assert service.question_generator_prompt is not None

    @patch('services.llm_service.response_generator')
    @patch('services.llm_service.OpenWebUILLM')
    def test_process_chat_request_basic(self, mock_openwebui_llm, mock_response_generator):
        """Test basic chat request processing without RAG."""
        # Mock the OpenWebUILLM
        mock_llm_instance = MagicMock()
        mock_llm_instance.return_value = "This is a test response."
        mock_openwebui_llm.return_value = mock_llm_instance
        
        # Mock the response generator
        mock_response = ChatResponse(
            response="This is a test response.",
            suggestions=["Suggestion 1", "Suggestion 2"],
            follow_up_questions=["Question 1?", "Question 2?"],
            sources=[],
            confidence=0.9,
            tokens=100
        )
        mock_response_generator.create_response.return_value = mock_response
        
        # Create a new LLMService with the mocked LLM
        service = LLMService()
        service.llm = mock_llm_instance
        
        # Create a chat request
        chat_request = ChatRequest(
            message="Hello, AI assistant!",
            conversation_id="test-conversation-id"
        )
        
        # Process the chat request
        response = service.process_chat_request(chat_request)
        
        # Verify the response
        assert response is not None
        assert response.response == "This is a test response."
        assert len(response.suggestions) == 2
        assert len(response.follow_up_questions) == 2
        assert response.confidence == 0.9
        assert response.tokens == 100
        
        # Verify that the LLM was called
        mock_llm_instance.assert_called_once()
        
        # Verify that the response generator was called
        mock_response_generator.create_response.assert_called_once()

    @patch('services.llm_service.response_generator')
    @patch('services.llm_service.OpenWebUILLM')
    def test_process_chat_request_with_concept(self, mock_openwebui_llm, mock_response_generator):
        """Test chat request processing with a concept."""
        # Mock the OpenWebUILLM
        mock_llm_instance = MagicMock()
        mock_llm_instance.return_value = "This is a test response with concept context."
        mock_openwebui_llm.return_value = mock_llm_instance
        
        # Mock the response generator
        mock_response = ChatResponse(
            response="This is a test response with concept context.",
            suggestions=["Suggestion 1", "Suggestion 2"],
            follow_up_questions=["Question 1?", "Question 2?"],
            sources=[],
            confidence=0.9,
            tokens=100
        )
        mock_response_generator.create_response.return_value = mock_response
        
        # Create a new LLMService with the mocked LLM
        service = LLMService()
        service.llm = mock_llm_instance
        
        # Create a chat request with a concept
        chat_request = ChatRequest(
            message="Tell me about this concept.",
            conversation_id="test-conversation-id",
            concept=self.mock_concept
        )
        
        # Process the chat request
        response = service.process_chat_request(chat_request)
        
        # Verify the response
        assert response is not None
        assert response.response == "This is a test response with concept context."
        
        # Verify that the LLM was called with concept context
        mock_llm_instance.assert_called_once()
        args, kwargs = mock_llm_instance.call_args
        assert "Context: Working on concept:" in args[0]["question"]
        assert "Test Concept" in args[0]["question"]
        
        # Verify that the response generator was called
        mock_response_generator.create_response.assert_called_once()

    @patch('services.llm_service.vector_store_service')
    @patch('services.llm_service.response_generator')
    @patch('services.llm_service.OpenWebUILLM')
    def test_process_chat_request_with_rag(self, mock_openwebui_llm, mock_response_generator, mock_vector_store):
        """Test chat request processing with RAG (Retrieval-Augmented Generation)."""
        # Mock the OpenWebUILLM
        mock_llm_instance = MagicMock()
        mock_llm_instance.return_value = "This is a test response with RAG."
        mock_openwebui_llm.return_value = mock_llm_instance
        
        # Mock the response generator
        mock_response = ChatResponse(
            response="This is a test response with RAG.",
            suggestions=["Suggestion 1", "Suggestion 2"],
            follow_up_questions=["Question 1?", "Question 2?"],
            sources=[{"documentId": "doc-123", "filename": "test.pdf", "confidence": 0.9}],
            confidence=0.9,
            tokens=100
        )
        mock_response_generator.create_response.return_value = mock_response
        
        # Mock the vector store service
        mock_retriever = MagicMock()
        mock_vector_store.get_retriever.return_value = mock_retriever
        mock_vector_store.vector_store = MagicMock()  # Ensure vector_store is not None
        
        # Create a new LLMService with the mocked LLM
        service = LLMService()
        service.llm = mock_llm_instance
        
        # Create a chat request with a concept
        chat_request = ChatRequest(
            message="Tell me about this concept.",
            conversation_id="test-conversation-id",
            concept=self.mock_concept
        )
        
        # Mock the ConversationalRetrievalChain
        with patch('services.llm_service.ConversationalRetrievalChain') as mock_chain_constructor:
            # Create a mock chain instance
            mock_chain = MagicMock()
            mock_chain.invoke.return_value = {
                "answer": "This is a test response with RAG.",
                "source_documents": [
                    MagicMock(metadata={"document_id": "doc-123", "filename": "test.pdf"})
                ]
            }
            mock_chain_constructor.return_value = mock_chain
            
            # Process the chat request
            response = service.process_chat_request(chat_request)
            
            # Verify the response
            assert response is not None
            assert response.response == "This is a test response with RAG."
            assert len(response.sources) == 1
            assert response.sources[0]["documentId"] == "doc-123"
            
            # Verify that the vector store service was called
            mock_vector_store.get_retriever.assert_called_once_with(self.mock_concept.id)
            
            # Verify that the chain was invoked
            mock_chain.invoke.assert_called_once()
            
            # Verify that the response generator was called
            mock_response_generator.create_response.assert_called_once()

    @patch('services.llm_service.conversation_history_service')
    @patch('services.llm_service.response_generator')
    @patch('services.llm_service.OpenWebUILLM')
    def test_process_chat_request_with_history(self, mock_openwebui_llm, mock_response_generator, mock_history_service):
        """Test chat request processing with conversation history."""
        # Mock the OpenWebUILLM
        mock_llm_instance = MagicMock()
        mock_llm_instance.return_value = "This is a test response with history."
        mock_openwebui_llm.return_value = mock_llm_instance
        
        # Mock the response generator
        mock_response = ChatResponse(
            response="This is a test response with history.",
            suggestions=["Suggestion 1", "Suggestion 2"],
            follow_up_questions=["Question 1?", "Question 2?"],
            sources=[],
            confidence=0.9,
            tokens=100
        )
        mock_response_generator.create_response.return_value = mock_response
        
        # Mock the conversation history service
        mock_history_service.get_formatted_history.return_value = (
            "User: Previous message\nAssistant: Previous response",
            [("Previous message", "Previous response")]
        )
        
        # Create a new LLMService with the mocked LLM
        service = LLMService()
        service.llm = mock_llm_instance
        
        # Create a chat request with conversation ID
        chat_request = ChatRequest(
            message="Tell me more.",
            conversation_id="test-conversation-id"
        )
        
        # Process the chat request
        response = service.process_chat_request(chat_request)
        
        # Verify the response
        assert response is not None
        assert response.response == "This is a test response with history."
        
        # Verify that the conversation history service was called
        mock_history_service.get_formatted_history.assert_called_once_with("test-conversation-id")
        
        # Verify that the LLM was called with history context
        mock_llm_instance.assert_called_once()
        args, kwargs = mock_llm_instance.call_args
        assert "chat_history" in args[0]
        
        # Verify that the response generator was called
        mock_response_generator.create_response.assert_called_once()

    @patch('services.llm_service.response_generator')
    @patch('services.llm_service.OpenWebUILLM')
    def test_process_chat_request_error_handling(self, mock_openwebui_llm, mock_response_generator):
        """Test error handling in chat request processing."""
        # Mock the OpenWebUILLM to raise an exception
        mock_llm_instance = MagicMock()
        mock_llm_instance.side_effect = Exception("Test error")
        mock_openwebui_llm.return_value = mock_llm_instance
        
        # Mock the response generator
        mock_response = ChatResponse(
            response="I'm sorry, I encountered an error while processing your request. Please try again.",
            suggestions=[],
            follow_up_questions=[],
            sources=[],
            confidence=0.0,
            tokens=0
        )
        mock_response_generator.create_response.return_value = mock_response
        
        # Create a new LLMService with the mocked LLM
        service = LLMService()
        service.llm = mock_llm_instance
        
        # Create a chat request
        chat_request = ChatRequest(
            message="Hello, AI assistant!",
            conversation_id="test-conversation-id"
        )
        
        # Process the chat request
        response = service.process_chat_request(chat_request)
        
        # Verify the response
        assert response is not None
        assert "I'm sorry, I encountered an error" in response.response
        
        # Verify that the response generator was called with the error message
        mock_response_generator.create_response.assert_called_once()

    @patch('services.llm_service.welcome_generator')
    def test_generate_welcome_message(self, mock_welcome_generator):
        """Test the generate_welcome_message method."""
        # Mock the welcome generator
        mock_welcome_generator.generate_welcome_message.return_value = "Welcome to the test concept!"
        
        # Create a new LLMService
        service = LLMService()
        
        # Create an initialization request
        init_request = InitializeChatForConceptRequest(
            concept_id="test-concept-123",
            concept=self.mock_concept
        )
        
        # Generate a welcome message
        welcome_message = service.generate_welcome_message(init_request)
        
        # Verify the welcome message
        assert welcome_message == "Welcome to the test concept!"
        
        # Verify that the welcome generator was called
        mock_welcome_generator.generate_welcome_message.assert_called_once_with(init_request)

    @patch('services.llm_service.response_generator')
    def test_generate_dynamic_suggestions(self, mock_response_generator):
        """Test the _generate_dynamic_suggestions method."""
        # Mock the response generator
        mock_response_generator._generate_dynamic_suggestions.return_value = ["Suggestion 1", "Suggestion 2"]
        
        # Create a new LLMService
        service = LLMService()
        
        # Generate dynamic suggestions
        concept_suggestion = {"title": "Test Concept"}
        suggestions = service._generate_dynamic_suggestions(concept_suggestion)
        
        # Verify the suggestions
        assert suggestions == ["Suggestion 1", "Suggestion 2"]
        
        # Verify that the response generator was called
        mock_response_generator._generate_dynamic_suggestions.assert_called_once_with(concept_suggestion)

    @patch('services.llm_service.response_generator')
    def test_generate_dynamic_follow_up_questions(self, mock_response_generator):
        """Test the _generate_dynamic_follow_up_questions method."""
        # Mock the response generator
        mock_response_generator._generate_dynamic_follow_up_questions.return_value = ["Question 1?", "Question 2?"]
        
        # Create a new LLMService
        service = LLMService()
        
        # Generate dynamic follow-up questions
        concept_suggestion = {"title": "Test Concept"}
        questions = service._generate_dynamic_follow_up_questions(concept_suggestion)
        
        # Verify the questions
        assert questions == ["Question 1?", "Question 2?"]
        
        # Verify that the response generator was called
        mock_response_generator._generate_dynamic_follow_up_questions.assert_called_once_with(concept_suggestion)
