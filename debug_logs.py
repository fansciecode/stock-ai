#!/usr/bin/env python3
"""
Quick debug script to check if trading engine is actually creating duplicate positions
"""

import re
import time
from collections import defaultdict

def analyze_logs():
    """Analyze trading logs for duplicate patterns"""
    
    log_file = 'logs/fixed_continuous_trading.log'
    patterns = defaultdict(list)
    
    try:
        with open(log_file, 'r') as f:
            lines = f.readlines()
            recent_lines = lines[-200:] if len(lines) > 200 else lines
        
        print(f"📊 Analyzing last {len(recent_lines)} log lines...")
        
        for line in recent_lines:
            # Look for position creation patterns
            if '🎭 SIMULATED: New position' in line:
                # Extract timestamp and symbol
                match = re.search(r'(\d{2}:\d{2}:\d{2}).*New position (\S+)', line)
                if match:
                    timestamp, symbol = match.groups()
                    patterns[symbol].append(timestamp)
        
        print("\n🔍 Position Creation Analysis:")
        for symbol, timestamps in patterns.items():
            count = len(timestamps)
            if count > 1:
                print(f"❌ {symbol}: Created {count} times - {timestamps[:5]}{'...' if count > 5 else ''}")
            else:
                print(f"✅ {symbol}: Created {count} time")
        
        # Check for frequent duplicates
        duplicates = {k: v for k, v in patterns.items() if len(v) > 3}
        if duplicates:
            print(f"\n🚨 CRITICAL: {len(duplicates)} symbols with excessive duplicates!")
            for symbol, timestamps in list(duplicates.items())[:3]:
                print(f"   {symbol}: {len(timestamps)} creations")
        else:
            print("\n✅ No excessive duplicates found")
            
    except FileNotFoundError:
        print("❌ Log file not found")
    except Exception as e:
        print(f"❌ Error analyzing logs: {e}")

if __name__ == "__main__":
    analyze_logs()
