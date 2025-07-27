const PaymentService = require('../services/paymentService');
const { paymentRepository } = require('../models/payment');

const paymentService = new PaymentService();

const vnpayPaymentController = {
    create: async (req, res) => {
        try {
            const { userId, orderId, amount, paymentMethod, paymentDetails = {} } = req.body;
            if (!userId || !orderId || !amount || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required payment information'
                });
            }
            paymentDetails.provider = 'vnpay';
            const paymentResult = await paymentService.processPayment({
                userId,
                orderId,
                amount,
                paymentMethod,
                paymentDetails
            });
            if (paymentResult.success) {
                if (paymentResult.paymentUrl) {
                    const pendingPayment = await paymentRepository.create({
                        userId,
                        orderId,
                        amount,
                        paymentMethod,
                        paymentStatus: 'pending',
                        transactionId: paymentResult.transactionId,
                        paymentDetails: {
                            ...paymentDetails,
                            provider: paymentResult.provider,
                            paymentUrl: paymentResult.paymentUrl
                        }
                    });
                    return res.status(200).json({
                        success: true,
                        message: 'VNPay payment initiated',
                        data: {
                            paymentId: pendingPayment.id || pendingPayment._id,
                            transactionId: paymentResult.transactionId,
                            paymentUrl: paymentResult.paymentUrl,
                            status: 'pending',
                            provider: paymentResult.provider
                        }
                    });
                } else {
                    const newPayment = await paymentRepository.create({
                        userId,
                        orderId,
                        amount,
                        paymentMethod,
                        paymentStatus: 'completed',
                        transactionId: paymentResult.transactionId,
                        paymentDetails
                    });
                    return res.status(201).json({
                        success: true,
                        message: 'VNPay payment processed successfully',
                        data: {
                            paymentId: newPayment.id || newPayment._id,
                            transactionId: paymentResult.transactionId,
                            status: 'completed'
                        }
                    });
                }
            } else {
                const failedPayment = await paymentRepository.create({
                    userId,
                    orderId,
                    amount,
                    paymentMethod,
                    paymentStatus: 'failed',
                    paymentDetails
                });
                return res.status(400).json({
                    success: false,
                    message: 'VNPay payment processing failed',
                    error: paymentResult.error
                });
            }
        } catch (error) {
            console.error('VNPay payment creation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = vnpayPaymentController;
