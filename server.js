const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

dotenv.config(); // Memuat file .env

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request body

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route tidak ditemukan' });
});

// Start server
const PORT = process.env.SERVER_PORT;
const HOST = process.env.SERVER_HOST;

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
