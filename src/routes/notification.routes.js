const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { sendNotificationValidator } = require('../validators/notification.validator');

const router = express.Router();

// All notification routes require authentication
router.use(protect);

router.get('/', notificationController.getUserNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/fcm-token', notificationController.updateFcmToken);
router.delete('/fcm-token', notificationController.removeFcmToken);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

// Admin Only Route: Send Custom / Broadcast Notification
router.post(
  '/admin/send',
  authorize('admin'),
  sendNotificationValidator,
  validate,
  notificationController.sendCustomNotification
);

module.exports = router;
