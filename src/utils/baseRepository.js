const { databaseService } = require('../config/db');

/**
 * Base Repository class to abstract database operations
 * Supports both MongoDB and Firestore
 */
class BaseRepository {
    /**
     * @param {string} collectionName - Name of the collection/table
     * @param {object} model - Mongoose model (used only for MongoDB)
     */
    constructor(collectionName, model = null) {
        this.collectionName = collectionName;
        this.model = model;
        this.dbType = databaseService.getDatabaseType();
        this.db = databaseService.getDb();
    }

    /**
     * Create a new document
     * @param {object} data - Document data
     * @returns {Promise<object>} Created document
     */
    async create(data) {
        try {
            if (this.dbType === 'mongodb') {
                const newDoc = new this.model(data);
                return await newDoc.save();
            } else {
                // Firestore
                const docRef = await this.db.collection(this.collectionName).add({
                    ...data,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                const doc = await docRef.get();
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
        } catch (error) {
            console.error(`Error creating document in ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Find document by ID
     * @param {string} id - Document ID
     * @returns {Promise<object>} Found document or null
     */
    async findById(id) {
        try {
            if (this.dbType === 'mongodb') {
                return await this.model.findById(id);
            } else {
                const doc = await this.db.collection(this.collectionName).doc(id).get();
                if (!doc.exists) return null;
                return { id: doc.id, ...doc.data() };
            }
        } catch (error) {
            console.error(`Error finding document by ID in ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Find one document by query
     * @param {object} query - Query object
     * @returns {Promise<object|null>} Found document or null
     */
    async findOne(query = {}) {
        try {
            if (this.dbType === 'mongodb') {
                return await this.model.findOne(query);
            } else {
                console.log('order id query :', query);
                let firestoreQuery = this.db.collection(this.collectionName);
                Object.entries(query).forEach(([field, value]) => {
                    firestoreQuery = firestoreQuery.where(field, '==', value);
                });

                const snapshot = await firestoreQuery.limit(1).get();
                if (snapshot.empty) return null;

                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
        } catch (error) {
            console.error(`Error finding one document in ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Find documents by query
     * @param {object} query - Query object
     * @param {object} options - Query options (sort, limit, etc.)
     * @returns {Promise<Array>} Array of documents
     */
    async find(query = {}, options = {}) {
        try {
            if (this.dbType === 'mongodb') {
                return await this.model.find(query, null, options);
            } else {
                let firestoreQuery = this.db.collection(this.collectionName);

                Object.entries(query).forEach(([field, value]) => {
                    firestoreQuery = firestoreQuery.where(field, '==', value);
                });

                if (options.sort) {
                    const [field, direction] = Object.entries(options.sort)[0];
                    firestoreQuery = firestoreQuery.orderBy(field, direction === 1 ? 'asc' : 'desc');
                }

                if (options.limit) firestoreQuery = firestoreQuery.limit(options.limit);

                const snapshot = await firestoreQuery.get();
                if (snapshot.empty) return [];

                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
        } catch (error) {
            console.error(`Error finding documents in ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Update document by ID
     * @param {string} id - Document ID
     * @param {object} data - Update data
     * @returns {Promise<object>} Updated document
     */
    async updateById(id, data) {
        try {
            if (this.dbType === 'mongodb') {
                return await this.model.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true });
            } else {
                const docRef = this.db.collection(this.collectionName).doc(id);
                await docRef.update({ ...data, updatedAt: new Date() });
                const updatedDoc = await docRef.get();
                return { id: updatedDoc.id, ...updatedDoc.data() };
            }
        } catch (error) {
            console.error(`Error updating document in ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Delete document by ID
     * @param {string} id - Document ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteById(id) {
        try {
            if (this.dbType === 'mongodb') {
                const result = await this.model.findByIdAndDelete(id);
                return !!result;
            } else {
                await this.db.collection(this.collectionName).doc(id).delete();
                return true;
            }
        } catch (error) {
            console.error(`Error deleting document in ${this.collectionName}:`, error);
            throw error;
        }
    }
}

module.exports = BaseRepository;
