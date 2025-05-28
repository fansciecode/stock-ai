# IBCM-ai Microservice

This microservice provides AI-powered features for the IBCM platform, including text generation, recommendations, and search.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
2. Run the service:
   ```
   uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```

## Features (Planned)
- Event description generation
- Personalized recommendations
- Geo-aware, semantic search

## Configuration
- Edit `config.py` for MongoDB and other settings.

## Extending
- Add new endpoints in `main.py` and implement logic in the `ai/` modules. 