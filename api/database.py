"""Simple database service for Supabase integration."""

import os
from typing import List, Dict, Any
from supabase import create_client, Client
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class SimilarQuery(BaseModel):
    """Model for similar query results with similarity scores."""
    id: str
    user_id: str
    prompt: str
    response: str
    similarity_score: float
    keywords: List[str] = []


class DatabaseService:
    """Simple service for database operations with vector similarity search."""

    def __init__(self):
        """Initialize database service."""
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_API")  # Using your actual env var name
        )

    def store_query(
        self,
        user_id: str,
        prompt: str,
        response: str,
        prompt_embedding: List[float],
        response_embedding: List[float],
        cached_query_id: str = None,
        model_used: str = 'unknown',
        tokens_used: int = 0,
        response_time_ms: int = 0,
        rating: int = None,
        keywords: List[str] = None
    ) -> str:
        """Store a query with its embeddings and metadata in the database."""
        query_data = {
            'user_id': user_id,
            'prompt': prompt,
            'response': response,
            'prompt_embedding': prompt_embedding,
            'response_embedding': response_embedding,
            'model_used': model_used,
            'tokens_used': tokens_used,
            'response_time_ms': response_time_ms
        }

        # Add cached_query_id if provided
        if cached_query_id:
            query_data['cached_query_id'] = cached_query_id

        # Add rating if provided
        if rating is not None:
            query_data['rating'] = rating

        # Add keywords if provided
        if keywords is not None:
            query_data['keywords'] = keywords

        result = self.supabase.table('queries').insert(query_data).execute()

        return result.data[0]['id']

    def find_similar_queries(
        self,
        prompt_embedding: List[float],
        similarity_threshold: float = 0.7,
        max_results: int = 5
    ) -> List[SimilarQuery]:
        """Find similar queries using vector similarity search."""
        # Use Supabase's RPC function for vector similarity
        result = self.supabase.rpc('match_queries', {
            'query_embedding': prompt_embedding,
            'match_threshold': similarity_threshold,
            'match_count': max_results
        }).execute()

        return [
            SimilarQuery(
                id=row['id'],
                user_id=row['user_id'],
                prompt=row['prompt'],
                response=row['response'],
                similarity_score=row['similarity'],
                keywords=row.get('keywords', [])
            )
            for row in result.data
        ]

# Global database service instance
_db_service = None


def get_database_service() -> DatabaseService:
    """Get or create the global database service instance."""
    global _db_service

    if _db_service is None:
        _db_service = DatabaseService()

    return _db_service
