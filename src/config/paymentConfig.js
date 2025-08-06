const paymentConfig = {
    momo: {
        partnerCode: process.env.MOMO_PARTNER_CODE,
        accessKey: process.env.MOMO_ACCESS_KEY,
        secretKey: process.env.MOMO_SECRET_KEY,
        apiEndpoint: process.env.MOMO_API_ENDPOINT,
        returnUrl: process.env.MOMO_RETURN_URL,
        notifyUrl: process.env.MOMO_NOTIFY_URL,
        language: 'vi'
    },
    // Đã xóa cấu hình vnpay, chỉ dùng momo
    // Default payment method
    defaultProvider: process.env.DEFAULT_PAYMENT_PROVIDER || 'momo'
};

module.exports = paymentConfig; 