import api from './api';

class SecurityService {
  // Authentication & Session Management
  async getSecuritySettings() {
    try {
      const response = await api.get('/security/settings');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch security settings' };
    }
  }

  async updateSecuritySettings(settings) {
    try {
      const response = await api.put('/security/settings', settings);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update security settings' };
    }
  }

  // Two-Factor Authentication
  async enableTwoFactorAuth() {
    try {
      const response = await api.post('/security/2fa/enable');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to enable 2FA' };
    }
  }

  async disableTwoFactorAuth(code) {
    try {
      const response = await api.post('/security/2fa/disable', { code });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to disable 2FA' };
    }
  }

  async verifyTwoFactorAuth(code) {
    try {
      const response = await api.post('/security/2fa/verify', { code });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Invalid 2FA code' };
    }
  }

  async generateBackupCodes() {
    try {
      const response = await api.post('/security/2fa/backup-codes');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to generate backup codes' };
    }
  }

  // Password Management
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post('/security/password/change', {
        currentPassword,
        newPassword
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to change password' };
    }
  }

  async checkPasswordStrength(password) {
    // Client-side password strength check
    const strength = {
      score: 0,
      feedback: [],
      isValid: false
    };

    if (password.length < 8) {
      strength.feedback.push('Password must be at least 8 characters long');
    } else {
      strength.score += 1;
    }

    if (!/[a-z]/.test(password)) {
      strength.feedback.push('Password must contain lowercase letters');
    } else {
      strength.score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      strength.feedback.push('Password must contain uppercase letters');
    } else {
      strength.score += 1;
    }

    if (!/\d/.test(password)) {
      strength.feedback.push('Password must contain numbers');
    } else {
      strength.score += 1;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength.feedback.push('Password must contain special characters');
    } else {
      strength.score += 1;
    }

    strength.isValid = strength.score >= 4;
    return { success: true, data: strength };
  }

  // Session Management
  async getActiveSessions() {
    try {
      const response = await api.get('/security/sessions');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch active sessions' };
    }
  }

  async terminateSession(sessionId) {
    try {
      const response = await api.delete(`/security/sessions/${sessionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to terminate session' };
    }
  }

  async terminateAllSessions() {
    try {
      const response = await api.delete('/security/sessions/all');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to terminate all sessions' };
    }
  }

  // Security Events & Monitoring
  async getSecurityEvents(limit = 20, offset = 0) {
    try {
      const response = await api.get('/security/events', {
        params: { limit, offset }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch security events' };
    }
  }

  async reportSecurityEvent(eventData) {
    try {
      const response = await api.post('/security/events/report', eventData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to report security event' };
    }
  }

  // Account Security
  async getSecurityScore() {
    try {
      const response = await api.get('/security/score');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch security score' };
    }
  }

  async getSecurityRecommendations() {
    try {
      const response = await api.get('/security/recommendations');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch security recommendations' };
    }
  }

  // Privacy Settings
  async getPrivacySettings() {
    try {
      const response = await api.get('/security/privacy');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch privacy settings' };
    }
  }

  async updatePrivacySettings(settings) {
    try {
      const response = await api.put('/security/privacy', settings);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update privacy settings' };
    }
  }

  // Data Export & Account Deletion
  async requestDataExport() {
    try {
      const response = await api.post('/security/data/export');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to request data export' };
    }
  }

  async getDataExportStatus() {
    try {
      const response = await api.get('/security/data/export/status');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch export status' };
    }
  }

  async deleteAccount(password, reason) {
    try {
      const response = await api.post('/security/account/delete', {
        password,
        reason
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete account' };
    }
  }

  // Security Alerts
  async getSecurityAlerts() {
    try {
      const response = await api.get('/security/alerts');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch security alerts' };
    }
  }

  async markAlertAsRead(alertId) {
    try {
      const response = await api.put(`/security/alerts/${alertId}/read`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to mark alert as read' };
    }
  }

  async dismissAlert(alertId) {
    try {
      const response = await api.delete(`/security/alerts/${alertId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to dismiss alert' };
    }
  }

  // Device Management
  async getTrustedDevices() {
    try {
      const response = await api.get('/security/devices');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch trusted devices' };
    }
  }

  async removeTrustedDevice(deviceId) {
    try {
      const response = await api.delete(`/security/devices/${deviceId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to remove trusted device' };
    }
  }

  async addTrustedDevice(deviceInfo) {
    try {
      const response = await api.post('/security/devices', deviceInfo);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to add trusted device' };
    }
  }

  // API Security
  async getApiKeys() {
    try {
      const response = await api.get('/security/api-keys');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch API keys' };
    }
  }

  async generateApiKey(name, permissions) {
    try {
      const response = await api.post('/security/api-keys', { name, permissions });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to generate API key' };
    }
  }

  async revokeApiKey(keyId) {
    try {
      const response = await api.delete(`/security/api-keys/${keyId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to revoke API key' };
    }
  }

  // Audit Logs
  async getAuditLogs(filters = {}) {
    try {
      const response = await api.get('/security/audit-logs', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch audit logs' };
    }
  }

  // Security Configuration
  async getSecurityPolicy() {
    try {
      const response = await api.get('/security/policy');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch security policy' };
    }
  }

  async updateSecurityPolicy(policy) {
    try {
      const response = await api.put('/security/policy', policy);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update security policy' };
    }
  }
}

export default new SecurityService();
