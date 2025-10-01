#!/usr/bin/env python3
"""
Free Email Service Setup for AI Trading Platform
Sets up Gmail SMTP for free email sending
"""

import os
import getpass

def setup_gmail_smtp():
    """Setup Gmail SMTP for free email sending"""
    
    print("🚀 Setting up FREE Gmail SMTP for Email Verification")
    print("=" * 60)
    
    print("\n📧 STEP 1: Gmail Account Setup")
    print("1. Create a Gmail account for your platform (e.g., ai-trader-pro@gmail.com)")
    print("2. Or use an existing Gmail account")
    
    email = input("\nEnter your Gmail address: ").strip()
    
    print("\n🔒 STEP 2: Enable 2-Factor Authentication")
    print("1. Go to: https://myaccount.google.com/security")
    print("2. Enable 2-Step Verification if not already enabled")
    print("3. This is required for app passwords")
    
    input("Press Enter when 2FA is enabled...")
    
    print("\n🔑 STEP 3: Generate App Password")
    print("1. Go to: https://myaccount.google.com/apppasswords")
    print("2. Select 'Mail' as the app")
    print("3. Select 'Other (custom name)' as device")
    print("4. Enter 'AI Trading Platform' as the name")
    print("5. Copy the 16-character password (no spaces)")
    
    app_password = getpass.getpass("Enter the 16-character app password: ").strip()
    
    print("\n⚙️ STEP 4: Setting Environment Variables")
    
    # Create .env file
    env_content = f"""# Email Configuration for AI Trading Platform
SMTP_EMAIL={email}
SMTP_PASSWORD={app_password}
PLATFORM_URL=http://localhost:8000
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env file with email configuration")
    
    # Create shell export commands
    export_commands = f"""
# Add these to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export SMTP_EMAIL="{email}"
export SMTP_PASSWORD="{app_password}"
export PLATFORM_URL="http://localhost:8000"
"""
    
    with open('email_env_setup.sh', 'w') as f:
        f.write(export_commands)
    
    print("✅ Created email_env_setup.sh for shell configuration")
    
    print("\n🧪 STEP 5: Testing Email Service")
    
    # Test the email service
    try:
        # Set environment variables for this session
        os.environ['SMTP_EMAIL'] = email
        os.environ['SMTP_PASSWORD'] = app_password
        
        from email_service import email_service
        
        # Test email validation
        is_valid, msg = email_service.validate_email(email)
        print(f"Email validation: {'✅' if is_valid else '❌'} {msg}")
        
        # Generate test token
        token = email_service.generate_verification_token(email)
        print(f"Token generation: {'✅' if token else '❌'}")
        
        # Test sending verification email
        print("\n📤 Sending test verification email...")
        success, message = email_service.send_verification_email(email, token, "Test User")
        
        if success:
            print("✅ TEST EMAIL SENT SUCCESSFULLY!")
            print(f"Check your inbox at {email}")
        else:
            print(f"❌ Email sending failed: {message}")
            
    except Exception as e:
        print(f"❌ Error testing email service: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 EMAIL SETUP COMPLETE!")
    print("\nNext steps:")
    print("1. Check your email inbox for the test verification email")
    print("2. Restart your server to load the new environment variables")
    print("3. Test signup with email verification")
    
    print(f"\nTo restart server with email:")
    print("cd /Users/unitednewdigitalmedia/Desktop/kiran/IBCM-stack/stock-ai/src/web_interface")
    print("source ../../../email_env_setup.sh")
    print("python3 production_dashboard.py")

if __name__ == "__main__":
    setup_gmail_smtp()
