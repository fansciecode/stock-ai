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
    
    def _send_real_email(self, recipient_email, token, user_name=None, email_type='verification'):
        """Send actual email using SMTP"""
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.sender_email
            msg['To'] = recipient_email
            
            if email_type == 'verification':
                msg['Subject'] = f"Verify Your {self.platform_name} Account"
                
                # Create verification link
                verification_link = f"{self.platform_url}/verify-email?token={token}"
                
                # HTML email content
                html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                        .button {{ display: inline-block; background: #4299e1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🤖 {self.platform_name}</h1>
                            <h2>Email Verification Required</h2>
                        </div>
                        <div class="content">
                            <p>Hello {user_name or 'Trader'},</p>
                            
                            <p>Welcome to {self.platform_name}! 🎉</p>
                            
                            <p>To complete your registration and start AI-powered trading, please verify your email by clicking the button below:</p>
                            
                            <div style="text-align: center;">
                                <a href="{verification_link}" class="button">✅ Verify My Email</a>
                            </div>
                            
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">{verification_link}</p>
                            
                            <p><strong>⏰ This link expires in 24 hours.</strong></p>
                            
                            <p>🛡️ If you didn't create this account, please ignore this email.</p>
                            
                            <h3>What's next after verification?</h3>
                            <ul>
                                <li>✅ Complete your onboarding process</li>
                                <li>🔑 Add your exchange API keys securely</li>
                                <li>📊 Choose your subscription plan</li>
                                <li>🚀 Start AI-powered trading</li>
                            </ul>
                            
                            <p>Best regards,<br>The {self.platform_name} Team</p>
                        </div>
                        <div class="footer">
                            <p>This email was sent to {recipient_email}</p>
                            <p>{self.platform_name} - AI-Powered Trading Platform</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                
                # Plain text version
                text_content = f"""
                Welcome to {self.platform_name}!
                
                To complete your registration, please verify your email by clicking this link:
                {verification_link}
                
                This link expires in 24 hours.
                
                If you didn't create this account, please ignore this email.
                
                Best regards,
                The {self.platform_name} Team
                """
                
            elif email_type == 'welcome':
                msg['Subject'] = f"Welcome to {self.platform_name}!"
                html_content = f"""
                <h1>Welcome to {self.platform_name}!</h1>
                <p>Your email has been verified successfully.</p>
                <p>You can now login and start trading: <a href="{self.platform_url}/login">Login Here</a></p>
                """
                text_content = f"Welcome to {self.platform_name}! Your email has been verified. Login at: {self.platform_url}/login"
            
            # Attach parts
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            
            # Send email
            print(f"🔗 Connecting to SMTP server: {self.smtp_server}:{self.smtp_port}")
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            
            text = msg.as_string()
            server.sendmail(self.sender_email, recipient_email, text)
            server.quit()
            
            print(f"✅ Real email sent successfully to: {recipient_email}")
            return True, f"Email sent to {recipient_email}"
            
        except Exception as e:
            print(f"❌ Failed to send real email: {e}")
            print(f"🔄 Falling back to console mode...")
            
            # Fallback to console mode
            if email_type == 'verification':
                from simple_email_service import send_console_verification_email
                return send_console_verification_email(recipient_email, token, user_name)
            else:
                from simple_email_service import send_console_welcome_email
                return send_console_welcome_email(recipient_email, user_name)
    
    def setup_verification_db(self):
        """Setup email verification database"""
        try:
            conn = sqlite3.connect('data/email_verification.db')
            cursor = conn.cursor()
            
            # Email verification tokens
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS email_verifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    token TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    verified BOOLEAN DEFAULT FALSE,
                    attempts INTEGER DEFAULT 0,
                    ip_address TEXT,
                    user_agent TEXT
                )
            """)
            
            # Rate limiting
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    action TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    ip_address TEXT
                )
            """)
            
            conn.commit()
            conn.close()
            print("✅ Email verification database initialized")
            
        except Exception as e:
            print(f"❌ Error setting up email verification database: {e}")
    
    def validate_email(self, email):
        """Validate email format and domain"""
        # Basic email regex
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False, "Invalid email format"
        
        # Check for disposable email domains (basic list)
        disposable_domains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'throwaway.email', 'temp-mail.org'
        ]
        
        domain = email.split('@')[1].lower()
        if domain in disposable_domains:
            return False, "Disposable email addresses not allowed"
        
        return True, "Valid email"
    
    def check_rate_limit(self, email, action, ip_address=None):
        """Check if user has exceeded rate limits"""
        try:
            conn = sqlite3.connect('data/email_verification.db')
            cursor = conn.cursor()
            
            # Check last 24 hours
            since = (datetime.now() - timedelta(hours=24)).isoformat()
            
            cursor.execute("""
                SELECT COUNT(*) FROM rate_limits 
                WHERE email = ? AND action = ? AND timestamp > ?
            """, (email, action, since))
            
            count = cursor.fetchone()[0]
            conn.close()
            
            # Limits per action
            limits = {
                'signup': 3,        # 3 signup attempts per day
                'verification': 5,  # 5 verification emails per day
                'resend': 3,        # 3 resend attempts per day
                'login': 10         # 10 login attempts per day
            }
            
            limit = limits.get(action, 5)
            
            if count >= limit:
                return False, f"Rate limit exceeded. Max {limit} {action} attempts per 24 hours"
            
            return True, "Within rate limit"
            
        except Exception as e:
            print(f"Error checking rate limit: {e}")
            return True, "Rate limit check failed, allowing request"
    
    def log_action(self, email, action, ip_address=None):
        """Log user action for rate limiting"""
        try:
            conn = sqlite3.connect('data/email_verification.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO rate_limits (email, action, timestamp, ip_address)
                VALUES (?, ?, ?, ?)
            """, (email, action, datetime.now().isoformat(), ip_address))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"Error logging action: {e}")
    
    def generate_verification_token(self, email, ip_address=None, user_agent=None):
        """Generate email verification token"""
        try:
            # Generate secure token
            token = secrets.token_urlsafe(32)
            
            # Set expiration (24 hours)
            expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
            
            conn = sqlite3.connect('data/email_verification.db')
            cursor = conn.cursor()
            
            # Invalidate old tokens for this email
            cursor.execute("""
                UPDATE email_verifications 
                SET verified = FALSE 
                WHERE email = ? AND verified = FALSE
            """, (email,))
            
            # Insert new token
            cursor.execute("""
                INSERT INTO email_verifications 
                (email, token, created_at, expires_at, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (email, token, datetime.now().isoformat(), expires_at, ip_address, user_agent))
            
            conn.commit()
            conn.close()
            
            return token
            
        except Exception as e:
            print(f"Error generating verification token: {e}")
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
            
            # Create verification link
            verification_link = f"{self.platform_url}/verify-email?token={token}"
            
            # Email content
            subject = f"Verify Your {self.platform_name} Account"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; 
                              padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                              margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                    .security-note {{ background: #fff3cd; border: 1px solid #ffeaa7; 
                                     padding: 15px; border-radius: 5px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🤖 {self.platform_name}</h1>
                        <h2>Email Verification Required</h2>
                    </div>
                    
                    <div class="content">
                        <p>Hello{f" {user_name}" if user_name else ""},</p>
                        
                        <p>Thank you for signing up for {self.platform_name}! To complete your registration and start AI-powered trading, please verify your email address.</p>
                        
                        <div style="text-align: center;">
                            <a href="{verification_link}" class="button">✅ Verify Email Address</a>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                            {verification_link}
                        </p>
                        
                        <div class="security-note">
                            <strong>🔒 Security Note:</strong>
                            <ul>
                                <li>This verification link expires in 24 hours</li>
                                <li>If you didn't create this account, please ignore this email</li>
                                <li>Never share your login credentials with anyone</li>
                            </ul>
                        </div>
                        
                        <p><strong>What happens after verification?</strong></p>
                        <ul>
                            <li>🎯 Complete your onboarding process</li>
                            <li>🔑 Add your exchange API keys securely</li>
                            <li>📊 Choose your subscription plan</li>
                            <li>🚀 Start AI-powered trading</li>
                        </ul>
                    </div>
                    
                    <div class="footer">
                        <p>© 2025 {self.platform_name}. All rights reserved.</p>
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = email
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, email, message.as_string())
            
            print(f"✅ Verification email sent to {email}")
            return True, "Verification email sent successfully"
            
        except Exception as e:
            print(f"❌ Error sending verification email: {e}")
            return False, f"Failed to send verification email: {str(e)}"
    
    def verify_token(self, token):
        """Verify email verification token"""
        try:
            conn = sqlite3.connect('data/email_verification.db')
            cursor = conn.cursor()
            
            # Find token
            cursor.execute("""
                SELECT email, expires_at, verified, attempts 
                FROM email_verifications 
                WHERE token = ?
            """, (token,))
            
            result = cursor.fetchone()
            
            if not result:
                conn.close()
                return False, "Invalid verification token", None
            
            email, expires_at, verified, attempts = result
            
            # Check if already verified
            if verified:
                conn.close()
                return False, "Email already verified", email
            
            # Check expiration
            if datetime.now() > datetime.fromisoformat(expires_at):
                conn.close()
                return False, "Verification token expired", email
            
            # Check attempts (prevent brute force)
            if attempts >= 5:
                conn.close()
                return False, "Too many verification attempts", email
            
            # Mark as verified
            cursor.execute("""
                UPDATE email_verifications 
                SET verified = TRUE, attempts = attempts + 1
                WHERE token = ?
            """, (token,))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Email verified successfully: {email}")
            return True, "Email verified successfully", email
            
        except Exception as e:
            print(f"Error verifying token: {e}")
            return False, f"Verification error: {str(e)}", None
    
    def is_email_verified(self, email):
        """Check if email is verified"""
        try:
            conn = sqlite3.connect('data/email_verification.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT verified FROM email_verifications 
                WHERE email = ? AND verified = TRUE
                ORDER BY created_at DESC LIMIT 1
            """, (email,))
            
            result = cursor.fetchone()
            conn.close()
            
            return result is not None
            
        except Exception as e:
            print(f"Error checking email verification: {e}")
            return False
    
    def is_email_pending_verification(self, email):
        """Check if email has a pending verification (not yet verified)"""
        try:
            conn = sqlite3.connect('data/email_verification.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT email FROM email_verifications 
                WHERE email = ? AND verified = FALSE AND expires_at > ?
                ORDER BY created_at DESC LIMIT 1
            """, (email, datetime.now().isoformat()))
            
            result = cursor.fetchone()
            conn.close()
            
            return result is not None
            
        except Exception as e:
            print(f"Error checking pending verification: {e}")
            return False
    
    def send_welcome_email(self, email, user_name=None):
        """Send welcome email after successful verification"""
        try:
            if not self.sender_password:
                print("⚠️ SMTP password not configured - using console mode for welcome email")
                from simple_email_service import send_console_welcome_email
                return send_console_welcome_email(email, user_name)
            
            # Send real welcome email
            print(f"📧 Sending real welcome email to: {email}")
            return self._send_real_email(email, None, user_name, email_type='welcome')
            
            subject = f"Welcome to {self.platform_name}! 🚀"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #28a745; color: white; 
                              padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                              margin: 20px 0; }}
                    .stats {{ display: flex; justify-content: space-around; margin: 20px 0; }}
                    .stat {{ text-align: center; }}
                    .stat-number {{ font-size: 24px; font-weight: bold; color: #667eea; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to {self.platform_name}!</h1>
                        <p>Your AI trading journey starts now</p>
                    </div>
                    
                    <div class="content">
                        <p>Hello{f" {user_name}" if user_name else ""},</p>
                        
                        <p>🎊 Congratulations! Your email has been verified and your {self.platform_name} account is now active.</p>
                        
                        <div class="stats">
                            <div class="stat">
                                <div class="stat-number">142+</div>
                                <div>Trading Instruments</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number">9</div>
                                <div>Major Exchanges</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number">85%+</div>
                                <div>Success Rate</div>
                            </div>
                        </div>
                        
                        <h3>🚀 Next Steps:</h3>
                        <ol>
                            <li><strong>Complete Onboarding:</strong> Follow our guided setup process</li>
                            <li><strong>Add API Keys:</strong> Connect your exchange accounts securely</li>
                            <li><strong>Choose Subscription:</strong> Select the plan that fits your needs</li>
                            <li><strong>Start Trading:</strong> Let our AI generate profits for you</li>
                        </ol>
                        
                        <div style="text-align: center;">
                            <a href="{self.platform_url}/dashboard" class="button">🎯 Complete Setup</a>
                        </div>
                        
                        <h3>🔒 Security Reminders:</h3>
                        <ul>
                            <li>Never share your login credentials</li>
                            <li>Enable 2FA when available</li>
                            <li>Use strong, unique passwords</li>
                            <li>Monitor your account regularly</li>
                        </ul>
                        
                        <p>Need help? Contact our support team or check our documentation.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create and send message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = email
            
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, email, message.as_string())
            
            return True, "Welcome email sent"
            
        except Exception as e:
            print(f"Error sending welcome email: {e}")
            return False, f"Failed to send welcome email: {str(e)}"
    
    def send_trading_report(self, email, report_data):
        """Send trading performance report"""
        try:
            if not self.sender_password:
                return True, "Demo mode: Trading report sent"
            
            subject = f"Your {self.platform_name} Trading Report 📊"
            
            # Extract report data
            total_trades = report_data.get('total_trades', 0)
            profit_loss = report_data.get('profit_loss', 0)
            success_rate = report_data.get('success_rate', 0)
            best_trade = report_data.get('best_trade', 0)
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .metric {{ background: white; padding: 20px; margin: 10px 0; border-radius: 8px; 
                             border-left: 4px solid #667eea; }}
                    .metric-value {{ font-size: 24px; font-weight: bold; color: #667eea; }}
                    .profit {{ color: #28a745; }}
                    .loss {{ color: #dc3545; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Trading Performance Report</h1>
                        <p>Your AI trading results for {datetime.now().strftime('%B %Y')}</p>
                    </div>
                    
                    <div class="content">
                        <h3>📈 Performance Summary</h3>
                        
                        <div class="metric">
                            <div>Total Trades</div>
                            <div class="metric-value">{total_trades}</div>
                        </div>
                        
                        <div class="metric">
                            <div>Profit/Loss</div>
                            <div class="metric-value {'profit' if profit_loss >= 0 else 'loss'}">
                                ${profit_loss:,.2f}
                            </div>
                        </div>
                        
                        <div class="metric">
                            <div>Success Rate</div>
                            <div class="metric-value">{success_rate:.1f}%</div>
                        </div>
                        
                        <div class="metric">
                            <div>Best Single Trade</div>
                            <div class="metric-value profit">${best_trade:,.2f}</div>
                        </div>
                        
                        <p><strong>🎯 AI Analysis:</strong> Your trading performance shows consistent results with our AI algorithms optimizing for risk-adjusted returns.</p>
                        
                        <p><a href="{self.platform_url}/performance">View Detailed Report →</a></p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create and send message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = email
            
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, email, message.as_string())
            
            return True, "Trading report sent"
            
        except Exception as e:
            print(f"Error sending trading report: {e}")
            return False, f"Failed to send trading report: {str(e)}"

# Global email service instance
email_service = EmailService()
