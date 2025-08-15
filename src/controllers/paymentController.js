const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');

// Controller to create a new payment
const processMomoPayment = async (req, res) => {
    try {
        const paymentData = req.body;
        console.log('[PROCESS MOMO PAYMENT] Dữ liệu đầu vào:', paymentData);
        const newPayment = await paymentService.processMomoPayment(paymentData);
        res.status(201).json(newPayment);
    } catch (error) {
        console.error('[PROCESS MOMO PAYMENT ERROR]', error);
        res.status(500).json({ error: error.message });
    }
};

// Controller to get a payment by ID
const getPaymentById = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const payment = await paymentService.getPaymentById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Controller to handle Momo redirect callback
const handleMomoCallback = async (req, res) => {
    try {
        const paymentResult = req.query;
        console.log('[MOMO] Redirect Callback Data:', paymentResult);
        await paymentService.processMomoCallback(paymentResult);
        res.status(200).send('Payment processed successfully');
    } catch (error) {
        console.error('[MOMO CALLBACK ERROR]', error);
        res.status(500).send('Internal Server Error');
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

// Controller to generate data for MoMo App payment (QR or deep link)
const generateMomoAppPaymentData = async (req, res) => {
    try {
        const paymentInfo = req.body;
        const momoData = await paymentService.generateMomoAppPaymentData(paymentInfo);
        res.status(200).json(momoData);
    } catch (error) {
        console.error('[GENERATE MOMO DATA ERROR]', error);
        res.status(500).json({ error: error.message });
    }
};

// ✅ Controller để xử lý notifyUrl MoMo gửi về
const handleMomoNotifyUrl = async (req, res) => {
    try {
        const notifyData = req.body;
        console.log('[MOMO] Notify URL Data Received:', notifyData);

        const result = await paymentService.processMomoNotify(notifyData);

        if (result.success) {
            // Gửi thông báo đẩy nếu cần
            await notificationService.sendPaymentNotification(result.userId, result.message);
            res.status(200).json({ message: 'Notify handled successfully' });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        console.error('[MOMO NOTIFY ERROR]', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ✅ Export tất cả các controller ra ngoài
const paymentController = {
    processMomoPayment,
    getPaymentById,
    handleMomoCallback,
    handleMomoIPN,
    generateMomoAppPaymentData,
    handleMomoNotifyUrl // ✅ ĐÃ THÊM HÀM NÀY VÀO ĐÂY
};

module.exports = paymentController;
