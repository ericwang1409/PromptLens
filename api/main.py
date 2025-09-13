"""Simple FastAPI application."""
from fastapi import FastAPI
from enum import Enum

# Models and Enums
class Provider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    XAI = "xai"


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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
