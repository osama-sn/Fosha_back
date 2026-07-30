const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { getPagination, getPagingData } = require('../utils/pagination.util');
const { sendFCMMulticast } = require('../config/firebase');

class NotificationService {
  /**
   * Internal helper to create a single notification and trigger Mobile FCM Push
   */
  async createNotification({ user: userId, title, body, type = 'general', data = {}, isProtected = false }) {
    const notification = await Notification.create({
      user: userId,
      title,
      body,
      type,
      data,
      isProtected: Boolean(isProtected),
    });

    // Trigger FCM Mobile Push Notification asynchronously
    try {
      const targetUser = await User.findById(userId, 'fcmTokens');
      if (targetUser && targetUser.fcmTokens && targetUser.fcmTokens.length > 0) {
        await sendFCMMulticast(targetUser.fcmTokens, title, body, data);
      }
    } catch (e) {
      console.error('❌ Failed to trigger FCM push in createNotification:', e.message);
    }

    return notification;
  }

  /**
   * Admin custom notification (Single user or Broadcast to all registered users)
   */
  async sendCustomNotification({ userId, title, body, type = 'promo', data = {} }) {
    if (!userId || userId === 'all') {
      // Broadcast to ALL non-deleted users
      const users = await User.find({ isDeleted: { $ne: true } }, '_id fcmTokens');
      const notificationsPayload = users.map((u) => ({
        user: u._id,
        title,
        body,
        type: type || 'promo',
        data,
      }));

      await Notification.insertMany(notificationsPayload);

      // Collect all active FCM device tokens across platform
      const allTokens = [];
      users.forEach((u) => {
        if (u.fcmTokens && Array.isArray(u.fcmTokens)) {
          allTokens.push(...u.fcmTokens);
        }
      });

      if (allTokens.length > 0) {
        await sendFCMMulticast(allTokens, title, body, data);
      }

      return { broadcast: true, count: users.length, deviceTokensReached: allTokens.length };
    } else {
      // Direct send to specific user
      const user = await User.findById(userId, 'fcmTokens');
      if (!user) {
        throw new ApiError(404, 'USER_NOT_FOUND');
      }

      const notification = await Notification.create({
        user: userId,
        title,
        body,
        type: type || 'promo',
        data,
      });

      if (user.fcmTokens && user.fcmTokens.length > 0) {
        await sendFCMMulticast(user.fcmTokens, title, body, data);
      }

      return { broadcast: false, notification };
    }
  }

  /**
   * Update / Add FCM Device Token for mobile app
   */
  async updateFcmToken(userId, fcmToken) {
    if (!fcmToken) {
      throw new ApiError(400, 'VAL_FCM_TOKEN_REQUIRED');
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: fcmToken },
    });

    return true;
  }

  /**
   * Remove FCM Device Token on logout
   */
  async removeFcmToken(userId, fcmToken) {
    if (!fcmToken) {
      throw new ApiError(400, 'VAL_FCM_TOKEN_REQUIRED');
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: fcmToken },
    });

    return true;
  }

  /**
   * Get user notifications with pagination and unreadCount
   */
  async getUserNotifications(userId, query) {
    const { page, limit, skip } = getPagination(query);

    const filter = { user: userId };
    if (query.isRead !== undefined) {
      filter.isRead = query.isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    const paginatedData = getPagingData(notifications, totalItems, page, limit, 'notifications');
    paginatedData.unreadCount = unreadCount;

    return paginatedData;
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOne({ _id: notificationId, user: userId });
    if (!notification) {
      throw new ApiError(404, 'NOTIFICATION_NOT_FOUND');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return true;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId, notificationId) {
    const notification = await Notification.findOneAndDelete({ _id: notificationId, user: userId });
    if (!notification) {
      throw new ApiError(404, 'NOTIFICATION_NOT_FOUND');
    }
    return true;
  }
}

module.exports = new NotificationService();
