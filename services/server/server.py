#!/usr/bin/env python3
"""
🔧 SERVER SERVICE
Backend API server for AI Trading System
Handles business logic, data management, and trading operations
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import aiohttp
import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Any

# Add shared utilities and core modules
sys.path.append(str(Path(__file__).parent.parent / "shared"))
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from utils import setup_logging, get_config
from services.instrument_manager import InstrumentManager
from execution.order_gateway import OrderGateway
from data.realtime_streamer import RealTimeDataStreamer

class ServerService:
    """Server service for AI Trading System"""
    
    def __init__(self):
        self.logger = setup_logging("server")
        self.config = get_config("server")
        
        # Initialize core components
        self.instrument_manager = InstrumentManager()
        self.order_gateway = OrderGateway()
        self.data_streamer = RealTimeDataStreamer()
        
        # Service endpoints
        self.ai_model_url = os.getenv("AI_MODEL_URL", "http://ai-model:8002")
        
        # Active sessions
        self.active_sessions = {}
        self.system_metrics = {
            "total_instruments": 0,
            "active_sessions": 0,
            "total_trades": 0,
            "system_uptime": datetime.now()
        }
        
        self.logger.info("🔧 Server Service Initialized")
        
    async def initialize(self):
        """Initialize server components"""
        try:
            # Load instruments
            instruments = self.instrument_manager.get_instruments()
            self.system_metrics["total_instruments"] = len(instruments)
            
            # Initialize data streaming
            await self.data_streamer.start_all_streams()
            
            self.logger.info(f"✅ Server initialized with {len(instruments):,} instruments")
            
        except Exception as e:
            self.logger.error(f"Server initialization failed: {e}")
            raise
    
    async def call_ai_model(self, endpoint: str, data: dict = None):
        """Call AI model service"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.ai_model_url}{endpoint}"
                async with session.post(url, json=data) as response:
                    return await response.json()
                    
        except Exception as e:
            self.logger.error(f"AI model call failed: {e}")
            return {"error": str(e)}
    
    async def start_trading_session(self, user_id: str, config: dict):
        """Start a new trading session"""
        session_id = f"session_{user_id}_{int(datetime.now().timestamp())}"
        
        # Get instruments for trading
        instruments = self.instrument_manager.get_instruments(limit=100)
        
        # Get AI predictions for instruments
        ai_response = await self.call_ai_model("/predict", {
            "instruments": [{"symbol": inst["symbol"]} for inst in instruments[:20]]
        })
        
        if "error" not in ai_response:
            self.active_sessions[session_id] = {
                "user_id": user_id,
                "start_time": datetime.now(),
                "config": config,
                "status": "active",
                "instruments": instruments,
                "ai_predictions": ai_response
            }
            
            self.system_metrics["active_sessions"] = len(self.active_sessions)
            
            # Start background trading task
            asyncio.create_task(self._execute_trading_session(session_id))
            
            self.logger.info(f"🚀 Started trading session {session_id} for user {user_id}")
            return {"success": True, "session_id": session_id}
        
        return {"success": False, "error": "AI model unavailable"}
    
    async def _execute_trading_session(self, session_id: str):
        """Execute trading session in background"""
        session = self.active_sessions.get(session_id)
        if not session:
            return
        
        while session["status"] == "active":
            try:
                # Get fresh AI predictions
                instruments = session["instruments"][:10]  # Process batch
                
                ai_response = await self.call_ai_model("/predict", {
                    "instruments": [{"symbol": inst["symbol"]} for inst in instruments]
                })
                
                if "predictions" in ai_response:
                    predictions = ai_response["predictions"]
                    
                    # Execute trades based on AI predictions
                    for prediction in predictions:
                        if prediction.get("confidence", 0) > 0.8:  # High confidence only
                            await self._execute_trade(session_id, prediction)
                
                # Wait before next cycle
                await asyncio.sleep(30)
                
            except Exception as e:
                self.logger.error(f"Trading session {session_id} error: {e}")
                await asyncio.sleep(60)
    
    async def _execute_trade(self, session_id: str, prediction: dict):
        """Execute a trade based on AI prediction"""
        try:
            # Simulate trade execution
            trade_result = {
                "session_id": session_id,
                "symbol": prediction["symbol"],
                "action": prediction["action"],
                "confidence": prediction["confidence"],
                "timestamp": datetime.now().isoformat(),
                "status": "executed"
            }
            
            self.system_metrics["total_trades"] += 1
            
            self.logger.info(f"💰 Executed trade: {prediction['symbol']} {prediction['action']} (Confidence: {prediction['confidence']:.1%})")
            
            return trade_result
            
        except Exception as e:
            self.logger.error(f"Trade execution failed: {e}")
            return {"error": str(e)}

# Initialize server service
server_service = ServerService()

# Create FastAPI app
app = FastAPI(
    title="AI Trading System - Server",
    description="Backend API server",
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

@app.on_event("startup")
async def startup_event():
    await server_service.initialize()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "server",
        "status": "healthy",
        "ai_model_connection": "checking...",
        "instruments_loaded": server_service.system_metrics["total_instruments"]
    }

@app.get("/api/system/status")
async def get_system_status():
    """Get system status"""
    return {
        "status": "operational",
        "metrics": server_service.system_metrics,
        "active_sessions": len(server_service.active_sessions)
    }

@app.get("/api/instruments")
async def get_instruments():
    """Get available instruments"""
    instruments = server_service.instrument_manager.get_instruments(limit=100)
    return {
        "instruments": instruments,
        "total_count": server_service.system_metrics["total_instruments"]
    }

@app.post("/api/trading/start")
async def start_trading(request: dict):
    """Start trading session"""
    user_id = request.get("user_id", "demo_user")
    config = request.get("config", {})
    
    result = await server_service.start_trading_session(user_id, config)
    return result

@app.post("/api/trading/stop")
async def stop_trading(request: dict):
    """Stop trading session"""
    session_id = request.get("session_id")
    
    if session_id in server_service.active_sessions:
        server_service.active_sessions[session_id]["status"] = "stopped"
        server_service.system_metrics["active_sessions"] = len([
            s for s in server_service.active_sessions.values() 
            if s["status"] == "active"
        ])
        
        return {"success": True, "message": f"Session {session_id} stopped"}
    
    return {"success": False, "error": "Session not found"}

@app.get("/api/portfolio/{user_id}")
async def get_portfolio(user_id: str):
    """Get user portfolio"""
    # Find user's active sessions
    user_sessions = [
        s for s in server_service.active_sessions.values() 
        if s["user_id"] == user_id
    ]
    
    portfolio = {
        "user_id": user_id,
        "active_sessions": len(user_sessions),
        "total_trades": server_service.system_metrics["total_trades"],
        "status": "active" if user_sessions else "inactive"
    }
    
    return portfolio

@app.get("/api/trading/sessions")
async def get_trading_sessions():
    """Get all active trading sessions"""
    return {
        "active_sessions": server_service.active_sessions,
        "total_count": len(server_service.active_sessions)
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
