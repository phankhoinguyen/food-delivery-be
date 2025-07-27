const mongoose = require('mongoose');
const BaseRepository = require('../utils/baseRepository');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        default: {}
    },
    type: {
        type: String,
        enum: ['order', 'payment', 'promotion', 'system', 'other'],
        default: 'system'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    sentToDevice: {
        type: Boolean,
        default: false
    },
    deviceTokens: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the timestamp before saving
notificationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create the Mongoose model (used for MongoDB)
const NotificationModel = mongoose.model('Notification', notificationSchema);

/**
 * Notification Repository for database operations
 * Works with both MongoDB and Firestore
 */
class NotificationRepository extends BaseRepository {
    constructor() {
        super('notifications', NotificationModel);
    }

    /**
     * Find notifications by user ID
     * @param {string} userId - User ID
     * @param {object} options - Query options
     * @returns {Promise<Array>} Array of notifications
     */
    async findByUserId(userId, options = {}) {
        return this.find(
            { userId },
            { sort: { createdAt: -1 }, ...options }
        );
    }

    /**
     * Find unread notifications by user ID
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of unread notifications
     */
    async findUnreadByUserId(userId) {
        return this.find(
            { userId, isRead: false },
            { sort: { createdAt: -1 } }
        );
    }

    /**
     * Mark notification as read
     * @param {string} id - Notification ID
     * @returns {Promise<object>} Updated notification
     */
    async markAsRead(id) {
        return this.updateById(id, { isRead: true });
    }

    /**
     * Mark all notifications as read for a user
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async markAllAsRead(userId) {
        try {
            if (this.dbType === 'mongodb') {
                await this.model.updateMany(
                    { userId, isRead: false },
                    { isRead: true, updatedAt: new Date() }
                );
            } else {
                // Firestore batch update
                const batch = this.db.batch();
                const unreadNotifications = await this.findUnreadByUserId(userId);

                unreadNotifications.forEach(notification => {
                    const docRef = this.db.collection(this.collectionName).doc(notification.id);
                    batch.update(docRef, { isRead: true, updatedAt: new Date() });
                });

                await batch.commit();
            }
            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
}

// Create a singleton instance
const notificationRepository = new NotificationRepository();

module.exports = {
    NotificationModel,
    notificationRepository
}; 