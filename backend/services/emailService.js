import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      debug: true // Enable debug logs
    });

    // Verify connection configuration
    this.transporter.verify(function(error, success) {
      if (error) {
        logger.error('Email service error:', error);
      } else {
        logger.info('Email server is ready to send messages');
      }
    });
  }

  async sendEmail(to, subject, html) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent:', info.messageId);
      return true;
    } catch (error) {
      logger.error('Email send error:', error);
      throw error;
    }
  }

  async sendResetPasswordEmail(email, token) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.sendEmail(email, 'Password Reset Request', html);
  }

  async sendPasswordResetEmail(to, resetToken) {
    try {
      await this.transporter.verify();
      logger.info('Email server connection verified');

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent successfully', {
        messageId: info.messageId,
        to: to
      });
      return info;

    } catch (error) {
      logger.error('Email service error', {
        error: error.message,
        stack: error.stack,
        config: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER
        }
      });
      throw new Error(`Email service error: ${error.message}`);
    }
  }

  async sendResetEmail(email, resetUrl) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Error sending reset email');
    }
  }

  async sendVerificationEmail(email, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <h1>Verify Your Email</h1>
        <p>Thank you for registering! Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Verification email sent successfully', {
        messageId: info.messageId,
        to: email
      });
      return info;
    } catch (error) {
      logger.error('Verification email sending error:', error);
      throw new Error('Error sending verification email');
    }
  }
}

export const emailService = new EmailService();
export const sendResetPasswordEmail = (email, token) => 
  emailService.sendResetPasswordEmail(email, token);

// Add a test function to verify email configuration
export const testEmailConfig = async () => {
  try {
    await emailService.transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    logger.error('Email configuration test failed:', error);
    return { success: false, message: error.message };
  }
};

export const sendPasswordResetEmail = (to, resetToken) => 
  emailService.sendPasswordResetEmail(to, resetToken);

export const sendResetEmail = (email, resetUrl) => 
  emailService.sendResetEmail(email, resetUrl);

export const sendVerificationEmail = (email, verificationToken) => 
  emailService.sendVerificationEmail(email, verificationToken); 