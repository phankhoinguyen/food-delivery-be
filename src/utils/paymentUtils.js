/**
 * Payment Utility Functions
 */

/**
 * Format amount for display in VND
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'VND')
 * @returns {string} Formatted amount
 */
const formatAmount = (amount, currency = 'VND') => {
    const formatter = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    return formatter.format(amount);
};

/**
 * Convert amount to VND (Vietnamese Dong) - no decimal places
 * @param {number} amount - Amount in VND
 * @returns {number} Amount in VND (rounded)
 */
const amountToVND = (amount) => {
    return Math.round(amount);
};

/**
 * Validate amount for Vietnamese payment providers
 * @param {number} amount - Amount in VND
 * @returns {boolean} Is valid amount
 */
const isValidVNDAmount = (amount) => {
    return amount >= 1000 && amount <= 50000000; // Min 1,000 VND, Max 50,000,000 VND
};

/**
 * Generate a unique payment reference for VNPay/MomoPay
 * @param {string} provider - Payment provider ('vnpay' or 'momo')
 * @param {string} prefix - Prefix for the reference (default: 'PAY')
 * @returns {string} Unique payment reference
 */
const generatePaymentReference = (provider = 'vnpay', prefix = 'PAY') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const providerPrefix = provider.toUpperCase();
    return `${providerPrefix}_${prefix}_${timestamp}_${random}`;
};

/**
 * Generate VNPay transaction reference
 * @param {string} tmnCode - VNPay terminal code
 * @returns {string} VNPay transaction reference
 */
const generateVNPayTxnRef = (tmnCode) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${tmnCode}${timestamp}${random}`;
};

/**
 * Generate MomoPay order ID
 * @param {string} partnerCode - MomoPay partner code
 * @returns {string} MomoPay order ID
 */
const generateMomoOrderId = (partnerCode) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${partnerCode}_${timestamp}_${random}`;
};

/**
 * Validate Vietnamese phone number for payment
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} Is valid Vietnamese phone number
 */
const isValidVietnamesePhone = (phoneNumber) => {
    // Remove spaces and non-numeric characters
    const digits = phoneNumber.replace(/\D/g, '');

    // Vietnamese phone number patterns
    // Mobile: 03x, 05x, 07x, 08x, 09x (10 digits)
    // Or with country code: +84 or 84
    const mobilePattern = /^(84|0)(3|5|7|8|9)[0-9]{8}$/;

    return mobilePattern.test(digits);
};

/**
 * Get payment method type
 * @param {string} provider - Payment provider ('vnpay' or 'momo')
 * @param {string} method - Payment method ('wallet', 'bank', 'card')
 * @returns {string} Payment method identifier
 */
const getPaymentMethodType = (provider, method) => {
    const methodMap = {
        vnpay: {
            wallet: 'VNPAYQR',
            bank: 'VNBANK',
            card: 'INTCARD'
        },
        momo: {
            wallet: 'payWithMoMo',
            bank: 'payWithATM',
            card: 'payWithCC'
        }
    };

    return methodMap[provider]?.[method] || 'VNPAYQR';
};

/**
 * Mask sensitive payment information for logging
 * 
 * @param {Object} paymentData - Payment data object
 * @returns {Object} - Masked payment data
 */
const maskSensitiveData = (paymentData) => {
    const maskedData = { ...paymentData };

    // Mask phone numbers
    if (maskedData.phoneNumber) {
        const phone = maskedData.phoneNumber.replace(/\D/g, '');
        if (phone.length >= 7) {
            maskedData.phoneNumber = `${phone.slice(0, 3)}****${phone.slice(-3)}`;
        }
    }

    // Mask order IDs partially
    if (maskedData.orderId) {
        const orderIdLength = maskedData.orderId.length;
        if (orderIdLength > 8) {
            maskedData.orderId = `${maskedData.orderId.slice(0, 4)}...${maskedData.orderId.slice(-4)}`;
        }
    }

    // Mask tokens
    if (maskedData.token) {
        const tokenLength = maskedData.token.length;
        if (tokenLength > 8) {
            maskedData.token = `${maskedData.token.slice(0, 4)}...${maskedData.token.slice(-4)}`;
        }
    }

    // Mask app transaction refs
    if (maskedData.vnpTxnRef) {
        const refLength = maskedData.vnpTxnRef.length;
        if (refLength > 8) {
            maskedData.vnpTxnRef = `${maskedData.vnpTxnRef.slice(0, 4)}...${maskedData.vnpTxnRef.slice(-4)}`;
        }
    }

    return maskedData;
};

/**
 * Create VNPay secure hash
 * @param {string} data - Data string to create hash for
 * @param {string} secretKey - Secret key
 * @returns {string} SHA256 hash
 */
const createVNPaySecureHash = (data, secretKey) => {
    const crypto = require('crypto');
    return crypto.createHmac('sha512', secretKey).update(data).digest('hex');
};

/**
 * Create MomoPay signature
 * @param {string} data - Data string to create signature for
 * @param {string} secretKey - Secret key
 * @returns {string} Signature hash
 */
const createMomoSignature = (data, secretKey) => {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
};

/**
 * Validate VNPay callback secure hash
 * @param {Object} callbackData - Callback data from VNPay
 * @param {string} secretKey - Secret key
 * @returns {boolean} Is valid secure hash
 */
const validateVNPayCallback = (callbackData, secretKey) => {
    const { vnp_SecureHash, ...dataToVerify } = callbackData;

    // Sort parameters and create query string
    const sortedKeys = Object.keys(dataToVerify).sort();
    const hashData = sortedKeys
        .map(key => `${key}=${dataToVerify[key]}`)
        .join('&');

    const expectedHash = createVNPaySecureHash(hashData, secretKey);
    return vnp_SecureHash === expectedHash;
};

/**
 * Validate MomoPay callback signature
 * @param {Object} callbackData - Callback data from MomoPay
 * @param {string} secretKey - Secret key
 * @returns {boolean} Is valid signature
 */
const validateMomoCallback = (callbackData, secretKey) => {
    const { signature, ...dataToVerify } = callbackData;
    const dataString = Object.keys(dataToVerify)
        .sort()
        .map(key => `${key}=${dataToVerify[key]}`)
        .join('&');

    const expectedSignature = createMomoSignature(dataString, secretKey);
    return signature === expectedSignature;
};

module.exports = {
    formatAmount,
    amountToVND,
    isValidVNDAmount,
    generatePaymentReference,
    generateVNPayTxnRef,
    generateMomoOrderId,
    isValidVietnamesePhone,
    getPaymentMethodType,
    maskSensitiveData,
    createVNPaySecureHash,
    createMomoSignature,
    validateVNPayCallback,
    validateMomoCallback
}; 