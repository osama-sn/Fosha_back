const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class NotificationController {
  getUserNotifications = AsyncHandler(async (req, res) => {
    const data = await notificationService.getUserNotifications(req.user._id, req.query);
    res.status(200).json(new ApiResponse(200, 'NOTIFICATIONS_FETCHED', data, req.lang));
  });

  markAsRead = AsyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(req.user._id, req.params.id);
    res.status(200).json(new ApiResponse(200, 'NOTIFICATION_READ', notification, req.lang));
  });

  markAllAsRead = AsyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user._id);
    res.status(200).json(new ApiResponse(200, 'ALL_NOTIFICATIONS_READ', {}, req.lang));
  });

  deleteNotification = AsyncHandler(async (req, res) => {
    await notificationService.deleteNotification(req.user._id, req.params.id);
    res.status(200).json(new ApiResponse(200, 'NOTIFICATION_DELETED', {}, req.lang));
  });

  sendCustomNotification = AsyncHandler(async (req, res) => {
    const result = await notificationService.sendCustomNotification({
      userId: req.body.userId,
      title: req.body.title,
      body: req.body.body,
      type: req.body.type || 'promo',
      data: req.body.data || {},
    });

    res.status(201).json(new ApiResponse(201, 'NOTIFICATION_SENT', result, req.lang));
  });

  updateFcmToken = AsyncHandler(async (req, res) => {
    await notificationService.updateFcmToken(req.user._id, req.body.fcmToken);
    res.status(200).json(new ApiResponse(200, 'FCM_TOKEN_UPDATED', {}, req.lang));
  });

  removeFcmToken = AsyncHandler(async (req, res) => {
    await notificationService.removeFcmToken(req.user._id, req.body.fcmToken);
    res.status(200).json(new ApiResponse(200, 'FCM_TOKEN_REMOVED', {}, req.lang));
  });
}

module.exports = new NotificationController();
