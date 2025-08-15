const crypto = require('crypto');
const axios = require('axios');
const paymentConfig = require('../config/paymentConfig');
const notificationService = require('./notificationService');
const { paymentRepository } = require('../models/payment'); // ✅ thêm dòng này

// Hàm sanitize dữ liệu trước khi lưu Firestore
function sanitizeData(obj) {
    const result = {};
    for (const key in obj) {
        const value = obj[key];
        if (value === undefined) {
            result[key] = null;
        } else if (typeof value === 'object' && value !== null) {
            result[key] = sanitizeData(value); // xử lý object lồng nhau
        } else {
            result[key] = value;
        }
    }
    return result;
}

class PaymentService {
    constructor() {
        this.momoConfig = paymentConfig.momo;
        this.defaultProvider = paymentConfig.defaultProvider;
    }

    async processMomoPayment({ userId, amount, paymentMethod, paymentDetails }) {
        const orderId = paymentDetails.orderId || crypto.randomUUID();
        const requestId = crypto.randomUUID();
        const { partnerCode, accessKey, secretKey, apiEndpoint, returnUrl, notifyUrl } = this.momoConfig;

        const orderInfo = 'Thanh toán đơn hàng qua MoMo';
        const extraData = '';
        const requestType = 'captureWallet';

        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

        const requestBody = {
            partnerCode,
            accessKey,
            requestId,
            amount: amount.toString(),
            orderId,
            orderInfo,
            redirectUrl: returnUrl,
            ipnUrl: notifyUrl,
            extraData,
            requestType,
            signature,
            lang: 'vi'
        };

        try {
            const momoRes = await axios.post(apiEndpoint, requestBody);

            if (momoRes.data.resultCode === 0) {
                const pendingPaymentData = {
                    userId,
                    orderId,
                    amount,
                    paymentMethod,
                    paymentStatus: 'pending',
                    paymentDetails: {
                        provider: 'momo',
                        requestId,
                        transactionId: momoRes.data.transId || null,
                        redirectUrl: momoRes.data.payUrl || null,
                        deepLink: momoRes.data.deeplink || null,
                        qrCodeUrl: momoRes.data.qrCodeUrl || null,
                        smartUrl: momoRes.data.smartUrl || null
                    }
                };

                // sanitize dữ liệu trước khi lưu
                const sanitizedData = sanitizeData(pendingPaymentData);
                console.log('Dữ liệu gửi Firestore:', sanitizedData);

                await paymentRepository.create(sanitizedData); // lưu DB
                return { success: true, data: sanitizedData.paymentDetails };
            } else {
                return { success: false, error: momoRes.data };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async processMomoNotify(notifyData) {
        const { orderId, resultCode, transId, message, userId, amount } = notifyData;

        const payment = await paymentRepository.findOneByOrderId(orderId);

        const newData = sanitizeData({
            userId,
            orderId,
            amount,
            paymentMethod: 'momo',
            paymentStatus: parseInt(resultCode) === 0 ? 'completed' : 'failed',
            transactionId: transId,
            paidAt: parseInt(resultCode) === 0 ? new Date() : null,
            errorMessage: parseInt(resultCode) !== 0 ? message : null,
            paymentDetails: notifyData
        });

        if (!payment) {
            await paymentRepository.create(newData);
        } else {
            await paymentRepository.updatePayment(payment._id, newData);
        }

        return { success: true, message: 'Notify processed' };
    }
}

module.exports = new PaymentService();
