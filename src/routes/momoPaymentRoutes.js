const express = require('express');
const router = express.Router();

const momoPaymentController = require('../controllers/momoPaymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Tạo giao dịch MoMo (web)
router.post('/momo', authMiddleware, momoPaymentController.create);

// Callback URL được MoMo redirect người dùng về sau khi thanh toán
router.get('/status/:orderId', authMiddleware, paymentController.checkStatusPayment);

// IPN (Instant Payment Notification) – MoMo gọi POST về để xác nhận giao dịch
router.post('/ipn', paymentController.handleMomoIPN);


module.exports = router;
