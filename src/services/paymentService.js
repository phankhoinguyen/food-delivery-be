const crypto = require('crypto');
const axios = require('axios');
const paymentConfig = require('../config/paymentConfig');
const notificationService = require('./notificationService');
const { generateMomoOrderId } = require('../utils/paymentUtils');
const admin = require('../config/firebase');

class PaymentService {
    async processMomoNotify(notifyData) {
        const { orderId, resultCode, transId, message, userId, amount } = notifyData;
        console.log('[MoMo Notify] Dữ liệu nhận được:', notifyData);
        try {
            const orderRef = admin.firestore().collection('orders').doc(orderId);
            const orderSnap = await orderRef.get();

            let updateData;
            let notifyMsg;
            if (parseInt(resultCode) === 0) {
                updateData = {
                    status: 'completed',
                    paidAt: new Date(),
                    transId: transId,
                    paymentProvider: 'momo'
                };
                notifyMsg = `Đơn hàng ${orderId} đã thanh toán thành công qua MoMo.`;
            } else {
                updateData = {
                    status: 'failed',
                    paymentProvider: 'momo',
                    errorMessage: message
                };
                notifyMsg = `Đơn hàng ${orderId} thanh toán thất bại qua MoMo: ${message}`;
            }

            if (!orderSnap.exists) {
                // Nếu chưa có document, tạo mới
                await orderRef.set({
                    orderId,
                    userId: userId || null,
                    amount: amount || null,
                    ...updateData,
                    createdAt: new Date()
                });
                console.log(`[MoMo Notify] Đã tạo mới đơn hàng ${orderId} với trạng thái ${updateData.status}`);
            } else {
                await orderRef.update(updateData);
                console.log(`[MoMo Notify] Đã cập nhật đơn hàng ${orderId} với trạng thái ${updateData.status}`);
            }

            return { success: true, userId: userId || null, message: notifyMsg };
        } catch (error) {
            console.error(`[MoMo Notify] Lỗi xử lý đơn hàng ${orderId}:`, error);
            return { success: false, message: 'Lỗi xử lý notify MoMo' };
        }
    }
    constructor() {
        this.momoConfig = paymentConfig.momo;
        this.defaultProvider = paymentConfig.defaultProvider;
    }
    async handleMomoIPN(ipnData) {
        const { orderId, resultCode, transId, message, userId, amount } = ipnData;
        console.log('[MoMo IPN] Dữ liệu nhận được:', ipnData);
        try {
            // Kết nối Firestore
            const orderRef = admin.firestore().collection('orders').doc(orderId);
            const orderSnap = await orderRef.get();

            if (!orderSnap.exists) {
                // Nếu chưa có document, tạo mới

                const newOrder = {
                    orderId,
                    userId: userId || null,
                    amount: amount || null,
                    paymentProvider: 'momo',
                    status: parseInt(resultCode) === 0 ? 'completed' : 'failed',
                    paidAt: parseInt(resultCode) === 0 ? new Date() : null,
                    transId: transId || null,
                    errorMessage: parseInt(resultCode) === 0 ? null : message,
                    createdAt: new Date()
                };
                await orderRef.set(newOrder);
                console.log(`[MoMo IPN] Đã tạo mới đơn hàng ${orderId} với trạng thái ${newOrder.status}`);
            } else {
                // Nếu đã có document, update như cũ
                if (parseInt(resultCode) === 0) {
                    await orderRef.update({
                        status: 'completed',
                        paidAt: new Date(),
                        transId: transId,
                        paymentProvider: 'momo'
                    });
                    console.log(`[MoMo IPN] Đơn hàng ${orderId} đã cập nhật trạng thái completed.`);
                } else {
                    await orderRef.update({
                        status: 'failed',
                        paymentProvider: 'momo',
                        errorMessage: message
                    });
                    console.log(`[MoMo IPN] Đơn hàng ${orderId} cập nhật trạng thái failed - Lý do: ${message}`);
                }
            }
        } catch (error) {
            console.error(`[MoMo IPN] Lỗi cập nhật/tạo đơn hàng ${orderId}:`, error);
            throw error;
        }
    }
    async processMomoPayment({ userId, amount, paymentMethod, paymentDetails }) {
        console.log('[MoMo] Dữ liệu đầu vào:', { userId, amount, paymentMethod, paymentDetails });

        const orderId = paymentDetails.orderId || crypto.randomUUID(); // ✅ Tạo orderId nếu không có
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
        console.log('[MoMo] Request gửi đi:', requestBody);

        try {
            const momoRes = await axios.post(apiEndpoint, requestBody);
            console.log('[MoMo] Response trả về:', momoRes.data);

            if (momoRes.data.resultCode === 0) {
                return {
                    success: true,
                    data: {
                        provider: 'momo',
                        requestId,
                        transactionId: momoRes.data.transId || null,
                        redirectUrl: momoRes.data.payUrl || null,
                        deepLink: momoRes.data.deeplink || null,
                        qrCodeUrl: momoRes.data.qrCodeUrl || null,
                        smartUrl: momoRes.data.smartUrl || null
                    }
                };
            } else {
                console.error('[MoMo] Lỗi trả về:', momoRes.data);
                return {
                    success: false,
                    error: momoRes.data
                };
            }
        } catch (error) {
            console.error('[MoMo] Lỗi gửi request:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

const paymentServiceInstance = new PaymentService();
module.exports = paymentServiceInstance;
