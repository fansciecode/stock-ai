const config = {
    API_URL: process.env.REACT_APP_API_URL || 'https://api.ibcm.app/api',
    APP_TITLE: process.env.REACT_APP_TITLE || 'Admin Panel',
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production'
};

export default config; 