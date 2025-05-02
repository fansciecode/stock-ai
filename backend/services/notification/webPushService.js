import webpush from 'web-push';

export class WebPushService {
    constructor() {
        // Skip VAPID setup if environment variable is set
        if (process.env.SKIP_PUSH_NOTIFICATIONS === 'true') {
            console.log('NOTICE: Push notifications are disabled for testing');
            this.isDisabled = true;
            return;
        }
        
        try {
            // Check if VAPID details are properly configured
            if (!process.env.WEB_PUSH_CONTACT || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
                console.warn('WARNING: VAPID details missing, push notifications will be disabled');
                this.isDisabled = true;
                return;
            }
            
            webpush.setVapidDetails(
                process.env.WEB_PUSH_CONTACT,
                process.env.VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY
            );
            this.isDisabled = false;
        } catch (error) {
            console.error('Error initializing web push:', error);
            this.isDisabled = true;
        }
    }

    async sendNotification(subscription, payload) {
        // If disabled, just log and return success
        if (this.isDisabled) {
            console.log('PUSH NOTIFICATION [DISABLED]:', payload);
            return { success: true, disabled: true };
        }
        
        try {
            return await webpush.sendNotification(subscription, payload);
        } catch (error) {
            console.error('Web Push notification error:', error);
            throw error;
        }
    }

    async sendToMultipleSubscriptions(subscriptions, payload) {
        // If disabled, just log and return success
        if (this.isDisabled) {
            console.log('BULK PUSH NOTIFICATION [DISABLED]:', payload);
            return { success: true, disabled: true, count: subscriptions.length };
        }
        
        const results = [];
        for (const subscription of subscriptions) {
            try {
                const result = await this.sendNotification(subscription, payload);
                results.push({ subscription, success: true, result });
            } catch (error) {
                results.push({ subscription, success: false, error: error.message });
            }
        }
        return results;
    }

    generateVAPIDKeys() {
        return webpush.generateVAPIDKeys();
    }

    isValidSubscription(subscription) {
        return subscription &&
               subscription.endpoint &&
               subscription.keys &&
               subscription.keys.p256dh &&
               subscription.keys.auth;
    }
}

// Export a singleton instance (maintains compatibility with existing code)
export default new WebPushService(); 