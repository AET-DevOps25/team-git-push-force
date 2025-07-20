import os
import pytest
from unittest.mock import patch, MagicMock

# Import the welcome_generator singleton
from services.welcome_generator import welcome_generator

class TestWelcomeGenerator:
    """Test suite for the welcome_generator module."""

    def setup_method(self):
        """Set up test environment before each test method."""
        # Ensure environment variables are set for testing
        os.environ["SKIP_WEAVIATE"] = "true"
        os.environ["SKIP_MINIO"] = "true"
        os.environ["SKIP_OPENWEBUI"] = "true"

    @patch('services.welcome_generator.welcome_generator.llm')
    def test_generate_welcome_message_basic(self, mock_llm):
        """Test generating a welcome message with basic input."""
        # Mock the LLM response
        mock_llm.return_value = "Welcome to your new concept! I'm here to help you plan your event."
        
        # Create a mock initialization request
        mock_request = MagicMock()
        mock_request.concept_id = "test-concept-123"
        mock_request.concept = None
        
        # Generate a welcome message
        welcome_message = welcome_generator.generate_welcome_message(mock_request)
        
        # Verify the welcome message
        assert welcome_message is not None
        assert "Welcome" in welcome_message
        
        # Verify that the LLM was called
        mock_llm.assert_called_once()

    @patch('services.welcome_generator.welcome_generator.llm')
    def test_generate_welcome_message_with_concept(self, mock_llm):
        """Test generating a welcome message with a concept."""
        # Mock the LLM response
        mock_llm.return_value = "Welcome to your Test Concept! I'm here to help you plan your HYBRID event."
        
        # Create a mock concept
        mock_concept = MagicMock()
        mock_concept.title = "Test Concept"
        mock_concept.event_details.format = "HYBRID"
        mock_concept.event_details.theme = "Test Theme"
        
        # Create a mock initialization request
        mock_request = MagicMock()
        mock_request.concept_id = "test-concept-123"
        mock_request.concept = mock_concept
        mock_request.concept_title = "Test Concept"
        mock_request.user_id = "test-user"
        
        # Generate a welcome message
        welcome_message = welcome_generator.generate_welcome_message(mock_request)
        
        # Verify the welcome message
        assert welcome_message is not None
        assert "Welcome" in welcome_message
        assert "Test Concept" in welcome_message
        
        # Verify that the LLM was called with concept information
        mock_llm.assert_called_once()
        args, kwargs = mock_llm.call_args
        # Check if args[0] is a StringPromptValue object with a text attribute
        if hasattr(args[0], 'text'):
            assert "Test Concept" in args[0].text
        else:
            assert "Test Concept" in args[0]

    @patch('services.welcome_generator.welcome_generator.llm')
    def test_generate_welcome_message_error_handling(self, mock_llm):
        """Test error handling in welcome message generation."""
        # Mock the LLM to raise an exception
        mock_llm.side_effect = Exception("Test error")
        
        # Create a mock initialization request
        mock_request = MagicMock()
        mock_request.concept_id = "test-concept-123"
        mock_request.concept = None
        
        # Generate a welcome message
        welcome_message = welcome_generator.generate_welcome_message(mock_request)
        
        # Verify that a default welcome message is returned
        assert welcome_message is not None
        assert "Welcome" in welcome_message
        assert "I'm here to help" in welcome_message
        
        # Verify that the LLM was called
        mock_llm.assert_called_once()
