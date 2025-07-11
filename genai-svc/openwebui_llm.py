import os
import requests
from typing import Any, List, Mapping, Optional
from langchain.callbacks.manager import CallbackManagerForLLMRun
from langchain.llms.base import LLM

class OpenWebUILLM(LLM):
    """LLM wrapper for OpenWebUI API."""
    
    api_url: str = os.getenv("OPENWEBUI_API_URL", "https://gpu.aet.cit.tum.de/api")
    api_token: str = os.getenv("OPENWEBUI_API_TOKEN", "")
    model_name: str = "llama3"  # Default model, can be changed to "deepseek" or other available models
    temperature: float = 0.7
    max_tokens: int = 1024
    
    @property
    def _llm_type(self) -> str:
        return "openwebui"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Call the OpenWebUI API and return the generated text."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_token}"
        }
        
        # Prepare the payload for the API request
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }
        
        # Add stop sequences if provided
        if stop:
            payload["stop"] = stop
        
        # Override default parameters with any provided in kwargs
        for key, value in kwargs.items():
            if key in payload:
                payload[key] = value
        
        try:
            # Make the API request
            response = requests.post(
                f"{self.api_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=120  # 2-minute timeout
            )
            
            # Check if the request was successful
            response.raise_for_status()
            
            # Parse the response
            result = response.json()
            
            # Extract the generated text
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                raise ValueError("No response content received from OpenWebUI API")
                
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error calling OpenWebUI API: {str(e)}")
    
    @property
    def _identifying_params(self) -> Mapping[str, Any]:
        """Get the identifying parameters."""
        return {
            "model_name": self.model_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }