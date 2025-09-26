# Multi-stage Docker build for Stock AI Trading System
FROM python:3.9-slim as base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libffi-dev \
    libssl-dev \
    wget \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install additional ML/AI packages
RUN pip install --no-cache-dir \
    torch \
    torchvision \
    torchaudio \
    optuna \
    mlflow \
    wandb

# Production stage
FROM base as production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data models logs reports states configs

# Set permissions
RUN chmod +x run_pipeline.py
RUN chmod +x src/api/trading_api.py

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose ports
EXPOSE 8000 8001 8002

# Default command
CMD ["uvicorn", "src.api.trading_api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

# Development stage
FROM base as development

# Install development dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-asyncio \
    pytest-cov \
    black \
    flake8 \
    jupyter \
    ipykernel

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data models logs reports states configs

# Set development mode
ENV ENVIRONMENT=development

# Default command for development
CMD ["uvicorn", "src.api.trading_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
