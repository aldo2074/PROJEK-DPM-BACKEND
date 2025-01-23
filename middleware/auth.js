const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Gunakan environment variable untuk production

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak ditemukan'
            });
        }

        // Extract token
        const token = authHeader.replace('Bearer ', '');

        try {
            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Add user info to request
            req.user = {
                userId: decoded.userId,
                role: decoded.role
            };
            
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = auth; 