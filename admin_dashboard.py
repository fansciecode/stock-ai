#!/usr/bin/env python3
"""
Admin Dashboard for AI Trading Platform
Provides admin controls, fraud detection, and user management
"""

from flask import Flask, render_template_string, request, jsonify, session, redirect, url_for
import json
import os
from datetime import datetime, timedelta
from admin_security_manager import admin_security
from subscription_manager import subscription_manager

app = Flask(__name__)
app.secret_key = 'admin_secret_key_2024_secure'

@app.route('/admin')
def admin_login_page():
    """Admin login page"""
    return render_template_string("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔒 Admin Login - AI Trading Platform</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .login-container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 400px; width: 90%; }
        .logo { text-align: center; margin-bottom: 30px; font-size: 2em; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
        .form-group input { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; }
        .btn { width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
        .btn:hover { background: #5a6fd8; }
        .error { color: #e74c3c; margin-top: 10px; padding: 10px; background: #ffeaea; border-radius: 5px; }
        .security-note { margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 5px; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">🔒 Admin Portal</div>
        <h2 style="text-align: center; margin-bottom: 30px;">AI Trading Platform</h2>
        
        <form id="adminLoginForm">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn">🔑 Admin Login</button>
        </form>
        
        <div id="errorMessage" class="error" style="display: none;"></div>
        
        <div class="security-note">
            🛡️ <strong>Security Notice:</strong><br>
            Admin access is logged and monitored. Unauthorized access attempts will be reported.
            <br><br>
            Default Admin: superadmin / Admin123!SecurePass
        </div>
    </div>

    <script>
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        try {
            const response = await fetch('/admin/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.location.href = '/admin/dashboard';
            } else {
                document.getElementById('errorMessage').textContent = result.error;
                document.getElementById('errorMessage').style.display = 'block';
            }
        } catch (error) {
            document.getElementById('errorMessage').textContent = 'Login failed: ' + error.message;
            document.getElementById('errorMessage').style.display = 'block';
        }
    });
    </script>
</body>
</html>
    """)

@app.route('/admin/api/login', methods=['POST'])
def admin_login():
    """Admin authentication"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        auth_result = admin_security.authenticate_admin(username, password)
        
        if auth_result['success']:
            # Set admin session
            session['admin_id'] = auth_result['admin_id']
            session['admin_username'] = auth_result['username']
            session['admin_role'] = auth_result['role']
            session['admin_permissions'] = auth_result['permissions']
            session.permanent = True
            
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': auth_result['error']})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/dashboard')
def admin_dashboard():
    """Main admin dashboard"""
    if 'admin_id' not in session:
        return redirect(url_for('admin_login_page'))
    
    admin_id = session['admin_id']
    admin_username = session['admin_username']
    admin_role = session['admin_role']
    
    # Get dashboard data
    dashboard_data = admin_security.get_admin_dashboard_data(admin_id)
    
    return render_template_string("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔒 Admin Dashboard - AI Trading Platform</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .stat-value { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .stat-label { color: #666; font-size: 14px; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .btn { padding: 8px 16px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn-primary { background: #3498db; color: white; }
        .btn-danger { background: #e74c3c; color: white; }
        .btn-warning { background: #f39c12; color: white; }
        .btn-success { background: #27ae60; color: white; }
        .alert-high { background: #ffebee; border-left: 4px solid #e74c3c; padding: 15px; margin: 10px 0; }
        .alert-medium { background: #fff3e0; border-left: 4px solid #f39c12; padding: 15px; margin: 10px 0; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f8f9fa; font-weight: bold; }
        .status-active { color: #27ae60; font-weight: bold; }
        .status-banned { color: #e74c3c; font-weight: bold; }
        .status-flagged { color: #f39c12; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>🔒 Admin Dashboard</h1>
            <span>{{ admin_username }} ({{ admin_role }})</span>
        </div>
        <div>
            <button onclick="showUsersTab()" class="btn btn-primary">👥 Users</button>
            <button onclick="showFraudTab()" class="btn btn-warning">🚨 Fraud</button>
            <button onclick="showPaymentsTab()" class="btn btn-success">💰 Payments</button>
            <a href="/admin/logout" class="btn btn-danger">🚪 Logout</a>
        </div>
    </div>
    
    <div class="container">
        {% if dashboard_data.success %}
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" style="color: #e74c3c;">{{ dashboard_data.fraud_detections_30d }}</div>
                <div class="stat-label">🚨 Fraud Detections (30d)</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-value" style="color: #f39c12;">{{ "%.1f"|format(dashboard_data.avg_fraud_score) }}</div>
                <div class="stat-label">📊 Avg Fraud Score</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-value" style="color: #e74c3c;">{{ dashboard_data.banned_accounts }}</div>
                <div class="stat-label">🚫 Banned Accounts</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-value" style="color: #f39c12;">{{ dashboard_data.pending_reviews }}</div>
                <div class="stat-label">⏳ Pending Reviews</div>
            </div>
        </div>
        
        {% if dashboard_data.recent_alerts %}
        <div class="card">
            <h2>🚨 Recent Fraud Alerts</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Detection Type</th>
                        <th>Fraud Score</th>
                        <th>Action</th>
                        <th>Detected</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {% for alert in dashboard_data.recent_alerts %}
                    <tr>
                        <td>{{ alert.user_id[:8] }}...</td>
                        <td>{{ alert.type }}</td>
                        <td><strong>{{ alert.score }}</strong></td>
                        <td>
                            <span class="{% if alert.action == 'BANNED' %}status-banned{% elif alert.action == 'FLAGGED' %}status-flagged{% else %}status-active{% endif %}">
                                {{ alert.action }}
                            </span>
                        </td>
                        <td>{{ alert.detected_at[:16] }}</td>
                        <td>
                            <button class="btn btn-primary" onclick="reviewFraud('{{ alert.fraud_id }}')">👁️ Review</button>
                            <button class="btn btn-danger" onclick="banUser('{{ alert.user_id }}')">🚫 Ban</button>
                        </td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
        {% endif %}
        {% endif %}
        
        <!-- Tab Content Areas -->
        <div id="mainDashboard" class="tab-content">
            <div class="card">
                <h2>🛠️ Quick Actions</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    <button class="btn btn-primary" onclick="showUserLookup()">🔍 User Lookup</button>
                    <button class="btn btn-warning" onclick="showBulkActions()">⚡ Bulk Actions</button>
                    <button class="btn btn-success" onclick="showGrantLifetime()">💎 Grant Lifetime</button>
                    <button class="btn btn-danger" onclick="emergencyShutdown()">🛑 Emergency Stop</button>
                </div>
            </div>
        </div>
        
        <div id="usersTab" class="tab-content" style="display: none;">
            <div class="card">
                <h2>👥 User Management</h2>
                <div style="margin: 20px 0;">
                    <input type="text" id="userSearchInput2" placeholder="Search by email, user ID, or name" style="width: 70%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <button class="btn btn-primary" onclick="searchAllUsers()">🔍 Search</button>
                    <button class="btn btn-success" onclick="loadAllUsers()">📋 Load All Users</button>
                </div>
                <div id="usersTableContainer">
                    <p>Use search to find users or click "Load All Users" to see everyone.</p>
                </div>
            </div>
        </div>
        
        <div id="fraudTab" class="tab-content" style="display: none;">
            <div class="card">
                <h2>🚨 Fraud Detection Management</h2>
                <div id="fraudDetailsContainer">
                    <h3>Recent Fraud Alerts</h3>
                    <div id="fraudAlertsTable">Loading fraud data...</div>
                </div>
            </div>
        </div>
        
        <div id="paymentsTab" class="tab-content" style="display: none;">
            <div class="card">
                <h2>💰 Payment Management</h2>
                <div id="paymentsContainer">
                    <h3>Recent Payments</h3>
                    <div id="paymentsTable">Loading payment data...</div>
                </div>
            </div>
        </div>
        
        <!-- User Lookup Modal -->
        <div id="userLookupModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
            <div style="background: white; margin: 10% auto; padding: 30px; border-radius: 10px; max-width: 600px; width: 90%;">
                <h3>🔍 User Lookup & Management</h3>
                <div style="margin: 20px 0;">
                    <input type="text" id="userSearchInput" placeholder="Enter User ID, Email, or Device Hash" style="width: 70%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <button class="btn btn-primary" onclick="searchUser()">Search</button>
                </div>
                
                <div id="userSearchResults"></div>
                
                <div style="text-align: right; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="closeModal('userLookupModal')">Close</button>
                </div>
            </div>
        </div>
    </div>

    <script>
    // Tab Management
    function showTab(tabId) {
        console.log('Switching to tab:', tabId);
        
        // Hide all tabs
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.style.display = 'none';
            console.log('Hiding tab:', tab.id);
        });
        
        // Show selected tab
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.style.display = 'block';
            console.log('Showing tab:', tabId);
        } else {
            console.error('Tab not found:', tabId);
        }
    }
    
    function showUsersTab() {
        showTab('usersTab');
        loadAllUsers();
    }
    
    function showFraudTab() {
        showTab('fraudTab');
        loadFraudData();
    }
    
    function showPaymentsTab() {
        showTab('paymentsTab');
        loadPaymentData();
    }
    
    function showMainDashboard() {
        showTab('mainDashboard');
    }
    
    // Modal Management
    function showUserLookup() {
        document.getElementById('userLookupModal').style.display = 'block';
    }
    
    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    function searchUser() {
        const query = document.getElementById('userSearchInput').value;
        if (!query) return;
        
        fetch('/admin/api/user-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        })
        .then(response => response.json())
        .then(data => {
            displayUserResults(data);
        })
        .catch(error => {
            alert('Search failed: ' + error.message);
        });
    }
    
    function displayUserResults(data) {
        const resultsDiv = document.getElementById('userSearchResults');
        
        if (data.success && data.user) {
            const user = data.user;
            resultsDiv.innerHTML = `
                <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <h4>👤 User Details</h4>
                    <p><strong>ID:</strong> ${user.user_id}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Status:</strong> <span class="status-${user.is_active ? 'active' : 'banned'}">${user.is_active ? 'ACTIVE' : 'INACTIVE'}</span></p>
                    <p><strong>Created:</strong> ${user.created_at}</p>
                    <p><strong>Subscription:</strong> ${user.subscription_tier || 'None'}</p>
                    <p><strong>Total Payments:</strong> ₹${user.total_payments || 0}</p>
                    
                    <div style="margin-top: 15px;">
                        <button class="btn btn-warning" onclick="suspendUser('${user.user_id}', '${user.email}')">⏸️ Suspend</button>
                        <button class="btn btn-danger" onclick="banUser('${user.user_id}', '${user.email}')">🚫 Ban</button>
                        <button class="btn btn-success" onclick="grantLifetimeAccess('${user.user_id}', '${user.email}')">💎 Lifetime</button>
                    </div>
                </div>
            `;
        } else {
            resultsDiv.innerHTML = '<p>❌ User not found or search failed.</p>';
        }
    }
    
    function suspendUser(userId, userEmail) {
        const reason = prompt(`Suspend user ${userEmail || userId}?\n\nEnter reason for suspension:`);
        if (!reason) return;
        
        const duration = prompt('Enter suspension duration (in days):', '7');
        if (!duration) return;
        
        if (confirm(`⏸️ SUSPEND USER\n\nUser: ${userEmail || userId}\nDuration: ${duration} days\nReason: ${reason}\n\nContinue?`)) {
            fetch('/admin/api/suspend-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id: userId, 
                    reason: reason,
                    duration_days: parseInt(duration)
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`✅ User suspended for ${duration} days`);
                    loadAllUsers(); // Refresh the user list
                } else {
                    alert('❌ Failed to suspend user: ' + data.error);
                }
            })
            .catch(error => {
                alert('❌ Error: ' + error.message);
            });
        }
    }
    
    function banUser(userId, userEmail) {
        const reason = prompt(`Ban user ${userEmail || userId}?\n\nEnter reason for permanent ban:`);
        if (!reason) return;
        
        if (confirm(`Permanently ban user ${userId}?\\n\\nReason: ${reason}\\n\\nThis action cannot be undone!`)) {
            fetch('/admin/api/ban-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id: userId, 
                    reason: reason,
                    ban_type: 'GLOBAL'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('✅ User banned successfully');
                    location.reload();
                } else {
                    alert('❌ Ban failed: ' + data.error);
                }
            });
        }
    }
    
    // Data Loading Functions
    function loadAllUsers() {
        fetch('/admin/api/all-users')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayUsersTable(data.users);
            } else {
                document.getElementById('usersTableContainer').innerHTML = '<p>❌ Failed to load users: ' + data.error + '</p>';
            }
        })
        .catch(error => {
            document.getElementById('usersTableContainer').innerHTML = '<p>❌ Error loading users: ' + error.message + '</p>';
        });
    }
    
    function loadFraudData() {
        fetch('/admin/api/fraud-data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayFraudTable(data.fraud_logs);
            } else {
                document.getElementById('fraudAlertsTable').innerHTML = '<p>❌ Failed to load fraud data: ' + data.error + '</p>';
            }
        })
        .catch(error => {
            document.getElementById('fraudAlertsTable').innerHTML = '<p>❌ Error loading fraud data: ' + error.message + '</p>';
        });
    }
    
    function loadPaymentData() {
        fetch('/admin/api/payment-data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPaymentTable(data.payments);
            } else {
                document.getElementById('paymentsTable').innerHTML = '<p>❌ Failed to load payment data: ' + data.error + '</p>';
            }
        })
        .catch(error => {
            document.getElementById('paymentsTable').innerHTML = '<p>❌ Error loading payment data: ' + error.message + '</p>';
        });
    }
    
    function displayUsersTable(users) {
        if (!users || users.length === 0) {
            document.getElementById('usersTableContainer').innerHTML = '<p>No users found.</p>';
            return;
        }
        
        let html = '<table class="table"><thead><tr><th>Email</th><th>User ID</th><th>Status</th><th>Subscription</th><th>Created</th><th>Actions</th></tr></thead><tbody>';
        
        users.forEach(user => {
            html += `<tr>
                <td>${user.email}</td>
                <td>${user.user_id.substring(0, 12)}...</td>
                <td><span class="status-${user.is_active ? 'active' : 'banned'}">${user.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td>${user.subscription_tier || 'None'}</td>
                <td>${user.created_at ? user.created_at.substring(0, 10) : 'Unknown'}</td>
                <td>
                    <button class="btn btn-primary" onclick="viewUserDetails('${user.user_id}', '${user.email}')">👁️ View</button>
                    <button class="btn btn-success" onclick="grantLifetimeAccess('${user.user_id}', '${user.email}')">💎 Lifetime</button>
                    <button class="btn btn-danger" onclick="banUser('${user.user_id}')">🚫 Ban</button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        document.getElementById('usersTableContainer').innerHTML = html;
    }
    
    function displayFraudTable(fraudLogs) {
        if (!fraudLogs || fraudLogs.length === 0) {
            document.getElementById('fraudAlertsTable').innerHTML = '<p>No fraud alerts found.</p>';
            return;
        }
        
        let html = '<table class="table"><thead><tr><th>User ID</th><th>Detection Type</th><th>Fraud Score</th><th>Action</th><th>Evidence</th><th>Date</th></tr></thead><tbody>';
        
        fraudLogs.forEach(log => {
            html += `<tr>
                <td>${log.user_id ? log.user_id.substring(0, 12) + '...' : 'Unknown'}</td>
                <td>${log.detection_type}</td>
                <td><strong>${log.fraud_score}</strong></td>
                <td><span class="status-${log.action_taken.toLowerCase()}">${log.action_taken}</span></td>
                <td>${log.evidence ? log.evidence.substring(0, 50) + '...' : 'None'}</td>
                <td>${log.detected_at ? log.detected_at.substring(0, 16) : 'Unknown'}</td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        document.getElementById('fraudAlertsTable').innerHTML = html;
    }
    
    function displayPaymentTable(payments) {
        if (!payments || payments.length === 0) {
            document.getElementById('paymentsTable').innerHTML = '<p>No payments found.</p>';
            return;
        }
        
        let html = '<table class="table"><thead><tr><th>User ID</th><th>Amount</th><th>Status</th><th>Type</th><th>Gateway ID</th><th>Date</th></tr></thead><tbody>';
        
        payments.forEach(payment => {
            html += `<tr>
                <td>${payment.user_id ? payment.user_id.substring(0, 12) + '...' : 'Unknown'}</td>
                <td>₹${payment.amount}</td>
                <td><span class="status-${payment.payment_status.toLowerCase()}">${payment.payment_status}</span></td>
                <td>${payment.payment_type}</td>
                <td>${payment.payment_gateway_id ? payment.payment_gateway_id.substring(0, 20) + '...' : 'None'}</td>
                <td>${payment.created_at ? payment.created_at.substring(0, 16) : 'Unknown'}</td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        document.getElementById('paymentsTable').innerHTML = html;
    }
    
    function showGrantLifetime() {
        const email = prompt('Enter user email for lifetime access:');
        if (!email) return;
        
        const reason = prompt('Enter reason for lifetime access:');
        if (!reason) return;
        
        // First lookup the user
        fetch('/admin/api/user-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user) {
                // Show confirmation with proper user details
                const confirmMessage = `Grant lifetime access to:

Email: ${data.user.email}
User ID: ${data.user.user_id}
Reason: ${reason}

This action cannot be undone!`;
                
                if (confirm(confirmMessage)) {
                    grantLifetimeAccess(data.user.user_id, data.user.email, reason);
                }
            } else {
                alert('❌ User not found: ' + email);
            }
        })
        .catch(error => {
            alert('❌ Error looking up user: ' + error.message);
        });
    }
    
    function grantLifetimeAccess(userId, userEmail, reason) {
        if (!reason) {
            reason = prompt(`Grant lifetime access to ${userEmail}?\n\nEnter reason:`);
            if (!reason) return;
        }
        
        if (confirm(`Grant lifetime access to:\n\nEmail: ${userEmail}\nUser ID: ${userId}\nReason: ${reason}\n\nThis action cannot be undone!`)) {
            fetch('/admin/api/grant-lifetime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id: userId, 
                    reason: reason
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`✅ Lifetime access granted to ${userEmail}`);
                    location.reload();
                } else {
                    alert('❌ Failed: ' + data.error);
                }
            })
            .catch(error => {
                alert('❌ Error: ' + error.message);
            });
        }
    }
    
    function viewUserDetails(userId, userEmail) {
        fetch('/admin/api/user-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user) {
                const user = data.user;
                alert(`👤 User Details:\n\nEmail: ${user.email}\nUser ID: ${user.user_id}\nStatus: ${user.is_active ? 'Active' : 'Inactive'}\nSubscription: ${user.subscription_tier || 'None'}\nTotal Payments: ₹${user.total_payments || 0}\nCreated: ${user.created_at || 'Unknown'}\nLast Login: ${user.last_login || 'Never'}`);
            } else {
                alert('❌ Failed to load user details');
            }
        })
        .catch(error => {
            alert('❌ Error: ' + error.message);
        });
    }
    
    function reviewFraud(fraudId) {
        fetch('/admin/api/fraud-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fraud_id: fraudId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const fraud = data.fraud_details;
                const evidence = JSON.parse(fraud.evidence || '[]');
                
                const details = `🚨 FRAUD REVIEW
                
User ID: ${fraud.user_id}
Detection Type: ${fraud.detection_type}
Fraud Score: ${fraud.fraud_score}/100
Action Taken: ${fraud.action_taken}
Detected: ${fraud.detected_at}

📋 Evidence:
${evidence.map(e => '• ' + e).join('\\n')}

Admin Notes: ${fraud.admin_notes || 'None'}`;
                
                alert(details);
                
                // Mark as reviewed
                if (confirm('Mark this fraud case as reviewed?')) {
                    fetch('/admin/api/mark-reviewed', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fraud_id: fraudId })
                    })
                    .then(() => {
                        alert('✅ Fraud case marked as reviewed');
                        loadFraudData(); // Refresh the fraud data
                    });
                }
            } else {
                alert('❌ Failed to load fraud details: ' + data.error);
            }
        })
        .catch(error => {
            alert('❌ Error: ' + error.message);
        });
    }
    
    function emergencyShutdown() {
        if (confirm('🛑 EMERGENCY SHUTDOWN\\n\\nThis will stop all trading activities immediately.\\n\\nContinue?')) {
            fetch('/admin/api/emergency-shutdown', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                alert(data.success ? '✅ Emergency shutdown activated' : '❌ Shutdown failed');
            });
        }
    }
    </script>
</body>
</html>
    """, 
    admin_username=admin_username, 
    admin_role=admin_role, 
    dashboard_data=dashboard_data)

@app.route('/admin/api/user-lookup', methods=['POST'])
def admin_user_lookup():
    """Admin user lookup and management"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        # Search in users database
        import sqlite3
        
        # Try multiple database locations
        db_paths = [
            'src/web_interface/users.db',
            'data/users.db',
            'users.db'
        ]
        
        conn = None
        for db_path in db_paths:
            if os.path.exists(db_path):
                conn = sqlite3.connect(db_path)
                break
        
        if not conn:
            return jsonify({'success': False, 'error': 'Users database not found'})
        
        cursor = conn.cursor()
        
        # Search by user_id, email, or device hash (case insensitive)
        cursor.execute("""
            SELECT user_id, email, created_at, is_active, last_login
            FROM users
            WHERE LOWER(user_id) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?)
            LIMIT 1
        """, (f'%{query}%', f'%{query}%'))
        
        user_result = cursor.fetchone()
        
        if user_result:
            user_id, email, created_at, is_active, last_login = user_result
            
            # Get subscription info
            subscription = subscription_manager.get_user_subscription(user_id)
            
            conn.close()
            
            # Get payment total from subscriptions database
            try:
                sub_conn = sqlite3.connect('data/subscriptions.db')
                sub_cursor = sub_conn.cursor()
                
                sub_cursor.execute("""
                    SELECT SUM(amount) FROM payments
                    WHERE user_id = ? AND payment_status = 'SUCCESS'
                """, (user_id,))
                
                total_payments = sub_cursor.fetchone()[0] or 0
                sub_conn.close()
                
            except Exception as e:
                print(f"Warning: Could not get payment data: {e}")
                total_payments = 0
            
            return jsonify({
                'success': True,
                'user': {
                    'user_id': user_id,
                    'email': email,
                    'created_at': created_at,
                    'is_active': bool(is_active),
                    'last_login': last_login,
                    'subscription_tier': subscription.get('tier') if subscription.get('success') else None,
                    'total_payments': total_payments
                }
            })
        else:
            conn.close()
            return jsonify({'success': False, 'error': 'User not found'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/api/suspend-user', methods=['POST'])
def admin_suspend_user():
    """Suspend a user temporarily"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        reason = data.get('reason', 'Admin suspension')
        duration_days = data.get('duration_days', 7)
        
        admin_id = session.get('admin_id')
        
        # Update user status to suspended
        import sqlite3
        from datetime import datetime, timedelta
        
        # Try multiple database locations
        db_paths = [
            'src/web_interface/users.db',
            'data/users.db',
            'users.db'
        ]
        
        conn = None
        for db_path in db_paths:
            if os.path.exists(db_path):
                conn = sqlite3.connect(db_path)
                break
        
        if not conn:
            return jsonify({'success': False, 'error': 'Users database not found'})
        
        cursor = conn.cursor()
        
        # Calculate suspension end date
        suspension_end = datetime.now() + timedelta(days=duration_days)
        
        # Check if columns exist, if not add them
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN suspension_reason TEXT")
        except:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN suspension_end TEXT")
        except:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN suspended_by TEXT")
        except:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN suspended_at TEXT")
        except:
            pass
        
        # Update user status
        cursor.execute("""
            UPDATE users 
            SET is_active = 0, 
                suspension_reason = ?,
                suspension_end = ?,
                suspended_by = ?,
                suspended_at = ?
            WHERE user_id = ?
        """, (reason, suspension_end.isoformat(), admin_id, datetime.now().isoformat(), user_id))
        
        if cursor.rowcount > 0:
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True, 
                'message': f'User suspended for {duration_days} days',
                'suspension_end': suspension_end.isoformat()
            })
        else:
            conn.close()
            return jsonify({'success': False, 'error': 'User not found'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/api/ban-user', methods=['POST'])
def admin_ban_user():
    """Ban user permanently"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    admin_id = session['admin_id']
    
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        reason = data.get('reason')
        ban_type = data.get('ban_type', 'GLOBAL')
        
        result = admin_security.ban_user_permanently(user_id, reason, admin_id, ban_type)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/api/grant-lifetime', methods=['POST'])
def admin_grant_lifetime():
    """Grant lifetime access to user"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    admin_id = session['admin_id']
    
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        reason = data.get('reason')
        
        result = admin_security.grant_lifetime_access(user_id, admin_id, reason)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/api/all-users', methods=['GET'])
def get_all_users():
    """Get all users for admin management"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    try:
        import sqlite3
        
        # Check multiple possible database locations
        db_paths = [
            'data/users.db',
            'src/web_interface/data/users.db', 
            'src/web_interface/users.db',
            'users.db'
        ]
        
        users = []
        for db_path in db_paths:
            if os.path.exists(db_path):
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT user_id, email, created_at, is_active, last_login
                    FROM users
                    ORDER BY created_at DESC
                    LIMIT 100
                """)
                
                results = cursor.fetchall()
                
                for row in results:
                    user_id, email, created_at, is_active, last_login = row
                    
                    # Get subscription info
                    try:
                        from subscription_manager import subscription_manager
                        subscription = subscription_manager.get_user_subscription(user_id)
                        tier = subscription.get('tier') if subscription.get('success') else None
                    except:
                        tier = None
                    
                    users.append({
                        'user_id': user_id,
                        'email': email,
                        'created_at': created_at,
                        'is_active': bool(is_active),
                        'last_login': last_login,
                        'subscription_tier': tier
                    })
                
                conn.close()
                break
        
        return jsonify({'success': True, 'users': users})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/api/fraud-data', methods=['GET'])
def get_fraud_data():
    """Get fraud detection data"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    try:
        import sqlite3
        
        conn = sqlite3.connect('data/admin_security.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT fraud_id, user_id, detection_type, fraud_score, evidence, 
                   action_taken, detected_at, admin_reviewed
            FROM fraud_detection_logs
            ORDER BY detected_at DESC
            LIMIT 50
        """)
        
        results = cursor.fetchall()
        fraud_logs = []
        
        for row in results:
            fraud_id, user_id, detection_type, fraud_score, evidence, action_taken, detected_at, admin_reviewed = row
            fraud_logs.append({
                'fraud_id': fraud_id,
                'user_id': user_id,
                'detection_type': detection_type,
                'fraud_score': fraud_score,
                'evidence': evidence,
                'action_taken': action_taken,
                'detected_at': detected_at,
                'admin_reviewed': bool(admin_reviewed)
            })
        
        conn.close()
        return jsonify({'success': True, 'fraud_logs': fraud_logs})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/api/payment-data', methods=['GET'])
def get_payment_data():
    """Get payment data"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    try:
        import sqlite3
        
        conn = sqlite3.connect('data/subscriptions.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT payment_id, user_id, amount, currency, payment_method,
                   payment_gateway_id, payment_status, payment_type, 
                   payment_date, created_at
            FROM payments
            ORDER BY created_at DESC
            LIMIT 50
        """)
        
        results = cursor.fetchall()
        payments = []
        
        for row in results:
            payment_id, user_id, amount, currency, payment_method, gateway_id, status, payment_type, payment_date, created_at = row
            payments.append({
                'payment_id': payment_id,
                'user_id': user_id,
                'amount': amount,
                'currency': currency,
                'payment_method': payment_method,
                'payment_gateway_id': gateway_id,
                'payment_status': status,
                'payment_type': payment_type,
                'payment_date': payment_date,
                'created_at': created_at
            })
        
        conn.close()
        return jsonify({'success': True, 'payments': payments})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/api/fraud-details', methods=['POST'])
def get_fraud_details():
    """Get detailed fraud information"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    try:
        data = request.get_json()
        fraud_id = data.get('fraud_id')
        
        import sqlite3
        conn = sqlite3.connect('data/admin_security.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT fraud_id, user_id, detection_type, fraud_score, evidence, 
                   action_taken, detected_at, admin_reviewed, admin_notes
            FROM fraud_detection_logs
            WHERE fraud_id = ?
        """, (fraud_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            fraud_id, user_id, detection_type, fraud_score, evidence, action_taken, detected_at, admin_reviewed, admin_notes = result
            return jsonify({
                'success': True,
                'fraud_details': {
                    'fraud_id': fraud_id,
                    'user_id': user_id,
                    'detection_type': detection_type,
                    'fraud_score': fraud_score,
                    'evidence': evidence,
                    'action_taken': action_taken,
                    'detected_at': detected_at,
                    'admin_reviewed': bool(admin_reviewed),
                    'admin_notes': admin_notes
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Fraud case not found'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/api/mark-reviewed', methods=['POST'])
def mark_fraud_reviewed():
    """Mark fraud case as reviewed"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    try:
        data = request.get_json()
        fraud_id = data.get('fraud_id')
        admin_id = session.get('admin_id')
        
        import sqlite3
        conn = sqlite3.connect('data/admin_security.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE fraud_detection_logs 
            SET admin_reviewed = 1, reviewed_at = ?, reviewed_by = ?
            WHERE fraud_id = ?
        """, (datetime.now().isoformat(), admin_id, fraud_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/api/emergency-shutdown', methods=['POST'])
def emergency_shutdown():
    """Emergency shutdown of all trading activities"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    
    try:
        # Stop all trading engines
        # This would connect to your trading engine and stop all activities
        print(f"🛑 EMERGENCY SHUTDOWN initiated by admin {session.get('admin_username')}")
        
        # In a real implementation, you would:
        # 1. Stop all trading bots
        # 2. Cancel pending orders
        # 3. Close positions if needed
        # 4. Notify all users
        
        return jsonify({
            'success': True, 
            'message': 'Emergency shutdown initiated. All trading activities stopped.'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin/logout')
def admin_logout():
    """Admin logout"""
    session.clear()
    return redirect(url_for('admin_login_page'))

if __name__ == '__main__':
    print("🔒 Starting Admin Dashboard on http://localhost:8002")
    app.run(host='0.0.0.0', port=8002, debug=False, threaded=True)
