"""Simple test for embedding service."""

import asyncio
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from embedding_service import get_embedding_service


async def test_embedding():
    """Test embedding generation with a simple prompt."""

    # Get the embedding service
    embedding_service = get_embedding_service()

    # Test text
    test_text = "Hello, this is a test prompt for generating embeddings."

    print(f"Generating embedding for: '{test_text}'")

    try:
        # Generate embedding
        embedding = await embedding_service.generate_embedding(test_text)

        # Verify results
        print(f"✅ Success! Generated embedding with {len(embedding)} dimensions")
        print(f"First 5 values: {embedding[:5]}")
        print(f"Last 5 values: {embedding[-5:]}")

        # Verify it's the expected length
        if len(embedding) == 1536:
            print("✅ Correct embedding dimension (1536)")
        else:
            print(f"❌ Wrong embedding dimension. Expected 1536, got {len(embedding)}")

    except Exception as e:
        print(f"❌ Error generating embedding: {e}")


if __name__ == "__main__":
    # Run the test
    asyncio.run(test_embedding())
