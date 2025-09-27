#!/usr/bin/env python3
"""
📈 REAL TRADING STRATEGIES
Implement real trading strategies: Orderbook Tap, VWAP Mean Reversion, MA Crossover, RSI Divergence
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
import logging
from datetime import datetime, timedelta
import requests
import json

class RealTradingStrategies:
    """Real trading strategies implementation"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Strategy parameters
        self.strategies = {
            'orderbook_tap': {
                'name': 'Orderbook Tap Strategy',
                'description': 'Detect orderbook imbalances and tap into liquidity',
                'enabled': True,
                'weight': 0.25
            },
            'vwap_mean_reversion': {
                'name': 'VWAP Mean Reversion',
                'description': 'Trade when price deviates significantly from VWAP',
                'enabled': True,
                'weight': 0.25
            },
            'ma_crossover': {
                'name': 'Moving Average Crossover',
                'description': 'Trade on MA crossover signals with momentum confirmation',
                'enabled': True,
                'weight': 0.25
            },
            'rsi_divergence': {
                'name': 'RSI Divergence',
                'description': 'Trade on RSI divergence patterns',
                'enabled': True,
                'weight': 0.25
            }
        }
    
    def get_orderbook_data(self, symbol: str) -> Optional[Dict]:
        """Get orderbook data for orderbook tap strategy"""
        try:
            # For crypto symbols, try to get Binance orderbook
            if '-USD' in symbol or 'USDT' in symbol:
                # Convert symbol format for Binance API
                binance_symbol = symbol.replace('-USD', 'USDT').replace('-', '')
                
                url = f"https://api.binance.com/api/v3/depth"
                params = {'symbol': binance_symbol, 'limit': 100}
                
                response = requests.get(url, params=params, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    bids = [[float(price), float(qty)] for price, qty in data['bids'][:20]]
                    asks = [[float(price), float(qty)] for price, qty in data['asks'][:20]]
                    
                    return {
                        'symbol': symbol,
                        'bids': bids,
                        'asks': asks,
                        'timestamp': datetime.now().isoformat(),
                        'source': 'binance_orderbook'
                    }
            
            # For stocks, simulate orderbook based on current price and volume
            return self._simulate_orderbook(symbol)
            
        except Exception as e:
            self.logger.error(f"Error getting orderbook for {symbol}: {e}")
            return self._simulate_orderbook(symbol)
    
    def _simulate_orderbook(self, symbol: str) -> Dict:
        """Simulate orderbook for stocks (since real orderbook data requires paid feeds)"""
        try:
            # Get current price from our market data
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data'))
            from comprehensive_market_data import get_real_price
            
            price_data = get_real_price(symbol)
            
            if price_data:
                current_price = price_data['current_price']
                volume = price_data.get('volume', 1000000)
                
                # Simulate realistic orderbook
                bids = []
                asks = []
                
                # Generate bid levels (below current price)
                for i in range(20):
                    price_offset = (i + 1) * 0.001  # 0.1% increments
                    bid_price = current_price * (1 - price_offset)
                    bid_qty = volume * np.random.uniform(0.001, 0.01)  # 0.1-1% of daily volume
                    bids.append([bid_price, bid_qty])
                
                # Generate ask levels (above current price)
                for i in range(20):
                    price_offset = (i + 1) * 0.001  # 0.1% increments
                    ask_price = current_price * (1 + price_offset)
                    ask_qty = volume * np.random.uniform(0.001, 0.01)  # 0.1-1% of daily volume
                    asks.append([ask_price, ask_qty])
                
                return {
                    'symbol': symbol,
                    'bids': bids,
                    'asks': asks,
                    'timestamp': datetime.now().isoformat(),
                    'source': 'simulated_orderbook'
                }
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error simulating orderbook for {symbol}: {e}")
            return None
    
    def orderbook_tap_strategy(self, symbol: str, market_data: Dict) -> Dict:
        """Orderbook Tap Strategy - Detect imbalances and liquidity opportunities"""
        try:
            orderbook = self.get_orderbook_data(symbol)
            
            if not orderbook:
                return {'signal': 'HOLD', 'strength': 0, 'reason': 'No orderbook data'}
            
            bids = orderbook['bids']
            asks = orderbook['asks']
            
            if not bids or not asks:
                return {'signal': 'HOLD', 'strength': 0, 'reason': 'Empty orderbook'}
            
            # Calculate orderbook metrics
            best_bid = bids[0][0]
            best_ask = asks[0][0]
            bid_spread = best_ask - best_bid
            spread_pct = (bid_spread / best_bid) * 100
            
            # Calculate bid/ask volume imbalance
            total_bid_volume = sum(qty for price, qty in bids[:10])
            total_ask_volume = sum(qty for price, qty in asks[:10])
            
            volume_imbalance = (total_bid_volume - total_ask_volume) / (total_bid_volume + total_ask_volume)
            
            # Calculate weighted average prices
            bid_weighted_price = sum(price * qty for price, qty in bids[:5]) / sum(qty for price, qty in bids[:5])
            ask_weighted_price = sum(price * qty for price, qty in asks[:5]) / sum(qty for price, qty in asks[:5])
            
            # Strategy logic
            signal = 'HOLD'
            strength = 50
            reason = 'Neutral orderbook'
            
            # Strong buy signal: Heavy bid volume, tight spread
            if volume_imbalance > 0.3 and spread_pct < 0.1:
                signal = 'BUY'
                strength = min(90, 60 + abs(volume_imbalance) * 100)
                reason = f'Strong bid imbalance ({volume_imbalance:.2f}), tight spread ({spread_pct:.3f}%)'
            
            # Strong sell signal: Heavy ask volume, wide spread
            elif volume_imbalance < -0.3 and spread_pct > 0.2:
                signal = 'SELL'
                strength = min(90, 60 + abs(volume_imbalance) * 100)
                reason = f'Strong ask imbalance ({volume_imbalance:.2f}), wide spread ({spread_pct:.3f}%)'
            
            # Moderate buy: Bid imbalance
            elif volume_imbalance > 0.15:
                signal = 'BUY'
                strength = min(75, 50 + abs(volume_imbalance) * 100)
                reason = f'Moderate bid imbalance ({volume_imbalance:.2f})'
            
            # Moderate sell: Ask imbalance
            elif volume_imbalance < -0.15:
                signal = 'SELL'
                strength = min(75, 50 + abs(volume_imbalance) * 100)
                reason = f'Moderate ask imbalance ({volume_imbalance:.2f})'
            
            return {
                'signal': signal,
                'strength': strength,
                'reason': reason,
                'metrics': {
                    'spread_pct': spread_pct,
                    'volume_imbalance': volume_imbalance,
                    'best_bid': best_bid,
                    'best_ask': best_ask,
                    'bid_volume': total_bid_volume,
                    'ask_volume': total_ask_volume
                }
            }
            
        except Exception as e:
            self.logger.error(f"Orderbook tap strategy error for {symbol}: {e}")
            return {'signal': 'HOLD', 'strength': 0, 'reason': f'Strategy error: {e}'}
    
    def vwap_mean_reversion_strategy(self, symbol: str, market_data: Dict) -> Dict:
        """VWAP Mean Reversion Strategy"""
        try:
            current_price = market_data.get('current_price', 0)
            volume = market_data.get('volume', 0)
            
            if current_price == 0:
                return {'signal': 'HOLD', 'strength': 0, 'reason': 'No price data'}
            
            # Get historical data for VWAP calculation
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data'))
            from comprehensive_market_data import comprehensive_market_data
            
            hist_data = comprehensive_market_data.get_historical_data_direct(symbol, period='5d')
            
            if hist_data is None or len(hist_data) < 20:
                # Fallback: estimate VWAP from current data
                vwap = current_price  # Assume current price is near VWAP
                vwap_deviation = 0
            else:
                # Calculate VWAP for last 20 periods
                recent_data = hist_data.tail(20)
                typical_price = (recent_data['High'] + recent_data['Low'] + recent_data['Close']) / 3
                vwap = (typical_price * recent_data['Volume']).sum() / recent_data['Volume'].sum()
                vwap_deviation = (current_price - vwap) / vwap
            
            # Calculate volatility
            if hist_data is not None and len(hist_data) >= 10:
                volatility = hist_data['Close'].pct_change().tail(10).std()
            else:
                volatility = 0.02  # Assume 2% daily volatility
            
            # Strategy logic
            signal = 'HOLD'
            strength = 50
            reason = 'Price near VWAP'
            
            # Strong mean reversion signals
            if vwap_deviation > 2 * volatility:  # Price significantly above VWAP
                signal = 'SELL'
                strength = min(90, 60 + abs(vwap_deviation) * 1000)
                reason = f'Price {vwap_deviation:.2%} above VWAP, expect reversion'
            
            elif vwap_deviation < -2 * volatility:  # Price significantly below VWAP
                signal = 'BUY'
                strength = min(90, 60 + abs(vwap_deviation) * 1000)
                reason = f'Price {vwap_deviation:.2%} below VWAP, expect reversion'
            
            # Moderate signals
            elif vwap_deviation > volatility:
                signal = 'SELL'
                strength = min(75, 50 + abs(vwap_deviation) * 500)
                reason = f'Price moderately above VWAP ({vwap_deviation:.2%})'
            
            elif vwap_deviation < -volatility:
                signal = 'BUY'
                strength = min(75, 50 + abs(vwap_deviation) * 500)
                reason = f'Price moderately below VWAP ({vwap_deviation:.2%})'
            
            return {
                'signal': signal,
                'strength': strength,
                'reason': reason,
                'metrics': {
                    'current_price': current_price,
                    'vwap': vwap,
                    'vwap_deviation': vwap_deviation,
                    'volatility': volatility
                }
            }
            
        except Exception as e:
            self.logger.error(f"VWAP mean reversion strategy error for {symbol}: {e}")
            return {'signal': 'HOLD', 'strength': 0, 'reason': f'Strategy error: {e}'}
    
    def ma_crossover_strategy(self, symbol: str, market_data: Dict) -> Dict:
        """Moving Average Crossover Strategy with Momentum Confirmation"""
        try:
            current_price = market_data.get('current_price', 0)
            
            if current_price == 0:
                return {'signal': 'HOLD', 'strength': 0, 'reason': 'No price data'}
            
            # Get historical data
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data'))
            from comprehensive_market_data import comprehensive_market_data
            
            hist_data = comprehensive_market_data.get_historical_data_direct(symbol, period='3mo')
            
            if hist_data is None or len(hist_data) < 50:
                return {'signal': 'HOLD', 'strength': 0, 'reason': 'Insufficient historical data'}
            
            # Calculate moving averages
            ma_short = hist_data['Close'].rolling(window=10).mean()
            ma_long = hist_data['Close'].rolling(window=20).mean()
            
            # Get recent values
            current_ma_short = ma_short.iloc[-1]
            current_ma_long = ma_long.iloc[-1]
            prev_ma_short = ma_short.iloc[-2]
            prev_ma_long = ma_long.iloc[-2]
            
            # Calculate momentum indicators
            rsi = self._calculate_rsi(hist_data['Close'].tail(20))
            current_rsi = rsi.iloc[-1] if len(rsi) > 0 else 50
            
            # Volume confirmation
            volume_ma = hist_data['Volume'].rolling(window=10).mean()
            current_volume = market_data.get('volume', 0)
            avg_volume = volume_ma.iloc[-1] if len(volume_ma) > 0 else current_volume
            volume_ratio = current_volume / avg_volume if avg_volume > 0 else 1
            
            # Strategy logic
            signal = 'HOLD'
            strength = 50
            reason = 'No clear crossover signal'
            
            # Bullish crossover: Short MA crosses above Long MA
            if (prev_ma_short <= prev_ma_long and current_ma_short > current_ma_long):
                if current_rsi < 70 and volume_ratio > 1.2:  # Not overbought, good volume
                    signal = 'BUY'
                    strength = min(90, 70 + (volume_ratio - 1) * 20)
                    reason = f'Bullish MA crossover with RSI {current_rsi:.1f} and volume {volume_ratio:.1f}x'
                else:
                    signal = 'BUY'
                    strength = 60
                    reason = 'Bullish MA crossover but weak confirmation'
            
            # Bearish crossover: Short MA crosses below Long MA
            elif (prev_ma_short >= prev_ma_long and current_ma_short < current_ma_long):
                if current_rsi > 30 and volume_ratio > 1.2:  # Not oversold, good volume
                    signal = 'SELL'
                    strength = min(90, 70 + (volume_ratio - 1) * 20)
                    reason = f'Bearish MA crossover with RSI {current_rsi:.1f} and volume {volume_ratio:.1f}x'
                else:
                    signal = 'SELL'
                    strength = 60
                    reason = 'Bearish MA crossover but weak confirmation'
            
            # Trend continuation signals
            elif current_ma_short > current_ma_long * 1.02:  # Strong uptrend
                if current_rsi < 80:
                    signal = 'BUY'
                    strength = min(75, 55 + (current_ma_short / current_ma_long - 1) * 1000)
                    reason = f'Strong uptrend continuation, RSI {current_rsi:.1f}'
            
            elif current_ma_short < current_ma_long * 0.98:  # Strong downtrend
                if current_rsi > 20:
                    signal = 'SELL'
                    strength = min(75, 55 + (1 - current_ma_short / current_ma_long) * 1000)
                    reason = f'Strong downtrend continuation, RSI {current_rsi:.1f}'
            
            return {
                'signal': signal,
                'strength': strength,
                'reason': reason,
                'metrics': {
                    'ma_short': current_ma_short,
                    'ma_long': current_ma_long,
                    'rsi': current_rsi,
                    'volume_ratio': volume_ratio,
                    'trend_strength': current_ma_short / current_ma_long
                }
            }
            
        except Exception as e:
            self.logger.error(f"MA crossover strategy error for {symbol}: {e}")
            return {'signal': 'HOLD', 'strength': 0, 'reason': f'Strategy error: {e}'}
    
    def rsi_divergence_strategy(self, symbol: str, market_data: Dict) -> Dict:
        """RSI Divergence Strategy"""
        try:
            current_price = market_data.get('current_price', 0)
            
            if current_price == 0:
                return {'signal': 'HOLD', 'strength': 0, 'reason': 'No price data'}
            
            # Get historical data
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data'))
            from comprehensive_market_data import comprehensive_market_data
            
            hist_data = comprehensive_market_data.get_historical_data_direct(symbol, period='1mo')
            
            if hist_data is None or len(hist_data) < 30:
                return {'signal': 'HOLD', 'strength': 0, 'reason': 'Insufficient data for RSI divergence'}
            
            # Calculate RSI
            rsi = self._calculate_rsi(hist_data['Close'])
            prices = hist_data['Close']
            
            if len(rsi) < 20:
                return {'signal': 'HOLD', 'strength': 0, 'reason': 'Insufficient RSI data'}
            
            # Get recent data for divergence analysis
            recent_prices = prices.tail(10)
            recent_rsi = rsi.tail(10)
            
            # Find local highs and lows
            price_highs = []
            price_lows = []
            rsi_highs = []
            rsi_lows = []
            
            for i in range(2, len(recent_prices) - 2):
                # Price highs
                if (recent_prices.iloc[i] > recent_prices.iloc[i-1] and 
                    recent_prices.iloc[i] > recent_prices.iloc[i+1] and
                    recent_prices.iloc[i] > recent_prices.iloc[i-2] and
                    recent_prices.iloc[i] > recent_prices.iloc[i+2]):
                    price_highs.append((i, recent_prices.iloc[i]))
                    rsi_highs.append((i, recent_rsi.iloc[i]))
                
                # Price lows
                if (recent_prices.iloc[i] < recent_prices.iloc[i-1] and 
                    recent_prices.iloc[i] < recent_prices.iloc[i+1] and
                    recent_prices.iloc[i] < recent_prices.iloc[i-2] and
                    recent_prices.iloc[i] < recent_prices.iloc[i+2]):
                    price_lows.append((i, recent_prices.iloc[i]))
                    rsi_lows.append((i, recent_rsi.iloc[i]))
            
            # Current RSI level
            current_rsi = recent_rsi.iloc[-1]
            
            signal = 'HOLD'
            strength = 50
            reason = 'No clear RSI signal'
            
            # RSI overbought/oversold signals
            if current_rsi > 80:
                signal = 'SELL'
                strength = min(85, 60 + (current_rsi - 70))
                reason = f'RSI overbought at {current_rsi:.1f}'
            
            elif current_rsi < 20:
                signal = 'BUY'
                strength = min(85, 60 + (30 - current_rsi))
                reason = f'RSI oversold at {current_rsi:.1f}'
            
            # Bearish divergence: Price makes higher high, RSI makes lower high
            elif len(price_highs) >= 2 and len(rsi_highs) >= 2:
                if (price_highs[-1][1] > price_highs[-2][1] and 
                    rsi_highs[-1][1] < rsi_highs[-2][1]):
                    signal = 'SELL'
                    strength = 80
                    reason = 'Bearish RSI divergence detected'
            
            # Bullish divergence: Price makes lower low, RSI makes higher low
            elif len(price_lows) >= 2 and len(rsi_lows) >= 2:
                if (price_lows[-1][1] < price_lows[-2][1] and 
                    rsi_lows[-1][1] > rsi_lows[-2][1]):
                    signal = 'BUY'
                    strength = 80
                    reason = 'Bullish RSI divergence detected'
            
            # RSI momentum signals
            elif 30 < current_rsi < 70:
                rsi_momentum = recent_rsi.iloc[-1] - recent_rsi.iloc[-3]
                
                if rsi_momentum > 10:
                    signal = 'BUY'
                    strength = min(70, 50 + rsi_momentum)
                    reason = f'Strong RSI momentum up ({rsi_momentum:.1f})'
                
                elif rsi_momentum < -10:
                    signal = 'SELL'
                    strength = min(70, 50 + abs(rsi_momentum))
                    reason = f'Strong RSI momentum down ({rsi_momentum:.1f})'
            
            return {
                'signal': signal,
                'strength': strength,
                'reason': reason,
                'metrics': {
                    'current_rsi': current_rsi,
                    'rsi_trend': recent_rsi.iloc[-1] - recent_rsi.iloc[-5],
                    'price_highs': len(price_highs),
                    'price_lows': len(price_lows)
                }
            }
            
        except Exception as e:
            self.logger.error(f"RSI divergence strategy error for {symbol}: {e}")
            return {'signal': 'HOLD', 'strength': 0, 'reason': f'Strategy error: {e}'}
    
    def _calculate_rsi(self, prices: pd.Series, window: int = 14) -> pd.Series:
        """Calculate RSI indicator"""
        try:
            delta = prices.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            return rsi.fillna(50)
        except:
            return pd.Series([50] * len(prices), index=prices.index)
    
    def generate_combined_signal(self, symbol: str, market_data: Dict) -> Dict:
        """Generate combined signal from all strategies"""
        try:
            # Run all strategies
            strategies_results = {}
            
            if self.strategies['orderbook_tap']['enabled']:
                strategies_results['orderbook_tap'] = self.orderbook_tap_strategy(symbol, market_data)
            
            if self.strategies['vwap_mean_reversion']['enabled']:
                strategies_results['vwap_mean_reversion'] = self.vwap_mean_reversion_strategy(symbol, market_data)
            
            if self.strategies['ma_crossover']['enabled']:
                strategies_results['ma_crossover'] = self.ma_crossover_strategy(symbol, market_data)
            
            if self.strategies['rsi_divergence']['enabled']:
                strategies_results['rsi_divergence'] = self.rsi_divergence_strategy(symbol, market_data)
            
            # Combine signals using weighted voting
            buy_score = 0
            sell_score = 0
            total_weight = 0
            
            strategy_details = []
            
            for strategy_name, result in strategies_results.items():
                weight = self.strategies[strategy_name]['weight']
                signal = result['signal']
                strength = result['strength']
                
                weighted_strength = (strength / 100) * weight
                
                if signal == 'BUY':
                    buy_score += weighted_strength
                elif signal == 'SELL':
                    sell_score += weighted_strength
                
                total_weight += weight
                
                strategy_details.append({
                    'strategy': strategy_name,
                    'signal': signal,
                    'strength': strength,
                    'reason': result['reason'],
                    'weight': weight
                })
            
            # Determine final signal
            if buy_score > sell_score and buy_score > 0.3:
                final_signal = 'BUY'
                final_strength = min(95, (buy_score / total_weight) * 100)
            elif sell_score > buy_score and sell_score > 0.3:
                final_signal = 'SELL'
                final_strength = min(95, (sell_score / total_weight) * 100)
            else:
                final_signal = 'HOLD'
                final_strength = 50
            
            # Generate reasoning
            active_strategies = [s for s in strategy_details if s['signal'] != 'HOLD']
            if active_strategies:
                main_reason = f"{len(active_strategies)} strategies agree: {', '.join([s['strategy'] for s in active_strategies])}"
            else:
                main_reason = "No strong signals from any strategy"
            
            return {
                'signal': final_signal,
                'strength': final_strength,
                'confidence': f'{final_strength:.1f}%',
                'reasoning': main_reason,
                'strategy_breakdown': strategy_details,
                'scores': {
                    'buy_score': buy_score,
                    'sell_score': sell_score,
                    'total_weight': total_weight
                }
            }
            
        except Exception as e:
            self.logger.error(f"Combined signal generation error for {symbol}: {e}")
            return {
                'signal': 'HOLD',
                'strength': 50,
                'confidence': '50%',
                'reasoning': f'Error in strategy combination: {e}',
                'strategy_breakdown': [],
                'scores': {'buy_score': 0, 'sell_score': 0, 'total_weight': 0}
            }

# Global instance
real_trading_strategies = RealTradingStrategies()

def generate_strategy_signal(symbol: str, market_data: Dict) -> Dict:
    """Generate trading signal using real strategies"""
    return real_trading_strategies.generate_combined_signal(symbol, market_data)
