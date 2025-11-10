const express = require("express");
const router = express.Router();
const { verifyFirebaseToken, isAdmin, uploadFile } = require("../middlewares/admin-authMiddleware");
const adminProductController = require("../controllers/adminProductController");
const paymentController = require('../controllers/paymentController');

// Tạo sản phẩm
router.post("/create", verifyFirebaseToken, isAdmin, uploadFile, adminProductController.createProduct);

// Xem tất cả sản phẩm
router.get("/", verifyFirebaseToken, isAdmin, adminProductController.getAllProducts);

// Cập nhật sản phẩm
router.put("/:id", verifyFirebaseToken, isAdmin, uploadFile, adminProductController.updateProduct);

// Xóa sản phẩm
router.delete("/:id", verifyFirebaseToken, isAdmin, adminProductController.deleteProduct);

// Tìm theo name
router.get("/name", verifyFirebaseToken, isAdmin, adminProductController.getProductsByName);

// Tìm theo category
router.get("/category", verifyFirebaseToken, isAdmin, adminProductController.getProductsByCategory);

router.get('/orders', paymentController.getPaymentByStatus);

// Tìm theo id
router.get("/id", verifyFirebaseToken, isAdmin, adminProductController.getProductById);

module.exports = router;
