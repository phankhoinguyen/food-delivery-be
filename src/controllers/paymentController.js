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



// const handleMomoNotifyUrl = async (req, res) => {
//     try {
//         const notifyData = req.body;
//         console.log('[MOMO] Notify URL Data Received:', notifyData);

//         const result = await paymentService.processMomoNotify(notifyData);

//         if (result.success) {
//             // Gửi thông báo đẩy nếu cần
//             await notificationService.sendPaymentNotification(result.userId, result.message);
//             res.status(200).json({ message: 'Notify handled successfully' });
//         } else {
//             res.status(400).json({ message: result.message });
//         }
//     } catch (error) {
//         console.error('[MOMO NOTIFY ERROR]', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };


const paymentController = {
    checkStatusPayment,
    handleMomoIPN,

};

module.exports = paymentController;
