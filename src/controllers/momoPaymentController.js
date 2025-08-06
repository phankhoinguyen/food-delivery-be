const PaymentService = require('../services/paymentService');
const { paymentRepository } = require('../models/payment');

const paymentService = require('../services/paymentService');

const momoPaymentController = {
    create: async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { amount, paymentMethod, paymentDetails = {} } = req.body;

            if (!userId || !amount || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required payment information'
                });
            }

            paymentDetails.provider = 'momo';

            const paymentResult = await paymentService.processMomoPayment({
                userId,
                amount,
                paymentMethod,
                paymentDetails
            });

            if (paymentResult.success) {
                // Ưu tiên trả về các loại URL thanh toán
                const resultData = paymentResult.data;
                if (resultData.redirectUrl || resultData.deepLink || resultData.smartUrl || resultData.qrCodeUrl) {
                    const paymentDetailsData = {
                        ...paymentDetails,
                        provider: resultData.provider || 'momo',
                        deepLink: resultData.deepLink || null,
                        smartUrl: resultData.smartUrl || null,
                        qrCodeUrl: resultData.qrCodeUrl || null,
                        requestId: resultData.requestId || null,
                        transactionId: resultData.transactionId || null
                    };

                    const paymentData = {
                        userId,
                        amount,
                        paymentMethod,
                        paymentStatus: 'pending',
                        paymentDetails: paymentDetailsData
                    };

                    const pendingPayment = await paymentRepository.create(paymentData);

                    return res.status(200).json({
                        success: true,
                        message: 'MoMo payment initiated',
                        data: {
                            paymentId: pendingPayment.id || pendingPayment._id,
                            provider: resultData.provider || 'momo',
                            status: 'pending',
                            requestId: resultData.requestId || null,
                            transactionId: resultData.transactionId || null,
                            deepLink: resultData.deepLink || null,
                            qrCodeUrl: resultData.qrCodeUrl || null,
                            smartUrl: resultData.smartUrl || null
                        }
                    });
                } else {
                    // Không có URL thanh toán => app-in-app hoặc xử lý xong luôn
                    const paymentData = {
                        userId,
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
                // Giao dịch thất bại
                await paymentRepository.create({
                    userId,
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
