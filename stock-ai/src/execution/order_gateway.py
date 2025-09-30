import time
import json
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
from dataclasses import dataclass
from enum import Enum
import pandas as pd

class OrderType(Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP_LOSS = "STOP_LOSS"
    TAKE_PROFIT = "TAKE_PROFIT"

class OrderStatus(Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    FILLED = "FILLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

class OrderSide(Enum):
    BUY = 1
    SELL = -1

@dataclass
class Order:
    """Order data structure"""
    order_id: str
    instrument: str
    side: OrderSide
    quantity: float
    order_type: OrderType
    price: Optional[float] = None
    stop_price: Optional[float] = None
    agent_id: Optional[str] = None
    strategy: Optional[str] = None
    timestamp: datetime = None
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0.0
    avg_fill_price: float = 0.0
    commission: float = 0.0
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class RiskManager:
    """Risk management for order execution"""
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.max_position_size = self.config.get("max_position_size", 1000000)
        self.max_notional_per_order = self.config.get("max_notional_per_order", 50000)
        self.max_orders_per_minute = self.config.get("max_orders_per_minute", 10)
        self.allowed_instruments = set(self.config.get("allowed_instruments", []))
        self.blocked_instruments = set(self.config.get("blocked_instruments", []))
        
        # Track order frequency
        self.recent_orders = []
        
        # Setup logging
        self.logger = logging.getLogger("RiskManager")
    
    def validate_order(self, order: Order, current_positions: Dict = None) -> tuple[bool, str]:
        """Validate order against risk rules"""
        
        current_positions = current_positions or {}
        
        # Check instrument whitelist/blacklist
        if self.allowed_instruments and order.instrument not in self.allowed_instruments:
            return False, f"Instrument {order.instrument} not in allowed list"
        
        if order.instrument in self.blocked_instruments:
            return False, f"Instrument {order.instrument} is blocked"
        
        # Check notional size
        if order.price:
            notional = abs(order.quantity * order.price)
            if notional > self.max_notional_per_order:
                return False, f"Notional {notional} exceeds max {self.max_notional_per_order}"
        
        # Check position size limits
        current_position = current_positions.get(order.instrument, 0)
        new_position = current_position + (order.quantity * order.side.value)
        
        if abs(new_position) > self.max_position_size:
            return False, f"Position would exceed max size {self.max_position_size}"
        
        # Check order frequency
        now = datetime.now()
        self.recent_orders = [ts for ts in self.recent_orders 
                             if (now - ts).total_seconds() < 60]
        
        if len(self.recent_orders) >= self.max_orders_per_minute:
            return False, f"Too many orders per minute (max {self.max_orders_per_minute})"
        
        # Check for minimum quantity
        if abs(order.quantity) < 1:
            return False, "Quantity too small"
        
        self.recent_orders.append(now)
        return True, "Order validated"

class MockExchange:
    """Mock exchange for simulation"""
    
    def __init__(self, slippage: float = 0.0005, commission_rate: float = 0.001):
        self.slippage = slippage
        self.commission_rate = commission_rate
        self.market_data = {}
        self.latency_ms = 50  # 50ms execution latency
        
    def set_market_data(self, market_data: pd.DataFrame):
        """Update market data"""
        for _, row in market_data.iterrows():
            self.market_data[row["instrument"]] = {
                "bid": row["close"] * (1 - self.slippage),
                "ask": row["close"] * (1 + self.slippage),
                "last": row["close"],
                "timestamp": row["ts"]
            }
    
    def execute_order(self, order: Order) -> Dict:
        """Execute order against mock exchange"""
        
        # Simulate execution latency
        time.sleep(self.latency_ms / 1000)
        
        if order.instrument not in self.market_data:
            return {
                "status": "REJECTED",
                "reason": f"No market data for {order.instrument}"
            }
        
        market = self.market_data[order.instrument]
        
        # Determine fill price
        if order.order_type == OrderType.MARKET:
            if order.side == OrderSide.BUY:
                fill_price = market["ask"]
            else:
                fill_price = market["bid"]
        elif order.order_type == OrderType.LIMIT:
            # Simplified limit order logic
            if order.side == OrderSide.BUY and order.price >= market["ask"]:
                fill_price = market["ask"]
            elif order.side == OrderSide.SELL and order.price <= market["bid"]:
                fill_price = market["bid"]
            else:
                return {
                    "status": "PENDING",
                    "reason": "Limit price not reached"
                }
        else:
            fill_price = order.price or market["last"]
        
        # Calculate commission
        notional = abs(order.quantity * fill_price)
        commission = notional * self.commission_rate
        
        return {
            "status": "FILLED",
            "fill_price": fill_price,
            "filled_quantity": order.quantity,
            "commission": commission,
            "execution_time": datetime.now()
        }

class OrderGateway:
    """Main order gateway for trade execution"""
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.risk_manager = RiskManager(self.config.get("risk", {}))
        self.exchange = MockExchange(
            slippage=self.config.get("slippage", 0.0005),
            commission_rate=self.config.get("commission_rate", 0.001)
        )
        
        # Order tracking
        self.orders = {}
        self.positions = {}
        self.trade_history = []
        
        # Setup logging and audit trail
        self._setup_logging()
        self._setup_audit_trail()
    
    def _setup_logging(self):
        """Setup logging"""
        log_dir = Path("logs/execution")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / "order_gateway.log"),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger("OrderGateway")
    
    def _setup_audit_trail(self):
        """Setup audit trail for all orders"""
        audit_dir = Path("logs/audit")
        audit_dir.mkdir(parents=True, exist_ok=True)
        self.audit_file = audit_dir / "order_audit.jsonl"
    
    def submit_order(self, order_data: Dict) -> Dict:
        """Submit new order"""
        
        # Create order object
        order = Order(
            order_id=str(uuid.uuid4()),
            instrument=order_data["instrument"],
            side=OrderSide(order_data["side"]),
            quantity=order_data["quantity"],
            order_type=OrderType(order_data.get("order_type", "MARKET")),
            price=order_data.get("price"),
            stop_price=order_data.get("stop_price"),
            agent_id=order_data.get("agent_id"),
            strategy=order_data.get("strategy")
        )
        
        # Validate order
        is_valid, reason = self.risk_manager.validate_order(order, self.positions)
        
        if not is_valid:
            order.status = OrderStatus.REJECTED
            result = {
                "order_id": order.order_id,
                "status": "REJECTED",
                "reason": reason,
                "timestamp": order.timestamp
            }
            self._audit_order(order, result)
            self.logger.warning(f"Order rejected: {reason}")
            return result
        
        # Store order
        self.orders[order.order_id] = order
        order.status = OrderStatus.SUBMITTED
        
        # Execute order
        execution_result = self._execute_order(order)
        
        # Update order status
        if execution_result["status"] == "FILLED":
            order.status = OrderStatus.FILLED
            order.filled_quantity = execution_result["filled_quantity"]
            order.avg_fill_price = execution_result["fill_price"]
            order.commission = execution_result["commission"]
            
            # Update positions
            self._update_position(order)
            
            # Record trade
            self._record_trade(order, execution_result)
        
        # Prepare response
        result = {
            "order_id": order.order_id,
            "status": execution_result["status"],
            "fill_price": execution_result.get("fill_price"),
            "filled_quantity": execution_result.get("filled_quantity"),
            "commission": execution_result.get("commission"),
            "timestamp": order.timestamp,
            "reason": execution_result.get("reason")
        }
        
        # Audit trail
        self._audit_order(order, result)
        
        self.logger.info(f"Order {order.order_id} - {execution_result['status']}")
        
        return result
    
    def _execute_order(self, order: Order) -> Dict:
        """Execute order through exchange"""
        return self.exchange.execute_order(order)
    
    def _update_position(self, order: Order):
        """Update position tracking"""
        instrument = order.instrument
        quantity_change = order.filled_quantity * order.side.value
        
        if instrument not in self.positions:
            self.positions[instrument] = 0
        
        self.positions[instrument] += quantity_change
        
        # Clean up zero positions
        if abs(self.positions[instrument]) < 1e-6:
            del self.positions[instrument]
    
    def _record_trade(self, order: Order, execution_result: Dict):
        """Record completed trade"""
        trade = {
            "trade_id": str(uuid.uuid4()),
            "order_id": order.order_id,
            "instrument": order.instrument,
            "side": order.side.value,
            "quantity": order.filled_quantity,
            "price": order.avg_fill_price,
            "commission": order.commission,
            "agent_id": order.agent_id,
            "strategy": order.strategy,
            "execution_time": execution_result["execution_time"],
            "notional": abs(order.filled_quantity * order.avg_fill_price)
        }
        
        self.trade_history.append(trade)
    
    def _audit_order(self, order: Order, result: Dict):
        """Write order to audit trail"""
        audit_record = {
            "timestamp": datetime.now().isoformat(),
            "order": {
                "order_id": order.order_id,
                "instrument": order.instrument,
                "side": order.side.value,
                "quantity": order.quantity,
                "order_type": order.order_type.value,
                "price": order.price,
                "agent_id": order.agent_id,
                "strategy": order.strategy
            },
            "result": result
        }
        
        with open(self.audit_file, 'a') as f:
            f.write(json.dumps(audit_record, default=str) + '\n')
    
    def update_market_data(self, market_data: pd.DataFrame):
        """Update market data for execution"""
        self.exchange.set_market_data(market_data)
    
    def cancel_order(self, order_id: str) -> Dict:
        """Cancel pending order"""
        if order_id not in self.orders:
            return {"status": "ERROR", "reason": "Order not found"}
        
        order = self.orders[order_id]
        
        if order.status not in [OrderStatus.PENDING, OrderStatus.SUBMITTED]:
            return {"status": "ERROR", "reason": f"Cannot cancel order in status {order.status.value}"}
        
        order.status = OrderStatus.CANCELLED
        
        result = {
            "order_id": order_id,
            "status": "CANCELLED",
            "timestamp": datetime.now()
        }
        
        self._audit_order(order, result)
        self.logger.info(f"Order {order_id} cancelled")
        
        return result
    
    def get_order_status(self, order_id: str) -> Dict:
        """Get order status"""
        if order_id not in self.orders:
            return {"error": "Order not found"}
        
        order = self.orders[order_id]
        return {
            "order_id": order_id,
            "status": order.status.value,
            "filled_quantity": order.filled_quantity,
            "avg_fill_price": order.avg_fill_price,
            "commission": order.commission
        }
    
    def get_positions(self) -> Dict:
        """Get current positions"""
        return self.positions.copy()
    
    def get_trade_history(self, limit: int = 100) -> List[Dict]:
        """Get recent trade history"""
        return self.trade_history[-limit:]
    
    def get_execution_stats(self) -> Dict:
        """Get execution statistics"""
        if not self.trade_history:
            return {"message": "No trades executed"}
        
        df = pd.DataFrame(self.trade_history)
        
        return {
            "total_trades": len(df),
            "total_volume": df["notional"].sum(),
            "avg_trade_size": df["notional"].mean(),
            "total_commission": df["commission"].sum(),
            "instruments_traded": df["instrument"].nunique(),
            "last_trade_time": df["execution_time"].max()
        }

# Convenience functions
def place_market_order(gateway: OrderGateway, instrument: str, side: int, quantity: float, 
                      agent_id: str = None, strategy: str = None) -> Dict:
    """Place a market order"""
    order_data = {
        "instrument": instrument,
        "side": side,
        "quantity": quantity,
        "order_type": "MARKET",
        "agent_id": agent_id,
        "strategy": strategy
    }
    return gateway.submit_order(order_data)

def place_limit_order(gateway: OrderGateway, instrument: str, side: int, quantity: float, 
                     price: float, agent_id: str = None, strategy: str = None) -> Dict:
    """Place a limit order"""
    order_data = {
        "instrument": instrument,
        "side": side,
        "quantity": quantity,
        "order_type": "LIMIT",
        "price": price,
        "agent_id": agent_id,
        "strategy": strategy
    }
    return gateway.submit_order(order_data)

def main():
    """Test order gateway"""
    
    # Create gateway
    config = {
        "risk": {
            "max_notional_per_order": 100000,
            "max_orders_per_minute": 5
        },
        "slippage": 0.001,
        "commission_rate": 0.001
    }
    
    gateway = OrderGateway(config)
    
    # Mock market data
    market_data = pd.DataFrame({
        "instrument": ["AAPL", "GOOGL"],
        "close": [150.0, 2500.0],
        "ts": [datetime.now(), datetime.now()]
    })
    gateway.update_market_data(market_data)
    
    # Test orders
    print("Testing order gateway...")
    
    # Place market order
    result1 = place_market_order(gateway, "AAPL", 1, 100, agent_id="test_agent", strategy="test")
    print(f"Market order result: {result1}")
    
    # Place limit order
    result2 = place_limit_order(gateway, "GOOGL", -1, 10, 2400.0, agent_id="test_agent", strategy="test")
    print(f"Limit order result: {result2}")
    
    # Check positions
    positions = gateway.get_positions()
    print(f"Current positions: {positions}")
    
    # Check stats
    stats = gateway.get_execution_stats()
    print(f"Execution stats: {stats}")

if __name__ == "__main__":
    main()
