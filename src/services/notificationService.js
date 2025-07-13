const admin = require('firebase-admin');
const { notificationRepository } = require('../models/notification');

/**
 * Notification Service
 * 
 * Handles push notifications using Firebase Cloud Messaging (FCM)
 */
class NotificationService {
    constructor() {
        // Firebase Admin SDK should be initialized in db.js
        this.messaging = admin.apps.length ? admin.messaging() : null;
    }

    /**
     * Send push notification to user devices
     * 
     * @param {Object} notification - Notification data
     * @param {string} notification.userId - User ID
     * @param {string} notification.title - Notification title
     * @param {string} notification.body - Notification body
     * @param {Object} notification.data - Additional data to send
     * @param {string} notification.type - Notification type
     * @param {Array<string>} notification.deviceTokens - Device tokens to send to
     * @returns {Promise<Object>} Result of notification sending
     */
    async sendPushNotification(notification) {
        try {
            const { userId, title, body, data = {}, type = 'system', deviceTokens = [] } = notification;

            if (!userId || !title || !body) {
                throw new Error('Missing required notification information');
            }

            if (!deviceTokens.length) {
                console.warn('No device tokens provided for push notification');

                // Save notification to database even if no devices to send to
                const savedNotification = await notificationRepository.create({
                    userId,
                    title,
                    body,
                    data,
                    type,
                    sentToDevice: false,
                    deviceTokens: []
                });

                return {
                    success: false,
                    message: 'No device tokens provided',
                    notificationId: savedNotification.id || savedNotification._id
                };
            }

            // Ensure Firebase Admin SDK is initialized
            if (!this.messaging) {
                throw new Error('Firebase Admin SDK not initialized');
            }

            // Prepare the message
            const message = {
                notification: {
                    title,
                    body
                },
                data: {
                    ...data,
                    type,
                    notificationId: Date.now().toString(),
                    click_action: 'FLUTTER_NOTIFICATION_CLICK'
                },
                tokens: deviceTokens
            };

            // Send the message
            const response = await this.messaging.sendMulticast(message);

            // Save notification to database
            const savedNotification = await notificationRepository.create({
                userId,
                title,
                body,
                data,
                type,
                sentToDevice: response.successCount > 0,
                deviceTokens
            });

            // Return the result
            return {
                success: true,
                notificationId: savedNotification.id || savedNotification._id,
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses
            };
        } catch (error) {
            console.error('Push notification error:', error);

            // Return failure response
            return {
                success: false,
                error: error.message || 'Failed to send push notification'
            };
        }
    }

    /**
     * Register a device token for a user
     * 
     * @param {string} userId - User ID
     * @param {string} deviceToken - Device token to register
     * @returns {Promise<boolean>} Success status
     */
    async registerDeviceToken(userId, deviceToken) {
        try {
            // In a real implementation, you would store this in a user's document
            // For now, we'll just return success
            console.log(`Registered device token ${deviceToken} for user ${userId}`);
            return true;
        } catch (error) {
            console.error('Device token registration error:', error);
            throw error;
        }
    }

    /**
     * Unregister a device token for a user
     * 
     * @param {string} userId - User ID
     * @param {string} deviceToken - Device token to unregister
     * @returns {Promise<boolean>} Success status
     */
    async unregisterDeviceToken(userId, deviceToken) {
        try {
            // In a real implementation, you would remove this from a user's document
            // For now, we'll just return success
            console.log(`Unregistered device token ${deviceToken} for user ${userId}`);
            return true;
        } catch (error) {
            console.error('Device token unregistration error:', error);
            throw error;
        }
    }

    /**
     * Send notification to specific users
     * 
     * @param {Array<string>} userIds - Array of user IDs to send to
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} Result of notification sending
     */
    async sendToUsers(userIds, notificationData) {
        try {
            // In a real implementation, you would fetch device tokens for these users
            // For now, we'll just log and return success
            console.log(`Sending notification to users: ${userIds.join(', ')}`);

            // Create notifications in the database for each user
            const notifications = [];

            for (const userId of userIds) {
                const notification = await notificationRepository.create({
                    userId,
                    title: notificationData.title,
                    body: notificationData.body,
                    data: notificationData.data || {},
                    type: notificationData.type || 'system',
                    sentToDevice: false
                });

                notifications.push(notification);
            }

            return {
                success: true,
                message: `Created ${notifications.length} notifications`,
                notificationIds: notifications.map(n => n.id || n._id)
            };
        } catch (error) {
            console.error('Send to users error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send to users'
            };
        }
    }
}

// Create a singleton instance
const notificationService = new NotificationService();

module.exports = notificationService; 