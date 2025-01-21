const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const authenticateUser = require('../middleware/authenticateUser');

const router = express.Router();

// Konfigurasi Multer untuk unggah file
const storage = multer.memoryStorage(); // Menyimpan file di memori
const upload = multer({ storage });

// Registrasi
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Registrasi berhasil' });
    } catch (error) {
        console.error('Error in /register:', error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email tidak terdaftar' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password salah' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({
            message: 'Login berhasil',
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        console.error('Error in /login:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat login' });
    }
});

// Mendapatkan Data Profil
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        console.log('Middleware berjalan. Data req.user:', req.user);

        const userId = req.user.id;
        const user = await User.findById(userId, '-password');
        if (!user) {
            console.log('Pengguna tidak ditemukan:', userId);
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        // Validasi profileImage sebelum memprosesnya
        const profileImage = user.profileImage && user.profileImage.data
            ? `data:${user.profileImage.contentType};base64,${user.profileImage.data.toString('base64')}`
            : null;

        res.json({
            username: user.username,
            email: user.email,
            profileImage,
        });
    } catch (error) {
        console.error('Kesalahan di /profile:', error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
});

// Mengedit Foto Profil
router.put('/profile', authenticateUser, upload.single('profileImage'), async (req, res) => {
    try {
        const userId = req.user.id;

        // Ambil data dari request body
        const { username, email, oldPassword, newPassword } = req.body;

        // Cari pengguna berdasarkan ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        // Validasi oldPassword jika ingin mengganti password
        if (oldPassword && newPassword) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Password lama salah' });
            }

            // Hash password baru
            user.password = await bcrypt.hash(newPassword, 10);
        }

        // Perbarui username dan email jika diberikan
        if (username) user.username = username;
        if (email) user.email = email;

        // Perbarui foto profil jika ada file yang diunggah
        if (req.file) {
            user.profileImage = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            };
        }

        // Simpan perubahan
        await user.save();

        res.json({ message: 'Profil berhasil diperbarui', user });
    } catch (error) {
        console.error('Kesalahan di /profile:', error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
});

module.exports = router;
