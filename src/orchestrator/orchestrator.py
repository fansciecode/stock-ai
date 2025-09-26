import argparse
import pandas as pd
import numpy as np
import json
import time
import schedule
from datetime import datetime, timedelta
from pathlib import Path
import logging
import sys
import os
from typing import Dict, List
import yaml

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agents.trading_agent import TradingAgent
from execution.order_gateway import OrderGateway, place_market_order
from features.build_features import FeatureEngineer
from data.sample_generator import SyntheticDataGenerator
from ingestion.load_sample import DataLoader

class TradingOrchestrator:
    """Main orchestrator that coordinates all trading system components"""
    
    def __init__(self, config_path: str = "configs/strategies.yaml"):
        self.config = self._load_config(config_path)
        
        # Initialize components
        self.data_loader = DataLoader()
        self.feature_engineer = FeatureEngineer()
        self.trading_agents = {}
        self.order_gateway = None
        
        # State tracking
        self.is_running = False
        self.last_update = None
        self.market_data = None
        self.latest_features = None
        
        # Performance tracking
        self.system_metrics = {
            "signals_generated": 0,
            "orders_placed": 0,
            "trades_completed": 0,
            "total_pnl": 0.0,
            "uptime_hours": 0.0
        }
        
        # Setup logging
        self._setup_logging()
        
        # Initialize system
        self._initialize_system()
    
    def _load_config(self, config_path: str) -> Dict:
        """Load system configuration"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            self.logger.error(f"Config file not found: {config_path}")
            return {}
    
    def _setup_logging(self):
        """Setup orchestrator logging"""
        log_dir = Path("logs/orchestrator")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / "orchestrator.log"),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger("TradingOrchestrator")
    
    def _initialize_system(self):
        """Initialize all system components"""
        self.logger.info("Initializing trading system...")
        
        # Initialize order gateway
        gateway_config = {
            "risk": self.config.get("global_settings", {}),
            "slippage": 0.001,
            "commission_rate": 0.001
        }
        self.order_gateway = OrderGateway(gateway_config)
        
        # Initialize trading agents
        self._initialize_agents()
        
        self.logger.info("Trading system initialized successfully")
    
    def _initialize_agents(self):
        """Initialize trading agents with trained models"""
        models_dir = Path("models")
        
        if not models_dir.exists():
            self.logger.warning("No models directory found, agents will not be created")
            return
        
        # Look for saved models
        model_files = list(models_dir.glob("*.joblib"))
        
        if not model_files:
            self.logger.warning("No trained models found")
            return
        
        # Create agents for each model
        for i, model_file in enumerate(model_files):
            agent_id = f"agent_{i+1}_{model_file.stem}"
            
            try:
                agent_config = {
                    "max_positions": self.config.get("global_settings", {}).get("max_concurrent_trades", 5),
                    "max_risk_per_trade": self.config.get("global_settings", {}).get("max_risk_per_trade", 0.02),
                    "confidence_threshold": 0.6
                }
                
                agent = TradingAgent(agent_id, str(model_file), agent_config)
                self.trading_agents[agent_id] = agent
                
                self.logger.info(f"Created trading agent: {agent_id}")
                
            except Exception as e:
                self.logger.error(f"Failed to create agent for {model_file}: {e}")
    
    def start_trading(self):
        """Start the automated trading system"""
        self.logger.info("Starting automated trading system...")
        
        if not self.trading_agents:
            self.logger.error("No trading agents available, cannot start trading")
            return False
        
        self.is_running = True
        self.last_update = datetime.now()
        
        # Schedule regular updates
        schedule.every(1).minutes.do(self._trading_cycle)
        schedule.every(5).minutes.do(self._update_features)
        schedule.every(1).hours.do(self._performance_report)
        schedule.every(1).days.do(self._daily_cleanup)
        
        self.logger.info("Trading system started successfully")
        return True
    
    def stop_trading(self):
        """Stop the automated trading system"""
        self.logger.info("Stopping trading system...")
        
        self.is_running = False
        
        # Close all open positions
        self._close_all_positions()
        
        # Save agent states
        self._save_agent_states()
        
        # Generate final report
        self._generate_final_report()
        
        self.logger.info("Trading system stopped")
    
    def run_single_cycle(self):
        """Run a single trading cycle manually"""
        self.logger.info("Running single trading cycle...")
        
        # Update data and features
        success = self._update_market_data()
        if not success:
            return False
        
        # Run trading cycle
        self._trading_cycle()
        
        # Generate report
        self._performance_report()
        
        return True
    
    def run_continuous(self):
        """Run the trading system continuously"""
        self.logger.info("Starting continuous trading mode...")
        
        if not self.start_trading():
            return
        
        try:
            while self.is_running:
                schedule.run_pending()
                time.sleep(10)  # Check every 10 seconds
                
        except KeyboardInterrupt:
            self.logger.info("Received interrupt signal")
        except Exception as e:
            self.logger.error(f"Error in continuous mode: {e}")
        finally:
            self.stop_trading()
    
    def _trading_cycle(self):
        """Execute one complete trading cycle"""
        if not self.is_running:
            return
        
        self.logger.info("Executing trading cycle...")
        
        try:
            # Update market data
            if not self._update_market_data():
                return
            
            # Update features
            if not self._update_features():
                return
            
            # Generate signals from all agents
            all_signals = []
            for agent_id, agent in self.trading_agents.items():
                signals = agent.analyze_market(self.latest_features)
                if not signals.empty:
                    all_signals.append(signals)
                    self.system_metrics["signals_generated"] += len(signals)
            
            # Combine and prioritize signals
            if all_signals:
                combined_signals = pd.concat(all_signals, ignore_index=True)
                prioritized_signals = self._prioritize_signals(combined_signals)
                
                # Execute top signals
                self._execute_signals(prioritized_signals)
            
            # Update agent positions
            self._update_agent_positions()
            
            self.last_update = datetime.now()
            
        except Exception as e:
            self.logger.error(f"Error in trading cycle: {e}")
    
    def _update_market_data(self) -> bool:
        """Update market data"""
        try:
            # Load latest data (this would connect to real data feeds in production)
            self.market_data = self.data_loader.load_sample_data("data/sample_5m.parquet")
            
            if self.market_data is None or self.market_data.empty:
                # Generate fresh synthetic data if no real data available
                generator = SyntheticDataGenerator()
                self.market_data = generator.generate_multiple_instruments()
            
            # Update order gateway with latest prices
            if self.market_data is not None:
                self.order_gateway.update_market_data(self.market_data)
                return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Failed to update market data: {e}")
            return False
    
    def _update_features(self) -> bool:
        """Update feature data"""
        try:
            if self.market_data is None:
                return False
            
            # Build features
            self.latest_features = self.feature_engineer.build_all_features(self.market_data)
            
            self.logger.info(f"Updated features: {len(self.latest_features)} rows, "
                           f"{len(self.feature_engineer.feature_columns)} features")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to update features: {e}")
            return False
    
    def _prioritize_signals(self, signals: pd.DataFrame) -> pd.DataFrame:
        """Prioritize and filter signals"""
        if signals.empty:
            return signals
        
        # Sort by confidence and risk-adjusted return
        signals["priority_score"] = (
            signals["confidence"] * 0.6 + 
            signals.get("risk_reward_ratio", 2.0) * 0.4
        )
        
        # Take top signals based on system capacity
        max_new_positions = self.config.get("global_settings", {}).get("max_concurrent_trades", 5)
        current_positions = sum(len(agent.active_positions) for agent in self.trading_agents.values())
        available_slots = max(0, max_new_positions - current_positions)
        
        if available_slots > 0:
            return signals.nlargest(available_slots, "priority_score")
        else:
            return pd.DataFrame()
    
    def _execute_signals(self, signals: pd.DataFrame):
        """Execute trading signals"""
        for _, signal in signals.iterrows():
            try:
                # Place market order
                order_result = place_market_order(
                    self.order_gateway,
                    instrument=signal["instrument"],
                    side=signal["side"],
                    quantity=signal["position_size"],
                    agent_id=signal["agent_id"],
                    strategy=signal.get("strategy_type", "UNKNOWN")
                )
                
                if order_result["status"] in ["FILLED", "SUBMITTED"]:
                    self.system_metrics["orders_placed"] += 1
                    
                    # Notify agent of execution
                    agent = self.trading_agents.get(signal["agent_id"])
                    if agent:
                        agent.execute_signal(signal.to_dict())
                    
                    self.logger.info(f"Executed signal: {signal['instrument']} "
                                   f"{signal['side']} {signal['position_size']}")
                else:
                    self.logger.warning(f"Order rejected: {order_result.get('reason', 'Unknown')}")
                
            except Exception as e:
                self.logger.error(f"Failed to execute signal: {e}")
    
    def _update_agent_positions(self):
        """Update all agent positions with current market data"""
        if self.market_data is None:
            return
        
        for agent in self.trading_agents.values():
            agent.update_positions(self.market_data)
    
    def _close_all_positions(self):
        """Close all open positions"""
        self.logger.info("Closing all open positions...")
        
        positions = self.order_gateway.get_positions()
        for instrument, quantity in positions.items():
            if abs(quantity) > 0:
                side = -1 if quantity > 0 else 1  # Opposite side to close
                
                result = place_market_order(
                    self.order_gateway,
                    instrument=instrument,
                    side=side,
                    quantity=abs(quantity),
                    agent_id="system_close",
                    strategy="position_close"
                )
                
                self.logger.info(f"Closed position {instrument}: {result['status']}")
    
    def _save_agent_states(self):
        """Save all agent states"""
        states_dir = Path("states/agents")
        states_dir.mkdir(parents=True, exist_ok=True)
        
        for agent_id, agent in self.trading_agents.items():
            state_file = states_dir / f"{agent_id}_state.json"
            agent.save_state(str(state_file))
    
    def _performance_report(self):
        """Generate performance report"""
        self.logger.info("=== PERFORMANCE REPORT ===")
        
        # System metrics
        uptime = (datetime.now() - self.last_update).total_seconds() / 3600 if self.last_update else 0
        self.system_metrics["uptime_hours"] = uptime
        
        self.logger.info(f"System Metrics: {json.dumps(self.system_metrics, indent=2)}")
        
        # Agent performance
        for agent_id, agent in self.trading_agents.items():
            performance = agent.get_performance_summary()
            self.logger.info(f"Agent {agent_id}: {json.dumps(performance, indent=2)}")
        
        # Execution stats
        execution_stats = self.order_gateway.get_execution_stats()
        self.logger.info(f"Execution Stats: {json.dumps(execution_stats, indent=2, default=str)}")
        
        # Save detailed report
        self._save_performance_report()
    
    def _save_performance_report(self):
        """Save detailed performance report"""
        reports_dir = Path("reports/orchestrator")
        reports_dir.mkdir(parents=True, exist_ok=True)
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "system_metrics": self.system_metrics,
            "agent_performance": {
                agent_id: agent.get_performance_summary() 
                for agent_id, agent in self.trading_agents.items()
            },
            "execution_stats": self.order_gateway.get_execution_stats(),
            "current_positions": self.order_gateway.get_positions(),
            "recent_trades": self.order_gateway.get_trade_history(50)
        }
        
        report_file = reports_dir / f"performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        self.logger.info(f"Performance report saved: {report_file}")
    
    def _daily_cleanup(self):
        """Daily cleanup tasks"""
        self.logger.info("Running daily cleanup...")
        
        # Archive old logs
        # Cleanup old reports
        # Reset daily metrics
        
        self.logger.info("Daily cleanup completed")
    
    def _generate_final_report(self):
        """Generate final shutdown report"""
        self.logger.info("Generating final report...")
        
        final_report = {
            "shutdown_time": datetime.now().isoformat(),
            "total_runtime_hours": self.system_metrics["uptime_hours"],
            "final_system_metrics": self.system_metrics,
            "final_agent_performance": {
                agent_id: agent.get_performance_summary() 
                for agent_id, agent in self.trading_agents.items()
            },
            "final_positions": self.order_gateway.get_positions(),
            "total_trades": len(self.order_gateway.get_trade_history())
        }
        
        reports_dir = Path("reports/orchestrator")
        reports_dir.mkdir(parents=True, exist_ok=True)
        
        final_report_file = reports_dir / f"final_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(final_report_file, 'w') as f:
            json.dump(final_report, f, indent=2, default=str)
        
        self.logger.info(f"Final report saved: {final_report_file}")

def main():
    """Main orchestrator entry point"""
    parser = argparse.ArgumentParser(description="Trading System Orchestrator")
    parser.add_argument("--mode", choices=["single", "continuous"], default="single",
                       help="Run mode: single cycle or continuous")
    parser.add_argument("--config", default="configs/strategies.yaml",
                       help="Configuration file path")
    
    args = parser.parse_args()
    
    # Create orchestrator
    orchestrator = TradingOrchestrator(args.config)
    
    if args.mode == "single":
        # Run single cycle
        success = orchestrator.run_single_cycle()
        if success:
            print("Single cycle completed successfully")
        else:
            print("Single cycle failed")
    else:
        # Run continuous mode
        orchestrator.run_continuous()

if __name__ == "__main__":
    main()
