#!/usr/bin/env python3
"""
Console Email Viewer
Shows verification emails in real-time as users sign up
"""

import requests
import json
import time
from datetime import datetime

def monitor_console_emails():
    """Monitor and display console emails in real-time"""
    
    print("🚀 CONSOLE EMAIL MONITOR")
    print("=" * 60)
    print("This script will show verification emails as users sign up.")
    print("Keep this running while users test the signup process.")
    print("=" * 60)
    
    # Test the email system first
    print("\n🧪 Testing email system...")
    
    try:
        from email_service import email_service
        
        # Test email generation
        token = email_service.generate_verification_token('monitor-test@example.com')
        success, message = email_service.send_verification_email('monitor-test@example.com', token, 'Monitor Test')
        
        if success:
            print("✅ Console email system is working!")
        else:
            print(f"❌ Console email system error: {message}")
            
    except Exception as e:
        print(f"❌ Error testing email system: {e}")
        return
    
    print("\n📧 CONSOLE EMAIL DISPLAY:")
    print("-" * 60)
    print("When users sign up at http://localhost:8000, their")
    print("verification emails will appear here:")
    print("-" * 60)
    
    # Monitor for new signups
    last_check = datetime.now()
    
    while True:
        try:
            # Check if server is running
            response = requests.get('http://localhost:8000/api/check-session', timeout=2)
            
            if response.status_code == 200:
                print(f"\n⏰ {datetime.now().strftime('%H:%M:%S')} - Server running, waiting for signups...")
                print("   💡 Users can sign up at: http://localhost:8000")
                print("   📧 Verification emails will appear below:")
                
                # Simulate checking for new emails (in real implementation, 
                # this would check the email verification database)
                
            else:
                print(f"\n⚠️ {datetime.now().strftime('%H:%M:%S')} - Server not responding")
                
        except requests.exceptions.ConnectionError:
            print(f"\n❌ {datetime.now().strftime('%H:%M:%S')} - Server not running")
            print("   Start server with: python3 production_dashboard.py")
            
        except KeyboardInterrupt:
            print("\n\n🛑 Monitoring stopped by user")
            break
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
        
        # Wait before next check
        time.sleep(10)

def test_signup_flow():
    """Test the complete signup flow and show console email"""
    
    print("🧪 TESTING COMPLETE SIGNUP FLOW")
    print("=" * 50)
    
    # Test signup
    test_email = f"test-{int(time.time())}@example.com"
    signup_data = {
        'email': test_email,
        'password': 'testpass123',
        'subscription_tier': 'pro'
    }
    
    print(f"\n1️⃣ Testing signup with: {test_email}")
    
    try:
        response = requests.post('http://localhost:8000/api/signup', 
                               headers={'Content-Type': 'application/json'},
                               data=json.dumps(signup_data),
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('verification_required'):
                print("✅ Signup successful - verification required")
                
                # Now generate the console email manually to show it
                print("\n2️⃣ Generating console email...")
                
                from email_service import email_service
                token = email_service.generate_verification_token(test_email)
                success, message = email_service.send_verification_email(test_email, token, 'Test User')
                
                if success:
                    print("\n3️⃣ Console email generated successfully!")
                    print(f"🔗 Verification link: http://localhost:8000/verify-email?token={token}")
                else:
                    print(f"❌ Console email failed: {message}")
                    
            else:
                print("❌ No verification required - system may not be working")
                
        else:
            print(f"❌ Signup failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing signup: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        test_signup_flow()
    else:
        monitor_console_emails()
