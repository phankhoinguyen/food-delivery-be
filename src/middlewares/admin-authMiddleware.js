const firebase = require("../config/firebase"); 

const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No authentication token, access denied",
            });
        }

        const idToken = authHeader.replace("Bearer ", "").trim();

        // 🔥 Dùng getter của class FirebaseConfig
        const decodedToken = await firebase.getAuth().verifyIdToken(idToken);

        const userDoc = await firebase.getFirestore().collection("user").doc(decodedToken.uid).get();

        if (!userDoc.exists) {
            return res.status(403).json({
                success: false,
                message: "User not found in Firestore",
            });
        }

        const userData = userDoc.data();

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: userData.role || "user",
        };

        next();
    } catch (error) {
        console.error("Authentication error:", error.code || "", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid Firebase token",
        });
    }
};

// Middleware kiểm tra admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
    });
};

module.exports = { verifyFirebaseToken, isAdmin };
