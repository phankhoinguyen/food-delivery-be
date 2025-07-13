const crypto = require('crypto');
const axios = require('axios');
const paymentConfig = require('../config/paymentConfig');
const notificationService = require('./notificationService');
const { generatePaymentReference } = require('../utils/paymentUtils');

/**
 * Payment Service
 * 
 * This service handles the integration with payment gateways
 * Currently implements MoMo and VNPay payment processing
 */
class PaymentService {
    constructor() {
        // Initialize payment configurations
        this.momoConfig = paymentConfig.momo;
        this.vnpayConfig = paymentConfig.vnpay;
        this.defaultProvider = paymentConfig.defaultProvider;
    }

    /**
     * Process a payment
     * @param {Object} paymentData - Payment information
     * @returns {Promise<Object>} - Result of payment processing
     */
    async processPayment(paymentData) {
        try {
            const { userId, orderId, amount, paymentMethod, paymentDetails } = paymentData;

            console.log('Processing payment:', paymentData);

            // Determine which payment gateway to use
            const provider = paymentDetails.provider || this.defaultProvider;

            if (provider === 'momo') {
                return await this.processMomoPayment(paymentData);
            } else if (provider === 'vnpay') {
                return await this.processVnpayPayment(paymentData);
            } else {
                throw new Error(`Unsupported payment provider: ${provider}`);
            }
        } catch (error) {
            console.error('Payment processing error:', error);

            // Return failure response
            return {
                success: false,
                error: error.message || 'Payment processing failed'
            };
        }
    }

    /**
     * Process payment with MoMo
     * @param {Object} paymentData - Payment information
     * @returns {Promise<Object>} - Result of payment processing
     */
    async processMomoPayment(paymentData) {
        const { userId, orderId, amount, paymentDetails } = paymentData;

        // Generate a unique order reference
        const orderInfo = `Payment for order ${orderId}`;
        const requestId = generatePaymentReference('MOMO');
        const redirectUrl = paymentDetails.redirectUrl || this.momoConfig.returnUrl;

        // Prepare request body for MoMo API
        const requestBody = {
            partnerCode: this.momoConfig.partnerCode,
            accessKey: this.momoConfig.accessKey,
            requestId: requestId,
            amount: amount,
            orderId: requestId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: this.momoConfig.notifyUrl,
            requestType: this.momoConfig.requestType,
            extraData: Buffer.from(JSON.stringify({
                userId: userId,
                orderId: orderId
            })).toString('base64')
        };

        // Generate signature
        const rawSignature = `accessKey=${requestBody.accessKey}&amount=${requestBody.amount}&extraData=${requestBody.extraData}&ipnUrl=${requestBody.ipnUrl}&orderId=${requestBody.orderId}&orderInfo=${requestBody.orderInfo}&partnerCode=${requestBody.partnerCode}&redirectUrl=${requestBody.redirectUrl}&requestId=${requestBody.requestId}&requestType=${requestBody.requestType}`;

        const signature = crypto
            .createHmac('sha256', this.momoConfig.secretKey)
            .update(rawSignature)
            .digest('hex');

        requestBody.signature = signature;

        try {
            // Make API call to MoMo
            const response = await axios.post(
                `${this.momoConfig.apiEndpoint}/create`,
                requestBody
            );

            const { resultCode, payUrl, message } = response.data;

            if (resultCode === 0) {
                // Success - return the payment URL
                return {
                    success: true,
                    transactionId: requestId,
                    paymentUrl: payUrl,
                    timestamp: new Date(),
                    provider: 'momo'
                };
            } else {
                // Payment creation failed
                return {
                    success: false,
                    error: message || 'MoMo payment creation failed',
                    code: resultCode
                };
            }
        } catch (error) {
            console.error('MoMo API error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                code: error.response?.data?.resultCode
            };
        }
    }

    /**
     * Process payment with VNPay
     * @param {Object} paymentData - Payment information
     * @returns {Promise<Object>} - Result of payment processing
     */
    async processVnpayPayment(paymentData) {
        const { userId, orderId, amount, paymentDetails } = paymentData;

        // Generate a unique order reference
        const vnpTxnRef = generatePaymentReference('VNP');
        const vnpOrderInfo = `Payment for order ${orderId}`;
        const redirectUrl = paymentDetails.redirectUrl || this.vnpayConfig.returnUrl;

        // Create date in VNPay format
        const createDate = new Date().toISOString().split('T')[0].split('-').join('') +
            new Date().toISOString().split('T')[1].split(':').join('').split('.')[0];

        // Prepare VNPay parameters
        const vnpParams = {
            vnp_Version: this.vnpayConfig.version,
            vnp_Command: this.vnpayConfig.command,
            vnp_TmnCode: this.vnpayConfig.tmnCode,
            vnp_Amount: amount * 100, // Convert to smallest currency unit (VND doesn't have decimals)
            vnp_CreateDate: createDate,
            vnp_CurrCode: this.vnpayConfig.currCode,
            vnp_IpAddr: paymentDetails.ipAddress || '127.0.0.1',
            vnp_Locale: this.vnpayConfig.locale,
            vnp_OrderInfo: vnpOrderInfo,
            vnp_ReturnUrl: redirectUrl,
            vnp_TxnRef: vnpTxnRef
        };

        // Add optional bank code if provided
        if (paymentDetails.bankCode) {
            vnpParams.vnp_BankCode = paymentDetails.bankCode;
        }

        // Sort parameters by field name
        const sortedParams = this.sortObject(vnpParams);

        // Build query string
        const queryString = Object.entries(sortedParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        // Generate signature
        const hmac = crypto.createHmac('sha512', this.vnpayConfig.hashSecret);
        const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');

        // Add signature to query params
        vnpParams.vnp_SecureHash = signed;

        // Build payment URL
        const paymentUrl = `${this.vnpayConfig.apiEndpoint}?${Object.entries(vnpParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&')}`;

        return {
            success: true,
            transactionId: vnpTxnRef,
            paymentUrl: paymentUrl,
            timestamp: new Date(),
            provider: 'vnpay'
        };
    }

    /**
     * Process a refund
     * @param {Object} payment - Payment object to refund
     * @returns {Promise<Object>} - Result of refund processing
     */
    async processRefund(payment) {
        try {
            // Validate that the payment can be refunded
            if (!payment.transactionId) {
                throw new Error('Cannot refund a payment without a transaction ID');
            }

            // Determine which payment gateway to use
            const provider = payment.paymentDetails?.provider || this.defaultProvider;

            if (provider === 'momo') {
                return await this.processMomoRefund(payment);
            } else if (provider === 'vnpay') {
                return await this.processVnpayRefund(payment);
            } else {
                throw new Error(`Unsupported payment provider for refund: ${provider}`);
            }
        } catch (error) {
            console.error('Refund processing error:', error);

            // Return failure response
            return {
                success: false,
                error: error.message || 'Refund processing failed'
            };
        }
    }

    /**
     * Process refund with MoMo
     * @param {Object} payment - Payment to refund
     * @returns {Promise<Object>} - Result of refund processing
     */
    async processMomoRefund(payment) {
        // Generate a unique refund reference
        const requestId = generatePaymentReference('MOMO_REFUND');

        // Prepare request body for MoMo API
        const requestBody = {
            partnerCode: this.momoConfig.partnerCode,
            accessKey: this.momoConfig.accessKey,
            requestId: requestId,
            amount: payment.amount,
            orderId: requestId,
            transId: payment.transactionId,
            lang: this.momoConfig.language
        };

        // Generate signature
        const rawSignature = `accessKey=${requestBody.accessKey}&amount=${requestBody.amount}&description=${requestBody.description || ''}&orderId=${requestBody.orderId}&partnerCode=${requestBody.partnerCode}&requestId=${requestBody.requestId}&transId=${requestBody.transId}`;

        const signature = crypto
            .createHmac('sha256', this.momoConfig.secretKey)
            .update(rawSignature)
            .digest('hex');

        requestBody.signature = signature;

        try {
            // Make API call to MoMo for refund
            const response = await axios.post(
                `${this.momoConfig.apiEndpoint}/refund`,
                requestBody
            );

            const { resultCode, message } = response.data;

            if (resultCode === 0) {
                // Send notification to user about refund
                if (payment.userId && payment.paymentDetails && payment.paymentDetails.deviceTokens) {
                    await notificationService.sendPushNotification({
                        userId: payment.userId,
                        title: 'Payment Refunded',
                        body: `Your payment of ${payment.amount} VND has been refunded.`,
                        data: {
                            orderId: payment.orderId.toString(),
                            paymentId: payment.transactionId,
                            refundId: requestId
                        },
                        type: 'payment',
                        deviceTokens: payment.paymentDetails.deviceTokens
                    });
                }

                // Success
                return {
                    success: true,
                    refundTransactionId: requestId,
                    timestamp: new Date()
                };
            } else {
                // Refund failed
                return {
                    success: false,
                    error: message || 'MoMo refund failed',
                    code: resultCode
                };
            }
        } catch (error) {
            console.error('MoMo refund API error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                code: error.response?.data?.resultCode
            };
        }
    }

    /**
     * Process refund with VNPay
     * @param {Object} payment - Payment to refund
     * @returns {Promise<Object>} - Result of refund processing
     */
    async processVnpayRefund(payment) {
        // Note: VNPay refunds typically require manual processing through their merchant portal
        // This is a placeholder implementation

        console.log(`VNPay refund requested for transaction: ${payment.transactionId}`);

        // Send notification to user about refund request
        if (payment.userId && payment.paymentDetails && payment.paymentDetails.deviceTokens) {
            await notificationService.sendPushNotification({
                userId: payment.userId,
                title: 'Refund Requested',
                body: `Your refund request for ${payment.amount} VND is being processed.`,
                data: {
                    orderId: payment.orderId.toString(),
                    paymentId: payment.transactionId
                },
                type: 'payment',
                deviceTokens: payment.paymentDetails.deviceTokens
            });
        }

        // Return a placeholder response
        // In a real implementation, you would integrate with VNPay's refund API if available
        return {
            success: true,
            refundTransactionId: `REFUND_${payment.transactionId}`,
            timestamp: new Date(),
            message: 'Refund request has been submitted for processing'
        };
    }

    /**
     * Verify payment status
     * @param {string} transactionId - Payment transaction ID
     * @param {string} provider - Payment provider ('momo' or 'vnpay')
     * @returns {Promise<Object>} - Payment status information
     */
    async verifyPaymentStatus(transactionId, provider = null) {
        try {
            // If provider is not specified, try to determine from transaction ID
            if (!provider) {
                provider = transactionId.startsWith('MOMO') ? 'momo' :
                    transactionId.startsWith('VNP') ? 'vnpay' :
                        this.defaultProvider;
            }

            if (provider === 'momo') {
                return await this.verifyMomoPayment(transactionId);
            } else if (provider === 'vnpay') {
                return await this.verifyVnpayPayment(transactionId);
            } else {
                throw new Error(`Unsupported payment provider: ${provider}`);
            }
        } catch (error) {
            console.error('Payment verification error:', error);

            // Return failure response
            return {
                success: false,
                verified: false,
                error: error.message || 'Payment verification failed'
            };
        }
    }

    /**
     * Verify MoMo payment status
     * @param {string} transactionId - Payment transaction ID
     * @returns {Promise<Object>} - Payment status information
     */
    async verifyMomoPayment(transactionId) {
        // Prepare request body for MoMo API
        const requestBody = {
            partnerCode: this.momoConfig.partnerCode,
            accessKey: this.momoConfig.accessKey,
            requestId: generatePaymentReference('MOMO_QUERY'),
            orderId: transactionId,
            lang: this.momoConfig.language
        };

        // Generate signature
        const rawSignature = `accessKey=${requestBody.accessKey}&orderId=${requestBody.orderId}&partnerCode=${requestBody.partnerCode}&requestId=${requestBody.requestId}`;

        const signature = crypto
            .createHmac('sha256', this.momoConfig.secretKey)
            .update(rawSignature)
            .digest('hex');

        requestBody.signature = signature;

        try {
            // Make API call to MoMo
            const response = await axios.post(
                `${this.momoConfig.apiEndpoint}/query`,
                requestBody
            );

            const { resultCode, message, transId, amount, extraData } = response.data;

            // Parse the extra data if available
            let parsedExtraData = {};
            if (extraData) {
                try {
                    parsedExtraData = JSON.parse(Buffer.from(extraData, 'base64').toString());
                } catch (e) {
                    console.error('Failed to parse MoMo extra data:', e);
                }
            }

            if (resultCode === 0) {
                // Payment successful
                return {
                    success: true,
                    status: 'succeeded',
                    verified: true,
                    amount: amount,
                    transactionId: transId,
                    orderId: parsedExtraData.orderId,
                    userId: parsedExtraData.userId,
                    timestamp: new Date()
                };
            } else {
                // Payment failed or pending
                return {
                    success: false,
                    status: 'failed',
                    verified: false,
                    error: message,
                    code: resultCode
                };
            }
        } catch (error) {
            console.error('MoMo verification API error:', error);
            return {
                success: false,
                verified: false,
                error: error.response?.data?.message || error.message,
                code: error.response?.data?.resultCode
            };
        }
    }

    /**
     * Verify VNPay payment status
     * @param {string} transactionId - Payment transaction ID
     * @returns {Promise<Object>} - Payment status information
     */
    async verifyVnpayPayment(transactionId) {
        // Create date in VNPay format
        const createDate = new Date().toISOString().split('T')[0].split('-').join('') +
            new Date().toISOString().split('T')[1].split(':').join('').split('.')[0];

        // Prepare VNPay parameters
        const vnpParams = {
            vnp_Version: this.vnpayConfig.version,
            vnp_Command: 'querydr',
            vnp_TmnCode: this.vnpayConfig.tmnCode,
            vnp_CreateDate: createDate,
            vnp_IpAddr: '127.0.0.1',
            vnp_OrderInfo: `Query transaction ${transactionId}`,
            vnp_TransactionNo: transactionId,
            vnp_TxnRef: transactionId
        };

        // Sort parameters by field name
        const sortedParams = this.sortObject(vnpParams);

        // Build query string
        const queryString = Object.entries(sortedParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        // Generate signature
        const hmac = crypto.createHmac('sha512', this.vnpayConfig.hashSecret);
        const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');

        // Add signature to query params
        vnpParams.vnp_SecureHash = signed;

        try {
            // Make API call to VNPay
            const response = await axios.get(
                'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
                { params: vnpParams }
            );

            const { vnp_ResponseCode, vnp_TransactionStatus, vnp_Amount, vnp_PayDate } = response.data;

            if (vnp_ResponseCode === '00') {
                // Check transaction status
                const isSuccessful = vnp_TransactionStatus === '00';

                return {
                    success: isSuccessful,
                    status: isSuccessful ? 'succeeded' : 'failed',
                    verified: true,
                    amount: vnp_Amount / 100, // Convert from smallest currency unit
                    transactionId: transactionId,
                    timestamp: new Date(
                        parseInt(vnp_PayDate.substring(0, 4)),
                        parseInt(vnp_PayDate.substring(4, 6)) - 1,
                        parseInt(vnp_PayDate.substring(6, 8)),
                        parseInt(vnp_PayDate.substring(8, 10)),
                        parseInt(vnp_PayDate.substring(10, 12)),
                        parseInt(vnp_PayDate.substring(12, 14))
                    )
                };
            } else {
                // Query failed
                return {
                    success: false,
                    verified: false,
                    error: 'Failed to query transaction',
                    code: vnp_ResponseCode
                };
            }
        } catch (error) {
            console.error('VNPay verification API error:', error);
            return {
                success: false,
                verified: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Sort object by key
     * @param {Object} obj - Object to sort
     * @returns {Object} - Sorted object
     */
    sortObject(obj) {
        const sorted = {};
        const keys = Object.keys(obj).sort();

        for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null) {
                sorted[key] = obj[key];
            }
        }

        return sorted;
    }
}

module.exports = PaymentService; 