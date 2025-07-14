import api from './api';

const verificationService = {
  // Get user verification status
  getVerificationStatus: async () => {
    try {
      const response = await api.get('/auth/verification-status');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get verification status error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get verification status'
      };
    }
  },

  // Send email verification
  sendEmailVerification: async () => {
    try {
      const response = await api.post('/auth/send-verification-email');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Send email verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send verification email'
      };
    }
  },

  // Verify email with token
  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Verify email error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify email'
      };
    }
  },

  // Send phone verification code
  sendPhoneVerification: async (phoneNumber) => {
    try {
      const response = await api.post('/auth/send-phone-verification', {
        phoneNumber
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Send phone verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send phone verification'
      };
    }
  },

  // Verify phone number
  verifyPhone: async ({ phoneNumber, verificationCode }) => {
    try {
      const response = await api.post('/auth/verify-phone', {
        phoneNumber,
        verificationCode
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Verify phone error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify phone number'
      };
    }
  },

  // Upload verification document
  uploadDocument: async ({ documentType, file }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await api.post('/auth/upload-verification-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Upload document error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload document'
      };
    }
  },

  // Submit identity verification
  submitIdentityVerification: async ({ documentType, documentNumber, documents }) => {
    try {
      const response = await api.post('/auth/submit-identity-verification', {
        documentType,
        documentNumber,
        documents
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Submit identity verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit identity verification'
      };
    }
  },

  // Submit business verification
  submitBusinessVerification: async ({ businessName, businessType, registrationNumber, businessAddress, documents }) => {
    try {
      const response = await api.post('/auth/submit-business-verification', {
        businessName,
        businessType,
        registrationNumber,
        businessAddress,
        documents
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Submit business verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit business verification'
      };
    }
  },

  // Get verification documents
  getVerificationDocuments: async () => {
    try {
      const response = await api.get('/auth/verification-documents');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get verification documents error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get verification documents'
      };
    }
  },

  // Delete verification document
  deleteVerificationDocument: async (documentId) => {
    try {
      const response = await api.delete(`/auth/verification-documents/${documentId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Delete verification document error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete verification document'
      };
    }
  },

  // Check verification requirements
  getVerificationRequirements: async () => {
    try {
      const response = await api.get('/auth/verification-requirements');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get verification requirements error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get verification requirements'
      };
    }
  },

  // Update verification status (admin only)
  updateVerificationStatus: async (userId, verificationData) => {
    try {
      const response = await api.put(`/admin/verification/${userId}`, verificationData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update verification status error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update verification status'
      };
    }
  },

  // Get all pending verifications (admin only)
  getPendingVerifications: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/admin/verification/pending', {
        params: { page, limit }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get pending verifications error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get pending verifications'
      };
    }
  }
};

export default verificationService;