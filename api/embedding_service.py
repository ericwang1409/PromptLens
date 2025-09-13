"""Embedding service for generating text embeddings using OpenAI."""

import os
from typing import List
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class EmbeddingService:
    """Simple service for generating text embeddings using OpenAI."""

    def __init__(self):
        """Initialize embedding service."""
        self.client = openai.AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.model = "text-embedding-3-small"
        self.dimensions = 1536

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text string.

        Args:
            text: The text to generate embedding for

        Returns:
            List of floats representing the embedding vector (1536 dimensions)

        Raises:
            Exception: If embedding generation fails
        """
        try:
            response = await self.client.embeddings.create(
                model=self.model,
                input=text,
                dimensions=self.dimensions
            )

            return response.data[0].embedding

        except Exception as e:
            raise Exception(f"Embedding generation failed: {str(e)}")


# Global embedding service instance
_embedding_service = None


def get_embedding_service() -> EmbeddingService:
    """Get or create the global embedding service instance."""
    global _embedding_service

    if _embedding_service is None:
        _embedding_service = EmbeddingService()

    return _embedding_service
