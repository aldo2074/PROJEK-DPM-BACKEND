const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const profileRoutes = require('./routes/profileRoutes');

dotenv.config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to database
connectDB();

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Routes without /api prefix
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware untuk logging requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle specific errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validasi gagal',
            details: err.message
        });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Token tidak valid'
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Terjadi kesalahan pada server'
    });
});

// Handle 404 - Keep this as the last middleware
app.use((req, res) => {
    console.log('404 Route not found:', req.method, req.url);
    res.status(404).json({
        success: false,
        error: 'Route tidak ditemukan',
        path: req.originalUrl
    });
});

// Start server
const PORT = process.env.SERVER_PORT || 3000;
const HOST = process.env.SERVER_HOST || 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log('Available routes:');
    console.log('- /auth/*');
    console.log('- /profile/*');
    console.log('- /cart/*');
    console.log('- /orders/*');
});
