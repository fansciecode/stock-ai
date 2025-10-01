#!/usr/bin/env python3
"""
Gmail SMTP Setup for AI Trading Platform
This script helps you set up Gmail SMTP for sending real emails
"""

import os
import sys

def setup_gmail_smtp():
    """Interactive setup for Gmail SMTP"""
    
    print("🚀 Gmail SMTP Setup for AI Trading Platform")
    print("=" * 60)
    print()
    
    print("📧 To send real emails, you need to set up Gmail SMTP:")
    print()
    print("1️⃣ **Create a Gmail Account** (if you don't have one)")
    print("   - Go to https://gmail.com")
    print("   - Create account: ai.trader.pro.platform@gmail.com (or similar)")
    print()
    
    print("2️⃣ **Enable 2-Factor Authentication**")
    print("   - Go to https://myaccount.google.com/security")
    print("   - Enable 2-Step Verification")
    print()
    
    print("3️⃣ **Generate App Password**")
    print("   - Go to https://myaccount.google.com/apppasswords")
    print("   - Select 'Mail' and 'Other (custom name)'")
    print("   - Enter: 'AI Trading Platform'")
    print("   - Copy the 16-character password")
    print()
    
    print("4️⃣ **Set Environment Variables**")
    print()
    
    # Get user input
    email = input("Enter your Gmail address: ").strip()
    if not email:
        email = "ai.trader.pro.platform@gmail.com"
    
    app_password = input("Enter your Gmail App Password (16 characters): ").strip()
    
    if not app_password:
        print("❌ App password is required!")
        return False
    
    # Create environment setup
    env_content = f"""
# Gmail SMTP Configuration for AI Trading Platform
export SMTP_EMAIL="{email}"
export SMTP_PASSWORD="{app_password}"
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
"""
    
    # Write to .env file
    with open('.env', 'w') as f:
        f.write(env_content.strip())
    
    print()
    print("✅ Configuration saved to .env file!")
    print()
    print("🔧 **To activate the configuration:**")
    print()
    print("**Option 1: Load environment variables**")
    print("```bash")
    print("source .env")
    print("python3 production_dashboard.py")
    print("```")
    print()
    print("**Option 2: Export manually**")
    print("```bash")
    print(f'export SMTP_EMAIL="{email}"')
    print(f'export SMTP_PASSWORD="{app_password}"')
    print("python3 production_dashboard.py")
    print("```")
    print()
    print("**Option 3: Set in your shell profile**")
    print("Add these lines to ~/.bashrc or ~/.zshrc:")
    print(env_content)
    print()
    
    return True

def test_email_setup():
    """Test the email configuration"""
    print("🧪 Testing Email Configuration...")
    
    try:
        from email_service import email_service
        
        # Check if credentials are loaded
        if email_service.sender_password:
            print(f"✅ Email credentials found for: {email_service.sender_email}")
            
            # Test email generation
            test_email = input("Enter your email to test: ").strip()
            if test_email:
                token = email_service.generate_verification_token(test_email)
                success, message = email_service.send_verification_email(test_email, token, "Test User")
                
                if success:
                    print("✅ Test email sent successfully!")
                    print("📧 Check your inbox for the verification email")
                else:
                    print(f"❌ Test failed: {message}")
            else:
                print("⚠️ No test email provided")
        else:
            print("❌ No email credentials found")
            print("💡 Run setup first: python3 setup_gmail_smtp.py")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        test_email_setup()
    else:
        setup_gmail_smtp()

if __name__ == "__main__":
    main()
