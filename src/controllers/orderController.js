const { databaseService } = require('../config/db');

// Tạo đơn hàng mới
const createOrder = async (req, res) => {
    try {
        const { items, total } = req.body;
        const userId = req.user ? req.user.userId : null;
        if (!items || !total || !userId) {
            return res.status(400).json({ message: 'Missing order data or user not authenticated' });
        }
        const db = databaseService.getDb();
        const newOrder = {
            items,
            total,
            userId,
            status: 'pending',
            createdAt: new Date()
        };
        const orderRef = await db.collection('orders').add(newOrder);
        res.status(201).json({ message: 'Order created successfully', orderId: orderRef.id });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOrderById = async (req, res) => {
    const { id } = req.params;

    try {
        const db = databaseService.getDb(); // ✅ thêm dòng này
        const orderRef = db.collection('orders').doc(id);
        const doc = await orderRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order: doc.data() });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

module.exports = {
    createOrder,
    getOrderById
};

