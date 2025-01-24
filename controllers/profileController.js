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

        const user = await User.findById(req.user.userId)
            .select('-password')
            .lean();
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

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Profil berhasil diperbarui',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memperbarui profil'
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        console.log('Change Password Controller:', {
            userId: req.user?.userId,
            body: req.body
        });

        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'User tidak terautentikasi'
            });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password saat ini dan password baru harus diisi'
            });
        }

        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Verifikasi password saat ini
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Password saat ini tidak sesuai'
            });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        user.password = hashedPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password berhasil diubah'
        });
    } catch (error) {
        console.error('Error in changePassword:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengubah password'
        });
    }
}; 