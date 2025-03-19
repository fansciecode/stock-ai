import webpush from 'web-push';

export class WebPushService {
    constructor() {
        webpush.setVapidDetails(
            process.env.WEB_PUSH_CONTACT,
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    }

    async sendNotification(subscription, payload) {
        try {
            return await webpush.sendNotification(subscription, payload);
        } catch (error) {
            console.error('Web Push notification error:', error);
            throw error;
        }
    }

    async sendNotificationToMultiple(subscriptions, payload) {
        try {
            const results = await Promise.allSettled(
                subscriptions.map(subscription =>
                    this.sendNotification(subscription, payload)
                )
            );

            return {
                successful: results.filter(r => r.status === 'fulfilled').length,
                failed: results.filter(r => r.status === 'rejected').length,
                total: results.length
            };
        } catch (error) {
            console.error('Multiple web push notification error:', error);
            throw error;
        }
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

export default new WebPushService(); 