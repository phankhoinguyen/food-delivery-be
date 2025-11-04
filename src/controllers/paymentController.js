const { messaging } = require('../config/firebase');
const paymentService = require('../services/paymentService');


// Controller to get a payment by ID
const checkStatusPayment = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const payment = await paymentService.checkStatusPayment(orderId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Controller to handle Momo IPN (Instant Payment Notification)
const handleMomoIPN = async (req, res) => {
    try {
        const ipnData = req.body;
        console.log('[MOMO] IPN Data Received:', ipnData);
        const result = await paymentService.processMomoNotify(ipnData);
        if (result.success) {
            res.status(200).json({ message: 'IPN processed successfully' });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        console.error('[MOMO IPN ERROR]', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const getPaymentByUserId = async (req, res) => {
    const userId = req.user?.uid;
    try {
        const payload = await paymentService.getPaymentByFields({ userId });
        if (payload.success) {
            res.status(200).json(payload);
        } else {
            res.status(400).json(payload);
        }
    } catch (error) {
        res.status(500).json({
            message: error
        })
    }
}
const getPaymentByStatus = async (req, res) => {
    const status = {
        paymentStatus: 'completed'
    }
    try {
        const payload = await paymentService.getPaymentByFields(status);
        if (payload.success) {
            res.status(200).json(payload);
        } else {
            res.status(400).json(payload);
        }
    } catch (error) {
        res.status(500).json({
            message: error
        })
    }
}


const paymentController = {
    checkStatusPayment,
    handleMomoIPN,
    getPaymentByUserId,
    getPaymentByStatus
};

module.exports = paymentController;
