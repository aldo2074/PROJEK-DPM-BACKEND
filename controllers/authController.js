const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const AuthController = {
    register: async (req, res) => {
        try {
            const { username, email, password, confirmPassword } = req.body;

            // Validasi input
            if (!username || !email || !password || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Semua field harus diisi"
                });
            }

            // Validasi password match
            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Password tidak cocok"
                });
            }

            // Validasi panjang password
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password minimal 6 karakter"
                });
            }

            // Check if user exists
            const userExists = await User.findOne({ email: email.toLowerCase() });
            if (userExists) {
                return res.status(400).json({
                    success: false,
                    message: "Email sudah terdaftar"
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create new user
            const user = new User({
                username: username.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword
            });

            await user.save();

            // Buat token
            const token = generateToken(user._id);

            // Kirim response dengan token
            res.status(201).json({
                success: true,
                message: 'Registrasi berhasil',
                token: token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Terjadi kesalahan saat registrasi'
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log('Login attempt for:', email);

            // Cari user berdasarkan email
            const user = await User.findOne({ email });
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email atau password salah'
                });
            }

            // Verifikasi password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Email atau password salah'
                });
            }

            // Generate token dengan role yang sesuai
            const token = jwt.sign(
                { 
                    userId: user._id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Response sukses
            res.status(200).json({
                success: true,
                message: 'Login berhasil',
                data: {
                    token,
                    user: {
                        _id: user._id,
                        email: user.email,
                        role: user.role
                    }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan pada server'
            });
        }
    },

    registerAdmin: async (req, res) => {
        try {
            const { email, password, adminCode } = req.body;
            console.log('Attempting admin registration:', { email });

            // Validasi input
            if (!email || !password || !adminCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Semua field harus diisi'
                });
            }

            // Verifikasi kode admin
            const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE;
            if (!ADMIN_SECRET_CODE || adminCode !== ADMIN_SECRET_CODE) {
                return res.status(401).json({
                    success: false,
                    message: 'Kode admin tidak valid'
                });
            }

            // Cek email sudah terdaftar
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah terdaftar'
                });
            }

            // Generate username dari email (hapus karakter khusus)
            const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
            console.log('Generated username:', username);

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Buat user admin baru
            const newAdmin = new User({
                username,  // Pastikan username ada
                email,
                password: hashedPassword,
                role: 'admin'  // Set role admin
            });

            console.log('Creating admin user with data:', {
                username: newAdmin.username,
                email: newAdmin.email,
                role: newAdmin.role
            });

            await newAdmin.save();
            console.log('Admin registered successfully');

            res.status(201).json({
                success: true,
                message: 'Admin berhasil didaftarkan',
                data: {
                    username: newAdmin.username,
                    email: newAdmin.email,
                    role: newAdmin.role
                }
            });

        } catch (error) {
            console.error('Admin registration error:', error);
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Data tidak valid',
                    details: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan pada server',
                details: error.message
            });
        }
    }
};

module.exports = AuthController; 