# GenAI Service Tests

This directory contains tests for the GenAI service, particularly focusing on conversation history and concept suggestions.

## Running the Tests

To run the tests, navigate to the `genai-svc` directory and run:

```bash
python -m unittest discover tests
```

Or to run a specific test file:

```bash
python -m unittest tests/test_conversation_history.py
python -m unittest tests/test_concept_suggestions.py
```

## Test Cases

### Conversation History Tests

The `test_conversation_history.py` file contains tests for conversation history handling:

1. `test_conversation_history_processing`: Tests that conversation history is properly processed when included in the request.
2. `test_no_conversation_history`: Tests that the system handles requests without conversation history gracefully.

### Concept Suggestion Tests

The `test_concept_suggestions.py` file contains tests for concept suggestion extraction:

1. `test_extract_concept_suggestion_with_json`: Tests that concept suggestions are properly extracted from JSON responses.
2. `test_extract_concept_suggestion_with_malformed_json`: Tests that concept suggestions are properly handled when the JSON is malformed.
3. `test_extract_concept_suggestion_without_json`: Tests that concept suggestions are properly handled when no JSON is present.
4. `test_extract_concept_suggestion_with_json_without_code_blocks`: Tests that concept suggestions are properly extracted from JSON without code blocks.

## Verifying the Changes

To verify that the changes resolve the issues described in the issue description:

1. **Conversation History**:
   - Run the conversation history tests to verify that the system correctly processes conversation history when included in the request.
   - Check the logs to ensure that "No previous conversation history found in request" only appears when no conversation history is actually included.

2. **Concept Suggestions**:
   - Run the concept suggestion tests to verify that the system correctly extracts concept suggestions from the LLM responses.
   - Check that concept suggestions are included in the response even when the JSON is not perfectly formatted.

3. **Legacy Code Removal**:
   - Verify that the `_extract_concept_suggestion_legacy` method has been removed from `concept_extractor.py`.
   - Verify that the `extract_concept_suggestion` method no longer falls back to the legacy method.

## Manual Testing

For manual testing, you can use the following curl command to send a request with conversation history:

```bash
curl -X POST "http://localhost:8083/api/genai/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What were we talking about before?",
    "concept": {
      "id": "58afdb51-242f-44d2-adf2-0e3afde95d9f",
      "title": "AI Conference 2025"
    },
    "conversationId": "58afdb51-242f-44d2-adf2-0e3afde95d9f",
    "context": {
      "previousMessages": [
        {
          "role": "user",
          "content": "I am planning an AI conference focused on security.",
          "timestamp": "2025-07-16T20:30:00Z"
        },
        {
          "role": "assistant",
          "content": "That is a great idea! AI security is a critical topic. Would you like me to suggest some potential speakers or agenda items?",
          "timestamp": "2025-07-16T20:30:10Z"
        }
      ]
    }
  }'
```

Check the response to verify that:
1. The AI assistant acknowledges the previous conversation about an AI security conference.
2. The response includes a concept suggestion with relevant details.
3. The logs do not show "No previous conversation history found in request".