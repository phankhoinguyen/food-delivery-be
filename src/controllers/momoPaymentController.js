const paymentService = require('../services/paymentService');

const momoPaymentController = {
    create: async (req, res) => {
        try {
            const userId = req.user?.uid;
            const { amount, paymentMethod, paymentDetails = {} } = req.body;

            if (!userId || !amount || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required payment information'
                });
            }

            paymentDetails.provider = 'momo';

            // Gọi service để tạo payment (Service sẽ tự lưu pending)
            const paymentResult = await paymentService.processMomoPayment({
                userId,
                amount,
                paymentMethod,
                paymentDetails
            });

            if (paymentResult.success) {
                return res.status(200).json({
                    success: true,
                    message: 'MoMo payment initiated',
                    data: paymentResult.data // dữ liệu đã lưu pending trong Service
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'MoMo payment processing failed',
                    error: paymentResult.error
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = momoPaymentController;
