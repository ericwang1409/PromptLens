"""Simple test script for the simplified database service."""

import sys
import os
import uuid

# Add parent directory to path so we can import database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_database_service

def test_database():
    """Test basic database operations."""
    print("🧪 Testing simplified database service...")

    # Get database service
    db = get_database_service()

    # Test data
    user_id = str(uuid.uuid4())
    prompt = "What is machine learning?"
    response = "Machine learning is a subset of AI..."

    # Create fake embeddings (1536 dimensions)
    prompt_embedding = [0.1] * 1536
    response_embedding = [0.2] * 1536

    try:
        # Store a query
        print("📝 Storing query...")
        query_id = db.store_query(
            user_id=user_id,
            prompt=prompt,
            response=response,
            prompt_embedding=prompt_embedding,
            response_embedding=response_embedding
        )
        print(f"✅ Stored query: {query_id}")

        # Search for similar queries
        print("🔍 Searching for similar queries...")
        similar = db.find_similar_queries(
            prompt_embedding=prompt_embedding,
            similarity_threshold=0.5,
            max_results=3
        )
        print(f"✅ Found {len(similar)} similar queries")

        for query in similar:
            print(f"   - {query.prompt} (similarity: {query.similarity_score:.3f})")

        print("🎉 All tests passed!")

    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_database()
