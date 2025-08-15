const firebaseConfig = require('../config/firebase');

const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        const idToken = authHeader.replace('Bearer ', '').trim();

        if (!firebaseConfig || !firebaseConfig.getAuth) {
            throw new Error('Firebase not initialized');
        }

        // ✅ Xác thực token bằng Firebase Admin
        const decodedToken = await firebaseConfig.getAuth().verifyIdToken(idToken);

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role || 'user'
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error.code || '', error.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid Firebase token',
            error: error.message
        });
    }
};

module.exports = verifyFirebaseToken;
