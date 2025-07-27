const express = require('express');
const router = express.Router();
const momoPaymentController = require('../controllers/momoPaymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');


router.post('/momo', authMiddleware, momoPaymentController.create);

router.get('/callback', paymentController.handleMomoCallback);

router.post('/ipn', paymentController.handleMomoIPN);

router.post('/generate', authMiddleware, paymentController.generateMomoAppPaymentData);

module.exports = router;
