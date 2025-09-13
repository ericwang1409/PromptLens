"""Simple FastAPI application."""
from typing import Optional
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
from dotenv import load_dotenv
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

# Security
security = HTTPBearer()

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
    provider_api_key: str = Field(..., description="API key for the LLM provider (OpenAI, Anthropic, or XAI)")
    
    # Optional LLM parameters
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(1000, ge=1, le=8000, description="Maximum tokens to generate")
    top_p: Optional[float] = Field(1.0, ge=0.0, le=1.0, description="Top-p sampling parameter")
    frequency_penalty: Optional[float] = Field(0.0, ge=-2.0, le=2.0, description="Frequency penalty")
    presence_penalty: Optional[float] = Field(0.0, ge=-2.0, le=2.0, description="Presence penalty")
    model: Optional[str] = Field(None, description="Specific model to use (optional)")


class GenerateResponse(BaseModel):
    """Response model for text generation."""
    generated_text: str
    provider: str
    model_used: str
    usage: dict
    user_id: str


# Authentication functions
async def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """Verify API key and return user ID."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    token = credentials.credentials
    
    try:
        # Check if it's a PromptLens API key
        print('trying')
        if token.startswith('pl_'):
            print('here')
            print(supabase.table('user_api_keys'))
            result = supabase.table('user_api_keys').select('user_id').eq('api_key', token).eq('is_active', True).single().execute()
            print(result.data)
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
            client = openai.AsyncOpenAI(api_key=request.provider_api_key)
            
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
            client = anthropic.AsyncAnthropic(api_key=request.provider_api_key)
            
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
                    "Authorization": f"Bearer {request.provider_api_key}",
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
    Generate text using the specified LLM provider.
    
    Args:
        request: Generation request with prompt, provider, and parameters
        user_id: Authenticated user ID from API key
        
    Returns:
        Generated text with metadata
        
    Raises:
        HTTPException: If generation fails or provider is unsupported
    """
    try:
        match request.provider:
            case Provider.OPENAI:
                return await LLMService.generate_openai(request, user_id)
            case Provider.ANTHROPIC:
                return await LLMService.generate_anthropic(request, user_id)
            case Provider.XAI:
                return await LLMService.generate_xai(request, user_id)

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
