const admin = require('firebase-admin');
const path = require('path');

class FirebaseConfig {
    constructor() {
        this.db = null;
        this.auth = null;
        this.messaging = null;
    }

    async initialize() {
        try {
            // Check if Firebase is already initialized
            if (admin.apps.length === 0) {
                const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccountPath),
                    databaseURL: process.env.FIREBASE_DATABASE_URL,
                    projectId: process.env.FIREBASE_PROJECT_ID,
                });

                console.log('Firebase Admin SDK initialized successfully');
            }

            // Initialize services
            this.db = admin.firestore();
            this.auth = admin.auth();
            this.messaging = admin.messaging();

            // Firestore settings
            this.db.settings({
                timestampsInSnapshots: true,
            });

            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            throw error;
        }
    }

    getFirestore() {
        if (!this.db) {
            throw new Error('Firestore not initialized. Call initialize() first.');
        }
        return this.db;
    }

    getAuth() {
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized. Call initialize() first.');
        }
        return this.auth;
    }

    getMessaging() {
        if (!this.messaging) {
            throw new Error('Firebase Messaging not initialized. Call initialize() first.');
        }
        return this.messaging;
    }

    // Helper method to handle Firestore timestamps
    timestampToDate(timestamp) {
        if (!timestamp) return null;
        return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    }

    // Helper method to create Firestore timestamp
    createTimestamp(date = new Date()) {
        return admin.firestore.Timestamp.fromDate(date);
    }
}

module.exports = new FirebaseConfig();
