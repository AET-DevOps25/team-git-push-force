from genai_models.models.get_gen_ai_service_health200_response import GetGenAIServiceHealth200Response
from genai_models.models.get_gen_ai_service_health200_response_models import GetGenAIServiceHealth200ResponseModels
from genai_models.models.get_gen_ai_service_health200_response_vector_store import GetGenAIServiceHealth200ResponseVectorStore

from services.vector_store import vector_store_service
from services.llm_service import llm_service
from utils.serialization import to_camel_case_dict

def get_gen_ai_service_health():
    """Get health status of the GenAI service"""
    # Check LLM status
    llm_status = "healthy"
    llm_name = "Unknown"
    
    try:
        # Try to get the LLM name
        if hasattr(llm_service, 'llm'):
            if hasattr(llm_service.llm, 'model_name'):
                llm_name = llm_service.llm.model_name
            elif isinstance(llm_service.llm, type) and hasattr(llm_service.llm, '__name__'):
                llm_name = llm_service.llm.__name__
            else:
                llm_name = llm_service.llm.__class__.__name__
    except Exception as e:
        llm_status = "unhealthy"
        llm_name = f"Error: {str(e)}"
    
    # Check vector store status
    vector_store_status = "healthy" if vector_store_service.client else "unhealthy"
    vector_store_name = "Weaviate"
    
    # Create response
    response = GetGenAIServiceHealth200Response(
        status="UP",
        service="genai-service",
        models=GetGenAIServiceHealth200ResponseModels(
            llm=llm_name,
            embedding="text-embedding-ada-002"
        ),
        vector_store=GetGenAIServiceHealth200ResponseVectorStore(
            status="connected" if vector_store_status == "healthy" else "disconnected",
            collections=0  # Placeholder
        )
    )
    return to_camel_case_dict(response)
