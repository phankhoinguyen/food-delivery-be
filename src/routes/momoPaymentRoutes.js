const express = require('express');
const router = express.Router();

const momoPaymentController = require('../controllers/momoPaymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Tạo giao dịch MoMo (web)
router.post('/momo', authMiddleware, momoPaymentController.create);


router.get('/status/:orderId', authMiddleware, paymentController.checkStatusPayment);

router.get('/', authMiddleware, paymentController.getPaymentByUserId);

router.get('/admin', paymentController.getPaymentByStatus);

// IPN (Instant Payment Notification) – MoMo gọi POST về để xác nhận giao dịch
router.post('/ipn', paymentController.handleMomoIPN);


module.exports = router;
