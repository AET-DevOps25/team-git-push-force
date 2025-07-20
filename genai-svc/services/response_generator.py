from typing import List, Dict
import re

from genai_models.models.chat_response import ChatResponse
from genai_models.models.chat_response_concept_suggestion import ChatResponseConceptSuggestion


class ResponseGenerator:
    """Generates responses, suggestions, and follow-up questions"""

    def __init__(self, concept_extractor):
        """Initialize the response generator with a concept extractor"""
        self.concept_extractor = concept_extractor

    def create_response(self, response_text: str, sources: List[Dict] = None) -> ChatResponse:
        """Create a standard ChatResponse object with concept suggestions and follow-up items"""
        if sources is None:
            sources = []

        # Extract concept suggestion from response text
        concept_suggestion = self.concept_extractor.extract_concept_suggestion(response_text)

        # Remove JSON blocks from response text
        cleaned_response_text = self._remove_json_blocks(response_text)

        # Generate dynamic follow-up suggestions and questions
        suggestions = self._generate_dynamic_suggestions(concept_suggestion)
        follow_up_questions = self._generate_dynamic_follow_up_questions(concept_suggestion)

        return ChatResponse(
            response=cleaned_response_text,
            suggestions=suggestions,
            follow_up_questions=follow_up_questions,
            sources=sources,
            confidence=0.9,  # Placeholder
            concept_suggestion=concept_suggestion,
            tokens={
                "prompt": 100,  # Placeholder
                "response": 150,  # Placeholder
                "total": 250  # Placeholder
            }
        )
        
    def _remove_json_blocks(self, text: str) -> str:
        """Remove JSON code blocks from the response text (robust to formatting)."""
        # Remove all code blocks containing JSON (with or without 'json' tag)
        text = re.sub(r'```json[\s\S]*?```', '', text, flags=re.MULTILINE)
        text = re.sub(r'```[\s\S]*?```', '', text, flags=re.MULTILINE)
        # Remove any standalone JSON objects (not in code blocks)
        text = re.sub(r'\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}', '', text, flags=re.DOTALL)
        # Remove any lines that start with 'Example:' or similar prompt instructions
        text = re.sub(r'Example:\s*', '', text)
        # Clean up any summary or format instructions
        text = re.sub(r"Here(?:'s| is) (?:a|the) (?:summary|concept|JSON structure)[^:]*:\s*", '', text)
        # Remove excessive whitespace and newlines
        text = re.sub(r'\n{2,}', '\n', text)
        return text.strip()

    def _generate_dynamic_suggestions(self, concept_suggestion: ChatResponseConceptSuggestion) -> List[str]:
        """Generate dynamic suggestions based on the concept suggestion"""
        suggestions = []

        # Add suggestions based on what's missing or could be expanded
        if not concept_suggestion.agenda:
            suggestions.append("Can you suggest an agenda for this event?")
        else:
            suggestions.append("Can you refine the agenda with more detailed sessions?")

        if not concept_suggestion.speakers:
            suggestions.append("Who would be good speakers for this event?")
        else:
            suggestions.append("Can you suggest additional speakers with expertise in this field?")

        if not concept_suggestion.pricing:
            suggestions.append("What pricing structure would work for this event?")
        else:
            suggestions.append("How can I optimize the pricing strategy for maximum attendance?")

        # Add general suggestions
        general_suggestions = [
            "How can I make this event more interactive?",
            "What technologies should we use for this event?",
            "How can we promote this event effectively?",
            "What are the key success metrics for this type of event?",
            "How can we incorporate networking opportunities?",
            "What sponsorship opportunities would be appropriate?",
            "How should we handle registration and check-in?",
            "What post-event activities would you recommend?"
        ]

        # Add some general suggestions to ensure we have enough
        while len(suggestions) < 3 and general_suggestions:
            suggestions.append(general_suggestions.pop(0))

        # Limit to 3 suggestions
        return suggestions[:3]

    def _generate_dynamic_follow_up_questions(self, concept_suggestion: ChatResponseConceptSuggestion) -> List[str]:
        """Generate dynamic follow-up questions based on the concept suggestion"""
        questions = []

        # Add questions based on what's missing or could be expanded
        if not concept_suggestion.event_details or not concept_suggestion.event_details.target_audience:
            questions.append("Who is the target audience for this event?")

        if not concept_suggestion.event_details or not concept_suggestion.event_details.duration:
            questions.append("How long should this event be?")

        if not concept_suggestion.event_details or not concept_suggestion.event_details.location:
            questions.append("Where would be an ideal location for this event?")

        # Add general questions
        general_questions = [
            "What is your budget for this event?",
            "When are you planning to hold this event?",
            "What are your main objectives for this event?",
            "Are there any specific themes or topics you want to focus on?",
            "Do you have any preferred speakers in mind?",
            "What has worked well for similar events in the past?",
            "What challenges do you anticipate for this event?",
            "How will you measure the success of this event?"
        ]

        # Add some general questions to ensure we have enough
        while len(questions) < 3 and general_questions:
            questions.append(general_questions.pop(0))

        # Limit to 3 questions
        return questions[:3]


# Create a singleton instance
response_generator = ResponseGenerator(None)  # Will be initialized later with concept_extractor
