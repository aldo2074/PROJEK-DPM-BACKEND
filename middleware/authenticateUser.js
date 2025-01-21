const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Kesalahan autentikasi:', error);
        res.status(401).json({ error: 'Token tidak valid' });
    }
};

module.exports = authenticateUser;
