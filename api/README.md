# Simple API

A straightforward FastAPI template for building APIs quickly.

## Features

- ⚡ FastAPI framework
- 📝 Auto-generated documentation
- 🚀 Ready to run
- 🔧 Easy to extend

## Quick Start

### Installation

1. **Install dependencies with uv:**

   ```bash
   uv sync --no-editable
   ```

   **Or with pip:**

   ```bash
   pip install fastapi "uvicorn[standard]"
   ```

### Run the API

```bash
# With uv
uv run uvicorn main:app --reload

# Or run directly with Python
uv run python main.py

# Traditional way (if not using uv)
uvicorn main:app --reload
python main.py
```

### API Endpoints

- **Root**: `GET /` - Welcome message
- **Health**: `GET /health` - Health check
- **Hello**: `GET /api/hello` - Simple greeting
- **Get Item**: `GET /api/items/{item_id}` - Get item by ID
- **Create Item**: `POST /api/items` - Create new item
- **Get Users**: `GET /api/users` - Get all users

### Documentation

Once running, visit:

- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

### Add New Endpoints

Simply add new functions to `main.py`:

```python
@app.get("/api/new-endpoint")
async def new_endpoint():
    return {"message": "New endpoint"}
```

### Example Usage

```bash
# Test the API
curl http://localhost:8000/
curl http://localhost:8000/api/hello
curl http://localhost:8000/api/items/123
curl -X POST http://localhost:8000/api/items -H "Content-Type: application/json" -d '{"name": "test"}'
```

## Project Structure

```
api/
├── main.py             # FastAPI application
├── pyproject.toml      # Dependencies and project config
└── README.md          # This file
```

## Using uv

This project is configured to work with [uv](https://github.com/astral-sh/uv), a fast Python package manager:

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sync dependencies
uv sync

# Run the app
uv run uvicorn main:app --reload

# Add new dependencies
uv add package-name

# Add dev dependencies
uv add --dev pytest
```

That's it! Simple and ready to use.
