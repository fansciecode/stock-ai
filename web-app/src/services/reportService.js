import api from './api';

class ReportService {
  // Report Submission
  async submitReport(reportData) {
    try {
      const formData = new FormData();

      // Add text fields
      formData.append('type', reportData.type);
      formData.append('priority', reportData.priority);
      formData.append('description', reportData.description);

      if (reportData.contactEmail) {
        formData.append('contactEmail', reportData.contactEmail);
      }

      if (reportData.userAgent) {
        formData.append('userAgent', reportData.userAgent);
      }

      if (reportData.url) {
        formData.append('url', reportData.url);
      }

      // Add attachments
      if (reportData.attachments && reportData.attachments.length > 0) {
        reportData.attachments.forEach((file, index) => {
          formData.append(`attachments`, file);
        });
      }

      const response = await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit report'
      };
    }
  }

  // Get User Reports
  async getUserReports(userId, limit = 20, offset = 0) {
    try {
      const response = await api.get('/reports/user', {
        params: { userId, limit, offset }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user reports'
      };
    }
  }

  // Get Report by ID
  async getReportById(reportId) {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch report'
      };
    }
  }

  // Update Report Status (Admin function)
  async updateReportStatus(reportId, status, adminNotes = '') {
    try {
      const response = await api.put(`/reports/${reportId}/status`, {
        status,
        adminNotes
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update report status'
      };
    }
  }

  // Get All Reports (Admin function)
  async getAllReports(filters = {}) {
    try {
      const response = await api.get('/reports/admin', {
        params: filters
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch all reports'
      };
    }
  }

  // Delete Report
  async deleteReport(reportId) {
    try {
      const response = await api.delete(`/reports/${reportId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete report'
      };
    }
  }

  // Get Report Types
  async getReportTypes() {
    try {
      const response = await api.get('/reports/types');
      return { success: true, data: response.data };
    } catch (error) {
      // Return default types if API fails
      return {
        success: true,
        data: [
          { value: 'bug', label: 'Bug Report', icon: 'bug' },
          { value: 'feature', label: 'Feature Request', icon: 'lightbulb' },
          { value: 'content', label: 'Content Issue', icon: 'file-text' },
          { value: 'security', label: 'Security Issue', icon: 'shield' },
          { value: 'performance', label: 'Performance Issue', icon: 'gauge' },
          { value: 'other', label: 'Other', icon: 'help-circle' }
        ]
      };
    }
  }

  // Get Priority Levels
  async getPriorityLevels() {
    try {
      const response = await api.get('/reports/priorities');
      return { success: true, data: response.data };
    } catch (error) {
      // Return default priorities if API fails
      return {
        success: true,
        data: [
          { value: 'low', label: 'Low', color: '#52c41a' },
          { value: 'medium', label: 'Medium', color: '#faad14' },
          { value: 'high', label: 'High', color: '#fa541c' },
          { value: 'critical', label: 'Critical', color: '#f5222d' }
        ]
      };
    }
  }

  // Get Report Statistics (Admin function)
  async getReportStatistics(dateRange = {}) {
    try {
      const response = await api.get('/reports/statistics', {
        params: dateRange
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch report statistics'
      };
    }
  }

  // Add Comment to Report
  async addComment(reportId, comment) {
    try {
      const response = await api.post(`/reports/${reportId}/comments`, {
        comment
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add comment'
      };
    }
  }

  // Get Comments for Report
  async getComments(reportId) {
    try {
      const response = await api.get(`/reports/${reportId}/comments`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch comments'
      };
    }
  }

  // Upload Attachment
  async uploadAttachment(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/reports/attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload attachment'
      };
    }
  }

  // Delete Attachment
  async deleteAttachment(attachmentId) {
    try {
      const response = await api.delete(`/reports/attachments/${attachmentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete attachment'
      };
    }
  }

  // Search Reports
  async searchReports(query, filters = {}) {
    try {
      const response = await api.get('/reports/search', {
        params: { query, ...filters }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search reports'
      };
    }
  }

  // Export Reports (Admin function)
  async exportReports(format = 'csv', filters = {}) {
    try {
      const response = await api.get('/reports/export', {
        params: { format, ...filters },
        responseType: 'blob'
      });

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to export reports'
      };
    }
  }

  // Get Report Templates
  async getReportTemplates() {
    try {
      const response = await api.get('/reports/templates');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch report templates'
      };
    }
  }

  // Validate Report Data
  validateReport(reportData) {
    const errors = [];

    if (!reportData.type) {
      errors.push('Report type is required');
    }

    if (!reportData.priority) {
      errors.push('Priority level is required');
    }

    if (!reportData.description || reportData.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (reportData.description && reportData.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    if (reportData.contactEmail && !this.isValidEmail(reportData.contactEmail)) {
      errors.push('Please provide a valid email address');
    }

    if (reportData.attachments && reportData.attachments.length > 5) {
      errors.push('Maximum 5 attachments allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Email validation helper
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get System Information for Report
  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      window: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }

  // Format Report for Submission
  formatReportData(formData) {
    const systemInfo = this.getSystemInfo();

    return {
      ...formData,
      systemInfo,
      timestamp: new Date().toISOString(),
      version: process.env.REACT_APP_VERSION || '1.0.0'
    };
  }
}

export default new ReportService();
