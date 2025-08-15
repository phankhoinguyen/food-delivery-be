const express = require('express');
const router = express.Router();
const vnpayPaymentController = require('../controllers/vnpayPaymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');

/**
 * @route   POST /api/vnpay/pay
 * @desc    Create VNPay payment
 * @access  Private
 */
router.post('/pay', authMiddleware, vnpayPaymentController.create);

/**
 * @route   GET /api/vnpay/callback
 * @desc    Handle VNPay payment callback
 * @access  Public
 */
router.get('/callback', paymentController.handleVnpayCallback);

module.exports = router;
// File này đã được xóa, chỉ dùng MoMo
