const mongoose = require('mongoose');
const BaseRepository = require('../utils/baseRepository');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['credit_card', 'debit_card', 'paypal', 'wallet']
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String
    },
    paymentDetails: {
        type: Object
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the timestamp before saving
paymentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create the Mongoose model (used for MongoDB)
const PaymentModel = mongoose.model('Payment', paymentSchema);

/**
 * Payment Repository for database operations
 * Works with both MongoDB and Firestore
 */
class PaymentRepository extends BaseRepository {
    constructor() {
        super('payments', PaymentModel);
    }

    /**
     * Find payments by user ID
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of payments
     */
    async findByUserId(userId) {
        return this.find({ userId }, { sort: { createdAt: -1 } });
    }

    /**
     * Find payments by order ID
     * @param {string} orderId - Order ID
     * @returns {Promise<Array>} Array of payments
     */
    async findByOrderId(orderId) {
        return this.find({ orderId });
    }

    /**
     * Update payment status
     * @param {string} id - Payment ID
     * @param {string} status - New payment status
     * @returns {Promise<object>} Updated payment
     */
    async updateStatus(id, status) {
        return this.updateById(id, { paymentStatus: status });
    }
}

// Create a singleton instance
const paymentRepository = new PaymentRepository();

module.exports = {
    PaymentModel,
    paymentRepository
}; 