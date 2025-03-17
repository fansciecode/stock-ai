import QRCode from 'qrcode';
import crypto from 'crypto';

// Generate a secure QR code with encrypted data
export const generateQR = async (data) => {
    try {
        // Create a secure hash of the data
        const dataString = JSON.stringify(data);
        const hash = crypto
            .createHmac('sha256', process.env.JWT_SECRET || 'qr-secret')
            .update(dataString)
            .digest('hex');

        // Combine data with hash for verification
        const qrData = {
            ...data,
            hash
        };

        // Generate QR code
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        return qrCode;
    } catch (error) {
        console.error('QR Generation Error:', error);
        throw new Error('Failed to generate QR code');
    }
};

// Verify QR code data
export const verifyQR = async (qrCode) => {
    try {
        // Parse QR data
        const data = JSON.parse(qrCode);
        const { hash, ...qrData } = data;

        // Verify hash
        const verificationHash = crypto
            .createHmac('sha256', process.env.JWT_SECRET || 'qr-secret')
            .update(JSON.stringify(qrData))
            .digest('hex');

        if (hash !== verificationHash) {
            return null;
        }

        return qrData;
    } catch (error) {
        console.error('QR Verification Error:', error);
        return null;
    }
}; 