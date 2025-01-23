const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
    try {
        console.log('Request User:', req.user);
        
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'User tidak terautentikasi'
            });
        }

        const user = await User.findById(req.user.userId).select('-password');
        console.log('Found User:', user);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil profil'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'User tidak terautentikasi'
            });
        }

        const updates = {};
        
        // Handle text fields
        if (req.body.username) updates.username = req.body.username;
        if (req.body.email) updates.email = req.body.email;
        if (req.body.newPassword) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.newPassword, salt);
        }

        // Handle profile image
        if (req.file) {
            updates.profileImage = req.file.path;
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Profil berhasil diperbarui',
            user
        });
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memperbarui profil'
        });
    }
}; 