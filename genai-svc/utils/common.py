import os
import json
import requests
from typing import Dict, Any, Optional

def get_concept_details(concept_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch concept details from the concept service
    
    Args:
        concept_id: The ID of the concept to fetch
        
    Returns:
        A dictionary with concept details or None if the concept couldn't be fetched
    """
    concept_service_url = os.getenv("CONCEPT_SERVICE_URL", "http://concept-svc:8080")
    
    try:
        response = requests.get(
            f"{concept_service_url}/api/concepts/{concept_id}",
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching concept {concept_id}: {response.status_code}")
            return None
    except Exception as e:
        print(f"Exception fetching concept {concept_id}: {e}")
        return None

def format_error_response(status_code: int, message: str, details: Optional[str] = None) -> Dict[str, Any]:
    """
    Format a standard error response
    
    Args:
        status_code: HTTP status code
        message: Error message
        details: Optional details about the error
        
    Returns:
        A dictionary with the formatted error
    """
    error = {
        "status": status_code,
        "message": message
    }
    
    if details:
        error["details"] = details
        
    return error

def is_valid_uuid(uuid_string: str) -> bool:
    """
    Check if a string is a valid UUID
    
    Args:
        uuid_string: The string to check
        
    Returns:
        True if the string is a valid UUID, False otherwise
    """
    import uuid
    
    try:
        uuid_obj = uuid.UUID(uuid_string)
        return str(uuid_obj) == uuid_string
    except (ValueError, AttributeError):
        return False