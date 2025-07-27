const express = require('express');
const router = express.Router();

const momoPaymentController = require('../controllers/momoPaymentController');
const authMiddleware = require('../middlewares/authMiddleware'); // middleware kiểm tra token

// Route tạo payment MoMo, có auth để lấy userId
router.post('/momo', authMiddleware, momoPaymentController.create);


module.exports = router;
