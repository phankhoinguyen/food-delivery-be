const express = require('express');
const router = express.Router();
const { createOrder, getOrderById } = require('../controllers/orderController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/', verifyToken, createOrder);
router.get('/:id', verifyToken, getOrderById);

module.exports = router;
