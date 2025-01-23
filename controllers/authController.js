const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
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

            // Generate token menggunakan JWT_SECRET dari .env
            const token = generateToken(user._id);

            res.status(201).json({
                success: true,
                message: "Registrasi berhasil",
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan pada server"
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validasi input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email dan password harus diisi'
                });
            }

            // Cari user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email atau password salah'
                });
            }

            // Verifikasi password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Email atau password salah'
                });
            }

            // Generate token
            const token = generateToken(user._id);

            // Response dengan token
            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat login'
            });
        }
    }
};

module.exports = AuthController; 