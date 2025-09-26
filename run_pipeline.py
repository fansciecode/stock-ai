#!/usr/bin/env python3
"""
Complete Pipeline Runner for Stock AI Trading System

This script runs the entire pipeline from data generation to trading execution.
Perfect for testing the complete system end-to-end.
"""

import os
import sys
import subprocess
import time
import json
from pathlib import Path
from datetime import datetime

def run_command(cmd, description, cwd=None):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"STEP: {description}")
    print(f"Command: {cmd}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            cwd=cwd,
            capture_output=True, 
            text=True, 
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            print("✅ SUCCESS")
            if result.stdout:
                print("Output:", result.stdout[-500:])  # Last 500 chars
            return True
        else:
            print("❌ FAILED")
            print("Error:", result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ TIMEOUT - Command took too long")
        return False
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        return False

def check_file_exists(file_path, description):
    """Check if a file exists and print status"""
    if Path(file_path).exists():
        size = Path(file_path).stat().st_size
        print(f"✅ {description}: {file_path} ({size:,} bytes)")
        return True
    else:
        print(f"❌ {description}: {file_path} (NOT FOUND)")
        return False

def main():
    print("""
    🚀 Stock AI Trading System - Complete Pipeline Runner
    =====================================================
    
    This script will run the complete trading system pipeline:
    1. Generate synthetic market data
    2. Build technical features
    3. Generate trading labels
    4. Train ML model
    5. Run backtesting
    6. Execute trading system
    
    """)
    
    # Change to stock-ai directory
    stock_ai_dir = Path(__file__).parent
    os.chdir(stock_ai_dir)
    
    print(f"Working directory: {os.getcwd()}")
    
    # Create necessary directories
    directories = [
        "data", "models", "reports", "logs", 
        "logs/agents", "logs/execution", "logs/orchestrator",
        "reports/orchestrator", "states/agents"
    ]
    
    for dir_path in directories:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    
    pipeline_success = True
    
    # Step 1: Generate synthetic data
    if not run_command(
        "python3 src/data/sample_generator.py",
        "Generate synthetic market data"
    ):
        pipeline_success = False
    
    check_file_exists("data/sample_5m.parquet", "Sample data file")
    
    # Step 2: Build features
    if not run_command(
        "python3 src/features/build_features.py --input data/sample_5m.parquet --output data/features.parquet",
        "Build technical features"
    ):
        pipeline_success = False
    
    check_file_exists("data/features.parquet", "Features file")
    
    # Step 3: Generate labels
    if not run_command(
        "python3 src/labeling/label_pipeline.py --features data/features.parquet --out data/labels.parquet",
        "Generate trading labels"
    ):
        pipeline_success = False
    
    check_file_exists("data/labels.parquet", "Labels file")
    
    # Step 4: Train ML model
    if not run_command(
        "python3 src/models/train.py --features data/features.parquet --labels data/labels.parquet --out models/trading_model.joblib",
        "Train ML model"
    ):
        pipeline_success = False
    
    check_file_exists("models/trading_model.joblib", "Trained model file")
    
    # Step 5: Run backtest
    if not run_command(
        "python3 src/backtest/vector_backtest.py --raw data/sample_5m.parquet --labels data/labels.parquet --out reports/backtest_results.json",
        "Run backtesting"
    ):
        pipeline_success = False
    
    check_file_exists("reports/backtest_results.json", "Backtest results")
    
    # Step 6: Test order gateway
    if not run_command(
        "python3 src/execution/order_gateway.py",
        "Test order execution system"
    ):
        print("⚠️  Order gateway test failed, continuing...")
    
    # Step 7: Run single trading cycle
    if not run_command(
        "python3 src/orchestrator/orchestrator.py --mode single",
        "Run trading system (single cycle)"
    ):
        pipeline_success = False
    
    # Print summary
    print(f"\n{'='*80}")
    print("PIPELINE SUMMARY")
    print(f"{'='*80}")
    
    if pipeline_success:
        print("🎉 PIPELINE COMPLETED SUCCESSFULLY!")
        
        # Show key results
        print("\nKey Results:")
        
        # Backtest results
        try:
            with open("reports/backtest_results.json", 'r') as f:
                backtest = json.load(f)
            
            summary = backtest.get("backtest_summary", {})
            print(f"📊 Backtest Results:")
            print(f"   - Total Trades: {summary.get('total_trades', 'N/A')}")
            print(f"   - Win Rate: {summary.get('win_rate', 'N/A')}")
            print(f"   - Total Return: {summary.get('total_return_pct', 'N/A')}%")
            print(f"   - Sharpe Ratio: {summary.get('sharpe_ratio', 'N/A')}")
            print(f"   - Max Drawdown: {summary.get('max_drawdown_pct', 'N/A')}%")
            
        except Exception as e:
            print(f"Could not read backtest results: {e}")
        
        # File sizes
        print(f"\n📁 Generated Files:")
        files_to_check = [
            ("data/sample_5m.parquet", "Market Data"),
            ("data/features.parquet", "Features"),
            ("data/labels.parquet", "Labels"),
            ("models/trading_model.joblib", "ML Model"),
            ("reports/backtest_results.json", "Backtest Results")
        ]
        
        for file_path, description in files_to_check:
            check_file_exists(file_path, description)
        
        print(f"\n🎯 Next Steps:")
        print("1. Review backtest results in reports/backtest_results.json")
        print("2. Check logs in logs/ directory for detailed execution info")
        print("3. Modify strategy parameters in configs/strategies.yaml")
        print("4. Run continuous mode: python src/orchestrator/orchestrator.py --mode continuous")
        print("5. Add real data sources and connect to live brokers (with caution!)")
        
    else:
        print("❌ PIPELINE FAILED")
        print("\nTroubleshooting:")
        print("1. Check error messages above")
        print("2. Ensure all dependencies are installed: pip install -r requirements.txt")
        print("3. Check that you're in the correct directory")
        print("4. Review logs in logs/ directory")
        print("5. Try running individual steps manually")
    
    print(f"\n📝 Log files:")
    print("- Complete pipeline log: logs/")
    print("- Trading agents: logs/agents/")
    print("- Order execution: logs/execution/")
    print("- System orchestrator: logs/orchestrator/")
    
    print(f"\n🕒 Pipeline completed at: {datetime.now()}")
    
    return pipeline_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
