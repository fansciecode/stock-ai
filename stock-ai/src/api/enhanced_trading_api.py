#!/usr/bin/env python3
"""
🚀 ENHANCED TRADING API - MULTI-USER SUPPORT
Supports multiple users, live trading, and comprehensive exchange integration
"""

import os
import sys
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from services.user_management import user_manager, session_manager, get_user_by_session
from services.instrument_manager import InstrumentManager
from trading.enhanced_exchange_connector import EnhancedExchangeConnector

# Initialize FastAPI app
app = FastAPI(
    title="AI Trading System API",
    description="Enhanced multi-user trading API with live exchange integration",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
instrument_manager = InstrumentManager()
exchange_connector = EnhancedExchangeConnector()

# Pydantic models
class UserCreate(BaseModel):
    email: str
    password: str
    subscription_tier: str = "basic"

class UserLogin(BaseModel):
    email: str
    password: str

class ApiKeyAdd(BaseModel):
    exchange: str
    api_key: str
    secret_key: str
    passphrase: Optional[str] = None
    is_testnet: bool = True

class OrderPlace(BaseModel):
    symbol: str
    side: str  # 'buy' or 'sell'
    quantity: float
    price: Optional[float] = None
    order_type: str = 'market'  # 'market' or 'limit'
    exchange: str

class InstrumentSearch(BaseModel):
    search_term: str
    exchange: Optional[str] = None
    asset_class: Optional[str] = None
    limit: int = 50

# Authentication dependency
async def get_current_user(authorization: str = Header(None)) -> str:
    """Get current user from authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    user_id = get_user_by_session(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return user_id

# User management endpoints
@app.post("/api/v2/auth/register")
async def register_user(user_data: UserCreate):
    """Register a new user"""
    user_id, success = user_manager.create_user(
        user_data.email, 
        user_data.password, 
        user_data.subscription_tier
    )
    
    if success:
        # Create session token
        token = session_manager.create_session(user_id)
        
        return {
            "success": True,
            "user_id": user_id,
            "token": token,
            "message": "User created successfully"
        }
    else:
        raise HTTPException(status_code=400, detail="User already exists or registration failed")

@app.post("/api/v2/auth/login")
async def login_user(login_data: UserLogin):
    """Login user and create session"""
    user_id = user_manager.authenticate_user(login_data.email, login_data.password)
    
    if user_id:
        token = session_manager.create_session(user_id)
        stats = user_manager.get_user_stats(user_id)
        
        return {
            "success": True,
            "token": token,
            "user": stats,
            "message": "Login successful"
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/v2/auth/logout")
async def logout_user(authorization: str = Header(None)):
    """Logout user and destroy session"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        session_manager.destroy_session(token)
    
    return {"success": True, "message": "Logout successful"}

# User profile endpoints
@app.get("/api/v2/user/profile")
async def get_user_profile(user_id: str = Depends(get_current_user)):
    """Get user profile and statistics"""
    stats = user_manager.get_user_stats(user_id)
    return {"success": True, "user": stats}

@app.post("/api/v2/user/api-keys")
async def add_user_api_keys(api_key_data: ApiKeyAdd, user_id: str = Depends(get_current_user)):
    """Add API keys for user"""
    success = user_manager.add_api_keys(
        user_id,
        api_key_data.exchange,
        api_key_data.api_key,
        api_key_data.secret_key,
        api_key_data.passphrase,
        api_key_data.is_testnet
    )
    
    if success:
        return {"success": True, "message": "API keys added successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to add API keys")

@app.get("/api/v2/user/api-keys")
async def get_user_api_keys(user_id: str = Depends(get_current_user)):
    """Get user's API keys (without sensitive data)"""
    keys = user_manager.get_api_keys(user_id)
    
    # Remove sensitive data before returning
    safe_keys = []
    for key in keys:
        safe_keys.append({
            'key_id': key['key_id'],
            'exchange': key['exchange'],
            'is_testnet': key['is_testnet'],
            'api_key_preview': key['api_key'][:8] + "..." if key['api_key'] else None
        })
    
    return {"success": True, "api_keys": safe_keys}

# Exchange connection endpoints
@app.post("/api/v2/exchanges/connect/{exchange}")
async def connect_exchange(exchange: str, user_id: str = Depends(get_current_user)):
    """Connect to an exchange using user's API keys"""
    api_keys = user_manager.get_api_keys(user_id, exchange)
    
    if not api_keys:
        raise HTTPException(status_code=400, detail=f"No API keys found for {exchange}")
    
    key_data = api_keys[0]  # Use first available key
    
    success = False
    if exchange.lower() == 'zerodha':
        success = exchange_connector.connect_zerodha(
            key_data['api_key'], 
            key_data['secret_key']
        )
    elif exchange.lower() == 'upstox':
        success = exchange_connector.connect_upstox(
            key_data['api_key'], 
            key_data['secret_key']
        )
    elif exchange.lower() == 'binance':
        success = exchange_connector.connect_binance(
            key_data['api_key'], 
            key_data['secret_key'],
            key_data['is_testnet']
        )
    elif exchange.lower() == 'nse':
        success = exchange_connector.connect_nse_live()
    
    if success:
        user_manager.update_last_api_usage(user_id, exchange)
        return {"success": True, "message": f"Connected to {exchange} successfully"}
    else:
        raise HTTPException(status_code=400, detail=f"Failed to connect to {exchange}")

@app.get("/api/v2/exchanges/status")
async def get_exchange_status(user_id: str = Depends(get_current_user)):
    """Get connection status for all exchanges"""
    status = exchange_connector.get_connection_status()
    return {"success": True, "exchanges": status}

# Balance and positions endpoints
@app.get("/api/v2/account/balance/{exchange}")
async def get_account_balance(exchange: str, user_id: str = Depends(get_current_user)):
    """Get account balance from exchange"""
    balance = exchange_connector.get_balance(exchange)
    
    if balance:
        return {"success": True, "balance": balance}
    else:
        raise HTTPException(status_code=400, detail=f"Failed to get balance from {exchange}")

@app.get("/api/v2/account/positions/{exchange}")
async def get_account_positions(exchange: str, user_id: str = Depends(get_current_user)):
    """Get current positions from exchange"""
    positions = exchange_connector.get_positions(exchange)
    
    # Convert positions to dict format
    positions_data = []
    for pos in positions:
        positions_data.append({
            'symbol': pos.symbol,
            'quantity': pos.quantity,
            'average_price': pos.average_price,
            'current_price': pos.current_price,
            'pnl': pos.pnl,
            'side': pos.side
        })
    
    return {"success": True, "positions": positions_data}

# Trading endpoints
@app.post("/api/v2/trading/order")
async def place_order(order_data: OrderPlace, user_id: str = Depends(get_current_user)):
    """Place a trading order"""
    # Check user permissions
    permissions = user_manager.get_user_permissions(user_id)
    
    if not permissions['can_live_trade'] and order_data.exchange != 'paper':
        raise HTTPException(status_code=403, detail="Live trading not allowed for this subscription tier")
    
    # Check position size limit
    if order_data.quantity * (order_data.price or 0) > permissions['max_position_size']:
        raise HTTPException(status_code=403, detail="Order size exceeds maximum allowed position size")
    
    order_id = exchange_connector.place_order(
        order_data.exchange,
        order_data.symbol,
        order_data.side,
        order_data.quantity,
        order_data.price,
        order_data.order_type
    )
    
    if order_id:
        return {"success": True, "order_id": order_id, "message": "Order placed successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to place order")

@app.delete("/api/v2/trading/order/{exchange}/{order_id}")
async def cancel_order(exchange: str, order_id: str, user_id: str = Depends(get_current_user)):
    """Cancel a trading order"""
    success = exchange_connector.cancel_order(exchange, order_id)
    
    if success:
        return {"success": True, "message": "Order cancelled successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to cancel order")

# Market data endpoints
@app.get("/api/v2/market/price/{exchange}/{symbol}")
async def get_live_price(exchange: str, symbol: str, user_id: str = Depends(get_current_user)):
    """Get live price for a symbol"""
    price = exchange_connector.get_live_price(exchange, symbol)
    
    if price is not None:
        return {
            "success": True, 
            "symbol": symbol,
            "exchange": exchange,
            "price": price,
            "timestamp": datetime.now().isoformat()
        }
    else:
        raise HTTPException(status_code=404, detail="Price not found")

@app.get("/api/v2/market/history/{exchange}/{symbol}")
async def get_historical_data(
    exchange: str, 
    symbol: str, 
    interval: str = "1d", 
    limit: int = 100,
    user_id: str = Depends(get_current_user)
):
    """Get historical price data"""
    df = exchange_connector.get_historical_data(exchange, symbol, interval, limit)
    
    if not df.empty:
        return {
            "success": True,
            "symbol": symbol,
            "exchange": exchange,
            "interval": interval,
            "data": df.to_dict('records')
        }
    else:
        return {"success": True, "data": []}

@app.get("/api/v2/market/orderbook/{exchange}/{symbol}")
async def get_order_book(exchange: str, symbol: str, user_id: str = Depends(get_current_user)):
    """Get order book depth"""
    order_book = exchange_connector.get_order_book(exchange, symbol)
    
    return {
        "success": True,
        "symbol": symbol,
        "exchange": exchange,
        "order_book": order_book
    }

# Instrument management endpoints
@app.get("/api/v2/instruments")
async def get_instruments(
    exchange: Optional[str] = None,
    asset_class: Optional[str] = None,
    sector: Optional[str] = None,
    limit: Optional[int] = 100,
    user_id: str = Depends(get_current_user)
):
    """Get available instruments with filtering"""
    instruments = instrument_manager.get_instruments(exchange, asset_class, sector, limit)
    return {"success": True, "instruments": instruments}

@app.post("/api/v2/instruments/search")
async def search_instruments(search_data: InstrumentSearch, user_id: str = Depends(get_current_user)):
    """Search instruments by name or symbol"""
    instruments = instrument_manager.search_instruments(search_data.search_term, search_data.limit)
    
    # Filter by exchange and asset class if provided
    if search_data.exchange:
        instruments = [i for i in instruments if i['exchange'] == search_data.exchange.upper()]
    
    if search_data.asset_class:
        instruments = [i for i in instruments if i['asset_class'] == search_data.asset_class.lower()]
    
    return {"success": True, "instruments": instruments}

@app.get("/api/v2/instruments/stats")
async def get_instrument_stats(user_id: str = Depends(get_current_user)):
    """Get comprehensive instrument statistics"""
    stats = instrument_manager.get_stats()
    return {"success": True, "stats": stats}

@app.get("/api/v2/exchanges")
async def get_supported_exchanges(user_id: str = Depends(get_current_user)):
    """Get all supported exchanges"""
    exchanges = instrument_manager.get_exchanges()
    return {"success": True, "exchanges": exchanges}

# System status endpoints
@app.get("/api/v2/system/status")
async def get_system_status():
    """Get overall system status (public endpoint)"""
    return {
        "success": True,
        "status": "operational",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "features": {
            "multi_user": True,
            "live_trading": True,
            "indian_exchanges": True,
            "global_exchanges": True,
            "crypto_trading": True,
            "forex_trading": True,
            "commodities": True
        }
    }

@app.get("/api/v2/system/health")
async def get_system_health():
    """Get detailed system health (public endpoint)"""
    try:
        # Check database connections
        stats = instrument_manager.get_stats()
        
        # Check exchange connectivity
        exchange_status = exchange_connector.get_connection_status()
        
        return {
            "success": True,
            "health": "healthy",
            "components": {
                "database": "healthy",
                "instruments": f"{stats['total_instruments']} available",
                "exchanges": exchange_status
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "health": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Background tasks
@app.get("/api/v2/system/populate-demo-user")
async def populate_demo_user():
    """Create a demo user with sample data (development only)"""
    try:
        # Create demo user
        user_id, success = user_manager.create_user(
            "demo@trading.ai", 
            "demo123", 
            "pro"
        )
        
        if success or user_id:
            # If user already exists, authenticate to get user_id
            if not user_id:
                user_id = user_manager.authenticate_user("demo@trading.ai", "demo123")
            
            # Add sample API keys
            user_manager.add_api_keys(
                user_id,
                "binance",
                "demo_api_key",
                "demo_secret_key",
                is_testnet=True
            )
            
            # Create session token
            token = session_manager.create_session(user_id)
            
            return {
                "success": True,
                "demo_user": {
                    "email": "demo@trading.ai",
                    "password": "demo123",
                    "user_id": user_id,
                    "token": token
                },
                "message": "Demo user created/updated successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to create demo user")
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error creating demo user"
        }

if __name__ == "__main__":
    import uvicorn
    
    # Start the enhanced API server
    print("🚀 Starting Enhanced Trading API Server...")
    print("📊 Features: Multi-user, Live Trading, 1000+ Instruments")
    print("🌍 Exchanges: NSE, BSE, Zerodha, Upstox, Binance, Global")
    print("🔗 API Documentation: http://localhost:8002/docs")
    
    uvicorn.run(
        "enhanced_trading_api:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )
