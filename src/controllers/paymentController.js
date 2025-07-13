const { paymentRepository } = require('../models/payment');
const PaymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const crypto = require('crypto');
const paymentConfig = require('../config/paymentConfig');

// Initialize the payment service
const paymentService = new PaymentService();

// Controller methods for payment operations
const paymentController = {
    // Create a new payment
    createPayment: async (req, res) => {
        try {
            const { userId, orderId, amount, paymentMethod, paymentDetails } = req.body;

            if (!userId || !orderId || !amount || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required payment information'
                });
            }

            // Process payment through payment service
            const paymentResult = await paymentService.processPayment({
                userId,
                orderId,
                amount,
                paymentMethod,
                paymentDetails
            });

            if (paymentResult.success) {
                // For MoMo and VNPay, we get a payment URL and need to redirect the user
                if (paymentResult.paymentUrl) {
                    // Create pending payment record in database
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
                        message: 'Payment initiated',
                        data: {
                            paymentId: pendingPayment.id || pendingPayment._id,
                            transactionId: paymentResult.transactionId,
                            paymentUrl: paymentResult.paymentUrl,
                            status: 'pending',
                            provider: paymentResult.provider
                        }
                    });
                } else {
                    // Direct payment success (unlikely with MoMo/VNPay)
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
                        message: 'Payment processed successfully',
                        data: {
                            paymentId: newPayment.id || newPayment._id,
                            transactionId: paymentResult.transactionId,
                            status: 'completed'
                        }
                    });
                }
            } else {
                // Handle payment failure
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
                    message: 'Payment processing failed',
                    error: paymentResult.error
                });
            }
        } catch (error) {
            console.error('Payment creation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get payment by ID
    getPaymentById: async (req, res) => {
        try {
            const { paymentId } = req.params;

            const payment = await paymentRepository.findById(paymentId);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: payment
            });
        } catch (error) {
            console.error('Get payment error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get all payments for a user
    getUserPayments: async (req, res) => {
        try {
            const { userId } = req.params;

            const payments = await paymentRepository.findByUserId(userId);

            return res.status(200).json({
                success: true,
                data: payments
            });
        } catch (error) {
            console.error('Get user payments error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Process refund for a payment
    refundPayment: async (req, res) => {
        try {
            const { paymentId } = req.params;
            const { reason } = req.body;

            const payment = await paymentRepository.findById(paymentId);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            if (payment.paymentStatus === 'refunded') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment has already been refunded'
                });
            }

            // Process refund through payment service
            const refundResult = await paymentService.processRefund(payment);

            if (refundResult.success) {
                // Update payment status to refunded
                const updatedPaymentDetails = {
                    ...(payment.paymentDetails || {}),
                    refundReason: reason,
                    refundDate: new Date(),
                    refundTransactionId: refundResult.refundTransactionId
                };

                const updatedPayment = await paymentRepository.updateById(
                    payment.id || payment._id,
                    {
                        paymentStatus: 'refunded',
                        paymentDetails: updatedPaymentDetails
                    }
                );

                return res.status(200).json({
                    success: true,
                    message: 'Payment refunded successfully',
                    data: {
                        paymentId: updatedPayment.id || updatedPayment._id,
                        refundTransactionId: refundResult.refundTransactionId
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Refund processing failed',
                    error: refundResult.error
                });
            }
        } catch (error) {
            console.error('Refund payment error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Handle MoMo payment callback (redirect)
    handleMomoCallback: async (req, res) => {
        try {
            const { orderId, resultCode, message, transId, orderInfo, amount, extraData } = req.query;

            console.log('MoMo callback received:', req.query);

            // Find the payment by transaction ID
            const payments = await paymentRepository.find({ transactionId: orderId });

            if (!payments || payments.length === 0) {
                return res.status(404).send('Payment not found');
            }

            const payment = payments[0];

            // Check payment status
            if (resultCode === '0') {
                // Payment successful
                await paymentRepository.updateById(
                    payment.id || payment._id,
                    {
                        paymentStatus: 'completed',
                        paymentDetails: {
                            ...payment.paymentDetails,
                            momoTransId: transId,
                            completedAt: new Date()
                        }
                    }
                );

                // Send notification to user
                if (payment.userId && payment.paymentDetails && payment.paymentDetails.deviceTokens) {
                    await notificationService.sendPushNotification({
                        userId: payment.userId,
                        title: 'Payment Successful',
                        body: `Your payment of ${payment.amount} VND has been processed successfully.`,
                        data: {
                            orderId: payment.orderId.toString(),
                            paymentId: payment.id || payment._id
                        },
                        type: 'payment',
                        deviceTokens: payment.paymentDetails.deviceTokens
                    });
                }

                // Redirect to success page
                return res.redirect(`${payment.paymentDetails.successUrl || '/payment/success'}?paymentId=${payment.id || payment._id}`);
            } else {
                // Payment failed
                await paymentRepository.updateById(
                    payment.id || payment._id,
                    {
                        paymentStatus: 'failed',
                        paymentDetails: {
                            ...payment.paymentDetails,
                            errorCode: resultCode,
                            errorMessage: message
                        }
                    }
                );

                // Redirect to failure page
                return res.redirect(`${payment.paymentDetails.failureUrl || '/payment/failure'}?paymentId=${payment.id || payment._id}&error=${encodeURIComponent(message)}`);
            }
        } catch (error) {
            console.error('MoMo callback error:', error);
            return res.status(500).send('Internal server error');
        }
    },

    // Handle MoMo IPN (Instant Payment Notification)
    handleMomoIPN: async (req, res) => {
        try {
            const { orderId, resultCode, message, transId, orderInfo, amount, extraData, signature } = req.body;

            console.log('MoMo IPN received:', req.body);

            // Verify signature
            const momoConfig = paymentConfig.momo;
            const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&resultCode=${resultCode}&transId=${transId}`;

            const expectedSignature = crypto
                .createHmac('sha256', momoConfig.secretKey)
                .update(rawSignature)
                .digest('hex');

            if (signature !== expectedSignature) {
                return res.status(400).json({ message: 'Invalid signature' });
            }

            // Find the payment by transaction ID
            const payments = await paymentRepository.find({ transactionId: orderId });

            if (!payments || payments.length === 0) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            const payment = payments[0];

            // Update payment status based on result code
            if (resultCode === '0') {
                // Payment successful
                await paymentRepository.updateById(
                    payment.id || payment._id,
                    {
                        paymentStatus: 'completed',
                        paymentDetails: {
                            ...payment.paymentDetails,
                            momoTransId: transId,
                            completedAt: new Date()
                        }
                    }
                );
            } else {
                // Payment failed
                await paymentRepository.updateById(
                    payment.id || payment._id,
                    {
                        paymentStatus: 'failed',
                        paymentDetails: {
                            ...payment.paymentDetails,
                            errorCode: resultCode,
                            errorMessage: message
                        }
                    }
                );
            }

            // Return success response to MoMo
            return res.status(200).json({ message: 'IPN processed successfully' });
        } catch (error) {
            console.error('MoMo IPN error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },

    // Handle VNPay payment callback
    handleVnpayCallback: async (req, res) => {
        try {
            const vnpParams = req.query;

            console.log('VNPay callback received:', vnpParams);

            // Extract parameters
            const vnp_TxnRef = vnpParams.vnp_TxnRef;
            const vnp_ResponseCode = vnpParams.vnp_ResponseCode;
            const vnp_TransactionStatus = vnpParams.vnp_TransactionStatus;
            const vnp_Amount = parseInt(vnpParams.vnp_Amount) / 100; // Convert from smallest currency unit
            const vnp_SecureHash = vnpParams.vnp_SecureHash;

            // Verify signature
            const vnpayConfig = paymentConfig.vnpay;

            // Remove vnp_SecureHash and vnp_SecureHashType from params
            const secureHash = vnpParams.vnp_SecureHash;
            delete vnpParams.vnp_SecureHash;
            delete vnpParams.vnp_SecureHashType;

            // Sort params by key
            const sortedParams = {};
            Object.keys(vnpParams).sort().forEach(key => {
                if (vnpParams[key] !== undefined && vnpParams[key] !== null) {
                    sortedParams[key] = vnpParams[key];
                }
            });

            // Build query string
            const queryString = Object.entries(sortedParams)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');

            // Generate signature
            const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret);
            const expectedSignature = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');

            // Find the payment by transaction ID
            const payments = await paymentRepository.find({ transactionId: vnp_TxnRef });

            if (!payments || payments.length === 0) {
                return res.status(404).send('Payment not found');
            }

            const payment = payments[0];

            // Verify signature
            if (secureHash !== expectedSignature) {
                await paymentRepository.updateById(
                    payment.id || payment._id,
                    {
                        paymentStatus: 'failed',
                        paymentDetails: {
                            ...payment.paymentDetails,
                            errorCode: 'INVALID_SIGNATURE',
                            errorMessage: 'Invalid signature'
                        }
                    }
                );

                return res.redirect(`${payment.paymentDetails.failureUrl || '/payment/failure'}?paymentId=${payment.id || payment._id}&error=Invalid signature`);
            }

            // Check payment status
            if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
                // Payment successful
                await paymentRepository.updateById(
                    payment.id || payment._id,
                    {
                        paymentStatus: 'completed',
                        paymentDetails: {
                            ...payment.paymentDetails,
                            vnpayTransactionInfo: vnpParams,
                            completedAt: new Date()
                        }
                    }
                );

                // Send notification to user
                if (payment.userId && payment.paymentDetails && payment.paymentDetails.deviceTokens) {
                    await notificationService.sendPushNotification({
                        userId: payment.userId,
                        title: 'Payment Successful',
                        body: `Your payment of ${payment.amount} VND has been processed successfully.`,
                        data: {
                            orderId: payment.orderId.toString(),
                            paymentId: payment.id || payment._id
                        },
                        type: 'payment',
                        deviceTokens: payment.paymentDetails.deviceTokens
                    });
                }

                // Redirect to success page
                return res.redirect(`${payment.paymentDetails.successUrl || '/payment/success'}?paymentId=${payment.id || payment._id}`);
            } else {
                // Payment failed
                await paymentRepository.updateById(
                    payment.id || payment._id,
                    {
                        paymentStatus: 'failed',
                        paymentDetails: {
                            ...payment.paymentDetails,
                            errorCode: vnp_ResponseCode,
                            vnpayTransactionInfo: vnpParams
                        }
                    }
                );

                // Redirect to failure page
                return res.redirect(`${payment.paymentDetails.failureUrl || '/payment/failure'}?paymentId=${payment.id || payment._id}&error=Payment failed`);
            }
        } catch (error) {
            console.error('VNPay callback error:', error);
            return res.status(500).send('Internal server error');
        }
    }
};

module.exports = paymentController; 