/**
 * Payment Gateway Configuration
 */
const paymentConfig = {
    momo: {
        partnerCode: process.env.MOMO_PARTNER_CODE || 'your_momo_partner_code',
        accessKey: process.env.MOMO_ACCESS_KEY || 'your_momo_access_key',
        secretKey: process.env.MOMO_SECRET_KEY || 'your_momo_secret_key',
        apiEndpoint: process.env.MOMO_API_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api',
        returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:5000/api/payments/momo/callback',
        notifyUrl: process.env.MOMO_NOTIFY_URL || 'http://localhost:5000/api/payments/momo/ipn',
        requestType: 'captureWallet',
        language: 'vi'
    },
    vnpay: {
        tmnCode: process.env.VNPAY_TMN_CODE || 'your_vnpay_tmn_code',
        hashSecret: process.env.VNPAY_HASH_SECRET || 'your_vnpay_hash_secret',
        apiEndpoint: process.env.VNPAY_API_ENDPOINT || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/payments/vnpay/callback',
        version: '2.1.0',
        command: 'pay',
        currCode: 'VND',
        locale: 'vn'
    },
    // Default payment method
    defaultProvider: process.env.DEFAULT_PAYMENT_PROVIDER || 'momo'
};

module.exports = paymentConfig; 