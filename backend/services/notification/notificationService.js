import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { WebPushService } from './webPushService.js';
import { NotificationModel } from '../../models/notificationModel.js';

export class NotificationService {
    constructor() {
        // Email configuration - make it optional for testing
        try {
            if (process.env.SKIP_EMAIL_NOTIFICATIONS === 'true') {
                console.log('NOTICE: Email notifications are disabled for testing');
                this.emailDisabled = true;
            } else if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn('WARNING: Email configuration missing, email notifications will be disabled');
                this.emailDisabled = true;
            } else {
                this.emailTransporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    secure: true,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
                this.emailDisabled = false;
            }
        } catch (error) {
            console.error('Error setting up email service:', error);
            this.emailDisabled = true;
        }

        // SMS configuration - make it optional for testing
        try {
            if (process.env.SKIP_SMS_NOTIFICATIONS === 'true') {
                console.log('NOTICE: SMS notifications are disabled for testing');
                this.smsDisabled = true;
            } else if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
                console.warn('WARNING: Twilio configuration missing, SMS notifications will be disabled');
                this.smsDisabled = true;
            } else {
                this.smsClient = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
                this.smsDisabled = false;
            }
        } catch (error) {
            console.error('Error setting up SMS service:', error);
            this.smsDisabled = true;
        }

        // Web Push configuration is handled by the WebPushService class
        this.webPushService = new WebPushService();
    }

    async sendNotification(userId, notification) {
        try {
            const notificationRecord = await NotificationModel.create({
                userId,
                type: notification.type,
                content: notification.content,
                priority: notification.priority || 'normal',
                channels: notification.channels || ['email']
            });

            const promises = notification.channels.map(channel => 
                this.sendToChannel(channel, userId, notification)
            );

            const results = await Promise.allSettled(promises);
            await this.updateNotificationStatus(notificationRecord._id, results);

            return {
                id: notificationRecord._id,
                status: 'sent',
                channels: this.summarizeResults(results)
            };
        } catch (error) {
            console.error('Notification sending error:', error);
            throw error;
        }
    }

    async sendToChannel(channel, userId, notification) {
        switch (channel) {
            case 'email':
                return this.sendEmail(userId, notification);
            case 'sms':
                return this.sendSMS(userId, notification);
            case 'push':
                return this.sendPushNotification(userId, notification);
            case 'in_app':
                return this.sendInAppNotification(userId, notification);
            default:
                throw new Error(`Unsupported notification channel: ${channel}`);
        }
    }

    async sendEmail(userId, notification) {
        // If disabled, just log the message and return success
        if (this.emailDisabled) {
            console.log(`EMAIL [DISABLED] To: ${userId}, Subject: ${notification.subject}`);
            return { success: true, disabled: true };
        }

        try {
            const user = await this.getUserDetails(userId);
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: notification.subject,
                html: this.generateEmailTemplate(notification)
            };

            const result = await this.emailTransporter.sendMail(mailOptions);
            return { success: true, result };
        } catch (error) {
            console.error('Email sending error:', error);
            throw error;
        }
    }

    async sendSMS(userId, notification) {
        // If disabled, just log the message and return success
        if (this.smsDisabled) {
            console.log(`SMS [DISABLED] To: ${userId}, Body: ${notification.content}`);
            return { success: true, disabled: true };
        }

        try {
            const user = await this.getUserDetails(userId);
            const result = await this.smsClient.messages.create({
                body: notification.content,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: user.phone
            });
            return { success: true, result };
        } catch (error) {
            console.error('SMS sending error:', error);
            throw error;
        }
    }

    async sendPushNotification(userId, notification) {
        try {
            const subscription = await this.getWebPushSubscription(userId);
            if (!subscription) return null;

            return await this.webPushService.sendNotification(
                subscription,
                JSON.stringify({
                    title: notification.subject,
                    body: notification.content,
                    icon: notification.icon,
                    data: notification.data
                })
            );
        } catch (error) {
            console.error('Push notification error:', error);
            throw error;
        }
    }

    async sendInAppNotification(userId, notification) {
        try {
            return await NotificationModel.create({
                userId,
                type: 'in_app',
                content: notification.content,
                data: notification.data,
                read: false
            });
        } catch (error) {
            console.error('In-app notification error:', error);
            throw error;
        }
    }

    generateEmailTemplate(notification) {
        // Implement email template generation based on notification type
        return `
            <div style="font-family: Arial, sans-serif;">
                <h2>${notification.subject}</h2>
                <p>${notification.content}</p>
                ${notification.actionUrl ? `
                    <a href="${notification.actionUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        ${notification.actionText || 'View Details'}
                    </a>
                ` : ''}
            </div>
        `;
    }

    async updateNotificationStatus(notificationId, results) {
        const status = results.every(r => r.status === 'fulfilled') ? 'delivered' : 'partial';
        await NotificationModel.findByIdAndUpdate(notificationId, { status });
    }

    summarizeResults(results) {
        return results.reduce((summary, result, index) => {
            summary[result.status] = summary[result.status] || [];
            summary[result.status].push(index);
            return summary;
        }, {});
    }

    async getUserDetails(userId) {
        // Implement user details retrieval
        return { email: 'user@example.com', phone: '+1234567890' };
    }

    async getWebPushSubscription(userId) {
        // Implement web push subscription retrieval
        return null;
    }
}

export default new NotificationService(); 