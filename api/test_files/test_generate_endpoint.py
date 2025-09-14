"""Simple tests for the /api/generate endpoint."""

import pytest
import os
import uuid
from fastapi.testclient import TestClient
from dotenv import load_dotenv
from main import app

# Load environment variables just like the main app does
load_dotenv()

# Create test client
client = TestClient(app)


class TestGenerateEndpoint:
    """Simple test suite for the /api/generate endpoint."""

    def test_health_endpoint(self):
        """Test that the health endpoint works."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

    def test_root_endpoint(self):
        """Test that the root endpoint works."""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Hello from PromptLens!"}

    @pytest.mark.skipif(not os.getenv("OPENAI_API_KEY") or not os.getenv("PROMPTLENS_API_KEY"),
                       reason="OPENAI_API_KEY or PROMPTLENS_API_KEY not set")
    def test_real_openai_integration(self):
        """Test with real OpenAI API key - integration test."""
        request_data = {
            "prompt": "hello how do you do chatgpt?",
            "provider": "openai",
            "api_key": os.getenv("OPENAI_API_KEY"),
            "temperature": 0.0,  # Low temperature for consistent results
            "max_tokens": 10
        }

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {os.getenv("PROMPTLENS_API_KEY")}',
        }

        response = client.post("/api/generate", json=request_data, headers=headers)

        # This should work with real API key
        if response.status_code == 200:
            data = response.json()
            assert "generated_text" in data
            assert data["provider"] == "openai"
            assert "user_id" in data
            assert "cached" in data
            assert "similarity_score" in data
            print(f"✅ Real API test passed! Response: {data['generated_text'][:50]}...")
        else:
            # If it fails, print the error for debugging
            print(f"❌ Real API test failed with status {response.status_code}")
            print(f"Error: {response.json()}")
            assert False, f"API request failed: {response.json()}"

    @pytest.mark.skipif(not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_API"),
                       reason="Supabase credentials not set")
    def test_database_integration(self):
        """Test database integration if credentials are available."""
        # This is a placeholder for when database is properly configured
        # For now, just check that the environment variables exist
        assert os.getenv("SUPABASE_URL") is not None
        assert os.getenv("SUPABASE_API") is not None
        print("✅ Database credentials are configured")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
