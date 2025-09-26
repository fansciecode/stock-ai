import pandas as pd
import numpy as np
import argparse
import json
from pathlib import Path
from datetime import datetime, timedelta

class VectorBacktester:
    """Vectorized backtesting engine for trading strategies"""
    
    def __init__(self, initial_capital=100000, commission=0.001, slippage=0.0005):
        self.initial_capital = initial_capital
        self.commission = commission  # 0.1% commission
        self.slippage = slippage      # 0.05% slippage
        self.results = {}
        
    def simulate_trades(self, raw_data_path, labels_path, output_path="reports/backtest_results.json"):
        """Simulate all trades and calculate performance"""
        
        # Load data
        print("Loading data for backtesting...")
        raw_data = pd.read_parquet(raw_data_path).sort_values(["instrument", "ts"])
        labels = pd.read_parquet(labels_path).sort_values("ts")
        
        print(f"Backtesting {len(labels)} trades on {len(raw_data)} data points")
        
        # Simulate each trade
        trade_results = []
        for _, label in labels.iterrows():
            result = self._simulate_single_trade(raw_data, label)
            if result:
                trade_results.append(result)
        
        # Calculate portfolio metrics
        portfolio_results = self._calculate_portfolio_metrics(trade_results)
        
        # Combine results
        results = {
            "backtest_summary": portfolio_results,
            "trade_results": trade_results,
            "backtest_date": datetime.now().isoformat(),
            "parameters": {
                "initial_capital": self.initial_capital,
                "commission": self.commission,
                "slippage": self.slippage
            }
        }
        
        # Save results
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print(f"Backtest results saved to {output_path}")
        self._print_summary(portfolio_results)
        
        return results
    
    def _simulate_single_trade(self, raw_data, label):
        """Simulate a single trade"""
        
        instrument = label["instrument"]
        entry_time = label["ts"]
        side = label["side"]
        entry_price = label["entry"]
        stop_loss = label["stop_loss"]
        take_profit = label["take_profit"]
        horizon_minutes = label.get("horizon_minutes", 60)
        
        # Get instrument data
        inst_data = raw_data[raw_data["instrument"] == instrument].copy()
        inst_data = inst_data.sort_values("ts").reset_index(drop=True)
        
        # Find entry point
        entry_idx = inst_data[inst_data["ts"] >= entry_time].index
        if len(entry_idx) == 0:
            return None
        
        entry_idx = entry_idx[0]
        
        # Calculate actual entry price with slippage
        actual_entry = entry_price * (1 + self.slippage if side == 1 else 1 - self.slippage)
        
        # Determine exit point
        max_idx = min(len(inst_data) - 1, entry_idx + horizon_minutes // 5)  # Assuming 5min bars
        
        exit_result = self._find_exit_point(inst_data, entry_idx, max_idx, 
                                          side, stop_loss, take_profit)
        
        if not exit_result:
            return None
        
        exit_idx, exit_price, exit_reason = exit_result
        
        # Calculate trade results
        trade_result = self._calculate_trade_pnl(
            side, actual_entry, exit_price, 
            inst_data.iloc[entry_idx]["ts"], 
            inst_data.iloc[exit_idx]["ts"],
            exit_reason, label
        )
        
        return trade_result
    
    def _find_exit_point(self, data, entry_idx, max_idx, side, stop_loss, take_profit):
        """Find where the trade exits (SL, TP, or timeout)"""
        
        for i in range(entry_idx + 1, max_idx + 1):
            if i >= len(data):
                break
                
            candle = data.iloc[i]
            high, low = candle["high"], candle["low"]
            
            if side == 1:  # Long position
                if low <= stop_loss:
                    return i, stop_loss, "STOP_LOSS"
                elif high >= take_profit:
                    return i, take_profit, "TAKE_PROFIT"
            else:  # Short position
                if high >= stop_loss:
                    return i, stop_loss, "STOP_LOSS"
                elif low <= take_profit:
                    return i, take_profit, "TAKE_PROFIT"
        
        # If no SL/TP hit, exit at market close
        if max_idx < len(data):
            return max_idx, data.iloc[max_idx]["close"], "TIMEOUT"
        
        return None
    
    def _calculate_trade_pnl(self, side, entry_price, exit_price, entry_time, exit_time, exit_reason, label):
        """Calculate PnL and other trade metrics"""
        
        # Calculate returns
        if side == 1:  # Long
            gross_return = (exit_price - entry_price) / entry_price
        else:  # Short
            gross_return = (entry_price - exit_price) / entry_price
        
        # Account for costs
        total_commission = 2 * self.commission  # Entry + exit
        net_return = gross_return - total_commission
        
        # Position size (assuming equal dollar amounts)
        position_size = self.initial_capital * 0.02  # 2% of capital per trade
        pnl_dollars = position_size * net_return
        
        # Trade duration
        duration = (pd.to_datetime(exit_time) - pd.to_datetime(entry_time)).total_seconds() / 60
        
        # Create trade record
        trade_record = {
            "instrument": label["instrument"],
            "strategy": label.get("strategy", "UNKNOWN"),
            "entry_time": entry_time,
            "exit_time": exit_time,
            "duration_minutes": duration,
            "side": side,
            "entry_price": entry_price,
            "exit_price": exit_price,
            "exit_reason": exit_reason,
            "gross_return_pct": gross_return * 100,
            "net_return_pct": net_return * 100,
            "pnl_dollars": pnl_dollars,
            "position_size": position_size,
            "commission_cost": position_size * total_commission,
            "is_winner": net_return > 0,
            "risk_reward_actual": abs(gross_return) / abs((label["entry"] - label["stop_loss"]) / label["entry"]) if label["entry"] != label["stop_loss"] else 0,
            "confidence": label.get("confidence", 0.5)
        }
        
        return trade_record
    
    def _calculate_portfolio_metrics(self, trade_results):
        """Calculate overall portfolio performance metrics"""
        
        if not trade_results:
            return {"error": "No trades to analyze"}
        
        df = pd.DataFrame(trade_results)
        
        # Basic statistics
        total_trades = len(df)
        winning_trades = len(df[df["is_winner"]])
        losing_trades = total_trades - winning_trades
        win_rate = winning_trades / total_trades if total_trades > 0 else 0
        
        # PnL statistics
        total_pnl = df["pnl_dollars"].sum()
        avg_pnl = df["pnl_dollars"].mean()
        avg_winner = df[df["is_winner"]]["pnl_dollars"].mean() if winning_trades > 0 else 0
        avg_loser = df[~df["is_winner"]]["pnl_dollars"].mean() if losing_trades > 0 else 0
        
        # Return statistics
        avg_return = df["net_return_pct"].mean()
        std_return = df["net_return_pct"].std()
        sharpe_ratio = avg_return / std_return if std_return > 0 else 0
        
        # Drawdown calculation
        cumulative_pnl = df["pnl_dollars"].cumsum()
        running_max = cumulative_pnl.cummax()
        drawdown = cumulative_pnl - running_max
        max_drawdown = drawdown.min()
        max_drawdown_pct = (max_drawdown / self.initial_capital) * 100
        
        # Risk metrics
        profit_factor = abs(avg_winner * winning_trades / avg_loser / losing_trades) if losing_trades > 0 and avg_loser != 0 else float('inf')
        
        # Strategy breakdown
        strategy_performance = df.groupby("strategy").agg({
            "pnl_dollars": ["count", "sum", "mean"],
            "is_winner": "mean",
            "net_return_pct": "mean"
        }).round(4)
        
        # Convert to serializable format
        strategy_dict = {}
        for strategy in strategy_performance.index:
            strategy_dict[strategy] = {
                "trade_count": int(strategy_performance.loc[strategy, ("pnl_dollars", "count")]),
                "total_pnl": float(strategy_performance.loc[strategy, ("pnl_dollars", "sum")]),
                "avg_pnl": float(strategy_performance.loc[strategy, ("pnl_dollars", "mean")]),
                "win_rate": float(strategy_performance.loc[strategy, ("is_winner", "mean")]),
                "avg_return": float(strategy_performance.loc[strategy, ("net_return_pct", "mean")])
            }
        
        return {
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate": round(win_rate, 4),
            "total_pnl_dollars": round(total_pnl, 2),
            "avg_pnl_per_trade": round(avg_pnl, 2),
            "avg_winner_dollars": round(avg_winner, 2),
            "avg_loser_dollars": round(avg_loser, 2),
            "avg_return_pct": round(avg_return, 4),
            "std_return_pct": round(std_return, 4),
            "sharpe_ratio": round(sharpe_ratio, 4),
            "max_drawdown_dollars": round(max_drawdown, 2),
            "max_drawdown_pct": round(max_drawdown_pct, 4),
            "profit_factor": round(profit_factor, 2) if profit_factor != float('inf') else "∞",
            "total_return_pct": round((total_pnl / self.initial_capital) * 100, 4),
            "strategy_breakdown": strategy_dict
        }
    
    def _print_summary(self, results):
        """Print backtest summary"""
        print("\n" + "="*50)
        print("BACKTEST RESULTS SUMMARY")
        print("="*50)
        
        print(f"Total Trades: {results['total_trades']}")
        print(f"Win Rate: {results['win_rate']*100:.2f}%")
        print(f"Total Return: {results['total_return_pct']:.2f}%")
        print(f"Total PnL: ${results['total_pnl_dollars']:,.2f}")
        print(f"Average PnL per Trade: ${results['avg_pnl_per_trade']:,.2f}")
        print(f"Sharpe Ratio: {results['sharpe_ratio']:.4f}")
        print(f"Max Drawdown: {results['max_drawdown_pct']:.2f}%")
        print(f"Profit Factor: {results['profit_factor']}")
        
        print(f"\nWinning Trades: {results['winning_trades']}")
        print(f"Average Winner: ${results['avg_winner_dollars']:,.2f}")
        print(f"Losing Trades: {results['losing_trades']}")
        print(f"Average Loser: ${results['avg_loser_dollars']:,.2f}")

def main():
    parser = argparse.ArgumentParser(description="Run vectorized backtest")
    parser.add_argument("--raw", default="data/sample_5m.parquet",
                       help="Path to raw OHLCV data")
    parser.add_argument("--labels", default="data/labels.parquet",
                       help="Path to trading labels")
    parser.add_argument("--out", default="reports/backtest_results.json",
                       help="Output path for results")
    parser.add_argument("--capital", type=float, default=100000,
                       help="Initial capital")
    parser.add_argument("--commission", type=float, default=0.001,
                       help="Commission rate")
    parser.add_argument("--slippage", type=float, default=0.0005,
                       help="Slippage rate")
    
    args = parser.parse_args()
    
    # Run backtest
    backtester = VectorBacktester(
        initial_capital=args.capital,
        commission=args.commission,
        slippage=args.slippage
    )
    
    results = backtester.simulate_trades(args.raw, args.labels, args.out)

if __name__ == "__main__":
    main()
