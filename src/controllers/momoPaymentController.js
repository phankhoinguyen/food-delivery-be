const PaymentService = require('../services/paymentService');
const { paymentRepository } = require('../models/payment');

const paymentService = new PaymentService();

const momoPaymentController = {
    create: async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { orderId, amount, paymentMethod, paymentDetails = {} } = req.body;

            if (!userId || !orderId || !amount || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required payment information'
                });
            }

            paymentDetails.provider = 'momo';

            const paymentResult = await paymentService.processPayment({
                userId,
                orderId,
                amount,
                paymentMethod,
                paymentDetails
            });

            if (paymentResult.success) {
                if (paymentResult.paymentUrl) {
                    // Thanh toán redirect (có paymentUrl)
                    const paymentData = {
                        userId,
                        orderId,
                        amount,
                        paymentMethod,
                        paymentStatus: 'pending',
                        paymentDetails: {
                            ...paymentDetails,
                            provider: paymentResult.provider,
                            paymentUrl: paymentResult.paymentUrl
                        }
                    };

                    const pendingPayment = await paymentRepository.create(paymentData);

                    return res.status(200).json({
                        success: true,
                        message: 'MoMo payment initiated',
                        data: {
                            paymentId: pendingPayment.id || pendingPayment._id,
                            paymentUrl: paymentResult.paymentUrl,
                            status: 'pending',
                            provider: paymentResult.provider
                        }
                    });
                } else {
                    // Thanh toán app-in-app (không có paymentUrl)
                    const paymentData = {
                        userId,
                        orderId,
                        amount,
                        paymentMethod,
                        paymentStatus: 'completed',
                        paymentDetails
                    };

                    if (paymentResult.transactionId) {
                        paymentData.transactionId = paymentResult.transactionId;
                    }

                    const newPayment = await paymentRepository.create(paymentData);

                    return res.status(201).json({
                        success: true,
                        message: 'MoMo payment processed successfully',
                        data: {
                            paymentId: newPayment.id || newPayment._id,
                            transactionId: paymentResult.transactionId || null,
                            status: 'completed'
                        }
                    });
                }
            } else {
                await paymentRepository.create({
                    userId,
                    orderId,
                    amount,
                    paymentMethod,
                    paymentStatus: 'failed',
                    paymentDetails
                });

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
