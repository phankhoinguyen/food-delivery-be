const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // 👇 Sử dụng secret từ .env hoặc mặc định
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 👇 decoded cần chứa ít nhất userId
        req.user = {
            userId: decoded.userId,
            username: decoded.username, // nếu bạn có thêm username/email thì gán luôn
            role: decoded.role
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Token is not valid',
            error: error.message
        });
    }
};

module.exports = verifyToken;
