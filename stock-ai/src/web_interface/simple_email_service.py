#!/usr/bin/env python3
"""
Simple Free Email Service using EmailJS (Browser-based)
Alternative to SMTP for development/testing
"""

import requests
import json
import os
from datetime import datetime

class SimpleEmailService:
    """
    Simple email service using free services for development
    """
    
    def __init__(self):
        # For production, you can use services like:
        # - EmailJS (free tier: 200 emails/month)
        # - SendGrid (free tier: 100 emails/day)
        # - Mailgun (free tier: 5000 emails/month)
        
        self.service_type = "console"  # console, emailjs, sendgrid
        
    def send_verification_email_simple(self, email, token, user_name=None):
        """Send verification email using simple method"""
        
        verification_link = f"http://localhost:8000/verify-email?token={token}"
        
        if self.service_type == "console":
            # For development - print to console
            print("\n" + "="*60)
            print("📧 VERIFICATION EMAIL (Console Mode)")
            print("="*60)
            print(f"To: {email}")
            print(f"Subject: Verify Your AI Trader Pro Account")
            print("\nEmail Content:")
            print("-" * 40)
            print(f"Hello{f' {user_name}' if user_name else ''},")
            print()
            print("Thank you for signing up for AI Trader Pro!")
            print("Please click the link below to verify your email:")
            print()
            print(f"🔗 {verification_link}")
            print()
            print("This link expires in 24 hours.")
            print("If you didn't create this account, please ignore this email.")
            print()
            print("Best regards,")
            print("AI Trader Pro Team")
            print("-" * 40)
            print("="*60)
            
            return True, "Email displayed in console (demo mode)"
            
        elif self.service_type == "emailjs":
            # EmailJS implementation (requires frontend)
            return self._send_via_emailjs(email, verification_link, user_name)
            
        elif self.service_type == "sendgrid":
            # SendGrid implementation
            return self._send_via_sendgrid(email, verification_link, user_name)
            
        else:
            return False, "No email service configured"
    
    def _send_via_emailjs(self, email, verification_link, user_name=None):
        """Send email via EmailJS (requires browser/frontend)"""
        # EmailJS requires frontend JavaScript, so we'll simulate it
        print(f"📧 EmailJS: Would send verification email to {email}")
        print(f"🔗 Link: {verification_link}")
        return True, "EmailJS simulation (requires frontend setup)"
    
    def _send_via_sendgrid(self, email, verification_link, user_name=None):
        """Send email via SendGrid API"""
        api_key = os.getenv('SENDGRID_API_KEY')
        
        if not api_key:
            print("⚠️ SendGrid API key not configured")
            return False, "SendGrid API key not configured"
        
        # SendGrid API call would go here
        print(f"📧 SendGrid: Would send verification email to {email}")
        print(f"🔗 Link: {verification_link}")
        return True, "SendGrid simulation (API key needed)"

# Create simple email service instance
simple_email_service = SimpleEmailService()

def send_console_verification_email(email, token, user_name=None):
    """
    Simple function to send verification email to console
    Use this for immediate testing without SMTP setup
    """
    verification_link = f"http://localhost:8000/verify-email?token={token}"
    
    print("\n" + "🚀" * 30)
    print("📧 EMAIL VERIFICATION REQUIRED")
    print("🚀" * 30)
    print(f"""
📧 TO: {email}
📋 SUBJECT: Verify Your AI Trader Pro Account

Hello{f' {user_name}' if user_name else ''},

Welcome to AI Trader Pro! 🎉

To complete your registration and start AI-powered trading, 
please verify your email by clicking the link below:

🔗 VERIFICATION LINK:
{verification_link}

⏰ This link expires in 24 hours.
🛡️ If you didn't create this account, please ignore this email.

What's next after verification?
✅ Complete your onboarding process
🔑 Add your exchange API keys securely  
📊 Choose your subscription plan
🚀 Start AI-powered trading

Best regards,
The AI Trader Pro Team

---
This is a development email (console mode).
In production, this will be sent to your actual email.
""")
    print("🚀" * 30)
    print()
    
    return True, "Verification email displayed in console"

if __name__ == "__main__":
    # Test the simple email service
    print("🧪 Testing Simple Email Service...")
    
    # Test console email
    success, message = send_console_verification_email(
        "test@example.com", 
        "sample_token_123", 
        "Test User"
    )
    
    print(f"Result: {success} - {message}")
