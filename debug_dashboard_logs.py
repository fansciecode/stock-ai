#!/usr/bin/env python3
"""
Debug script to check what the dashboard API is returning
"""

import requests
import json

def test_dashboard_apis():
    """Test the dashboard APIs that feed the activity log"""
    
    base_url = "http://localhost:8000"
    
    try:
        # Test trading-activity endpoint
        print("🔍 Testing /api/trading-activity...")
        response = requests.get(f"{base_url}/api/trading-activity")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                activity = data.get('activity', [])
                print(f"   📊 Found {len(activity)} activity entries")
                for i, entry in enumerate(activity[:5]):
                    print(f"   {i+1}. {entry}")
                if len(activity) > 5:
                    print(f"   ... and {len(activity) - 5} more")
            else:
                print(f"   ❌ API error: {data.get('error')}")
        else:
            print(f"   ❌ HTTP error: {response.status_code}")
        
        print("\n🔍 Testing /api/detailed-trading-activity...")
        response = requests.get(f"{base_url}/api/detailed-trading-activity")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                trades = data.get('trades', [])
                print(f"   📊 Found {len(trades)} trade entries")
                for i, trade in enumerate(trades[:3]):
                    print(f"   {i+1}. {trade.get('symbol')} {trade.get('action')} at {trade.get('timestamp')}")
                if len(trades) > 3:
                    print(f"   ... and {len(trades) - 3} more")
            else:
                print(f"   ❌ API error: {data.get('error')}")
        else:
            print(f"   ❌ HTTP error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing APIs: {e}")

if __name__ == "__main__":
    test_dashboard_apis()
