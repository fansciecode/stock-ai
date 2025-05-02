import { createLogger } from './logger.js';
import twilio from 'twilio';

const logger = createLogger('otpService');

// Initialize Twilio client conditionally
let twilioClient;
let smsDisabled = false;

try {
    if (process.env.SKIP_SMS_NOTIFICATIONS === 'true') {
        logger.info('NOTICE: SMS/OTP services are disabled for testing');
        smsDisabled = true;
    } else if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        logger.warn('WARNING: Twilio configuration missing, SMS/OTP services will be disabled');
        smsDisabled = true;
    } else {
        twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }
} catch (error) {
    logger.error('Error initializing Twilio client:', error);
    smsDisabled = true;
}

/**
 * Generate a random OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} Generated OTP
 */
export const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
};

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - OTP to send
 * @returns {Promise<object>} Twilio response
 */
export const sendOTPViaSMS = async (phoneNumber, otp) => {
    try {
        // If SMS is disabled, just log and return success
        if (smsDisabled) {
            logger.info(`OTP SMS [DISABLED] To: ${phoneNumber}, OTP: ${otp}`);
            return { success: true, disabled: true };
        }
        
        const message = await twilioClient.messages.create({
            body: `Your IBCM verification code is: ${otp}. Valid for 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });
        
        logger.info(`OTP sent to ${phoneNumber}`);
        return { success: true, sid: message.sid };
    } catch (error) {
        logger.error(`Failed to send OTP to ${phoneNumber}:`, error);
        throw error;
    }
};

/**
 * Verify OTP
 * @param {string} storedOTP - OTP stored in the system
 * @param {string} providedOTP - OTP provided by the user
 * @param {Date} expiryTime - Expiry time of the OTP
 * @returns {boolean} Whether OTP is valid
 */
export const verifyOTP = (storedOTP, providedOTP, expiryTime) => {
    if (!storedOTP || !providedOTP) {
        return false;
    }

    if (new Date() > expiryTime) {
        return false;
    }

    return storedOTP === providedOTP;
};

/**
 * Get OTP expiry time
 * @param {number} minutes - Minutes until OTP expires (default: 10)
 * @returns {Date} Expiry time
 */
export const getOTPExpiry = (minutes = 10) => {
    return new Date(Date.now() + minutes * 60000);
};

/**
 * Generate OTP with expiry
 * @param {number} length - Length of OTP
 * @param {number} expiryMinutes - Minutes until OTP expires
 * @returns {Object} OTP details
 */
export const generateOTPWithExpiry = (length = 6, expiryMinutes = 10) => {
    return {
        otp: generateOTP(length),
        expiry: getOTPExpiry(expiryMinutes)
    };
}; 