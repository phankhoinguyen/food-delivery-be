const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/payments
 * @desc    Create a new payment
 * @access  Private
 */
router.post('/', authMiddleware, paymentController.createPayment);

/**
 * @route   GET /api/payments/:paymentId
 * @desc    Get payment by ID
 * @access  Private
 */
router.get('/:paymentId', authMiddleware, paymentController.getPaymentById);

/**
 * @route   GET /api/payments/user/:userId
 * @desc    Get all payments for a user
 * @access  Private
 */
router.get('/user/:userId', authMiddleware, paymentController.getUserPayments);

/**
 * @route   POST /api/payments/:paymentId/refund
 * @desc    Process refund for a payment
 * @access  Private (Admin)
 */
router.post('/:paymentId/refund', authMiddleware, paymentController.refundPayment);

/**
 * @route   GET /api/payments/momo/callback
 * @desc    Handle MoMo payment callback (redirect)
 * @access  Public
 */
router.get('/momo/callback', paymentController.handleMomoCallback);

/**
 * @route   POST /api/payments/momo/ipn
 * @desc    Handle MoMo IPN (Instant Payment Notification)
 * @access  Public
 */
router.post('/momo/ipn', paymentController.handleMomoIPN);

/**
 * @route   GET /api/payments/vnpay/callback
 * @desc    Handle VNPay payment callback
 * @access  Public
 */
router.get('/vnpay/callback', paymentController.handleVnpayCallback);

module.exports = router; 