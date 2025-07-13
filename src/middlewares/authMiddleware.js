const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies the JWT token in the request header
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

        // Add user from payload to request object
        req.user = decoded;

        // Continue to next middleware/controller
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

module.exports = authMiddleware; 