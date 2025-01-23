const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt');
require('dotenv').config();

const authenticateUser = async (req, res, next) => {
    try {
        // 1. Cek header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Token tidak ditemukan'
            });
        }

        // 2. Cek format Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Format token tidak valid'
            });
        }

        // 3. Ekstrak token
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token tidak ditemukan'
            });
        }

        // 4. Verifikasi token
        const { valid, decoded, error } = verifyToken(token);
        
        if (!valid) {
            return res.status(401).json({
                success: false,
                error: error || 'Token tidak valid'
            });
        }

        // 5. Set user ke request
        req.user = decoded;
        next();
        
    } catch (error) {
        console.error('Auth Error:', error);
        return res.status(401).json({
            success: false,
            error: 'Terjadi kesalahan pada autentikasi'
        });
    }
};

module.exports = authenticateUser;
