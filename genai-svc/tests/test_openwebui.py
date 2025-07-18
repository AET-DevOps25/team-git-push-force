import os
import pytest
from unittest.mock import patch, MagicMock

# Import the OpenWebUILLM class (path already added in conftest.py)
from openwebui_llm import OpenWebUILLM

class TestOpenWebUILLM:
    """Test suite for the OpenWebUILLM class."""

    def setup_method(self):
        """Set up test environment before each test method."""
        # Get configuration from environment variables
        self.api_url = os.getenv("OPENWEBUI_API_URL", "https://example.com/api")
        self.api_token = os.getenv("OPENWEBUI_API_TOKEN", "test_token")
        self.model_name = os.getenv("OPENWEBUI_MODEL", "test_model")

    def test_initialization(self):
        """Test that the OpenWebUILLM class can be initialized with proper parameters."""
        llm = OpenWebUILLM(
            api_url=self.api_url,
            api_token=self.api_token,
            model_name=self.model_name
        )

        assert llm.api_url == self.api_url
        assert llm.api_token == self.api_token
        assert llm.model_name == self.model_name
        assert llm._llm_type == "openwebui"

    @patch('openwebui_llm.requests.post')
    def test_call_success(self, mock_post):
        """Test successful API call with mocked response."""
        # Mock the response from the API
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "Hello, I can hear you!"
                    }
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Initialize the LLM
        llm = OpenWebUILLM(
            api_url=self.api_url,
            api_token=self.api_token,
            model_name=self.model_name
        )

        # Call the LLM
        result = llm("Hello, can you hear me?")

        # Verify the result
        assert result == "Hello, I can hear you!"

        # Verify the API was called with the correct parameters
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == f"{self.api_url}/chat/completions"
        assert kwargs['headers']['Authorization'] == f"Bearer {self.api_token}"
        assert kwargs['json']['model'] == self.model_name
        assert kwargs['json']['messages'][0]['content'] == "Hello, can you hear me?"

    @patch('openwebui_llm.requests.post')
    def test_call_with_shared_mock(self, mock_post, mock_openwebui_response):
        """Test API call using the shared mock response fixture."""
        # Use the shared mock response from conftest.py
        mock_post.return_value = mock_openwebui_response

        # Initialize the LLM
        llm = OpenWebUILLM(
            api_url=self.api_url,
            api_token=self.api_token,
            model_name=self.model_name
        )

        # Call the LLM
        result = llm("Hello, can you hear me?")

        # Verify the result matches the mock response content from conftest.py
        assert result == "This is a mock response from the OpenWebUI API."

        # Verify the API was called with the correct parameters
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == f"{self.api_url}/chat/completions"
        assert kwargs['headers']['Authorization'] == f"Bearer {self.api_token}"
        assert kwargs['json']['model'] == self.model_name
        assert kwargs['json']['messages'][0]['content'] == "Hello, can you hear me?"

    @patch('openwebui_llm.requests.post')
    def test_call_api_error(self, mock_post):
        """Test API call with error response."""
        # Mock an error response
        from requests.exceptions import RequestException
        mock_post.side_effect = RequestException("API connection error")

        # Initialize the LLM
        llm = OpenWebUILLM(
            api_url=self.api_url,
            api_token=self.api_token,
            model_name=self.model_name
        )

        # Call the LLM and expect an exception
        with pytest.raises(ValueError) as excinfo:
            llm("Hello, can you hear me?")

        # Verify the error message
        assert "Error calling OpenWebUI API" in str(excinfo.value)

    @patch('openwebui_llm.requests.post')
    def test_call_empty_response(self, mock_post):
        """Test API call with empty response."""
        # Mock a response with no choices
        mock_response = MagicMock()
        mock_response.json.return_value = {"choices": []}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Initialize the LLM
        llm = OpenWebUILLM(
            api_url=self.api_url,
            api_token=self.api_token,
            model_name=self.model_name
        )

        # Call the LLM and expect an exception
        with pytest.raises(ValueError) as excinfo:
            llm("Hello, can you hear me?")

        # Verify the error message
        assert "No response content received" in str(excinfo.value)

    def test_identifying_params(self):
        """Test that identifying parameters are correctly returned."""
        llm = OpenWebUILLM(
            api_url=self.api_url,
            api_token=self.api_token,
            model_name=self.model_name,
            temperature=0.5,
            max_tokens=200
        )

        params = llm._identifying_params
        assert params['model_name'] == self.model_name
        assert params['temperature'] == 0.5
        assert params['max_tokens'] == 200
