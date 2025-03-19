import nodemailer from 'nodemailer';
import { NotificationModel } from '../models/notificationModel.js';

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send email notification
const sendEmailNotification = async ({ to, subject, text, html }) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html
        });
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

// Send in-app notification
const sendInAppNotification = async ({ userId, type, message, data }) => {
    try {
        await Notification.create({
            user: userId,
            type,
            message,
            data
        });
    } catch (error) {
        console.error('Failed to create in-app notification:', error);
    }
};

// Send order notification
const sendOrderNotification = async ({ type, order, business, user }) => {
    const message = `Order ${order.orderNumber} is now ${order.status}.`;
    const emailSubject = `Order Update: ${order.orderNumber}`;
    const emailText = `Your order with ${business.businessName} is now ${order.status}.`;

    // Send email to user
    await sendEmailNotification({
        to: user.email,
        subject: emailSubject,
        text: emailText
    });

    // Send in-app notification to user
    await sendInAppNotification({
        userId: user._id,
        type,
        message,
        data: { orderId: order._id }
    });

    // Send in-app notification to business
    await sendInAppNotification({
        userId: business.user,
        type,
        message,
        data: { orderId: order._id }
    });
};

// Send delivery notification
const sendDeliveryNotification = async ({ type, delivery, order, deliveryPartner }) => {
    const message = `Delivery for order ${order.orderNumber} is now ${delivery.status}.`;
    const emailSubject = `Delivery Update: ${order.orderNumber}`;
    const emailText = `Your delivery for order ${order.orderNumber} is now ${delivery.status}.`;

    // Send email to delivery partner
    await sendEmailNotification({
        to: deliveryPartner.email,
        subject: emailSubject,
        text: emailText
    });

    // Send in-app notification to delivery partner
    await sendInAppNotification({
        userId: deliveryPartner._id,
        type,
        message,
        data: { deliveryId: delivery._id }
    });

    // Send in-app notification to user
    await sendInAppNotification({
        userId: order.user,
        type,
        message,
        data: { orderId: order._id }
    });
};

export {
    sendOrderNotification,
    sendDeliveryNotification
}; 