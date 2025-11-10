const paymentService = require('../services/paymentService');
const momoPaymentController = {
    create: async (req, res) => {
        try {
            const userId = req.user?.uid;
            const { address, userToken, amount, paymentMethod, orderId, items = {} } = req.body;

            if (!userId || !amount || !paymentMethod || !orderId || !items || !userToken || !address) {
                return res.status(402).json({
                    success: false,
                    message: 'Missing required payment information'
                });
            }


            const paymentResult = await paymentService.processMomoPayment({
                address,
                userId,
                userToken,
                amount,
                paymentMethod,
                orderId,
                items
            });
            console.log(paymentResult.data);

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
            console.log(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = momoPaymentController;
