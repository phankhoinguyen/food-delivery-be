const mongoose = require('mongoose');
const admin = require('firebase-admin');

/**
 * Database abstraction layer to support both Firestore and MongoDB
 */
class DatabaseService {
    constructor() {
        this.dbType = process.env.DB_TYPE;
        this.isConnected = false;
        this.db = null;
    }

    /**
     * Initialize and connect to the database
     */
    async connect() {
        try {
            if (this.dbType === 'mongodb') {
                await this.connectMongoDB();
            } else {
                await this.connectFirestore();
            }

            this.isConnected = true;
            return this.db;
        } catch (error) {
            console.error(`Error connecting to database: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Connect to MongoDB
     */
    async connectMongoDB() {
        const mongoURI = process.env.MONGO_URI;

        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        this.db = conn;
        return conn;
    }

    async connectFirestore() {
        try {
            // Check if Firebase app is already initialized
            if (!admin.apps.length) {
                // Load service account from file path
                const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
                const path = require('path');
                const fullPath = path.resolve(serviceAccountPath);
                const serviceAccount = require(fullPath);

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: process.env.FIREBASE_DATABASE_URL,
                    projectId: process.env.FIREBASE_PROJECT_ID
                });
            }

            this.db = admin.firestore();
            console.log('Firestore Connected');
            return this.db;
        } catch (error) {
            console.error(`Error connecting to Firestore: ${error.message}`);
            throw error;
        }
    }

    getDb() {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    getDatabaseType() {
        return this.dbType;
    }
}

// Create a singleton instance
const databaseService = new DatabaseService();

// Export the connect function for backward compatibility
const connectDB = async () => {
    return await databaseService.connect();
};

module.exports = {
    connectDB,
    databaseService
}; 