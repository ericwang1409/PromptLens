"""Simple pytest tests for the embedding service."""

import pytest
import os
from dotenv import load_dotenv
from embedding_service import get_embedding_service

# Load environment variables
load_dotenv()


class TestEmbeddingService:
    """Simple test suite for the embedding service."""

    @pytest.fixture
    def embedding_service(self):
        """Get embedding service instance."""
        return get_embedding_service()

    def test_embedding_service_creation(self):
        """Test that embedding service can be created."""
        service = get_embedding_service()
        assert service is not None
        assert service.model == "text-embedding-3-small"
        assert service.dimensions == 1536
        print("✅ Embedding service created successfully")

    @pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="OPENAI_API_KEY not set")
    @pytest.mark.asyncio
    async def test_generate_embedding_basic(self, embedding_service):
        """Test basic embedding generation with real API."""
        test_text = "What is machine learning?"

        print(f"Generating embedding for: '{test_text}'")

        # Generate embedding using real OpenAI API
        embedding = await embedding_service.generate_embedding(test_text)

        # Verify results
        assert embedding is not None
        assert isinstance(embedding, list)
        assert len(embedding) == 1536
        assert all(isinstance(x, (int, float)) for x in embedding)

        print(f"✅ Success! Generated embedding with {len(embedding)} dimensions")
        print(f"First 5 values: {embedding[:5]}")

    @pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="OPENAI_API_KEY not set")
    @pytest.mark.asyncio
    async def test_different_texts_different_embeddings(self, embedding_service):
        """Test that different texts produce different embeddings."""
        text1 = "What is Python programming?"
        text2 = "How is the weather today?"

        # Generate embeddings for different texts
        embedding1 = await embedding_service.generate_embedding(text1)
        embedding2 = await embedding_service.generate_embedding(text2)

        # Verify they are different
        assert embedding1 != embedding2
        assert len(embedding1) == 1536
        assert len(embedding2) == 1536

        print("✅ Different texts produce different embeddings")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
