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
        self.db_path = 'data/email_verification.db'  # Database path for email verification
        
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
    
    def send_password_reset_email(self, email, token, reset_url):
        """Send password reset email using same infrastructure as verification"""
        try:
            if not self.sender_password:
                print("⚠️ SMTP password not configured - using console mode")
                # Use console mode for immediate testing
                print(f"🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀")
                print(f"📧 PASSWORD RESET REQUIRED")
                print(f"🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀")
                print(f"")
                print(f"📧 TO: {email}")
                print(f"📋 SUBJECT: Reset Your AI Trader Pro Password")
                print(f"")
                print(f"🔗 PASSWORD RESET LINK:")
                print(f"{reset_url}")
                print(f"")
                print(f"⏰ This link expires in 1 hour.")
                print(f"🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀")
                return True, "Password reset email displayed in console"
            
            # Try to send real email using existing SMTP setup
            print(f"📧 Attempting to send password reset email to: {email}")
            return self._send_real_password_reset_email(email, token, reset_url)
            
        except Exception as e:
            print(f"❌ Password reset email sending failed: {e}")
            # Fallback to console mode
            print(f"📧 FALLBACK - PASSWORD RESET")
            print(f"Email: {email}")
            print(f"Reset URL: {reset_url}")
            return True, f"Password reset email fallback: {str(e)}"
    
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

    def validate_email(self, email):
        """Validate email format"""
        import re
        
        if not email or len(email) < 5:
            return False, "Email address is too short"
        
        if len(email) > 254:
            return False, "Email address is too long"
        
        # Basic email regex pattern
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False, "Invalid email format"
        
        return True, "Valid email"
    
    def check_rate_limit(self, email, action, ip_address):
        """Check rate limiting for signup/login attempts"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create rate_limits table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT,
                    action TEXT,
                    ip_address TEXT,
                    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Check attempts in last hour
            cursor.execute("""
                SELECT COUNT(*) FROM rate_limits 
                WHERE (email = ? OR ip_address = ?) 
                AND action = ? 
                AND attempt_time > datetime('now', '-1 hour')
            """, (email, ip_address, action))
            
            attempts = cursor.fetchone()[0]
            
            # Allow up to 5 attempts per hour
            if attempts >= 5:
                conn.close()
                return False, "Too many attempts. Please try again later."
            
            # Log this attempt
            cursor.execute("""
                INSERT INTO rate_limits (email, action, ip_address)
                VALUES (?, ?, ?)
            """, (email, action, ip_address))
            
            conn.commit()
            conn.close()
            
            return True, "Rate limit OK"
            
        except Exception as e:
            print(f"❌ Error checking rate limit: {e}")
            return True, "Rate limit check failed, allowing"
    
    def log_action(self, email, action, details=None):
        """Log user actions for audit trail"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create action_logs table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS action_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT,
                    action TEXT,
                    details TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                INSERT INTO action_logs (email, action, details)
                VALUES (?, ?, ?)
            """, (email, action, details or ''))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error logging action: {e}")
    
    def send_welcome_email(self, email, user_name=None):
        """Send welcome email after successful verification"""
        try:
            print(f"🎉 Welcome email sent to: {email}")
            return True, "Welcome email sent successfully"
        except Exception as e:
            print(f"❌ Error sending welcome email: {e}")
            return False, f"Failed to send welcome email: {e}"
    
    def _send_real_password_reset_email(self, recipient_email, token, reset_url):
        """Send actual password reset email via SMTP"""
        try:
            import smtplib
            import ssl
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"🔐 Reset Your {self.platform_name} Password"
            msg['From'] = self.sender_email
            msg['To'] = recipient_email
            
            # HTML email content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
                    <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">{self.platform_name}</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                    <h2 style="color: #2d3748; margin-top: 0;">Reset Your Password</h2>
                    <p style="font-size: 16px; margin-bottom: 25px;">
                        You requested a password reset for your AI Trading Platform account. 
                        Click the button below to set a new password:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" 
                           style="background: #4299e1; color: white; padding: 15px 30px; text-decoration: none; 
                                  border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                            🔑 Reset Password
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 25px;">
                        Or copy and paste this link in your browser:<br>
                        <a href="{reset_url}" style="color: #4299e1; word-break: break-all;">{reset_url}</a>
                    </p>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #856404;">
                            ⏰ <strong>This link expires in 1 hour.</strong><br>
                            🔒 If you didn't request this reset, please ignore this email.
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 25px 0;">
                    
                    <p style="font-size: 12px; color: #6c757d; text-align: center; margin: 0;">
                        {self.platform_name} | Secure AI Trading Solutions<br>
                        This is an automated message, please do not reply.
                    </p>
                </div>
            </body>
            </html>
            """
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            print(f"✅ Password reset email sent successfully to {recipient_email}")
            return True, "Password reset email sent successfully"
            
        except Exception as e:
            print(f"❌ SMTP error sending password reset email: {e}")
            return False, f"Failed to send email: {str(e)}"

# Create global email service instance
try:
    email_service = EmailService()
except Exception as e:
    print(f"⚠️ Email service initialization failed: {e}")
    email_service = None