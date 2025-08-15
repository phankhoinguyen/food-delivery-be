// src/controllers/authController.js
const firebaseConfig = require('../config/firebase');

// ✅ Lấy thông tin user từ Firebase token
exports.getProfile = async (req, res) => {
    try {
        // req.user đã được set ở middleware verifyFirebaseToken
        res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ❌ Không xử lý login ở server nữa (sẽ login từ client)
exports.login = async (req, res) => {
    return res.status(400).json({
        success: false,
        message: "Login phải thực hiện ở client qua Firebase Auth. Server chỉ xác thực token."
    });
};

// ❌ Không xử lý register ở server nữa (sẽ register từ client)
exports.register = async (req, res) => {
    return res.status(400).json({
        success: false,
        message: "Register phải thực hiện ở client qua Firebase Auth."
    });
};
