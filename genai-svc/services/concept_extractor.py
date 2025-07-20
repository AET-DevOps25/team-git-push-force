import json
import re
from typing import Dict, Any

from genai_models.models.chat_response_concept_suggestion import ChatResponseConceptSuggestion
from genai_models.models.chat_response_concept_suggestion_event_details import ChatResponseConceptSuggestionEventDetails
from genai_models.models.chat_response_concept_suggestion_agenda_inner import ChatResponseConceptSuggestionAgendaInner
from genai_models.models.chat_response_concept_suggestion_speakers_inner import ChatResponseConceptSuggestionSpeakersInner
from genai_models.models.chat_response_concept_suggestion_pricing import ChatResponseConceptSuggestionPricing


class ConceptExtractor:
    """Extracts concept suggestions from LLM responses"""

    def extract_concept_suggestion(self, response_text: str) -> ChatResponseConceptSuggestion:
        """Extract concept suggestions from the response text. Assumes a complete JSON block is always present."""
        # Initialize with default values
        title = "Event Concept Suggestion"
        description = ""
        event_details = None
        agenda = []
        speakers = []
        pricing = None
        notes = ""
        reasoning = ""
        confidence = 0.9

        # Always extract JSON from the response
        json_data = self._extract_json_from_text(response_text)
        if not json_data:
            # If no JSON found, return a minimal suggestion
            return ChatResponseConceptSuggestion(
                title=title,
                description=response_text,
                event_details=None,
                agenda=None,
                speakers=None,
                pricing=None,
                notes=notes,
                reasoning=reasoning,
                confidence=confidence
            )

        # Extract all fields from JSON, using empty string or None for missing values
        title = json_data.get("title", "")
        description = json_data.get("description", "")
        notes = json_data.get("notes", "")
        reasoning = json_data.get("reasoning", "")

        # Event details
        event_details_data = json_data.get("eventDetails", {})
        event_details = ChatResponseConceptSuggestionEventDetails(
            theme=event_details_data.get("theme", ""),
            format=event_details_data.get("format", "").upper() if event_details_data.get("format") else None,
            capacity=event_details_data.get("capacity"),
            duration=event_details_data.get("duration", ""),
            target_audience=event_details_data.get("targetAudience", ""),
            location=event_details_data.get("location", "")
        ) if event_details_data else None

        # Agenda
        agenda = [
            ChatResponseConceptSuggestionAgendaInner(
                time=item.get("time", ""),
                title=item.get("title", ""),
                type=item.get("type", "KEYNOTE"),
                duration=item.get("duration", 60)
            ) for item in json_data.get("agenda", [])
        ] or None

        # Speakers
        speakers = [
            ChatResponseConceptSuggestionSpeakersInner(
                name=speaker.get("name", ""),
                expertise=speaker.get("expertise", ""),
                suggested_topic=speaker.get("suggestedTopic", "")
            ) for speaker in json_data.get("speakers", [])
        ] or None

        # Pricing
        pricing_data = json_data.get("pricing", {})
        pricing = ChatResponseConceptSuggestionPricing(
            currency=pricing_data.get("currency", "USD"),
            regular=pricing_data.get("regular"),
            early_bird=pricing_data.get("earlyBird"),
            vip=pricing_data.get("vip"),
            student=pricing_data.get("student")
        ) if pricing_data else None

        return ChatResponseConceptSuggestion(
            title=title,
            description=description,
            event_details=event_details,
            agenda=agenda,
            speakers=speakers,
            pricing=pricing,
            notes=notes,
            reasoning=reasoning,
            confidence=confidence
        )

    def _extract_json_from_text(self, text: str) -> dict:
        """Extract JSON object from text"""
        print(f"Attempting to extract JSON from response text of length {len(text)}")
        
        # Look for JSON pattern in the text - first try with json code blocks
        json_pattern = r'```json\s*(.*?)\s*```'
        json_match = re.search(json_pattern, text, re.DOTALL)
        if json_match:
            print("Found JSON in ```json``` code block")

        if not json_match:
            # Try alternative pattern without the json tag
            json_pattern = r'```\s*(\{.*?\})\s*```'
            json_match = re.search(json_pattern, text, re.DOTALL)
            if json_match:
                print("Found JSON in regular ``` ``` code block")

        if not json_match:
            # Try to find JSON without code blocks
            # This pattern doesn't have a capturing group, so we need to handle it differently
            json_pattern = r'\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}'
            json_match = re.search(json_pattern, text, re.DOTALL)
            if json_match:
                print("Found JSON without code blocks")

        if json_match:
            try:
                # Parse the JSON
                if hasattr(json_match, 'groups') and len(json_match.groups()) > 0:
                    # For patterns with capturing groups (first two patterns)
                    json_str = json_match.group(1)
                    print(f"Extracted JSON from capturing group")
                else:
                    # For pattern without capturing group (third pattern)
                    json_str = json_match.group(0)
                    print(f"Extracted JSON from full match")

                # Debug the extracted JSON string
                print(f"Extracted JSON string (first 100 chars): {json_str[:100]}...")

                # First try to parse as is
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError as e:
                    print(f"Initial JSON parsing failed: {e}. Attempting cleanup...")
                    
                    # Apply multiple cleanup steps
                    # 1. Remove any trailing commas before closing braces or brackets
                    json_str = re.sub(r',\s*}', '}', json_str)
                    json_str = re.sub(r',\s*]', ']', json_str)
                    
                    # 2. Fix common formatting issues
                    # Replace single quotes with double quotes for keys and string values
                    json_str = re.sub(r"'([^']*)':", r'"\1":', json_str)  # Fix keys
                    json_str = re.sub(r':\s*\'([^\']*)\'', r': "\1"', json_str)  # Fix values
                    
                    # 3. Handle unquoted property names
                    json_str = re.sub(r'([{,])\s*(\w+):', r'\1"\2":', json_str)
                    
                    # 4. Fix newlines and extra spaces in keys
                    json_str = re.sub(r'[\n\r]+\s*"', '"', json_str)  # Remove newlines before keys
                    json_str = re.sub(r'[\n\r]+\s*}', '}', json_str)  # Remove newlines before closing braces
                    json_str = re.sub(r'[\n\r]+\s*]', ']', json_str)  # Remove newlines before closing brackets
                    
                    print(f"Cleaned JSON string (first 100 chars): {json_str[:100]}...")
                    
                    # Try parsing the cleaned JSON
                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError as e2:
                        print(f"JSON parsing failed even after cleanup: {e2}")
                        
                        # Last resort: try to extract a valid subset of the JSON
                        try:
                            # Find all potential JSON objects
                            potential_jsons = re.findall(r'\{[^{}]*\}', json_str)
                            for potential_json in potential_jsons:
                                try:
                                    parsed = json.loads(potential_json)
                                    if parsed and isinstance(parsed, dict) and len(parsed) > 0:
                                        print(f"Found valid JSON subset with {len(parsed)} keys")
                                        return parsed
                                except:
                                    continue
                        except:
                            pass
                        
                        return {}
            except Exception as e:
                print(f"Unexpected error parsing JSON: {e}")
                return {}

        print("No JSON pattern found in the response text")
        return {}



# Create a singleton instance
concept_extractor = ConceptExtractor()
