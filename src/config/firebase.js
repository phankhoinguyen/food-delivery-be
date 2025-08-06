require('dotenv').config();
const admin = require('firebase-admin');

class FirebaseConfig {
    constructor() {
        this.db = null;
        this.auth = null;
        this.messaging = null;
    }

    async initialize() {
        try {
            if (admin.apps.length === 0) {
                const serviceAccount = {
                    type: 'service_account',
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    database_URL: process.env.FIREBASE_DATABASE_URL,
                    storage_Bucket: process.env.FIREBASE_STORAGE_BUCKET,
                };
                console.log('📦 Firebase ENV loaded:', {
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key_status: process.env.FIREBASE_PRIVATE_KEY ? '✅ OK' : '❌ MISSING',
                    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
                    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET
                });

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: process.env.FIREBASE_DATABASE_URL,
                    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                });

                console.log('✅ Firebase Admin SDK initialized');
            }

            this.db = admin.firestore();
            this.auth = admin.auth();
            this.messaging = admin.messaging();

            this.db.settings({ timestampsInSnapshots: true });

            return true;
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            throw error;
        }
    }

    getFirestore() {
        if (!this.db) throw new Error('Firestore not initialized.');
        return this.db;
    }

    getAuth() {
        if (!this.auth) throw new Error('Auth not initialized.');
        return this.auth;
    }

    getMessaging() {
        if (!this.messaging) throw new Error('Messaging not initialized.');
        return this.messaging;
    }

    timestampToDate(timestamp) {
        return timestamp?.toDate?.() || new Date(timestamp);
    }

    createTimestamp(date = new Date()) {
        return admin.firestore.Timestamp.fromDate(date);
    }
}

module.exports = new FirebaseConfig();
