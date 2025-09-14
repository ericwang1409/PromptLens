"""Simple pytest tests for the database service."""

import pytest
import uuid
import os
import random
from dotenv import load_dotenv
from database import get_database_service

# Load environment variables
load_dotenv()


class TestDatabaseService:
    """Simple test suite for the database service."""

    @pytest.fixture
    def db_service(self):
        """Get database service instance."""
        return get_database_service()

    def test_database_service_creation(self):
        """Test that database service can be created."""
        db = get_database_service()
        assert db is not None
        print("✅ Database service created successfully")

    @pytest.mark.skipif(not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_API"),
                       reason="Supabase credentials not set")
    def test_store_and_find_query(self, db_service):
        """Test storing a query and finding it with similarity search."""
        # Test data
        user_id = str(uuid.uuid4())
        prompt = "What is machine learning?"
        response = "Machine learning is a subset of AI..."
        prompt_embedding = [0.1] * 1536
        response_embedding = [0.2] * 1536
        model_used = "test"
        tokens_used = 100
        response_time_ms = 100

        # Store a query in real database
        query_id = db_service.store_query(
            user_id=user_id,
            prompt=prompt,
            response=response,
            prompt_embedding=prompt_embedding,
            response_embedding=response_embedding,
            model_used=model_used,
            tokens_used=tokens_used,
            response_time_ms=response_time_ms,
            rating=random.randint(2, 5)  # Test rating
        )

        # Verify we got an ID back
        assert query_id is not None
        print(f"✅ Stored query: {query_id}")

        # Search for similar queries using the same embedding
        similar = db_service.find_similar_queries(
            prompt_embedding=prompt_embedding,
            similarity_threshold=0.5,
            max_results=3
        )

        # Should find at least the query we just stored
        assert len(similar) >= 1
        assert similar[0].similarity_score > 0.9

        print(f"✅ Found {len(similar)} similar queries")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
