#!/usr/bin/env python3
"""
Exchange Connector - Direct API integration for live order execution
Connects to Binance, Coinbase, Kraken for real trading
"""

import ccxt
import pandas as pd
import asyncio
import logging
from typing import Dict, List, Optional
import os
import json
from datetime import datetime

class ExchangeConnector:
    """Direct exchange API connector for live trading"""
    
    def __init__(self):
        self.exchanges = {}
        self.connected_exchanges = []
        self.logger = self._setup_logging()
        
        # Load API credentials from environment or config
        self.load_exchange_credentials()
    
    def _setup_logging(self):
        logging.basicConfig(level=logging.INFO)
        return logging.getLogger(__name__)
    
    def load_exchange_credentials(self):
        """Load exchange API credentials"""
        
        # Example credential structure (use environment variables in production)
        credentials = {
            'binance': {
                'apiKey': os.getenv('BINANCE_API_KEY', ''),
                'secret': os.getenv('BINANCE_SECRET_KEY', ''),
                'sandbox': True,  # Start with testnet
                'enableRateLimit': True,
            },
            'coinbase': {
                'apiKey': os.getenv('COINBASE_API_KEY', ''),
                'secret': os.getenv('COINBASE_SECRET_KEY', ''),
                'password': os.getenv('COINBASE_PASSPHRASE', ''),
                'sandbox': True,
                'enableRateLimit': True,
            },
            'kraken': {
                'apiKey': os.getenv('KRAKEN_API_KEY', ''),
                'secret': os.getenv('KRAKEN_SECRET_KEY', ''),
                'enableRateLimit': True,
            }
        }
        
        # Initialize exchanges
        for exchange_name, creds in credentials.items():
            if creds['apiKey'] and creds['secret']:
                try:
                    if exchange_name == 'binance':
                        self.exchanges[exchange_name] = ccxt.binance(creds)
                    elif exchange_name == 'coinbase':
                        self.exchanges[exchange_name] = ccxt.coinbasepro(creds)
                    elif exchange_name == 'kraken':
                        self.exchanges[exchange_name] = ccxt.kraken(creds)
                    
                    self.connected_exchanges.append(exchange_name)
                    self.logger.info(f"✅ Connected to {exchange_name}")
                
                except Exception as e:
                    self.logger.error(f"❌ Failed to connect to {exchange_name}: {e}")
    
    async def place_order(self, exchange_name: str, symbol: str, side: str, amount: float, 
                         order_type: str = 'market', price: float = None) -> Dict:
        """Place an order on the specified exchange"""
        
        if exchange_name not in self.exchanges:
            return {'status': 'error', 'message': f'Exchange {exchange_name} not connected'}
        
        exchange = self.exchanges[exchange_name]
        
        try:
            # Validate order parameters
            if side not in ['buy', 'sell']:
                return {'status': 'error', 'message': 'Invalid side. Use buy or sell'}
            
            if amount <= 0:
                return {'status': 'error', 'message': 'Amount must be positive'}
            
            # Place order based on type
            if order_type == 'market':
                if side == 'buy':
                    order = exchange.create_market_buy_order(symbol, amount)
                else:
                    order = exchange.create_market_sell_order(symbol, amount)
            
            elif order_type == 'limit':
                if price is None:
                    return {'status': 'error', 'message': 'Price required for limit orders'}
                
                order = exchange.create_limit_order(symbol, side, amount, price)
            
            else:
                return {'status': 'error', 'message': 'Unsupported order type'}
            
            # Log successful order
            self.logger.info(f"✅ Order placed: {side} {amount} {symbol} on {exchange_name}")
            
            return {
                'status': 'success',
                'order_id': order['id'],
                'symbol': symbol,
                'side': side,
                'amount': amount,
                'price': order.get('price'),
                'exchange': exchange_name,
                'timestamp': datetime.now().isoformat(),
                'raw_response': order
            }
        
        except Exception as e:
            self.logger.error(f"❌ Order failed on {exchange_name}: {e}")
            return {'status': 'error', 'message': str(e)}
    
    async def get_balance(self, exchange_name: str) -> Dict:
        """Get account balance from exchange"""
        
        if exchange_name not in self.exchanges:
            return {'status': 'error', 'message': f'Exchange {exchange_name} not connected'}
        
        try:
            exchange = self.exchanges[exchange_name]
            balance = exchange.fetch_balance()
            
            return {
                'status': 'success',
                'exchange': exchange_name,
                'balances': balance,
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            self.logger.error(f"❌ Failed to get balance from {exchange_name}: {e}")
            return {'status': 'error', 'message': str(e)}
    
    async def get_open_orders(self, exchange_name: str, symbol: str = None) -> Dict:
        """Get open orders from exchange"""
        
        if exchange_name not in self.exchanges:
            return {'status': 'error', 'message': f'Exchange {exchange_name} not connected'}
        
        try:
            exchange = self.exchanges[exchange_name]
            orders = exchange.fetch_open_orders(symbol)
            
            return {
                'status': 'success',
                'exchange': exchange_name,
                'orders': orders,
                'count': len(orders),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            self.logger.error(f"❌ Failed to get orders from {exchange_name}: {e}")
            return {'status': 'error', 'message': str(e)}
    
    async def cancel_order(self, exchange_name: str, order_id: str, symbol: str) -> Dict:
        """Cancel an order"""
        
        if exchange_name not in self.exchanges:
            return {'status': 'error', 'message': f'Exchange {exchange_name} not connected'}
        
        try:
            exchange = self.exchanges[exchange_name]
            result = exchange.cancel_order(order_id, symbol)
            
            self.logger.info(f"✅ Order cancelled: {order_id} on {exchange_name}")
            
            return {
                'status': 'success',
                'order_id': order_id,
                'symbol': symbol,
                'exchange': exchange_name,
                'timestamp': datetime.now().isoformat(),
                'raw_response': result
            }
        
        except Exception as e:
            self.logger.error(f"❌ Failed to cancel order {order_id}: {e}")
            return {'status': 'error', 'message': str(e)}

# Global connector instance
exchange_connector = ExchangeConnector()

async def main():
    """Test exchange connectivity"""
    
    print("🔗 Testing Exchange Connectivity")
    print("=" * 40)
    
    # Test balance retrieval
    for exchange_name in exchange_connector.connected_exchanges:
        balance = await exchange_connector.get_balance(exchange_name)
        if balance['status'] == 'success':
            print(f"✅ {exchange_name}: Connected and authenticated")
        else:
            print(f"❌ {exchange_name}: {balance['message']}")

if __name__ == "__main__":
    asyncio.run(main())
