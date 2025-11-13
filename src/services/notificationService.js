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


    async sendPushNotification(notification) {
        try {
            const { userId, title, body, data = {}, type = 'system', deviceToken } = notification;

            if (!userId || !title || !body) {
                throw new Error('Missing required notification information');
            }

            if (!this.messaging) {
                throw new Error('Firebase Admin SDK not initialized');
            }
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
                token: deviceToken
            };

            // Send the message
            const response = await this.messaging.send(message);

            // Save notification to database
            const savedNotification = await notificationRepository.create({
                userId,
                title,
                body,
                isRead: false,
                data,
                type,
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


    async sendToAdminTopic(notificationData) {
        try {
            const { title, body, data = {}, type = 'admin' } = notificationData;

            if (!title || !body) {
                throw new Error('Missing required notification information (title and body)');
            }

            // Ensure Firebase Admin SDK is initialized
            if (!this.messaging) {
                throw new Error('Firebase Admin SDK not initialized');
            }

            // Prepare the message for admin topic
            const message = {
                notification: {
                    title,
                    body
                },
                data: {
                    ...data,
                    type,
                    notificationId: Date.now().toString(),
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                    timestamp: new Date().toISOString()
                },
                topic: 'admin' // Send to admin topic
            };

            // Send the message to admin topic
            const response = await this.messaging.send(message);

            console.log('Successfully sent notification to admin topic:', response);


            const savedNotification = await notificationRepository.create({
                userId: 'admin',
                title,
                body,
                isRead: false,
                data,
                type,
                topic: 'admin'
            });

            return {
                success: true,
                message: 'Notification sent to admin topic successfully',
                notificationId: savedNotification.id || savedNotification._id,
                messageId: response
            };
        } catch (error) {
            console.error('Admin topic notification error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send notification to admin topic'
            };
        }
    }
}

// Create a singleton instance
const notificationService = new NotificationService();

module.exports = notificationService; 