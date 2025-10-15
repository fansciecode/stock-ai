#!/usr/bin/env python3
"""
Email Service for AI Trading Platform
Handles email verification, notifications, and reports using free email services
"""

import smtplib
import ssl
import secrets
import time
import sqlite3
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
from datetime import datetime, timedelta
import re

class EmailService:
    """
    Comprehensive email service for user verification and notifications
    Uses Gmail SMTP (free) - requires app password setup
    """
    
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = os.getenv('SMTP_EMAIL', 'ai.trader.pro.platform@gmail.com')
        self.sender_password = os.getenv('SMTP_PASSWORD', '')  # App password
        self.platform_name = "AI Trader Pro"
        self.platform_url = "http://localhost:8000"
        
        # Try to set up real email credentials
        self._setup_email_credentials()
        
        # Initialize verification database
        self.setup_verification_db()
    
    def _setup_email_credentials(self):
        """Try to set up real email credentials from environment or use defaults"""
        # Try different environment variable names
        possible_passwords = [
            os.getenv('SMTP_PASSWORD'),
            os.getenv('GMAIL_APP_PASSWORD'),
            os.getenv('EMAIL_PASSWORD'),
            os.getenv('GMAIL_PASSWORD')
        ]
        
        for password in possible_passwords:
            if password:
                self.sender_password = password
                print(f"✅ Found email credentials for: {self.sender_email}")
                return
        
        print(f"⚠️ No email credentials found - will use console mode")
        print(f"💡 To enable real emails, set SMTP_PASSWORD environment variable")
        self.sender_password = None
    
    def setup_verification_db(self):
        """Set up email verification database"""
        try:
            # Try multiple database paths
            db_paths = [
                'data/email_verification.db',
                '../../data/email_verification.db',
                '../data/email_verification.db'
            ]
            
            db_path = None
            for path in db_paths:
                try:
                    # Create directory if it doesn't exist
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    conn = sqlite3.connect(path)
                    conn.close()
                    db_path = path
                    break
                except:
                    continue
            
            if not db_path:
                db_path = 'email_verification.db'
            
            self.verification_db_path = db_path
            
            conn = sqlite3.connect(self.verification_db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS email_verifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    token TEXT UNIQUE NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    verified BOOLEAN DEFAULT FALSE,
                    verified_at TEXT,
                    ip_address TEXT,
                    user_agent TEXT
                )
            """)
            
            conn.commit()
            conn.close()
            print(f"✅ Email verification database ready: {self.verification_db_path}")
            
        except Exception as e:
            print(f"⚠️ Email verification database setup failed: {e}")
            self.verification_db_path = None
    
    def generate_verification_token(self, email, ip_address=None, user_agent=None):
        """Generate and store verification token"""
        try:
            if not self.verification_db_path:
                return None
                
            token = secrets.token_urlsafe(32)
            created_at = datetime.now().isoformat()
            expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
            
            conn = sqlite3.connect(self.verification_db_path)
            cursor = conn.cursor()
            
            # Delete any existing tokens for this email
            cursor.execute("DELETE FROM email_verifications WHERE email = ?", (email,))
            
            # Insert new token
            cursor.execute("""
                INSERT INTO email_verifications 
                (email, token, created_at, expires_at, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (email, token, created_at, expires_at, ip_address, user_agent))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Generated verification token for: {email}")
            return token
            
        except Exception as e:
            print(f"❌ Failed to generate verification token: {e}")
            return None
    
    def send_verification_email(self, email, token, user_name=None):
        """Send email verification email"""
        try:
            if not self.sender_password:
                print("⚠️ SMTP password not configured - using console mode")
                print(f"🔍 DEBUG: About to call console email for {email}")
                # Use console mode for immediate testing
                from simple_email_service import send_console_verification_email
                result = send_console_verification_email(email, token, user_name)
                print(f"🔍 DEBUG: Console email result: {result}")
                return result
            
            # Try to send real email
            print(f"📧 Attempting to send real email to: {email}")
            return self._send_real_email(email, token, user_name, email_type='verification')
            
        except Exception as e:
            print(f"❌ Email sending failed: {e}")
            # Fallback to console mode
            try:
                from simple_email_service import send_console_verification_email
                return send_console_verification_email(email, token, user_name)
            except:
                return False, f"Email sending failed: {str(e)}"
    
    def _send_real_email(self, recipient_email, token, user_name=None, email_type='verification'):
        """Send real email via SMTP"""
        try:
            # Create verification link
            verification_link = f"{self.platform_url}/verify-email?token={token}"
            
            # Email content
            subject = f"Verify Your {self.platform_name} Account"
            
            html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🤖 {self.platform_name}</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">AI-Powered Trading Platform</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Welcome{f', {user_name}' if user_name else ''}! 🎉</h2>
        
        <p>Thank you for signing up for {self.platform_name}! You're just one step away from accessing our AI-powered trading platform.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_link}" 
               style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                ✅ Verify Your Email
            </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">
            {verification_link}
        </p>
        
        <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">🚀 What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Complete your email verification</li>
                <li>Add your exchange API keys securely</li>
                <li>Choose your subscription plan</li>
                <li>Start AI-powered trading across 142+ instruments</li>
            </ul>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
            ⏰ This verification link expires in 24 hours.<br>
            🛡️ If you didn't create this account, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
            Best regards,<br>
            The {self.platform_name} Team<br>
            <em>Empowering traders with AI technology</em>
        </p>
    </div>
</body>
</html>
            """
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())
            
            print(f"✅ Verification email sent successfully to: {recipient_email}")
            return True, "Email sent successfully"
            
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            return False, f"Failed to send email: {str(e)}"
    
    def verify_token(self, token):
        """Verify email token"""
        try:
            if not self.verification_db_path:
                return False, "Email verification not available", None
                
            conn = sqlite3.connect(self.verification_db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT email, expires_at, verified 
                FROM email_verifications 
                WHERE token = ?
            """, (token,))
            
            result = cursor.fetchone()
            
            if not result:
                conn.close()
                return False, "Invalid verification token", None
            
            email, expires_at, verified = result
            
            if verified:
                conn.close()
                return False, "Email already verified", email
            
            # Check if token expired
            if datetime.now() > datetime.fromisoformat(expires_at):
                conn.close()
                return False, "Verification token expired", email
            
            # Mark as verified
            cursor.execute("""
                UPDATE email_verifications 
                SET verified = TRUE, verified_at = ?
                WHERE token = ?
            """, (datetime.now().isoformat(), token))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Email verified successfully: {email}")
            return True, "Email verified successfully", email
            
        except Exception as e:
            print(f"❌ Token verification failed: {e}")
            return False, f"Verification failed: {str(e)}", None
    
    def is_email_verified(self, email):
        """Check if email is already verified"""
        try:
            if not self.verification_db_path:
                return False
                
            conn = sqlite3.connect(self.verification_db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT verified FROM email_verifications 
                WHERE email = ? AND verified = TRUE
            """, (email,))
            
            result = cursor.fetchone()
            conn.close()
            
            return bool(result)
            
        except Exception as e:
            print(f"❌ Email verification check failed: {e}")
            return False
    
    def is_email_pending_verification(self, email):
        """Check if email has pending verification"""
        try:
            if not self.verification_db_path:
                return False
                
            conn = sqlite3.connect(self.verification_db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT token FROM email_verifications 
                WHERE email = ? AND verified = FALSE AND expires_at > ?
            """, (email, datetime.now().isoformat()))
            
            result = cursor.fetchone()
            conn.close()
            
            return bool(result)
            
        except Exception as e:
            print(f"❌ Pending verification check failed: {e}")
            return False

# Create global email service instance
try:
    email_service = EmailService()
except Exception as e:
    print(f"⚠️ Email service initialization failed: {e}")
    email_service = None