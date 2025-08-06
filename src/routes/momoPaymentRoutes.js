const express = require('express');
const router = express.Router();

const momoPaymentController = require('../controllers/momoPaymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Tạo giao dịch MoMo (web)
router.post('/momo', authMiddleware, momoPaymentController.create);

// Callback URL được MoMo redirect người dùng về sau khi thanh toán
router.get('/callback', paymentController.handleMomoCallback);

// IPN (Instant Payment Notification) – MoMo gọi POST về để xác nhận giao dịch
router.post('/ipn', paymentController.handleMomoIPN);

// Tạo dữ liệu deeplink để mở app MoMo (dành cho mobile app)
router.post('/generate', authMiddleware, paymentController.generateMomoAppPaymentData);

//Callback dùng để nhận dữ liệu MoMo gửi về nếu bạn khai báo notifyUrl
router.post('/momo/callback', paymentController.handleMomoNotifyUrl);

module.exports = router;
