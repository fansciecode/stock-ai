import api from './api';

class AutomationService {
    // Content moderation automation
    async moderateContent() {
        try {
            const response = await api.get('/admin/ai/content-moderation');
            return response.data;
        } catch (error) {
            console.error('Error in content moderation:', error);
            return {
                status: 'error',
                summary: 'Failed to fetch content moderation status',
                issues: []
            };
        }
    }

    // User issue management automation
    async manageUserIssues() {
        try {
            const response = await api.get('/admin/ai/user-issues');
            return response.data;
        } catch (error) {
            console.error('Error in user issue management:', error);
            return {
                status: 'error',
                summary: 'Failed to fetch user issue management status',
                issues: []
            };
        }
    }

    // Event quality monitoring automation
    async monitorEventQuality() {
        try {
            const response = await api.get('/admin/ai/event-quality');
            return response.data;
        } catch (error) {
            console.error('Error in event quality monitoring:', error);
            return {
                status: 'error',
                summary: 'Failed to fetch event quality monitoring status',
                issues: []
            };
        }
    }

    // System health monitoring automation
    async monitorSystemHealth() {
        try {
            const response = await api.get('/admin/ai/system-health');
            return response.data;
        } catch (error) {
            console.error('Error in system health monitoring:', error);
            return {
                status: 'error',
                summary: 'Failed to fetch system health status',
                issues: []
            };
        }
    }
}

export default new AutomationService(); 