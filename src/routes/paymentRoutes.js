const express = require('express');
const router = express.Router();

const momoPaymentController = require('../controllers/momoPaymentController');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware'); // middleware kiểm tra token

// Route tạo payment MoMo, có auth để lấy userId
router.post('/momo', authMiddleware, momoPaymentController.create);
router.post('/momo/callback', paymentController.handleMomoNotifyUrl);

module.exports = router;
