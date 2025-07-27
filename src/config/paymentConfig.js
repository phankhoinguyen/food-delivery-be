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
    vnpay: {
        tmnCode: process.env.VNPAY_TMN_CODE,
        hashSecret: process.env.VNPAY_HASH_SECRET,
        apiEndpoint: process.env.VNPAY_API_ENDPOINT,
        returnUrl: process.env.VNPAY_RETURN_URL,
        version: '2.1.0',
        command: 'pay',
        currCode: 'VND',
        locale: 'vn'
    },
    // Default payment method
    defaultProvider: process.env.DEFAULT_PAYMENT_PROVIDER || 'momo'
};

module.exports = paymentConfig; 