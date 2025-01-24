const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authenticateUser = require('../middleware/authenticateUser');
const NotificationController = require('../controllers/notificationController');

// Apply authentication middleware
router.use(authenticateUser);

// Get notifications
router.get('/', NotificationController.getNotifications);

// Create notification
router.post('/', async (req, res) => {
    try {
        const { userId, orderId, type, title, message } = req.body;

        const notification = new Notification({
            userId,
            orderId,
            type,
            title,
            message
        });

        await notification.save();

        res.status(201).json({
            success: true,
            message: 'Notifikasi berhasil dibuat',
            notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            error: 'Gagal membuat notifikasi'
        });
    }
});

// Mark notification as read
router.put('/:notificationId/read', NotificationController.markAsRead);

// Delete single notification
router.delete('/:id', NotificationController.deleteNotification);

// Delete all notifications
router.delete('/all', NotificationController.deleteAllNotifications);

module.exports = router; 