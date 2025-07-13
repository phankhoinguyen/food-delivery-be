const { notificationRepository } = require('../models/notification');
const notificationService = require('../services/notificationService');

// Controller methods for notification operations
const notificationController = {
    // Get all notifications for a user
    getUserNotifications: async (req, res) => {
        try {
            const userId = req.params.userId || req.user.id;
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;

            const notifications = await notificationRepository.findByUserId(
                userId,
                { limit, skip: (page - 1) * limit }
            );

            return res.status(200).json({
                success: true,
                data: notifications,
                pagination: {
                    page,
                    limit,
                    hasMore: notifications.length === limit
                }
            });
        } catch (error) {
            console.error('Get user notifications error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get unread notifications count for a user
    getUnreadCount: async (req, res) => {
        try {
            const userId = req.params.userId || req.user.id;

            const unreadNotifications = await notificationRepository.findUnreadByUserId(userId);

            return res.status(200).json({
                success: true,
                count: unreadNotifications.length
            });
        } catch (error) {
            console.error('Get unread count error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Mark a notification as read
    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;

            const notification = await notificationRepository.findById(notificationId);

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            // Check if user owns this notification
            if (notification.userId.toString() !== req.user.id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this notification'
                });
            }

            const updatedNotification = await notificationRepository.markAsRead(notificationId);

            return res.status(200).json({
                success: true,
                data: updatedNotification
            });
        } catch (error) {
            console.error('Mark as read error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Mark all notifications as read for a user
    markAllAsRead: async (req, res) => {
        try {
            const userId = req.params.userId || req.user.id;

            await notificationRepository.markAllAsRead(userId);

            return res.status(200).json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            console.error('Mark all as read error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Register a device token for push notifications
    registerDeviceToken: async (req, res) => {
        try {
            const { deviceToken } = req.body;
            const userId = req.user.id;

            if (!deviceToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Device token is required'
                });
            }

            await notificationService.registerDeviceToken(userId, deviceToken);

            return res.status(200).json({
                success: true,
                message: 'Device token registered successfully'
            });
        } catch (error) {
            console.error('Register device token error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Unregister a device token
    unregisterDeviceToken: async (req, res) => {
        try {
            const { deviceToken } = req.body;
            const userId = req.user.id;

            if (!deviceToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Device token is required'
                });
            }

            await notificationService.unregisterDeviceToken(userId, deviceToken);

            return res.status(200).json({
                success: true,
                message: 'Device token unregistered successfully'
            });
        } catch (error) {
            console.error('Unregister device token error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Send a test notification (admin only)
    sendTestNotification: async (req, res) => {
        try {
            const { userId, title, body, deviceTokens } = req.body;

            if (!userId || !title || !body || !deviceTokens) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required notification information'
                });
            }

            // Check if user is admin (you would implement proper authorization)
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to send test notifications'
                });
            }

            const result = await notificationService.sendPushNotification({
                userId,
                title,
                body,
                deviceTokens,
                data: { test: true },
                type: 'system'
            });

            return res.status(200).json({
                success: true,
                message: 'Test notification sent',
                data: result
            });
        } catch (error) {
            console.error('Send test notification error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = notificationController; 