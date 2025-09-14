"""Simple FastAPI application."""
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from enum import Enum
import openai
import anthropic
import httpx
import os
from supabase import create_client, Client
import datetime
import time
import random
from dotenv import load_dotenv
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_API", "")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

# Security
security = HTTPBearer()

# Import database and embedding services
from database import get_database_service
from embedding_service import get_embedding_service

# Models and Enums
class Provider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    XAI = "xai"


class GenerateRequest(BaseModel):
    """Request model for text generation."""
    prompt: str = Field(..., description="The prompt to generate text from")
    provider: Provider = Field(..., description="LLM provider to use")
    api_key: str = Field(..., description="API key for the LLM provider (OpenAI, Anthropic, or XAI)")
    # Optional LLM parameters
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(1000, ge=1, le=8000, description="Maximum tokens to generate")
    top_p: Optional[float] = Field(1.0, ge=0.0, le=1.0, description="Top-p sampling parameter")
    frequency_penalty: Optional[float] = Field(0.0, ge=-2.0, le=2.0, description="Frequency penalty")
    presence_penalty: Optional[float] = Field(0.0, ge=-2.0, le=2.0, description="Presence penalty")
    model: Optional[str] = Field(None, description="Specific model to use (optional)")
    keywords: Optional[List[str]] = Field(None, description="List of keywords to associate with this query")


class GenerateResponse(BaseModel):
    """Response model for text generation."""
    generated_text: str
    provider: str
    model_used: str
    usage: dict
    user_id: str
    cached: bool = False
    similarity_score: Optional[float] = None


# Authentication functions
async def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """Verify API key and return user ID."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    token = credentials.credentials

    try:
        # Check if it's a PromptLens API key
        if token.startswith('pl_'):
            result = supabase.table('user_api_keys').select('user_id').eq('api_key', token).eq('is_active', True).single().execute()
            if result.data:
                # Update last_used_at
                supabase.table('user_api_keys').update({'last_used_at': datetime.datetime.utcnow().isoformat()}).eq('api_key', token).execute()
                return result.data['user_id']

        # Otherwise, try to verify as Supabase JWT
        user = supabase.auth.get_user(token)
        if user and user.user:
            return user.user.id

    except Exception:
        pass

    raise HTTPException(status_code=401, detail="Invalid API key")


# LLM Service Classes
class LLMService:
    """Base class for LLM services."""

    @staticmethod
    async def generate_openai(request: GenerateRequest, user_id: str) -> GenerateResponse:
        """Generate text using OpenAI API."""
        try:
            client = openai.AsyncOpenAI(api_key=request.api_key)
            # Default model selection
            model = request.model or "gpt-4o"

            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": request.prompt}],
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                top_p=request.top_p,
                frequency_penalty=request.frequency_penalty,
                presence_penalty=request.presence_penalty
            )

            return GenerateResponse(
                generated_text=response.choices[0].message.content,
                provider="openai",
                model_used=response.model,
                usage=response.usage.model_dump() if response.usage else {},
                user_id=user_id
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"OpenAI API error: {str(e)}")

    @staticmethod
    async def generate_anthropic(request: GenerateRequest, user_id: str) -> GenerateResponse:
        """Generate text using Anthropic API."""
        try:
            client = anthropic.AsyncAnthropic(api_key=request.api_key)
            # Default model selection
            model = request.model or "claude-3-haiku-20240307"

            response = await client.messages.create(
                model=model,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                top_p=request.top_p,
                messages=[{"role": "user", "content": request.prompt}]
            )

            return GenerateResponse(
                generated_text=response.content[0].text,
                provider="anthropic",
                model_used=response.model,
                usage=response.usage.model_dump() if response.usage else {},
                user_id=user_id
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Anthropic API error: {str(e)}")

    @staticmethod
    async def generate_xai(request: GenerateRequest, user_id: str) -> GenerateResponse:
        """Generate text using XAI API."""
        try:
            # XAI uses OpenAI-compatible API
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {request.api_key}",
                    "Content-Type": "application/json"
                }

                # Default model selection - XAI models
                model = request.model or "grok-3"

                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": request.prompt}],
                    "temperature": request.temperature,
                    "max_tokens": request.max_tokens,
                    "top_p": request.top_p,
                    "frequency_penalty": request.frequency_penalty,
                    "presence_penalty": request.presence_penalty,
                    "stream": False
                }

                response = await client.post(
                    "https://api.x.ai/v1/chat/completions",
                    headers=headers,
                    json=payload
                )

                response_text = response.text

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"XAI API error (status {response.status_code}): {response_text}"
                    )

                try:
                    data = response.json()
                except Exception as json_error:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to parse XAI response as JSON: {json_error}. Response: {response_text}"
                    )

                if "choices" not in data or not data["choices"]:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Invalid XAI response format: {data}"
                    )

                return GenerateResponse(
                    generated_text=data["choices"][0]["message"]["content"],
                    provider="xai",
                    model_used=data.get("model", model),
                    usage=data.get("usage", {}),
                    user_id=user_id
                )

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"XAI API unexpected error: {str(e)}")


# Create FastAPI app
app = FastAPI(
    title="PromptLens API",
    version="1.0.0",
    description="API for PromptLens - LLM Data Insights Platform"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Hello from PromptLens!"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/api/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest, user_id: str = Depends(verify_api_key)):
    """
    Generate text using the specified LLM provider with embedding-based caching.

    This endpoint:
    1. Creates an embedding for the input prompt
    2. Searches for similar prompts in the database
    3. If a close match is found (similarity > 0.95), returns the cached response
    4. If no close match, queries the LLM provider
    5. Stores the new prompt, response, and embeddings in the database

    Args:
        request: Generation request with prompt, provider, and parameters
        user_id: Authenticated user ID from API key
    Returns:
        Generated text with metadata, including cache status

    Raises:
        HTTPException: If generation fails or provider is unsupported
    """
    try:
        start_time = time.time()
        # Get services
        db_service = get_database_service()
        embedding_service = get_embedding_service()

        # Step 1: Generate embedding for the prompt
        prompt_embedding = await embedding_service.generate_embedding(request.prompt)

        # Step 2: Search for similar queries in database
        similar_queries = db_service.find_similar_queries(
            prompt_embedding=prompt_embedding,
            similarity_threshold=0.7,  # Lower threshold for search
            max_results=1
        )

        # Generate a random rating between 2-5 because we're too lazy to implement a real rating system
        rating = random.randint(2, 5)

        # Step 3: Check if we have a very close match (>95% similarity)
        if similar_queries and similar_queries[0].similarity_score > 0.95:
            # Use cached response but still store this query in database
            cached_query = similar_queries[0]

            # Generate embedding for the cached response to store with this query
            response_embedding = await embedding_service.generate_embedding(cached_query.response)

            end_time = time.time()
            response_time_ms = int((end_time - start_time) * 1000)  # Convert to milliseconds

            # Store this query in database even though we're using cached response
            # Link it to the original cached query
            db_service.store_query(
                user_id=user_id,
                prompt=request.prompt,
                response=cached_query.response,
                prompt_embedding=prompt_embedding,
                response_embedding=response_embedding,
                cached_query_id=cached_query.id,
                model_used="cached",
                tokens_used=0,  # Cached responses use 0 tokens
                response_time_ms=response_time_ms,  # Cached responses have minimal response time
                rating=rating,
                keywords=request.keywords
            )

            return GenerateResponse(
                generated_text=cached_query.response,
                provider=request.provider.value,
                model_used="cached",
                usage={"cached": True},
                user_id=user_id,
                cached=True,
                similarity_score=cached_query.similarity_score
            )

        # Step 4: No close match found, query the LLM provider
        llm_response = None
        match request.provider:
            case Provider.OPENAI:
                llm_response = await LLMService.generate_openai(request, user_id)
            case Provider.ANTHROPIC:
                llm_response = await LLMService.generate_anthropic(request, user_id)
            case Provider.XAI:
                llm_response = await LLMService.generate_xai(request, user_id)

        end_time = time.time()
        response_time_ms = int((end_time - start_time) * 1000)  # Convert to milliseconds

        if llm_response is None:
            raise HTTPException(status_code=500, detail="Failed to generate response")

        # Extract token usage from the response
        tokens_used = 0
        if isinstance(llm_response.usage, dict):
            # For OpenAI and XAI, usage typically has 'total_tokens'
            tokens_used = llm_response.usage.get('total_tokens', 0)
            # If total_tokens not available, sum prompt_tokens and completion_tokens
            if tokens_used == 0:
                tokens_used = llm_response.usage.get('prompt_tokens', 0) + llm_response.usage.get('completion_tokens', 0)
            # For Anthropic, usage has 'input_tokens' and 'output_tokens'
            if tokens_used == 0:
                tokens_used = llm_response.usage.get('input_tokens', 0) + llm_response.usage.get('output_tokens', 0)

        # Step 5: Generate embedding for the response
        response_embedding = await embedding_service.generate_embedding(llm_response.generated_text)

        # Step 6: Store in database
        db_service.store_query(
            user_id=user_id,
            prompt=request.prompt,
            response=llm_response.generated_text,
            prompt_embedding=prompt_embedding,
            response_embedding=response_embedding,
            model_used=llm_response.model_used,
            tokens_used=tokens_used,
            response_time_ms=response_time_ms,
            rating=rating,
            keywords=request.keywords
        )

        # Return the fresh response
        return GenerateResponse(
            generated_text=llm_response.generated_text,
            provider=llm_response.provider,
            model_used=llm_response.model_used,
            usage=llm_response.usage,
            user_id=llm_response.user_id,
            cached=False,
            similarity_score=None
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
