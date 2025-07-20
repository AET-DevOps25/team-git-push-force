from genai_models.models.chat_request import ChatRequest
from genai_models.models.chat_response import ChatResponse
from genai_models.models.initialize_chat_for_concept200_response import InitializeChatForConcept200Response
from genai_models.models.initialize_chat_for_concept_request import InitializeChatForConceptRequest
import connexion

# Import services
from services.llm_service import LLMService
from services.conversation_history_service import conversation_history_service
from utils.serialization import to_camel_case_dict

# Initialize the LLM service
llm_service = LLMService()

def chat_with_ai_assistant(body):
    """Implementation of chat_with_ai_assistant endpoint"""
    try:
        # Extract the chat request from the body
        if hasattr(connexion, 'request') and hasattr(connexion.request, 'is_json') and connexion.request.is_json:
            chat_request = ChatRequest.from_dict(connexion.request.get_json())
        else:
            chat_request = body if isinstance(body, ChatRequest) else ChatRequest.from_dict(body)

        # Set the question field from message for compatibility with LLM services
        if hasattr(chat_request, 'message') and chat_request.message:
            chat_request.question = chat_request.message
            
        # Get the conversation ID from the request
        conversation_id = getattr(chat_request, 'conversation_id', None)
        
        # Store the user's message in the conversation history if we have a conversation ID
        if conversation_id and hasattr(chat_request, 'message') and chat_request.message:
            conversation_history_service.add_message(
                conversation_id=conversation_id,
                role="user",
                content=chat_request.message
            )
            print(f"Stored user message in conversation {conversation_id}")

        # Get the response from the service
        response = llm_service.process_chat_request(chat_request)

        # Verify that concept_suggestion is present in the response
        if isinstance(response, ChatResponse) and not response.concept_suggestion:
            print("WARNING: No concept_suggestion in response from LLM service")

            # Attempt to extract it again from the response text
            from services.concept_extractor import concept_extractor
            concept_suggestion = concept_extractor.extract_concept_suggestion(response.response)

            # If we still don't have a concept, create a minimal one
            if not concept_suggestion or not concept_suggestion.title:
                from genai_models.models.chat_response_concept_suggestion import ChatResponseConceptSuggestion
                concept_suggestion = ChatResponseConceptSuggestion(
                    title="Event Concept",
                    description=response.response,
                    notes="Automatically generated when no concept was found in the response"
                )

            # Update the response with the concept
            response.concept_suggestion = concept_suggestion
            print(f"Added concept_suggestion with title: {concept_suggestion.title}")

        # Ensure we have a valid response object
        if not response or (isinstance(response, dict) and 'response' not in response):
            # Create a fallback response
            fallback_response = ChatResponse(
                response="I processed your request, but couldn't generate a proper response.",
                suggestions=["Try asking a different question"],
                follow_up_questions=[],
                confidence=0.5
            )
            response_dict = to_camel_case_dict(fallback_response)
            response_dict['conversationId'] = getattr(chat_request, 'conversation_id', None)
            return response_dict

        # Store the assistant's response in the conversation history if we have a conversation ID
        if conversation_id and isinstance(response, ChatResponse) and response.response:
            conversation_history_service.add_message(
                conversation_id=conversation_id,
                role="assistant",
                content=response.response
            )
            print(f"Stored assistant response in conversation {conversation_id}")

        # Return the response, ensuring it's a dict
        if isinstance(response, ChatResponse):
            response_dict = to_camel_case_dict(response)
            response_dict['conversationId'] = getattr(chat_request, 'conversation_id', None)
            return response_dict
        return response

    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        print(f"Error in chat_with_ai_assistant: {str(e)}")
        print(f"Full traceback: {traceback_str}")

        # Log more details about the request for debugging
        if 'chat_request' in locals():
            try:
                print(f"Request details: conversation_id={getattr(chat_request, 'conversation_id', None)}")
                print(f"Message: {getattr(chat_request, 'message', None)}")
                if hasattr(chat_request, 'context') and chat_request.context:
                    print(f"Context: {getattr(chat_request.context, 'previous_messages', [])}")
            except Exception as debug_err:
                print(f"Error while logging debug info: {debug_err}")

        # Create a default error response
        error_response = ChatResponse(
            response="I'm sorry, but I encountered an error processing your request. The development team has been notified.",
            suggestions=["Try again with a different question", "Refresh the page and start a new conversation"],
            follow_up_questions=[],
            confidence=0.5
        )
        response_dict = to_camel_case_dict(error_response)
        response_dict['conversationId'] = getattr(chat_request, 'conversation_id', None) if 'chat_request' in locals() else None
        return response_dict

def initialize_chat_for_concept(body):
    """Implementation of initialize_chat_for_concept endpoint"""
    if hasattr(connexion, 'request') and hasattr(connexion.request, 'is_json') and connexion.request.is_json:
        init_request = InitializeChatForConceptRequest.from_dict(connexion.request.get_json())
    else:
        init_request = body if isinstance(body, InitializeChatForConceptRequest) else InitializeChatForConceptRequest.from_dict(body)

    welcome_message = llm_service.generate_welcome_message(init_request)

    # Generate a unique conversation ID
    import uuid
    conversation_id = str(uuid.uuid4())

    # Generate dynamic suggestions based on the concept
    try:
        # Create a concept suggestion object for the dynamic suggestions method
        from genai_models.models.chat_response_concept_suggestion import ChatResponseConceptSuggestion
        from genai_models.models.chat_response_concept_suggestion_event_details import ChatResponseConceptSuggestionEventDetails

        # Create a simple concept suggestion based on the welcome message
        concept_suggestion = ChatResponseConceptSuggestion(
            title=init_request.concept_title,
            description=welcome_message
        )

        # Get dynamic suggestions from the LLM service
        suggestions = llm_service._generate_dynamic_suggestions(concept_suggestion)
    except Exception as e:
        print(f"Error generating dynamic suggestions: {e}")
        # Fallback to default suggestions
        suggestions = [
            "Generate an initial agenda",
            "Suggest keynote speakers",
            "Upload relevant documents",
            "Define target audience"
        ]

    # Store the welcome message in the conversation history
    conversation_history_service.add_message(
        conversation_id=conversation_id,
        role="assistant",
        content=welcome_message
    )
    print(f"Stored welcome message in conversation {conversation_id}")

    # The OpenAPI spec expects 'message', 'suggestions', and 'conversationId'
    response = InitializeChatForConcept200Response(
        message=welcome_message,
        suggestions=suggestions,
        conversation_id=conversation_id
    )
    return to_camel_case_dict(response)
