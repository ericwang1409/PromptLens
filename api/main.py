"""Simple FastAPI application."""

import os
import base64
from datetime import datetime
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from enum import Enum
from cryptography.fernet import Fernet
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
class Config:
    """Configuration management."""
    
    def __init__(self):
        # Supabase configuration (replace with your actual values)
        self.supabase_url = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY", "your-supabase-anon-key")
        
        # Encryption key (in production, store this securely)
        encryption_key = os.getenv("ENCRYPTION_KEY")
        if not encryption_key:
            # Generate a new key if none exists (for demo purposes)
            encryption_key = Fernet.generate_key().decode()
            print(f"Generated new encryption key: {encryption_key}")
            print("Store this key securely in your ENCRYPTION_KEY environment variable!")
        
        self.fernet = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
        
        # Initialize Supabase client
        try:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        except Exception as e:
            print(f"Warning: Could not initialize Supabase client: {e}")
            self.supabase = None


config = Config()


# Models and Enums
class Provider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    XAI = "xai"


class APIKeyRequest(BaseModel):
    """Request model for API key upload."""
    provider: Provider
    api_key: str


class APIKeyResponse(BaseModel):
    """Response model for API key operations."""
    message: str
    provider: str


class APIKeyRecord(BaseModel):
    """Database record model for API keys."""
    id: Optional[int] = None
    provider: str
    encrypted_key: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# Database operations
class APIKeyService:
    """Service for managing encrypted API keys in Supabase."""
    
    def __init__(self, supabase_client: Optional[Client], fernet: Fernet):
        self.supabase = supabase_client
        self.fernet = fernet
        self.table_name = "api_keys"
        
        # Fallback to in-memory storage if Supabase is not available
        self.fallback_storage: Dict[str, str] = {}
    
    def encrypt_key(self, api_key: str) -> str:
        """Encrypt an API key."""
        return self.fernet.encrypt(api_key.encode()).decode()
    
    def decrypt_key(self, encrypted_key: str) -> str:
        """Decrypt an API key."""
        return self.fernet.decrypt(encrypted_key.encode()).decode()
    
    async def store_api_key(self, provider: str, api_key: str) -> APIKeyResponse:
        """Store an encrypted API key."""
        encrypted_key = self.encrypt_key(api_key)
        
        if self.supabase:
            try:
                # Check if key already exists
                existing = self.supabase.table(self.table_name).select("id").eq("provider", provider).execute()
                
                if existing.data:
                    # Update existing key
                    result = self.supabase.table(self.table_name).update({
                        "encrypted_key": encrypted_key,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("provider", provider).execute()
                else:
                    # Insert new key
                    result = self.supabase.table(self.table_name).insert({
                        "provider": provider,
                        "encrypted_key": encrypted_key,
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }).execute()
                
                return APIKeyResponse(
                    message=f"API key successfully stored for {provider}",
                    provider=provider
                )
            except Exception as e:
                print(f"Supabase error: {e}, falling back to in-memory storage")
                # Fall back to in-memory storage
                self.fallback_storage[provider] = encrypted_key
        else:
            # Use fallback storage
            self.fallback_storage[provider] = encrypted_key
        
        return APIKeyResponse(
            message=f"API key successfully stored for {provider} (using fallback storage)",
            provider=provider
        )
    
    async def get_api_key(self, provider: str) -> Optional[str]:
        """Retrieve and decrypt an API key."""
        if self.supabase:
            try:
                result = self.supabase.table(self.table_name).select("encrypted_key").eq("provider", provider).execute()
                if result.data:
                    encrypted_key = result.data[0]["encrypted_key"]
                    return self.decrypt_key(encrypted_key)
            except Exception as e:
                print(f"Supabase error: {e}, checking fallback storage")
        
        # Check fallback storage
        encrypted_key = self.fallback_storage.get(provider)
        if encrypted_key:
            return self.decrypt_key(encrypted_key)
        
        return None
    
    async def list_providers(self) -> Dict[str, int]:
        """List all providers with stored keys."""
        providers = []
        
        if self.supabase:
            try:
                result = self.supabase.table(self.table_name).select("provider").execute()
                providers.extend([row["provider"] for row in result.data])
            except Exception as e:
                print(f"Supabase error: {e}, checking fallback storage")
        
        # Add fallback storage providers
        providers.extend(list(self.fallback_storage.keys()))
        
        # Remove duplicates
        unique_providers = list(set(providers))
        
        return {
            "stored_providers": unique_providers,
            "total_count": len(unique_providers)
        }
    
    async def delete_api_key(self, provider: str) -> bool:
        """Delete an API key."""
        deleted = False
        
        if self.supabase:
            try:
                result = self.supabase.table(self.table_name).delete().eq("provider", provider).execute()
                if result.data:
                    deleted = True
            except Exception as e:
                print(f"Supabase error: {e}, checking fallback storage")
        
        # Also check fallback storage
        if provider in self.fallback_storage:
            del self.fallback_storage[provider]
            deleted = True
        
        return deleted


# Initialize service
api_key_service = APIKeyService(config.supabase, config.fernet)

# Create FastAPI app
app = FastAPI(
    title="Simple API",
    version="1.0.0",
    description="A simple FastAPI template"
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Hello from PromptLens!"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.post("/api/keys", response_model=APIKeyResponse)
async def upload_api_key(request: APIKeyRequest):
    """
    Upload an encrypted API key for a specific LLM provider to Supabase.
    
    Args:
        request: Contains the provider name and API key
        
    Returns:
        Confirmation message with provider name
        
    Raises:
        HTTPException: If the API key is invalid or empty
    """
    # Basic validation
    if not request.api_key or not request.api_key.strip():
        raise HTTPException(
            status_code=400,
            detail="API key cannot be empty"
        )
    
    try:
        # Store the encrypted API key
        result = await api_key_service.store_api_key(
            request.provider.value, 
            request.api_key.strip()
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store API key: {str(e)}"
        )


@app.get("/api/keys")
async def get_stored_providers():
    """
    Get list of providers that have encrypted API keys stored in Supabase.
    
    Returns:
        List of provider names that have keys stored
    """
    try:
        return await api_key_service.list_providers()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve providers: {str(e)}"
        )


@app.get("/api/keys/{provider}/decrypt")
async def get_decrypted_key(provider: Provider):
    """
    Retrieve and decrypt an API key for a specific provider.
    
    CAUTION: This endpoint returns the decrypted API key.
    In production, this should be heavily protected or removed entirely.
    
    Args:
        provider: The provider whose API key should be retrieved
        
    Returns:
        The decrypted API key
        
    Raises:
        HTTPException: If no API key exists for the provider
    """
    try:
        decrypted_key = await api_key_service.get_api_key(provider.value)
        if not decrypted_key:
            raise HTTPException(
                status_code=404,
                detail=f"No API key found for provider: {provider.value}"
            )
        
        return {
            "provider": provider.value,
            "api_key": decrypted_key,
            "warning": "This endpoint should be secured or removed in production"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to decrypt API key: {str(e)}"
        )


@app.delete("/api/keys/{provider}")
async def delete_api_key(provider: Provider):
    """
    Delete an encrypted API key for a specific provider from Supabase.
    
    Args:
        provider: The provider whose API key should be deleted
        
    Returns:
        Confirmation message
        
    Raises:
        HTTPException: If no API key exists for the provider
    """
    try:
        deleted = await api_key_service.delete_api_key(provider.value)
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail=f"No API key found for provider: {provider.value}"
            )
        
        return APIKeyResponse(
            message=f"API key deleted for {provider.value}",
            provider=provider.value
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete API key: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
