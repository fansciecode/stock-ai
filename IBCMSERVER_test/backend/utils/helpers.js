export const formatResponse = (status, message, data = null) => {
    return { status, message, data };
};

export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
