const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for authenticated user
 * @access  Private
 */
router.get('/', authMiddleware, notificationController.getUserNotifications);

/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get unread notifications count for authenticated user
 * @access  Private
 */
router.get('/unread/count', authMiddleware, notificationController.getUnreadCount);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:notificationId/read', authMiddleware, notificationController.markAsRead);

/**
 * @route   PUT /api/notifications/read/all
 * @desc    Mark all notifications as read for authenticated user
 * @access  Private
 */
router.put('/read/all', authMiddleware, notificationController.markAllAsRead);

/**
 * @route   POST /api/notifications/device-token/register
 * @desc    Register a device token for push notifications
 * @access  Private
 */
router.post('/device-token/register', authMiddleware, notificationController.registerDeviceToken);

/**
 * @route   POST /api/notifications/device-token/unregister
 * @desc    Unregister a device token
 * @access  Private
 */
router.post('/device-token/unregister', authMiddleware, notificationController.unregisterDeviceToken);

/**
 * @route   POST /api/notifications/test
 * @desc    Send a test notification (admin only)
 * @access  Private (Admin)
 */
router.post('/test', authMiddleware, notificationController.sendTestNotification);

module.exports = router; 