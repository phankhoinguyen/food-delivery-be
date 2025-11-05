const crypto = require('crypto');
const axios = require('axios');
const paymentConfig = require('../config/paymentConfig');
const notificationService = require('./notificationService');
const { paymentRepository } = require('../models/payment');
const { cartRepository } = require('../models/cart');


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

    async processMomoPayment({ userId, userToken, amount, paymentMethod, orderId, items }) {
        const requestId = crypto.randomUUID();
        const { partnerCode, accessKey, secretKey, apiEndpoint, returnUrl, notifyUrl } = this.momoConfig;

        const orderInfo = 'Thanh toán đơn hàng qua MoMo';
        const extraData = Buffer.from(JSON.stringify({ userId })).toString('base64');
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
        console.log('Request : ', requestBody)
        try {
            const momoRes = await axios.post(apiEndpoint, requestBody);
            console.log(momoRes.data);
            if (momoRes.data.resultCode === 0) {
                const pendingPaymentData = {
                    userId,
                    orderId,
                    amount,
                    paymentMethod,
                    paymentStatus: 'pending',
                    userToken,
                    items
                };
                const paymentDetails = {
                    provider: 'momo',
                    requestId,
                    redirectUrl: momoRes.data.payUrl || null,
                    deepLink: momoRes.data.deeplink || null,
                    qrCodeUrl: momoRes.data.qrCodeUrl || null,
                    smartUrl: momoRes.data.smartUrl || null
                }
                // sanitize dữ liệu trước khi lưu
                const sanitizedData = sanitizeData(pendingPaymentData);
                console.log('Dữ liệu gửi Firestore:', sanitizedData);

                await paymentRepository.create(sanitizedData);
                return { success: true, data: paymentDetails };
            } else {
                return { success: false, error: momoRes.data };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async processMomoNotify(notifyData) {
        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature } = notifyData;

        console.log('data :', notifyData);

        const secretKey = process.env.MOMO_SECRET_KEY;

        const payment = await paymentRepository.findOneByOrderId(orderId);
        const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        const generatedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const userId = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'));

        if (signature === generatedSignature) {
            // Only update status
            const paymentId = payment.id || payment._id;
            await paymentRepository.updateStatus(paymentId, parseInt(resultCode) === 0 ? 'completed' : 'failed');
            // Delete cart 
            await cartRepository.deleteByUserId(userId);
            // Push notification for admin
            const notificationPayload = {
                title: 'New Orders Now !!!',
                body: `Order ${orderId} with a total of ${amount}`
            }
            notificationService.sendToAdminTopic(notificationPayload);
            return { success: true, message: 'Notify processed' };
        }
        else {
            return { success: false, message: 'Signature failed' };
        }
    }

    async checkStatusPayment(orderId) {
        try {
            const payment = await paymentRepository.findOneByOrderId(orderId);
            const data = {
                orderId: payment.orderId,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
                paymentStatus: payment.paymentStatus
            }
            return data;
        } catch (error) {
            console.log(error);
        }
    }

    async getPaymentByFields(fields) {
        try {
            const payments = await paymentRepository.findByFields(fields)

            return {
                success: true,
                data: payments
            }
        } catch (error) {
            return {
                success: false,
                message: error
            }
        }
    }
}

module.exports = new PaymentService();
