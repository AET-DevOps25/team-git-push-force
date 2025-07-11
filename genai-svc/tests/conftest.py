"""
Shared pytest fixtures for all tests.
"""
import os
import sys
import pytest
from unittest.mock import MagicMock
from dotenv import load_dotenv

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the app
import app

@pytest.fixture(scope="session", autouse=True)
def load_env():
    """Load environment variables from .env file."""
    load_dotenv()
    return os.environ

@pytest.fixture
def mock_openwebui_response():
    """Create a mock response from the OpenWebUI API."""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": "This is a mock response from the OpenWebUI API."
                }
            }
        ]
    }
    mock_response.raise_for_status.return_value = None
    return mock_response

@pytest.fixture
def flask_app():
    """Create a Flask app for testing."""
    app.flask_app.config['TESTING'] = True
    return app.flask_app

@pytest.fixture
def client(flask_app):
    """Create a test client for the Flask app."""
    with flask_app.test_client() as client:
        yield client