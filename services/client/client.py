#!/usr/bin/env python3
"""
🌐 CLIENT SERVICE
Frontend web application for AI Trading System
Handles UI, user authentication, and dashboard
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
import aiohttp
import json

# Add shared utilities
sys.path.append(str(Path(__file__).parent.parent / "shared"))
from utils import setup_logging, get_config

class ClientService:
    """Client service for AI Trading System"""
    
    def __init__(self):
        self.logger = setup_logging("client")
        self.config = get_config("client")
        
        # Service endpoints
        self.server_url = os.getenv("SERVER_URL", "http://server:8001")
        self.ai_model_url = os.getenv("AI_MODEL_URL", "http://ai-model:8002")
        
        self.logger.info("🌐 Client Service Initialized")
        
    async def call_server_api(self, endpoint: str, method: str = "GET", data: dict = None):
        """Call server API"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.server_url}{endpoint}"
                
                if method == "GET":
                    async with session.get(url) as response:
                        return await response.json()
                elif method == "POST":
                    async with session.post(url, json=data) as response:
                        return await response.json()
                        
        except Exception as e:
            self.logger.error(f"Server API call failed: {e}")
            return {"error": str(e)}
    
    async def get_ai_predictions(self, instruments: list):
        """Get AI predictions from AI model service"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.ai_model_url}/predict"
                async with session.post(url, json={"instruments": instruments}) as response:
                    return await response.json()
                    
        except Exception as e:
            self.logger.error(f"AI model call failed: {e}")
            return {"error": str(e)}

# Initialize client service
client_service = ClientService()

# Create FastAPI app
app = FastAPI(
    title="AI Trading System - Client",
    description="Frontend web application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Main dashboard"""
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "client",
        "status": "healthy",
        "server_connection": "checking..."
    }

@app.get("/api/system/status")
async def get_system_status():
    """Get system status from server"""
    return await client_service.call_server_api("/api/system/status")

@app.post("/api/trading/start")
async def start_trading(request: dict):
    """Start trading session"""
    return await client_service.call_server_api("/api/trading/start", "POST", request)

@app.post("/api/trading/stop")
async def stop_trading(request: dict):
    """Stop trading session"""
    return await client_service.call_server_api("/api/trading/stop", "POST", request)

@app.get("/api/portfolio/{user_id}")
async def get_portfolio(user_id: str):
    """Get user portfolio"""
    return await client_service.call_server_api(f"/api/portfolio/{user_id}")

@app.get("/api/signals")
async def get_trading_signals():
    """Get AI trading signals"""
    # Get instruments from server
    instruments_response = await client_service.call_server_api("/api/instruments")
    
    if "error" not in instruments_response:
        instruments = instruments_response.get("instruments", [])[:10]  # Limit for display
        
        # Get AI predictions
        predictions = await client_service.get_ai_predictions(instruments)
        return predictions
    
    return instruments_response

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
