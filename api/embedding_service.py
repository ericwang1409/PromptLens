"""Embedding service for generating text embeddings using OpenAI.

Adds LLM-based keyword extraction to reduce embedding cost and noise.
"""

import os
from typing import List, Tuple
import openai
import anthropic
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
        # Claude client for keyword extraction
        self.claude_client = anthropic.AsyncAnthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        self.keyword_model = os.getenv("KEYWORD_MODEL", "claude-3-haiku-20240307")

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

    async def extract_keywords(self, text: str, max_keywords: int = 3) -> List[str]:
        """
        Use Claude to extract important keywords/phrases from text.

        Returns a list of 2-3 words (no punctuation), lowercased, unique.
        """
        prompt = (
            "Extract AT MOST "
            f"{max_keywords} concise keywords that best represent the content. "
            "Return them as a JSON array of strings only."
        )
        try:
            resp = await self.claude_client.messages.create(
                model=self.keyword_model,
                max_tokens=256,
                temperature=0.2,
                system="You extract salient keywords.",
                messages=[
                    {"role": "user", "content": f"Text:\n{text}\n\n{prompt}"}
                ]
            )
            content = resp.content[0].text if resp.content else "[]"
            import json
            import re

            keywords = []
            try:
                # Remove any markdown code blocks and parse JSON
                clean_content = re.sub(r'```(?:json)?\n?|```', '', content).strip()
                parsed = json.loads(clean_content)
                if isinstance(parsed, list):
                    keywords = [str(k).strip().lower() for k in parsed if str(k).strip()]
            except Exception:
                # Fallback: return empty list
                keywords = []
            # Normalize: limit token length per phrase, dedupe, keep order
            seen = set()
            normalized: List[str] = []
            for kw in keywords:
                kw = " ".join(kw.split())
                kw = kw.strip(",.;:!?")
                if kw and kw not in seen:
                    seen.add(kw)
                    normalized.append(kw)
            return normalized[: max_keywords]
        except Exception as e:
            # Graceful fallback: return empty to signal caller to use full text
            return []

    async def generate_keyword_embedding(self, text: str, max_keywords: int = 3) -> Tuple[List[float], List[str]]:
        """
        Extract keywords and embed the joined keyword string. Falls back to full text when needed.

        Returns (embedding, keywords_used)
        """
        keywords = await self.extract_keywords(text, max_keywords=max_keywords)
        material = ", ".join(keywords) if keywords else text
        embedding = await self.generate_embedding(material)
        return embedding, keywords


# Global embedding service instance
_embedding_service = None


def get_embedding_service() -> EmbeddingService:
    """Get or create the global embedding service instance."""
    global _embedding_service

    if _embedding_service is None:
        _embedding_service = EmbeddingService()

    return _embedding_service
