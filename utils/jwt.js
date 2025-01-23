const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h'; // 24 jam

const generateToken = (userId) => {
    if (!userId) {
        throw new Error('User ID diperlukan untuk generate token');
    }
    
    return jwt.sign(
        { 
            userId,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 jam dalam detik
        }, 
        JWT_SECRET
    );
};

const verifyToken = (token) => {
    if (!token) {
        return { 
            valid: false, 
            error: 'Token tidak ditemukan' 
        };
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Cek expired
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            return {
                valid: false,
                error: 'Token telah kadaluarsa'
            };
        }

        return { 
            valid: true, 
            decoded 
        };
    } catch (error) {
        return { 
            valid: false, 
            error: error.message 
        };
    }
};

module.exports = {
    generateToken,
    verifyToken,
    JWT_SECRET
}; 