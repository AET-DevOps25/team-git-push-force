from genai_models.models.chat_request import ChatRequest
from genai_models.models.chat_response import ChatResponse
from genai_models.models.initialize_chat_for_concept200_response import InitializeChatForConcept200Response
from genai_models.models.initialize_chat_for_concept_request import InitializeChatForConceptRequest
import connexion

# Import services
from services.llm_service import process_chat_request, generate_welcome_message

def chat_with_ai_assistant(body):
    """Implementation of chat_with_ai_assistant endpoint"""
    if hasattr(connexion, 'request') and hasattr(connexion.request, 'is_json') and connexion.request.is_json:
        chat_request = ChatRequest.from_dict(connexion.request.get_json())
    else:
        chat_request = body if isinstance(body, ChatRequest) else ChatRequest.from_dict(body)
    
    return process_chat_request(chat_request)

def initialize_chat_for_concept(body):
    """Implementation of initialize_chat_for_concept endpoint"""
    if hasattr(connexion, 'request') and hasattr(connexion.request, 'is_json') and connexion.request.is_json:
        init_request = InitializeChatForConceptRequest.from_dict(connexion.request.get_json())
    else:
        init_request = body if isinstance(body, InitializeChatForConceptRequest) else InitializeChatForConceptRequest.from_dict(body)
    
    welcome_message = generate_welcome_message(init_request)
    
    # The OpenAPI spec expects 'message', 'suggestions', and 'conversationId'
    response = InitializeChatForConcept200Response(
        message=welcome_message,
        suggestions=[],  # Placeholder for now
        conversation_id="00000000-0000-0000-0000-000000000000"  # Placeholder for now
    )
    return response.to_dict()