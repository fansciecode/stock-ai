import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CERT_URL
};

let db = null;
let messaging = null;

// Initialize Firebase only if not in development mode or if credentials are available
if (!admin.apps.length && process.env.NODE_ENV !== 'development') {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'ibcmserver_init'
        });
        console.log('Firebase Admin initialized successfully');
        db = admin.firestore();
        messaging = admin.messaging();
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
        console.log('Continuing without Firebase in development mode');
    }
}

export { db, messaging };
export default admin; 