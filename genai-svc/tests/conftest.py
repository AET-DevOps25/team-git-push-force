"""
Shared pytest fixtures for all tests.
"""
import os
import sys
import warnings
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
    # Set environment variable for testing
    os.environ['TESTING'] = 'true'
    return app.flask_app

@pytest.fixture
def connexion_app():
    """Create a Connexion app for testing."""
    # Set environment variable for testing
    os.environ['TESTING'] = 'true'
    # Get the Connexion app directly
    connexion_app = app.app
    # Configure the app for testing
    connexion_app.app.config['TESTING'] = True
    return connexion_app

@pytest.fixture
def client(connexion_app):
    """Create a test client for the Flask app underlying the Connexion app."""
    with connexion_app.app.test_client() as client:
        yield client

@pytest.fixture(scope="session", autouse=True)
def cleanup_resources():
    """Clean up resources after all tests have run."""
    # This fixture runs after all tests
    yield
    # Close the vector store service connection
    from services.vector_store import vector_store_service
    vector_store_service.close()
    print("Vector store service connection closed after tests")

    # Close the document service connection
    from services.document_service import document_service
    document_service.close()
    print("Document service connection closed after tests")
