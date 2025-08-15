const mongoose = require('mongoose');
const BaseRepository = require('../utils/baseRepository');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
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
        enum: ['credit_card', 'debit_card', 'paypal', 'wallet', 'momo', 'vnpay']
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
    paidAt: {
        type: Date
    },
    errorMessage: {
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

// Update timestamp trước khi save
paymentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Mongoose model
const PaymentModel = mongoose.model('Payment', paymentSchema);

/**
 * Payment Repository for database operations
 */
class PaymentRepository extends BaseRepository {
    constructor() {
        super('payments', PaymentModel);
    }

    // Tìm tất cả payment của user
    async findByUserId(userId) {
        return this.find({ userId }, { sort: { createdAt: -1 } });
    }

    // Tìm tất cả payment theo orderId
    async findByOrderId(orderId) {
        return this.find({ orderId });
    }

    // Tìm 1 payment theo orderId (thường dùng cho MoMo IPN/notify)
    async findOneByOrderId(orderId) {
        return this.findOne({ orderId });
    }

    // Update paymentStatus
    async updateStatus(id, status) {
        return this.updateById(id, { paymentStatus: status, updatedAt: new Date() });
    }

    // Update nhiều trường (paymentStatus, transactionId, paidAt, errorMessage,...)
    async updatePayment(id, updateFields) {
        updateFields.updatedAt = new Date();
        return this.updateById(id, updateFields);
    }
}

// Singleton instance
const paymentRepository = new PaymentRepository();

module.exports = {
    PaymentModel,
    paymentRepository
};
