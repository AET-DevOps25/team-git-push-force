import os
import pytest
from unittest.mock import patch, MagicMock

# Import the response_generator singleton
from services.response_generator import response_generator
from genai_models.models.chat_response_concept_suggestion import ChatResponseConceptSuggestion

# Mock class to replace missing import
class EventDetails:
    def __init__(self, theme=None, format=None, capacity=None, duration=None, targetAudience=None, location=None):
        self.theme = theme
        self.format = format
        self.capacity = capacity
        self.duration = duration
        self.targetAudience = targetAudience
        self.location = location
        # Add snake_case versions for compatibility with response_generator.py
        self.target_audience = targetAudience

class TestResponseGenerator:
    """Test suite for the response_generator module."""

    def setup_method(self):
        """Set up test environment before each test method."""
        # Ensure environment variables are set for testing
        os.environ["SKIP_WEAVIATE"] = "true"
        os.environ["SKIP_MINIO"] = "true"
        os.environ["SKIP_OPENWEBUI"] = "true"
        
        # Create a mock concept_extractor
        mock_concept_extractor = MagicMock()
        mock_concept_extractor.extract_concept_suggestion.return_value = ChatResponseConceptSuggestion(
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
        
        # Set the mock concept_extractor on the response_generator
        response_generator.concept_extractor = mock_concept_extractor

    def test_remove_json_blocks(self):
        """Test removing JSON blocks from response text."""
        # Test with JSON code block
        text_with_json_block = """Here's a response to your question.

```json
{
  "title": "Test Concept",
  "description": "A test concept"
}
```

Let me know if you need anything else."""

        cleaned_text = response_generator._remove_json_blocks(text_with_json_block)
        assert "Here's a response to your question." in cleaned_text
        assert "Let me know if you need anything else." in cleaned_text
        assert "{" not in cleaned_text
        assert "}" not in cleaned_text
        assert "```" not in cleaned_text
        
        # Test with unmarked JSON object
        text_with_json_object = """Here's a response to your question.

{
  "title": "Test Concept",
  "description": "A test concept"
}

Let me know if you need anything else."""

        cleaned_text = response_generator._remove_json_blocks(text_with_json_object)
        assert "Here's a response to your question." in cleaned_text
        assert "Let me know if you need anything else." in cleaned_text
        assert "{" not in cleaned_text
        assert "}" not in cleaned_text
        
        # Test with example text
        text_with_example = """Here's a response to your question.

Example:
{
  "title": "Test Concept",
  "description": "A test concept"
}

Let me know if you need anything else."""

        cleaned_text = response_generator._remove_json_blocks(text_with_example)
        assert "Here's a response to your question." in cleaned_text
        assert "Let me know if you need anything else." in cleaned_text
        assert "Example:" not in cleaned_text
        assert "{" not in cleaned_text
        assert "}" not in cleaned_text

    def test_generate_dynamic_suggestions(self):
        """Test generating dynamic suggestions based on concept suggestion."""
        # Test with empty concept suggestion
        empty_concept = ChatResponseConceptSuggestion()
        suggestions = response_generator._generate_dynamic_suggestions(empty_concept)
        assert len(suggestions) == 3
        assert "Can you suggest an agenda for this event?" in suggestions
        assert "Who would be good speakers for this event?" in suggestions
        assert "What pricing structure would work for this event?" in suggestions
        
        # Test with partial concept suggestion
        partial_concept = ChatResponseConceptSuggestion(
            agenda=[{"time": "9:00 AM", "title": "Opening Keynote", "type": "KEYNOTE", "duration": 60}]
        )
        suggestions = response_generator._generate_dynamic_suggestions(partial_concept)
        assert len(suggestions) == 3
        assert "Can you refine the agenda with more detailed sessions?" in suggestions
        assert "Who would be good speakers for this event?" in suggestions
        assert "What pricing structure would work for this event?" in suggestions
        
        # Test with complete concept suggestion
        complete_concept = ChatResponseConceptSuggestion(
            agenda=[{"time": "9:00 AM", "title": "Opening Keynote", "type": "KEYNOTE", "duration": 60}],
            speakers=[{"name": "John Doe", "expertise": "AI", "suggestedTopic": "Future of AI"}],
            pricing={"currency": "USD", "earlyBird": 299, "regular": 399, "vip": 599, "student": 99}
        )
        suggestions = response_generator._generate_dynamic_suggestions(complete_concept)
        assert len(suggestions) == 3
        assert "Can you refine the agenda with more detailed sessions?" in suggestions
        assert "Can you suggest additional speakers with expertise in this field?" in suggestions
        assert "How can I optimize the pricing strategy for maximum attendance?" in suggestions

    def test_generate_dynamic_follow_up_questions(self):
        """Test generating dynamic follow-up questions based on concept suggestion."""
        # Test with empty concept suggestion
        empty_concept = ChatResponseConceptSuggestion()
        questions = response_generator._generate_dynamic_follow_up_questions(empty_concept)
        assert len(questions) == 3
        assert "Who is the target audience for this event?" in questions
        assert "How long should this event be?" in questions
        assert "Where would be an ideal location for this event?" in questions
        
        # Test with partial concept suggestion
        partial_concept = ChatResponseConceptSuggestion(
            event_details=EventDetails(
                targetAudience="Test audience"
            )
        )
        questions = response_generator._generate_dynamic_follow_up_questions(partial_concept)
        assert len(questions) == 3
        assert "Who is the target audience for this event?" not in questions
        assert "How long should this event be?" in questions
        assert "Where would be an ideal location for this event?" in questions
        
        # Test with complete concept suggestion
        complete_concept = ChatResponseConceptSuggestion(
            event_details=EventDetails(
                targetAudience="Test audience",
                duration="1 day",
                location="Test location"
            )
        )
        questions = response_generator._generate_dynamic_follow_up_questions(complete_concept)
        assert len(questions) == 3
        assert "Who is the target audience for this event?" not in questions
        assert "How long should this event be?" not in questions
        assert "Where would be an ideal location for this event?" not in questions
        assert len(questions) == 3  # Should still have 3 questions from the general list

    @patch('services.response_generator.ResponseGenerator._remove_json_blocks')
    @patch('services.response_generator.ResponseGenerator._generate_dynamic_suggestions')
    @patch('services.response_generator.ResponseGenerator._generate_dynamic_follow_up_questions')
    def test_create_response(self, mock_follow_up, mock_suggestions, mock_remove_json):
        """Test creating a chat response."""
        # Mock the internal methods
        mock_remove_json.return_value = "Cleaned response text"
        mock_suggestions.return_value = ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
        mock_follow_up.return_value = ["Question 1?", "Question 2?", "Question 3?"]
        
        # Create a response
        response_text = "Original response text with JSON"
        sources = [{"documentId": "doc-123", "filename": "test.pdf", "confidence": 0.9}]
        
        response = response_generator.create_response(response_text, sources)
        
        # Verify the response
        assert response.response == "Cleaned response text"
        assert len(response.suggestions) == 3
        assert len(response.follow_up_questions) == 3
        assert len(response.sources) == 1
        assert response.sources[0]["documentId"] == "doc-123"
        assert response.confidence == 0.9
        assert response.concept_suggestion is not None
        assert response.concept_suggestion.title == "Test Concept"
        
        # Verify that the internal methods were called
        mock_remove_json.assert_called_once_with(response_text)
        mock_suggestions.assert_called_once()
        mock_follow_up.assert_called_once()
        
        # Test with default sources
        response = response_generator.create_response(response_text)
        assert response.sources == []
