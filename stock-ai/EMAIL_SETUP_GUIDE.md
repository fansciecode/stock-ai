# 📧 Email Service Setup Guide

## 🎯 **Overview**

The AI Trading Platform now includes a comprehensive email verification system for enhanced security and user communication.

---

## 🔧 **Free Email Service Setup (Gmail)**

### **Step 1: Create Gmail Account**
1. Create a dedicated Gmail account for your platform (e.g., `ai-trader-pro@gmail.com`)
2. Enable 2-Factor Authentication

### **Step 2: Generate App Password**
1. Go to Google Account Settings → Security
2. Enable 2-Step Verification (if not already enabled)
3. Go to "App passwords"
4. Generate password for "Mail"
5. Copy the 16-character app password

### **Step 3: Configure Environment Variables**
```bash
# Add to your environment (.env file or system environment)
export SMTP_EMAIL="your-platform@gmail.com"
export SMTP_PASSWORD="your-16-char-app-password"
```

### **Step 4: Test Email Service**
```python
# Test script
from email_service import email_service

# Test email validation
is_valid, message = email_service.validate_email("test@example.com")
print(f"Email validation: {is_valid} - {message}")

# Test verification email (will use demo mode if no SMTP configured)
token = email_service.generate_verification_token("test@example.com")
success, message = email_service.send_verification_email("test@example.com", token)
print(f"Email sent: {success} - {message}")
```

---

## 🛡️ **Security Features Implemented**

### **1. Email Validation**
- ✅ Format validation (regex)
- ✅ Disposable email detection
- ✅ Domain validation

### **2. Rate Limiting**
- ✅ 3 signup attempts per 24 hours per email
- ✅ 5 verification emails per 24 hours per email
- ✅ 10 login attempts per 24 hours per email
- ✅ IP-based tracking

### **3. Verification System**
- ✅ Secure token generation (32-byte URL-safe)
- ✅ 24-hour expiration
- ✅ One-time use tokens
- ✅ Attempt limiting (max 5 attempts)

### **4. User Journey**
```
1. User enters email/password
2. System validates email format
3. System checks rate limits
4. System sends verification email
5. User clicks verification link
6. System creates account
7. System sends welcome email
```

---

## 📊 **Email Templates Included**

### **1. Verification Email**
- Professional design with platform branding
- Clear call-to-action button
- Security instructions
- 24-hour expiration notice

### **2. Welcome Email**
- Congratulations message
- Platform statistics
- Next steps guide
- Security reminders

### **3. Trading Reports**
- Performance metrics
- Profit/loss summary
- Success rate statistics
- Links to detailed reports

---

## 🔄 **Integration Points**

### **Signup Process**
```javascript
// Frontend handling
if (data.verification_required) {
    showMessage('📧 Verification email sent! Check your inbox.', 'info');
    // Show verification pending state
} else {
    // Handle error
}
```

### **Email Verification Route**
```
GET /verify-email?token=<verification_token>
→ Verifies token
→ Creates user account
→ Sends welcome email
→ Shows success page
```

### **Login Enhancement**
```python
# Check if email is verified before allowing login
if not email_service.is_email_verified(email):
    return jsonify({
        'success': False,
        'error': 'Please verify your email before logging in'
    })
```

---

## 📈 **Analytics & Reports**

### **Weekly Trading Reports**
```python
# Send automated reports
report_data = {
    'total_trades': 45,
    'profit_loss': 1250.50,
    'success_rate': 87.2,
    'best_trade': 340.25
}

email_service.send_trading_report(user_email, report_data)
```

### **Performance Notifications**
- Daily profit summaries
- Weekly performance reports
- Monthly analytics
- Risk alerts

---

## 🚀 **Production Deployment**

### **Environment Setup**
```bash
# Production environment variables
SMTP_EMAIL=your-production-email@gmail.com
SMTP_PASSWORD=your-app-password
PLATFORM_URL=https://your-domain.com
```

### **Database Setup**
```python
# Email verification database is automatically created
# Located at: data/email_verification.db
# Tables: email_verifications, rate_limits
```

### **Monitoring**
- Track verification rates
- Monitor email delivery
- Watch for rate limit hits
- Alert on failed verifications

---

## 🔒 **Security Best Practices**

### **1. Email Security**
- Use dedicated email account
- Enable 2FA on email account
- Rotate app passwords regularly
- Monitor email account activity

### **2. Rate Limiting**
- Implement IP-based limits
- Use progressive delays
- Log suspicious activity
- Block repeat offenders

### **3. Token Security**
- Use cryptographically secure tokens
- Short expiration times (24 hours)
- One-time use only
- Log all verification attempts

---

## 🛠️ **Customization Options**

### **Email Templates**
- Modify HTML templates in `email_service.py`
- Add company branding
- Customize colors and fonts
- Include additional information

### **Rate Limits**
```python
# Adjust limits in email_service.py
limits = {
    'signup': 3,        # Signups per day
    'verification': 5,  # Verification emails per day
    'login': 10         # Login attempts per day
}
```

### **Verification Expiry**
```python
# Change expiration time
expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
# Can be changed to minutes, days, etc.
```

---

## 📞 **Support & Troubleshooting**

### **Common Issues**

1. **"Demo mode" messages**
   - Ensure SMTP_PASSWORD is set
   - Check app password format (16 characters, no spaces)

2. **Email not received**
   - Check spam folder
   - Verify email address format
   - Check rate limits

3. **Verification fails**
   - Check token expiration
   - Verify token hasn't been used
   - Check attempt limits

### **Testing**
```bash
# Test email service
cd stock-ai/src/web_interface
python3 -c "from email_service import email_service; print('Email service loaded successfully')"
```

---

## 🎯 **Benefits**

### **Security**
- ✅ Prevents fake email signups
- ✅ Reduces spam accounts
- ✅ Enables user communication
- ✅ Implements rate limiting

### **User Experience**
- ✅ Professional email communications
- ✅ Clear verification process
- ✅ Automated reports
- ✅ Security notifications

### **Business**
- ✅ Verified user base
- ✅ Email marketing capability
- ✅ User engagement tracking
- ✅ Compliance with regulations

---

**The email verification system is now ready for production use! 🚀**
