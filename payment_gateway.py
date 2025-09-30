#!/usr/bin/env python3
"""
Payment Gateway Integration for AI Trading Platform
Supports Razorpay, Stripe, and demo payment processing
"""

import hashlib
import hmac
import json
import time
import uuid
from typing import Dict, Optional
import requests
from datetime import datetime

class PaymentGateway:
    def __init__(self, razorpay_key_id=None, razorpay_key_secret=None):
        # Use provided keys or demo keys
        if razorpay_key_id and razorpay_key_secret:
            self.razorpay_config = {
                'key_id': razorpay_key_id,
                'key_secret': razorpay_key_secret,
                'webhook_secret': 'whsec_real_webhook'
            }
            self.use_real_razorpay = True
            print(f"✅ Razorpay initialized with real keys: {razorpay_key_id[:10]}...")
        else:
            # Demo Configuration
            self.razorpay_config = {
                'key_id': 'rzp_test_demo_12345',
                'key_secret': 'demo_secret_razorpay',
                'webhook_secret': 'whsec_demo_webhook'
            }
            self.use_real_razorpay = False
            print("⚠️ Using demo Razorpay keys")
        
        # Initialize Razorpay client if real keys are provided
        if self.use_real_razorpay:
            try:
                import razorpay
                self.razorpay_client = razorpay.Client(auth=(self.razorpay_config['key_id'], self.razorpay_config['key_secret']))
                print(f"✅ Razorpay client initialized successfully")
            except ImportError:
                print("⚠️ Razorpay library not installed. Install with: pip install razorpay")
                self.use_real_razorpay = False
            except Exception as e:
                print(f"⚠️ Failed to initialize Razorpay client: {e}")
                self.use_real_razorpay = False
        
        self.stripe_config = {
            'secret_key': 'sk_test_demo_stripe_key',
            'webhook_secret': 'whsec_demo_stripe'
        }
    
    def create_razorpay_order(self, amount: float, currency: str = 'INR', 
                             user_email: str = '', description: str = '') -> Dict:
        """Create Razorpay order for payment"""
        try:
            # For demo purposes, simulate different scenarios
            order_id = f"order_demo_{int(time.time())}"
            
            # Demo logic: amounts under ₹500 succeed, above fail
            if amount <= 500:
                status = 'created'
                demo_result = 'success'
            else:
                status = 'failed'
                demo_result = 'failure'
            
            order_data = {
                'id': order_id,
                'entity': 'order',
                'amount': int(amount * 100),  # Razorpay expects paise
                'amount_paid': 0,
                'amount_due': int(amount * 100),
                'currency': currency,
                'receipt': f"receipt_{uuid.uuid4().hex[:8]}",
                'status': status,
                'attempts': 0,
                'notes': {
                    'user_email': user_email,
                    'description': description,
                    'demo_mode': True,
                    'demo_result': demo_result
                },
                'created_at': int(time.time())
            }
            
            print(f"🏦 Created Razorpay order: {order_id} for ₹{amount} ({demo_result})")
            
            return {
                'success': True,
                'order': order_data,
                'demo_mode': True,
                'expected_result': demo_result
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_razorpay_payment(self, payment_id: str, order_id: str, signature: str) -> Dict:
        """Verify Razorpay payment signature"""
        try:
            # For demo purposes, simulate verification
            # In production, use: razorpay_signature = hmac.new(key_secret, payload, hashlib.sha256).hexdigest()
            
            # Demo logic: orders with 'success' in notes succeed
            if 'demo' in order_id:
                # Simulate payment verification
                verification_success = True  # Always succeed in demo
                
                payment_data = {
                    'id': payment_id,
                    'entity': 'payment',
                    'amount': 50000,  # ₹500 in paise
                    'currency': 'INR',
                    'status': 'captured',
                    'order_id': order_id,
                    'method': 'card',
                    'description': 'AI Trading Platform Subscription',
                    'captured': True,
                    'email': 'demo@example.com',
                    'contact': '+919876543210',
                    'created_at': int(time.time())
                }
                
                return {
                    'success': True,
                    'verified': verification_success,
                    'payment': payment_data
                }
            else:
                return {
                    'success': False,
                    'error': 'Invalid payment verification'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_stripe_payment_intent(self, amount: float, currency: str = 'inr', 
                                   user_email: str = '', description: str = '') -> Dict:
        """Create Stripe payment intent"""
        try:
            # Demo Stripe implementation
            intent_id = f"pi_demo_{int(time.time())}"
            client_secret = f"{intent_id}_secret_demo"
            
            # Demo logic: amounts under $10 succeed
            if amount <= 10:
                status = 'requires_payment_method'
                demo_result = 'success'
            else:
                status = 'requires_payment_method'
                demo_result = 'failure'
            
            intent_data = {
                'id': intent_id,
                'object': 'payment_intent',
                'amount': int(amount * 100),  # Stripe expects cents
                'currency': currency,
                'status': status,
                'client_secret': client_secret,
                'description': description,
                'metadata': {
                    'user_email': user_email,
                    'demo_mode': 'true',
                    'demo_result': demo_result
                }
            }
            
            print(f"💳 Created Stripe payment intent: {intent_id} for {amount} {currency.upper()}")
            
            return {
                'success': True,
                'payment_intent': intent_data,
                'demo_mode': True,
                'expected_result': demo_result
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def simulate_payment_success(self, order_id: str, amount: float) -> Dict:
        """Simulate successful payment for demo purposes"""
        payment_id = f"pay_demo_success_{int(time.time())}"
        
        webhook_data = {
            'entity': 'event',
            'account_id': 'demo_account',
            'event': 'payment.captured',
            'contains': ['payment'],
            'payload': {
                'payment': {
                    'entity': {
                        'id': payment_id,
                        'entity': 'payment',
                        'amount': int(amount * 100),
                        'currency': 'INR',
                        'status': 'captured',
                        'order_id': order_id,
                        'method': 'card',
                        'captured': True,
                        'created_at': int(time.time())
                    }
                }
            },
            'created_at': int(time.time())
        }
        
        return {
            'success': True,
            'payment_id': payment_id,
            'webhook_data': webhook_data,
            'demo_mode': True
        }
    
    def simulate_payment_failure(self, order_id: str, amount: float) -> Dict:
        """Simulate failed payment for demo purposes"""
        payment_id = f"pay_demo_fail_{int(time.time())}"
        
        webhook_data = {
            'entity': 'event',
            'account_id': 'demo_account',
            'event': 'payment.failed',
            'contains': ['payment'],
            'payload': {
                'payment': {
                    'entity': {
                        'id': payment_id,
                        'entity': 'payment',
                        'amount': int(amount * 100),
                        'currency': 'INR',
                        'status': 'failed',
                        'order_id': order_id,
                        'method': 'card',
                        'error_code': 'BAD_REQUEST_ERROR',
                        'error_description': 'Insufficient funds in demo account',
                        'created_at': int(time.time())
                    }
                }
            },
            'created_at': int(time.time())
        }
        
        return {
            'success': False,
            'payment_id': payment_id,
            'webhook_data': webhook_data,
            'demo_mode': True,
            'error': 'Demo payment failure simulation'
        }
    
    def generate_payment_button_html(self, order_id: str, amount: float, 
                                   user_email: str, description: str) -> str:
        """Generate HTML for payment button"""
        
        # For demo purposes, create simple payment buttons
        html = f"""
        <div class="payment-options" style="margin: 20px 0;">
            <h3>💳 Payment Options</h3>
            
            <!-- Razorpay Payment -->
            <div class="payment-method" style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <h4>🏦 Razorpay (Recommended for India)</h4>
                <p>Amount: ₹{amount}</p>
                <p>Description: {description}</p>
                <button onclick="processRazorpayPayment('{order_id}', {amount})" 
                        class="btn btn-primary" style="margin: 5px;">
                    💰 Pay with Razorpay
                </button>
                <button onclick="simulatePaymentSuccess('{order_id}', {amount})" 
                        class="btn btn-success" style="margin: 5px;">
                    ✅ Demo Success
                </button>
                <button onclick="simulatePaymentFailure('{order_id}', {amount})" 
                        class="btn btn-danger" style="margin: 5px;">
                    ❌ Demo Failure
                </button>
            </div>
            
            <!-- Stripe Payment -->
            <div class="payment-method" style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <h4>💳 Stripe (International)</h4>
                <p>Amount: ${amount / 83:.2f} USD (approx)</p>
                <button onclick="processStripePayment('{order_id}', {amount})" 
                        class="btn btn-primary" style="margin: 5px;">
                    🌐 Pay with Stripe
                </button>
            </div>
            
            <!-- Bank Transfer -->
            <div class="payment-method" style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <h4>🏧 Bank Transfer</h4>
                <p>Account: AI Trading Platform</p>
                <p>IFSC: DEMO001</p>
                <p>Account Number: 1234567890</p>
                <button onclick="showBankTransferDetails()" class="btn btn-secondary">
                    📄 View Details
                </button>
            </div>
        </div>
        
        <script>
        function processRazorpayPayment(orderId, amount) {{
            // In production, integrate with actual Razorpay SDK
            console.log('Processing Razorpay payment:', orderId, amount);
            
            // Simulate payment processing
            setTimeout(() => {{
                if (amount <= 500) {{
                    simulatePaymentSuccess(orderId, amount);
                }} else {{
                    simulatePaymentFailure(orderId, amount);
                }}
            }}, 2000);
            
            // Show processing state
            event.target.textContent = '⏳ Processing...';
            event.target.disabled = true;
        }}
        
        function processStripePayment(orderId, amount) {{
            // In production, integrate with actual Stripe SDK
            console.log('Processing Stripe payment:', orderId, amount);
            alert('💳 Stripe integration coming soon!\\nFor demo, use Razorpay buttons.');
        }}
        
        function simulatePaymentSuccess(orderId, amount) {{
            console.log('Simulating payment success:', orderId, amount);
            
            fetch('/api/payment-webhook', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{
                    order_id: orderId,
                    status: 'SUCCESS',
                    amount: amount,
                    payment_id: 'pay_demo_success_' + Date.now(),
                    demo_mode: true
                }})
            }})
            .then(response => response.json())
            .then(data => {{
                if (data.success) {{
                    alert('✅ Payment Successful!\\nYour subscription has been activated.');
                    location.reload();
                }} else {{
                    alert('❌ Payment processing failed: ' + data.error);
                }}
            }})
            .catch(error => {{
                alert('❌ Payment error: ' + error.message);
            }});
        }}
        
        function simulatePaymentFailure(orderId, amount) {{
            console.log('Simulating payment failure:', orderId, amount);
            
            fetch('/api/payment-webhook', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{
                    order_id: orderId,
                    status: 'FAILED',
                    amount: amount,
                    payment_id: 'pay_demo_fail_' + Date.now(),
                    demo_mode: true,
                    error: 'Demo payment failure simulation'
                }})
            }})
            .then(response => response.json())
            .then(data => {{
                alert('❌ Payment Failed!\\nThis is a demo failure simulation.\\nTry the "Demo Success" button instead.');
            }})
            .catch(error => {{
                alert('❌ Payment error: ' + error.message);
            }});
        }}
        
        function showBankTransferDetails() {{
            alert('🏧 Bank Transfer Details:\\n\\n' +
                  'Account Name: AI Trading Platform\\n' +
                  'IFSC Code: DEMO001\\n' +
                  'Account Number: 1234567890\\n' +
                  'Amount: ₹{amount}\\n\\n' +
                  'After transfer, email payment proof to:\\n' +
                  'payments@aitradingplatform.com');
        }}
        </script>
        """
        
        return html

# Global instance
payment_gateway = PaymentGateway()
