import pytest
from flask import json
from app import flask_app as app

def test_health_endpoint():
    """Test that health endpoint returns 200 status code"""
    with app.test_client() as client:
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'UP'
        assert 'timestamp' in data
        assert data['service'] == 'genai-service'
