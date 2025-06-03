import QRCode from 'qrcode';

export const generateTicketNumber = () => {
    return `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

export const generateQRCode = async (data) => {
    try {
        return await QRCode.toDataURL(data);
    } catch (error) {
        console.error('QR Code generation error:', error);
        return null;
    }
}; 