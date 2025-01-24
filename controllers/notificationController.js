const Notification = require('../models/Notification');
const mongoose = require('mongoose');

const NotificationController = {
    // Get notifications
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.userId;
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .lean();

            console.log('Fetched notifications:', notifications);

            res.json({
                success: true,
                notifications
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil notifikasi'
            });
        }
    },

    // Delete notification
    deleteNotification: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            console.log('Attempting to delete notification:', { id, userId }); // Debug log

            // Validasi ID
            if (!id || !id.trim()) {
                console.log('Empty or invalid ID provided');
                return res.status(400).json({
                    success: false,
                    error: 'ID notifikasi tidak valid'
                });
            }

            // Validasi ObjectId
            if (!mongoose.Types.ObjectId.isValid(id.trim())) {
                console.log('Invalid MongoDB ObjectId:', id);
                return res.status(400).json({
                    success: false,
                    error: 'Format ID notifikasi tidak valid'
                });
            }

            const notification = await Notification.findOneAndDelete({
                _id: id.trim(),
                userId
            });

            console.log('Delete result:', notification); // Debug log

            if (!notification) {
                console.log('Notification not found');
                return res.status(404).json({
                    success: false,
                    error: 'Notifikasi tidak ditemukan'
                });
            }

            console.log('Notification deleted successfully');
            res.json({
                success: true,
                message: 'Notifikasi berhasil dihapus'
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menghapus notifikasi'
            });
        }
    },

    // Mark notification as read
    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;
            const userId = req.user.userId;

            // Tambahkan validasi ObjectId
            if (!mongoose.Types.ObjectId.isValid(notificationId)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID notifikasi tidak valid'
                });
            }

            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, userId },
                { read: true },
                { new: true }
            );

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    error: 'Notifikasi tidak ditemukan'
                });
            }

            res.json({
                success: true,
                message: 'Notifikasi ditandai telah dibaca',
                notification
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal memperbarui status notifikasi'
            });
        }
    },

    // Delete all notifications
    deleteAllNotifications: async (req, res) => {
        try {
            const userId = req.user.userId;
            
            const result = await Notification.deleteMany({ userId });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tidak ada notifikasi untuk dihapus'
                });
            }

            res.json({
                success: true,
                message: 'Semua notifikasi berhasil dihapus',
                deletedCount: result.deletedCount
            });
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menghapus semua notifikasi'
            });
        }
    }
};

module.exports = NotificationController; 